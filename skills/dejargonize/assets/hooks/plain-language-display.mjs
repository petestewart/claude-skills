#!/usr/bin/env node

import { appendFile, chmod, mkdir, readFile, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { EVAL_ROOT, loadConfig, rewriteText, textMetrics } from "../plain-language/rewrite.mjs";
import { latestUserIntent } from "../plain-language/transcript.mjs";

const STATE_ROOT = join(homedir(), ".cache", "claude-plain-language");

function safeId(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function readStdin() {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function hookOutput(text) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "MessageDisplay",
      displayContent: text,
    },
  });
}

async function capture(event, original, rewritten, metadata, error, config, userIntent) {
  if (config.capture !== true && process.env.CLAUDE_PLAIN_LANGUAGE_EVAL !== "1") return;
  await mkdir(EVAL_ROOT, { recursive: true, mode: 0o700 });
  await chmod(EVAL_ROOT, 0o700).catch(() => {});
  const record = {
    capturedAt: new Date().toISOString(),
    sessionId: event.session_id,
    messageId: event.message_id,
    original,
    rewritten,
    userIntent,
    model: metadata?.model ?? null,
    promptVersion: metadata?.promptVersion ?? null,
    latencyMs: metadata?.latencyMs ?? null,
    skipped: metadata?.skipped ?? false,
    protectedCount: metadata?.protectedCount ?? null,
    fallback: error !== null,
    error,
    beforeMetrics: textMetrics(original),
    afterMetrics: textMetrics(rewritten),
  };
  const path = join(EVAL_ROOT, "captures.jsonl");
  await appendFile(path, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(path, 0o600).catch(() => {});
}

async function main() {
  const raw = await readStdin();
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.stdout.write(hookOutput(""));
    return;
  }

  const delta = typeof event.delta === "string" ? event.delta : "";
  if (event.hook_event_name !== "MessageDisplay") {
    process.stdout.write(hookOutput(delta));
    return;
  }

  const config = await loadConfig();
  if (config.enabled === false) {
    process.stdout.write(hookOutput(delta));
    return;
  }

  const sessionDir = join(STATE_ROOT, safeId(event.session_id));
  const bufferPath = join(sessionDir, `${safeId(event.message_id)}.txt`);
  await mkdir(sessionDir, { recursive: true, mode: 0o700 });
  await chmod(sessionDir, 0o700).catch(() => {});
  await appendFile(bufferPath, delta, { encoding: "utf8", mode: 0o600 });
  await chmod(bufferPath, 0o600).catch(() => {});

  if (event.final !== true) {
    process.stdout.write(hookOutput(""));
    return;
  }

  const original = await readFile(bufferPath, "utf8");
  const userIntent = config.contextMode === "latest-user"
    ? await latestUserIntent(event.transcript_path, config.intentContextCharacters)
    : null;
  const bypassMarker = "<!-- DEJARGONIZE_BYPASS -->";
  const bypassed = original.includes(bypassMarker);
  let displayed = bypassed ? original.replace(bypassMarker, "").replace(/^\s*\n?/, "") : original;
  let metadata = null;
  let error = null;
  try {
    if (!bypassed) {
      const result = await rewriteText(original, { intentContext: userIntent });
      displayed = result.text;
      metadata = result.metadata;
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
    process.stderr.write(`[plain-language-display] ${error}\n`);
  } finally {
    await rm(bufferPath, { force: true }).catch(() => {});
  }

  if (!bypassed) await capture(event, original, displayed, metadata, error, config, userIntent).catch((cause) => {
    process.stderr.write(`[plain-language-display] capture failed: ${cause instanceof Error ? cause.message : String(cause)}\n`);
  });
  process.stdout.write(hookOutput(displayed));
}

main().catch((error) => {
  process.stderr.write(`[plain-language-display] fatal: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
