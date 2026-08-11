---
name: pr-walkthrough
description: Generate a polished, self-contained HTML walkthrough of a GitHub PR. Background and motivation first, then diff excerpts in logical reading order with short descriptions, syntax highlighting, and collapsible sections. Use when the user says "/pr-walkthrough", "create a PR walkthrough", "walk me through this PR", or wants a presentable HTML explanation of a pull request. Accepts a PR number or URL; can also run against the current branch's diff vs main.
---

# PR Walkthrough

Produce a single self-contained HTML document that presents a PR the way its author would walk a reviewer through it: why the change exists, then the diff in excerpts ordered for understanding (not file order), each with a short description. The reviewer's time is the scarce resource, so lead with what matters and keep each explanation tight.

## Workflow

### 1. Fetch the PR

```bash
gh pr view <number> --repo <owner/repo> --json title,body,author,baseRefName,headRefName,state,additions,deletions,changedFiles,files,createdAt,url
gh pr diff <number> --repo <owner/repo> > /tmp/pr<number>.diff
```

For a local branch instead of a PR: `git diff main...HEAD`.

Read the full diff. The PR body usually contains the motivation and design rationale. Mine it for the Background section, but verify claims against the actual diff rather than repeating the body verbatim.

For a large diff (roughly >1500 lines or >30 files), don't read it all into the main context: delegate the read to an `Explore` subagent that returns a structured map (files grouped by role, the "heart of the PR", notable risks), then pull only the load-bearing excerpts into the walkthrough. The embedded `{{RAW_DIFF}}` still carries the complete diff for the Diff tab regardless of how much you excerpt.

### 2. Plan the reading order

Order excerpts for comprehension, not by file path. A typical order for a full-stack change:

1. Background: the problem, prior art (linked PRs/tickets), the core tension or risk the design addresses
2. The API/data contract (shared types, schemas)
3. Entry points (routes, controllers), kept thin
4. The core logic (the "heart of the PR"; label it as such)
5. Supporting refactors
6. Side fixes (call out that they're incidental)
7. Frontend/UI
8. Tests: a table of suites and what each pins down, plus one representative excerpt
9. Potential issues: concerns identified during review, verified against the code (see step 3.5)
10. Summary: the design principle the layers have in common

Not every PR has all of these; collapse or reorder as the change demands. Give the Background section real substance: what system this lives in, what existed before, why the naive version would be dangerous or insufficient, and a bulleted list of the key design decisions the reader should watch for in the excerpts.

### 3.5. Identify potential issues

While reading the diff, note anything that looks like a real bug, edge case, or risk: race conditions, missing null/error handling, behavior changes that don't match the PR description, migration safety, dead code left behind, etc.

**Verify every concern before it goes in the walkthrough.** Do not include a hedge like "worth double-checking" or "should verify that..." for anything resolvable by reading the repo. Instead:

- Grep for callers, write sites, and schema definitions to confirm what the code actually does, not what its names suggest (a field named `procore_daily_log_id` may not hold a Procore id, e.g.).
- Trace both the pre-PR and post-PR code paths when a condition or guard changed, to confirm the claimed behavior change is real.
- For races, find where the shared id/lock/resource is minted before claiming two calls can collide.
- Spawn subagents (`Explore` for codebase questions) when one grep doesn't settle it. Launch independent checks concurrently in a single message.

Every concern that survives must be one of:
- A **confirmed finding** with file:line evidence and concrete impact, or
- A **runbook/ops item** that genuinely depends on information outside the code (prod data state, deploy coordination, external service state) — stated as the exact check to run, not a vague "verify before deploy".

If a concern turns out to be a non-issue after verification, drop it entirely; don't report "verified: fine". If nothing survives, skip the Potential Issues section rather than forcing one.

### 4. Build the HTML

Copy `assets/template.html` (in this skill's directory) to the output file, `pr-<number>-walkthrough.html` in the current directory. Replace `{{PR_NUMBER}}`, `{{PR_TITLE}}`, `{{CONTENT}}`, and `{{RAW_DIFF}}`, plus the follow-up-chat anchor placeholders below. The template's CSS and JS handle syntax highlighting (self-contained, no CDN) and collapsibility (click an `h2` to collapse its section; click a `.file` header to collapse its code block; TOC links auto-expand targets). Do not modify them, only produce content markup and fill in the placeholders.

The page has two tabs at the top: **Walkthrough** (the `{{CONTENT}}` you write) and **Diff** (full file diffs, GitHub-style, built by JS from `{{RAW_DIFF}}`). The Diff view orders files to match where each path first appears in a `.file` header in the walkthrough, so use the real repo-relative path in every `.file` header. No extra markup is needed for the Diff view; it is generated from the embedded raw diff.

Fill `{{RAW_DIFF}}` with the complete unified diff (the `/tmp/pr<number>.diff` from step 1), HTML-escaped. Do this after writing the walkthrough content, with a script rather than by hand:

Pass the filenames in through the environment so you don't have to substitute `<number>` inside the (quoted) heredoc, which is easy to leave literal:

```bash
NUM=<number>
PR_DIFF="/tmp/pr${NUM}.diff" OUT="pr-${NUM}-walkthrough.html" python3 - <<'PY'
import html, os, pathlib
diff = pathlib.Path(os.environ["PR_DIFF"]).read_text()
out = pathlib.Path(os.environ["OUT"])
out.write_text(out.read_text().replace("{{RAW_DIFF}}", html.escape(diff)))
PY
```

Fill in the chat anchor (`window.EXPLAIN_ANCHOR` in the `<head>`) so the follow-up chat panel can answer questions about this diff:

- `{{REPO}}`: absolute path of the repo the diff came from (`git -C <repo> rev-parse --show-toplevel`).
- `{{REF_RANGE}}`: the git range this walkthrough covers, in a form `git diff <range>` accepts from a fresh shell. For a PR, resolve to concrete SHAs (`<baseSha>...<headSha>`) so it still works after the branch is gone. For a local branch, use `<mergeBase>...HEAD` or `main...HEAD`.
- `{{GENERATED_AT}}`: current UTC timestamp (ISO 8601, e.g. `2026-07-16T18:00:00Z`).
- `{{REPO_NWO}}`: the GitHub `owner/name` the PR lives in (e.g. `trunk-tools/trunk-tools`). For a local-branch walkthrough with no PR, leave the placeholder as-is or set an empty string.
- `{{PR_NUMBER_ANCHOR}}`: the PR number as a bare JSON number (e.g. `6855`), used by the viewed-file sync (below). For a local-branch walkthrough with no PR, set it to `null` (not a string) so the anchor stays valid JSON.

The output file is a local artifact. Never commit it.

### 5. Publish the shareable copy

Always publish, every run. No flag, no asking.

The local page cannot be published as-is: artifacts supply their own `<!doctype>`/`<head>`/`<body>` shell, and their CSP blocks every request to another host, which would break the dashboard integrations. `assets/artifactize.py` derives a copy that drops the wrapper tags, the chat anchor, and the chat panel, and leaves the viewed-sync code inert.

It also drops the Potential Issues section and its TOC entry. That section is review material for the author, who has read it and decided what to act on before sharing; the shared copy is the explanation of the change, not a review of it. Keep writing the section as step 3.5 describes, since the local page still carries it.

```bash
NUM=<number>
ART="/tmp/pr-${NUM}-walkthrough.html"
python3 ~/.claude/skills/pr-walkthrough/assets/artifactize.py "pr-${NUM}-walkthrough.html" "$ART"
```

It prints the page title, which is the `title` for the publish call. Then publish with the `Artifact` tool:

- `file_path`: the derived copy.
- `title`: what the script printed.
- `favicon`: `🔍` for every walkthrough, so they share one tab icon.
- `description`: one sentence naming the PR and what it changes.

**Re-running against the same PR must reuse its URL, not mint a new one.** A path only maps to an existing artifact within the session that published it, so in any later session first call `Artifact` with `action: "list"`, find the row whose title contains this PR number, and pass its `url` on the publish call. Only when there's no such row is this a fresh publish.

Then put the link at the top of the local page:

```bash
python3 ~/.claude/skills/pr-walkthrough/assets/inject-artifact-link.py "pr-${NUM}-walkthrough.html" "<artifact-url>"
```

That adds a banner above the title with the URL as a clickable link and a Copy button, for pasting into the PR description. It is idempotent, so a re-publish replaces the old banner.

Order matters: build the local page, derive the copy, publish, then inject. Injecting first would put a stale link inside the published page (`artifactize.py` strips the banner defensively, but don't rely on it).

If publishing fails, say so and carry on. The local page is still the deliverable.

### 6. Open it

`open <file>`. Tell the user where the file is and give them the artifact URL.

## Follow-up chat panel

The generated page includes a self-contained "Ask about this change" panel (bottom-right) so the reader can ask follow-up questions about the PR, answered by a Claude session that has the diff in context. It is built into the template — no extra work beyond filling the anchor placeholders above. Behavior:

- Talks to the local dashboard command-center server (`http://127.0.0.1:7799/action`), which resumes `EXPLAIN_ANCHOR.sessionId` when set or cold-starts a session from `repo` + `refRange` when not, and returns the session id so the page reuses it for later questions.
- The server answers with a cheap model by default (Haiku, via `DIFF_QUESTION_MODEL` in `server.mjs`), since these are short questions over a diff already in context. Override per-server with the `DASHBOARD_DIFF_QUESTION_MODEL` env var.
- The server normally runs already (launchd: `com.trunktools.dashboard-server`). If the panel reports it's offline, start it with `~/.claude/skills/dashboard/server-run.sh` (or `launchctl kickstart -k gui/$(id -u)/com.trunktools.dashboard-server`).
- **"Ask about this" on selection**: selecting any text on the page (prose or a diff line) shows a floating button; clicking it attaches the selection as a quoted `selectedHunk` on the next question.
- **Graceful degradation**: if the server is offline the panel shows an inline notice and the rest of the page still works.

The chat is an enhancement layered on the same anchor/server contract as `/explain-diff`; the walkthrough must read perfectly with the server absent. The published copy has no chat panel at all (step 5), so that requirement is what makes the artifact readable.

## GitHub "Viewed" sync

When the anchor carries a real `repoNwo` + `prNumber`, each file header in the Walkthrough view gets an explicit **Viewed** checkbox (mirroring GitHub's own per-file control). Ticking it marks that file viewed in your GitHub PR review; unticking unmarks it. This is a distinct control from the collapse chevron, so reading/collapsing a file never silently changes your review state. Mechanics:

- On load the page calls `{ type: "gh-viewed-states", repoNwo, prNumber }` and ticks each box to match GitHub, so the boxes reflect the real review rather than starting blank.
- Toggling a box POSTs `{ type: "gh-mark-viewed", repoNwo, prNumber, path, viewed }` to the dashboard server, which resolves the PR node id (cached) and calls GitHub's `markFileAsViewed` / `unmarkFileAsViewed` GraphQL mutation via `gh`. On failure the box reverts and turns red; the PR state is unchanged.
- The `path` sent is the text of each `.file` header's first span, so those headers must carry the real repo-relative path (already required for the Diff view).
- The checkbox appears only in the Walkthrough view (not the Diff tab) and only when a PR backs the page. Per-user and reversible; needs `gh` authenticated. A missing server or a local-branch walkthrough (no PR) simply shows no checkbox.

## Content markup conventions

Top matter:

```html
<h1><span class="pr">PR #6855</span> Title here</h1>
<div class="meta">
  <a href="PR_URL">owner/repo #6855</a>
  &nbsp;·&nbsp; TICKET-123 &nbsp;·&nbsp; branch <code>branch-name</code> → <code>main</code>
  &nbsp;·&nbsp; 15 files, +905 / −30
</div>
```

Sections: `<h2 id="sN"><span class="num">N</span>Title</h2>` (Background and Summary get ids but no `.num`). Include a `.toc` box after Background linking to every `#sN`. The TOC doubles as an at-a-glance summary of the change, so keep section titles short and descriptive.

Each excerpt = a `.file` header immediately followed by a `pre`:

```html
<div class="file"><span>path/to/file.ts</span><span class="tag new">new file</span></div>
```

Tag conventions: `<span class="tag">+5 / −2</span>` for mixed diffs, `<span class="tag new">new file</span>` / `<span class="tag new">methodName (new)</span>` / `<span class="tag new">all new</span>` for pure additions.

**Pure additions (new files, wholly new methods): use a plain code block, no `+` prefixes, no green backgrounds.** Raw escaped text inside `pre.code`:

```html
<pre class="code">export function foo({ bar }: { bar: string }) {
  return bar;
}</pre>
```

**Mixed changes (context + additions/removals): use a diff block.** One `<span>` per line, class `a` (added), `d` (deleted), or `c` (context). The line's first character must be `+`, `-`, or a space, and the JS colors the marker and highlights the rest:

```html
<pre class="diff">
<span class="c">     const registered = registry[row.job_name];</span>
<span class="d">-      throw new Error(</span>
<span class="a">+      throw new BadRequestError(</span>
</pre>
```

Rules for all code content:

- Escape `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;` (JSX especially).
- Trim excerpts to the load-bearing lines; elide boilerplate with a `...` line. Long signatures may be condensed to `{ ... }`.
- Never fabricate code. Every excerpt must come from the actual diff, trimmed but not paraphrased (a `...` elision is fine; rewording is not).

Prose elements:

- `<div class="callout">` for a key insight below an excerpt; `<div class="callout warn">` for the central risk/tension (use one in Background).
- `<p class="muted">` for secondary notes (e.g., "also wired up in X, not excerpted").
- A `<table>` for the tests section: suite | what it pins down.
- Potential issues (from step 3.5): `<div class="finding"><h3><span class="sev major|minor|nit">MAJOR</span> Title</h3><p class="loc">file.ts:123</p><p>...</p></div>` for each verified concern. Omit this section entirely when no concern survives verification.

## Writing style

The goal is to give an engineer exactly what they need to understand the change, and nothing more. A reviewer skims first and reads deeply only where it matters, so keep the reading load low.

- Prefer concise over comprehensive. Say the thing once, in the fewest words that still land it, then move on. If a sentence is not helping the reader understand the diff, cut it.
- Prefer plain language over technical jargon. Use the simplest word that is still accurate. When a domain term is unavoidable, explain it the first time it appears.
- Prefer lists over paragraphs when the content is a set of items, steps, options, or parallel points. If prose contains something that would read more easily at a glance as a bulleted list (or a small table), pull it out into one. Paragraphs still belong here for narrative and reasoning, but reach for a list whenever it carries the same information faster.
- Short description before each excerpt: what it is and why it comes next in the story. One or two sentences is usually enough.
- After significant excerpts, note deliberate design choices visible in the code (a `muted` paragraph or callout), e.g. "attempts: 1 means a mid-run crash isn't auto-retried". Keep these to a single point.
- Plain prose, complete sentences, no marketing tone.
- Never use em-dashes. Use a period, comma, colon, or parentheses instead, whatever fits the sentence.
