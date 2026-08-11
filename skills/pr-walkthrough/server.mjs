// Self-contained local server for the pr-walkthrough skill: powers the
// "Ask about this change" follow-up chat panel and the GitHub "Viewed" file-sync
// on the generated PR walkthrough pages. Single file, no dependencies (node:
// builtins only). Binds 127.0.0.1:17799 only. Extracted from the larger command
// center dashboard server so this skill needs no other skill installed.
//
// Surface: POST /action (dispatched by body.type) and GET /ping. No static
// dashboard is served. CORS allows file:// / null origins because walkthrough
// pages open from disk.

import http from "node:http";
import { writeFile, rename, mkdir, appendFile } from "node:fs/promises";
import { readFileSync, existsSync, createWriteStream } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const HOST = "127.0.0.1";
const PORT = 17799;
const DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(DIR, "server.log");
const RUNS_DIR = path.join(DIR, "runs");
const RUNS_JSON = path.join(RUNS_DIR, "runs.json");

// Model for the /pr-walkthrough follow-up chat. These are short "what does this
// do" questions over a diff already in context, so a cheap model is the right
// default; override with DASHBOARD_DIFF_QUESTION_MODEL (or per-request body.model,
// validated by isSafeModel).
const DIFF_QUESTION_MODEL = process.env.DASHBOARD_DIFF_QUESTION_MODEL || "haiku";
// A model name is safe to pass to `claude --model` iff it's a bare token: word
// chars, dot, dash, and the [1m]-style context suffix. Rejects shell metachars.
function isSafeModel(s) {
  return typeof s === "string" && s.length > 0 && s.length <= 60 && /^[\w.\-\[\]]+$/.test(s);
}
const DIFF_QUESTION_ALLOWED_TOOLS =
  "Bash(git diff:*),Bash(git log:*),Bash(git show:*),Bash(git status:*),Read,Grep,Glob";

function log(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  // Fire-and-forget; a log write failure must never take the server down.
  appendFile(LOG_PATH, line).catch(() => {});
}

// ---- headless Claude session runner -------------------------------------
// Resolve the claude binary once at startup. `which claude` in Pete's shell
// returns the nvm-installed one; launchd's PATH won't find it, so we look in the
// same nvm bin dir as the node running us, then fall back to a `which` under a
// login-ish PATH.
function resolveClaudeBin() {
  const candidates = [];
  // Same bin dir as the current node (the nvm version server-run.sh resolved).
  const nodeBinDir = path.dirname(process.execPath);
  candidates.push(path.join(nodeBinDir, "claude"));
  // Common install locations.
  candidates.push(path.join(os.homedir(), ".claude", "local", "claude"));
  candidates.push("/opt/homebrew/bin/claude");
  candidates.push("/usr/local/bin/claude");
  for (const c of candidates) {
    try {
      if (existsSync(c)) return c;
    } catch {}
  }
  // Last resort: ask the shell (login shell so nvm/profile PATH is present).
  try {
    const found = execFileSync("/bin/bash", ["-lc", "command -v claude"], {
      encoding: "utf8",
    }).trim();
    if (found) return found;
  } catch {}
  return "claude"; // let spawn fail loudly if truly absent
}
const CLAUDE_BIN = resolveClaudeBin();

// A PATH the child can actually use to find git/gh/node/etc. launchd gives us a
// bare PATH; prepend the usual interactive locations + the current node's dir.
function childEnv() {
  const nodeBinDir = path.dirname(process.execPath);
  const extra = [
    nodeBinDir,
    path.join(os.homedir(), ".claude", "local"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
  ];
  const cur = process.env.PATH ? process.env.PATH.split(":") : [];
  const merged = [...extra, ...cur].filter((p, i, a) => p && a.indexOf(p) === i);
  return {
    ...process.env,
    HOME: os.homedir(),
    PATH: merged.join(":"),
  };
}

// In-memory registry, mirrored to runs.json. Keyed by runId.
const runs = new Map();

function nowIso() {
  return new Date().toISOString();
}

async function persistRuns() {
  try {
    await mkdir(RUNS_DIR, { recursive: true });
    const arr = [...runs.values()].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const tmp = RUNS_JSON + "." + process.pid + ".tmp";
    await writeFile(tmp, JSON.stringify({ generated: nowIso(), runs: arr }, null, 2));
    await rename(tmp, RUNS_JSON);
  } catch (e) {
    log(`persistRuns failed: ${e.message}`);
  }
}

// Load any prior registry on startup so the Activity log survives a restart.
function loadRunsSync() {
  try {
    const doc = JSON.parse(readFileSync(RUNS_JSON, "utf8"));
    for (const r of doc.runs || []) {
      // A run left "running" across a restart can't be resumed by this process
      // (we lost the child handle) — mark it unknown rather than lie about it.
      if (r.status === "running") r.status = "unknown";
      runs.set(r.runId, r);
    }
  } catch {}
}

// Extract a short human-readable line from one stream-json event for the run
// log. Returns null for events we don't surface (rate-limit, pings, etc.).
function transcriptLine(evt) {
  if (!evt || typeof evt !== "object") return null;
  if (evt.type === "system" && evt.subtype === "init") {
    return `[session ${evt.session_id}] model=${evt.model || "?"} cwd=${evt.cwd || "?"}`;
  }
  if (evt.type === "assistant" && evt.message && Array.isArray(evt.message.content)) {
    const parts = [];
    for (const c of evt.message.content) {
      if (c.type === "text" && c.text) parts.push(c.text);
      else if (c.type === "tool_use") {
        const inp = c.input || {};
        const hint =
          inp.command || inp.file_path || inp.path || inp.pattern || inp.description || "";
        parts.push(`→ ${c.name}${hint ? " " + String(hint).slice(0, 160) : ""}`);
      }
    }
    return parts.length ? parts.join("\n") : null;
  }
  if (evt.type === "user" && evt.message && Array.isArray(evt.message.content)) {
    for (const c of evt.message.content) {
      if (c.type === "tool_result") {
        const txt = typeof c.content === "string"
          ? c.content
          : Array.isArray(c.content)
            ? c.content.map((x) => (x && x.text) || "").join("")
            : "";
        if (txt) return `  ⤷ ${txt.slice(0, 200).replace(/\n/g, " ")}`;
      }
    }
    return null;
  }
  if (evt.type === "result") {
    return `[result ${evt.is_error ? "ERROR" : "ok"}] ${(evt.result || "").slice(0, 500)}`;
  }
  return null;
}

// Synchronous-from-the-request handler runner: spawns `claude` in stream-json
// mode and holds the HTTP request until the child to close and returns the final
// result text — used by the chat, which holds the HTTP request until the answer
// is ready (30–120s). Still registers in the runs registry + writes a transcript
// log so answers show up in the per-run logs. Either resumeSessionId (resume an
// existing session) or a plain prompt in a cwd (cold-start) — the caller decides
// which.
function runClaudeSync({ cwd, prompt, resumeSessionId, actionType, allowedTools, model }) {
  return new Promise(async (resolve) => {
    const runCwd = cwd || os.homedir();
    await mkdir(RUNS_DIR, { recursive: true });
    const runId = randomUUID();
    const logPath = path.join(RUNS_DIR, `${runId}.log`);

    const args = [];
    if (resumeSessionId) args.push("--resume", resumeSessionId);
    args.push("-p", prompt, "--output-format", "stream-json", "--verbose");
    if (model && isSafeModel(model)) args.push("--model", model);
    if (allowedTools) args.push("--allowedTools", allowedTools);

    const entry = {
      runId,
      sessionId: resumeSessionId || null,
      ticket: null,
      actionType: actionType || "diff-question",
      cwd: runCwd,
      startedAt: nowIso(),
      status: "running",
      exitCode: null,
      logPath,
    };
    runs.set(runId, entry);

    const out = createWriteStream(logPath, { flags: "a" });
    out.write(`# run ${runId} actionType=${entry.actionType} (sync)\n`);
    out.write(`# cwd=${runCwd} resume=${resumeSessionId || "-"} started=${entry.startedAt}\n`);
    out.write(`# bin=${CLAUDE_BIN}\n\n`);

    let buf = "";
    let answer = "";
    let isError = false;

    let finalized = false;
    const finalize = (status, code) => {
      if (finalized) return;
      finalized = true;
      entry.status = status;
      entry.exitCode = code;
      entry.endedAt = nowIso();
      if (buf.trim()) out.write(buf + "\n");
      out.write(`\n# exited code=${code} status=${status} at=${entry.endedAt}\n`);
      out.end();
      persistRuns();
      log(`${entry.actionType} ${runId} ${status} code=${code} session=${entry.sessionId || "-"}`);
      resolve({
        runId,
        sessionId: entry.sessionId,
        answer,
        isError,
        status,
        exitCode: code,
      });
    };

    let child;
    try {
      child = spawn(CLAUDE_BIN, args, {
        cwd: runCwd,
        env: childEnv(),
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      entry.error = e.message;
      out.write(`\n[spawn error] ${e.message}\n`);
      answer = "";
      isError = true;
      finalize("failed", -1);
      return;
    }

    child.on("error", (e) => {
      entry.error = e.message;
      out.write(`\n[child error] ${e.message}\n`);
      isError = true;
      finalize("failed", entry.exitCode == null ? -1 : entry.exitCode);
    });

    persistRuns();

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        buf += chunk.toString();
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (!line.trim()) continue;
          let evt = null;
          try {
            evt = JSON.parse(line);
          } catch {
            out.write(line + "\n");
            continue;
          }
          if (!entry.sessionId && evt && evt.session_id) {
            entry.sessionId = evt.session_id;
            persistRuns();
          }
          if (evt && evt.type === "result") {
            answer = evt.result || "";
            isError = !!evt.is_error;
          }
          const tl = transcriptLine(evt);
          if (tl) out.write(tl + "\n");
        }
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        out.write(`[stderr] ${chunk.toString()}`);
      });
    }

    child.on("close", (code) => {
      finalize(code === 0 && !isError ? "done" : "failed", code);
    });

    log(`${entry.actionType} ${runId} spawned pid=${child.pid} cwd=${runCwd} resume=${!!resumeSessionId}`);
  });
}

// The prompt for a COLD-START diff question: the session has no diff in context
// yet, so it must load it first. refRange is validated by the caller to be a
// safe git range token; it's interpolated into a git diff command the model
// runs via its (read-only) Bash grant.
function coldStartDiffQuestionPrompt({ refRange, question, selectedHunk }) {
  return [
    `You are answering a question about a specific code change (a git diff) in the repository at your current working directory.`,
    ``,
    `First, load the diff so you have it in context:`,
    `  git diff ${refRange}`,
    `(If that range shows nothing because the work is uncommitted, also check \`git status\` and \`git diff HEAD\`.)`,
    `Read the surrounding code as needed to answer accurately — do not guess. You have read-only git + file access; do not attempt to modify anything.`,
    ``,
    selectedHunk
      ? `The reader has selected this specific portion of the diff and is asking about it:\n<<<SELECTED\n${selectedHunk}\n>>>\n`
      : ``,
    `Question:`,
    question,
    ``,
    `Answer concisely and specifically about THIS diff — reference the actual files, functions, and lines involved. Use markdown (code spans/blocks, bold) where it helps. This is your final answer; do not ask follow-up questions.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// The prompt for a RESUME diff question: the session already explained this
// diff, so just ask. Include the selection when present.
function resumeDiffQuestionPrompt({ question, selectedHunk }) {
  return [
    selectedHunk
      ? `The reader has selected this specific portion of the diff and is asking about it:\n<<<SELECTED\n${selectedHunk}\n>>>\n`
      : ``,
    `Follow-up question about the same change you just explained:`,
    question,
    ``,
    `Answer concisely and specifically, referencing the actual code. Use markdown where it helps.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// A git ref range is safe to interpolate into `git diff <range>` iff it's made of
// the characters git ranges use: word chars, dot, slash, dash, underscore, and
// the range operators. Rejects shell metacharacters, spaces, quotes, semicolons.
function isSafeRefRange(s) {
  return typeof s === "string" && s.length > 0 && s.length <= 200 && /^[\w./\-~^@]+$/.test(s);
}

// ---- action handlers ----------------------------------------------------
// One dispatch table. Each handler receives the parsed JSON body and returns a
// plain object that becomes the JSON response. Throw to signal a handler error
// (surfaced as a 500 with the message).
// PR node ids resolved for gh-mark-viewed, keyed by "owner/name#number".
const prNodeIdCache = new Map();

const actions = {
  async ping() {
    return { ok: true, pong: true, at: new Date().toISOString() };
  },

  // Answer a follow-up question about a /pr-walkthrough page's diff. SYNCHRONOUS:
  // the request is held until the answer returns (30–120s; node's requestTimeout
  // is 5min and there is no socket timeout, so the hold is safe). If the page's
  // anchor carries a sessionId, resume that session (it already has the diff in
  // context); otherwise cold-start a session in anchor.repo that loads
  // `git diff <refRange>` first, and RETURN the new sessionId so the page
  // upgrades its anchor for subsequent questions. selectedHunk (a quoted portion
  // of the diff) is passed verbatim when present. Read-only git posture.
  // { type, anchor:{sessionId?, repo, refRange, generatedAt?}, question, selectedHunk? }
  async ["diff-question"](body) {
    const anchor = (body && body.anchor) || {};
    const question = body && body.question;
    const selectedHunk = (body && body.selectedHunk) || "";
    if (!question || !String(question).trim()) {
      throw new Error("diff-question requires a non-empty { question }");
    }
    const resumeSessionId = anchor.sessionId || null;
    // Cheap model by default (see DIFF_QUESTION_MODEL); a page may request a
    // specific one via body.model, honored only if it's a safe token.
    const model = (body && isSafeModel(body.model) && body.model) || DIFF_QUESTION_MODEL;

    let result;
    if (resumeSessionId) {
      // Resume path: the session already explained this diff. cwd is best-effort
      // (the anchor's repo if it still exists, else home) — resume doesn't depend
      // on cwd, but a valid one lets the session re-run read-only git if it wants.
      const cwd = anchor.repo && existsSync(anchor.repo) ? anchor.repo : os.homedir();
      result = await runClaudeSync({
        cwd,
        resumeSessionId,
        prompt: resumeDiffQuestionPrompt({ question, selectedHunk }),
        actionType: "diff-question",
        allowedTools: DIFF_QUESTION_ALLOWED_TOOLS,
        model,
      });
    } else {
      // Cold-start path: need a repo + a safe ref range to load the diff.
      const repo = anchor.repo;
      const refRange = anchor.refRange;
      if (!repo || !existsSync(repo)) {
        throw new Error(
          `cannot answer: anchor.repo is missing or not on disk (${repo || "(none)"})`
        );
      }
      if (!isSafeRefRange(refRange)) {
        throw new Error(
          `cannot answer: anchor.refRange is missing or unsafe (${refRange || "(none)"})`
        );
      }
      result = await runClaudeSync({
        cwd: repo,
        prompt: coldStartDiffQuestionPrompt({ refRange, question, selectedHunk }),
        actionType: "diff-question",
        allowedTools: DIFF_QUESTION_ALLOWED_TOOLS,
        model,
      });
    }

    if (result.isError || result.status !== "done") {
      throw new Error(
        result.answer
          ? `run ${result.status}: ${result.answer.slice(0, 300)}`
          : `diff-question run ${result.status} (exit ${result.exitCode})`
      );
    }
    return {
      runId: result.runId,
      // The (possibly new) session id — the page writes this back into its anchor
      // so the next question resumes instead of cold-starting again.
      sessionId: result.sessionId,
      answer: result.answer,
      resumed: !!resumeSessionId,
    };
  },

  // Mark (or unmark) a file as "Viewed" in the reader's GitHub PR review, so
  // collapsing a file in a /pr-walkthrough page checks the same box on GitHub.
  // Per-user, reversible state. Resolves the PR node id from owner/repo/number
  // (cached) and calls the markFileAsViewed / unmarkFileAsViewed GraphQL
  // mutation via `gh`. No LLM. { type, repoNwo, prNumber, path, viewed? }
  // repoNwo is "owner/name"; viewed defaults to true.
  async ["gh-mark-viewed"](body) {
    const repoNwo = body && body.repoNwo;
    const prNumber = body && Number(body.prNumber);
    const filePath = body && body.path;
    const viewed = body && body.viewed === false ? false : true;
    if (!repoNwo || !/^[\w.-]+\/[\w.-]+$/.test(repoNwo)) {
      throw new Error(`gh-mark-viewed requires a valid { repoNwo } "owner/name" (got ${repoNwo || "(none)"})`);
    }
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error(`gh-mark-viewed requires a positive integer { prNumber } (got ${body && body.prNumber})`);
    }
    if (!filePath || typeof filePath !== "string" || filePath.length > 500) {
      throw new Error("gh-mark-viewed requires a non-empty { path }");
    }
    const [owner, name] = repoNwo.split("/");

    // Resolve the PR node id once per repo+number (viewed state is by node id).
    const cacheKey = `${repoNwo}#${prNumber}`;
    let nodeId = prNodeIdCache.get(cacheKey);
    if (!nodeId) {
      const idJson = execFileSync(
        "gh",
        [
          "api", "graphql",
          "-f", "query=query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){id}}}",
          "-F", `o=${owner}`, "-F", `r=${name}`, "-F", `n=${prNumber}`,
          "--jq", ".data.repository.pullRequest.id",
        ],
        { encoding: "utf8", timeout: 15000, env: childEnv() }
      ).trim();
      if (!idJson) throw new Error(`could not resolve PR node id for ${cacheKey}`);
      nodeId = idJson;
      prNodeIdCache.set(cacheKey, nodeId);
    }

    const mutation = viewed ? "markFileAsViewed" : "unmarkFileAsViewed";
    execFileSync(
      "gh",
      [
        "api", "graphql",
        "-f", `query=mutation($id:ID!,$p:String!){${mutation}(input:{pullRequestId:$id,path:$p}){clientMutationId}}`,
        "-F", `id=${nodeId}`, "-F", `p=${filePath}`,
      ],
      { encoding: "utf8", timeout: 15000, env: childEnv() }
    );
    return { ok: true, repoNwo, prNumber, path: filePath, viewed };
  },

  // Return the reader's current per-file Viewed state for a PR, so a
  // /pr-walkthrough page can hydrate its checkboxes to match GitHub on load.
  // { type, repoNwo, prNumber } -> { ok, states: { "<path>": true|false } }
  async ["gh-viewed-states"](body) {
    const repoNwo = body && body.repoNwo;
    const prNumber = body && Number(body.prNumber);
    if (!repoNwo || !/^[\w.-]+\/[\w.-]+$/.test(repoNwo)) {
      throw new Error(`gh-viewed-states requires a valid { repoNwo } "owner/name" (got ${repoNwo || "(none)"})`);
    }
    if (!Number.isInteger(prNumber) || prNumber <= 0) {
      throw new Error(`gh-viewed-states requires a positive integer { prNumber } (got ${body && body.prNumber})`);
    }
    const [owner, name] = repoNwo.split("/");
    const out = execFileSync(
      "gh",
      [
        "api", "graphql", "--paginate",
        "-f", "query=query($o:String!,$r:String!,$n:Int!,$endCursor:String){repository(owner:$o,name:$r){pullRequest(number:$n){files(first:100,after:$endCursor){nodes{path viewerViewedState} pageInfo{hasNextPage endCursor}}}}}",
        "-F", `o=${owner}`, "-F", `r=${name}`, "-F", `n=${prNumber}`,
        "--jq", ".data.repository.pullRequest.files.nodes[] | [.path, .viewerViewedState] | @tsv",
      ],
      { encoding: "utf8", timeout: 20000, env: childEnv() }
    );
    const states = {};
    for (const line of out.split("\n")) {
      if (!line.trim()) continue;
      const tab = line.indexOf("\t");
      if (tab < 0) continue;
      states[line.slice(0, tab)] = line.slice(tab + 1).trim() === "VIEWED";
    }
    return { ok: true, repoNwo, prNumber, states };
  },
};

// ---- helpers ------------------------------------------------------------
// CORS headers so a cross-origin page (notably the walkthrough pages, which
// open from the local output dir over file:// and thus send Origin: null) can
// fetch the API. We echo the caller's Origin (including the literal "null")
// rather than "*", because the page sends Content-Type: application/json — which
// makes the POST a non-simple request that preflights, and an echoed origin is
// the interoperable answer. The sameOrigin() guard is the actual gate; these
// headers just let the browser deliver the request to that gate.
function corsHeaders(req) {
  const origin = req.headers.origin || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function sendJson(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    ...(extraHeaders || {}),
  });
  res.end(body);
}

// Same-origin guard for POST: allow when Origin is absent (curl, same-page
// fetch on some browsers), the literal "null" (a file:// page — the generated
// walkthrough pages open from disk over file:// and send Origin: null), or a
// localhost origin. A real cross-SITE attacker page always sends its own
// http(s)://host origin, which stays blocked — "null" doesn't defeat that, so
// allowing it costs nothing under the localhost-only posture.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || origin === "null") return true;
  try {
    const h = new URL(origin).hostname;
    return h === "127.0.0.1" || h === "localhost" || h === "[::1]" || h === "::1";
  } catch {
    return false;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;
  const cors = corsHeaders(req);

  // CORS preflight: the browser sends OPTIONS before a JSON POST from a
  // cross-origin (file://) page. Answer it 204 with the CORS headers or the
  // real POST never gets made.
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  // Liveness probe (also served as GET / for convenience).
  if (req.method === "GET" && (p === "/" || p === "/ping" || p === "/health")) {
    sendJson(res, 200, { ok: true, pong: true, uptime: process.uptime(), at: new Date().toISOString() }, cors);
    return;
  }

  if (req.method === "POST" && p === "/action") {
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: "cross-origin blocked" }, cors);
      log(`403 /action cross-origin (${req.headers.origin})`);
      return;
    }
    let body;
    try {
      const raw = await readBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      sendJson(res, 400, { ok: false, error: `bad request body: ${e.message}` }, cors);
      log(`400 /action bad body: ${e.message}`);
      return;
    }
    const type = body && body.type;
    const handler = type && actions[type];
    if (!handler) {
      sendJson(res, 400, { ok: false, error: `unknown action type: ${type || "(none)"}` }, cors);
      log(`400 /action unknown type: ${type || "(none)"}`);
      return;
    }
    try {
      const result = await handler(body);
      sendJson(res, 200, Object.assign({ ok: true }, result), cors);
      log(`200 /action ${type}`);
    } catch (e) {
      sendJson(res, 500, { ok: false, error: e.message }, cors);
      log(`500 /action ${type}: ${e.message}`);
    }
    return;
  }

  sendJson(res, 405, { ok: false, error: "method not allowed" }, cors);
});

loadRunsSync();

server.listen(PORT, HOST, () => {
  log(`server.mjs listening on http://${HOST}:${PORT} (node ${process.version}, pid ${process.pid})`);
  log(`claude binary resolved: ${CLAUDE_BIN}`);
});

server.on("error", (e) => {
  log(`server error: ${e.message}`);
  process.exit(1);
});