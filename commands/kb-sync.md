---
description: Apply the Wiki Update Protocol for a knowledge-base project — capture conversation learnings, new raw files, decisions, and correspondence into the wiki
argument-hint: [decision: <text> | ingest: <file> | email | <freeform hint>]
---

Apply the Wiki Update Protocol for this knowledge-base project.

User intent (may be empty): $ARGUMENTS

## Prerequisites

This command assumes the project follows the knowledge-base pattern (see the `knowledge-base` skill). Verify by checking for:
- `CLAUDE.md` with Wiki Update Protocol defined
- `wiki/` directory with topic articles
- `raw/` directory with source material

If those aren't present, suggest running `/kb-init` first.

## Step 1 — Identify what to sync

Figure out what needs to be captured. Check in this order:

1. **Explicit intent in $ARGUMENTS.** Common patterns:
   - `decision: <text>` — log a decision to `wiki/decisions.md`
   - `ingest: <filename>` or `ingest <filename>` — process a specific file in `raw/`
   - `email` — process correspondence discussed in the current session
   - Anything else — treat as a freeform hint about what to capture

2. **If $ARGUMENTS is empty**, look for pending updates:
   - Check `raw/` for files not yet referenced in `wiki/source-documents.md`
   - Review the current conversation for decisions, analysis, inferences, new facts, or new correspondence worth preserving
   - If scope is large, list what you found and confirm with the user before making changes

## Step 2 — Apply the protocol

For each thing being captured, apply the rules from the knowledge-base skill and the project's CLAUDE.md:

- **New raw file** → Summarize in `wiki/source-documents.md`. Update every topic article whose facts it touches. Update `wiki/open-questions.md`. Update `wiki/correspondence.md` if it's an email. Create a new `wiki/<topic>.md` and add to `INDEX.md` if it introduces a new topic.

- **Decision made** → Append to `wiki/decisions.md` with today's date (use absolute date from context) and the reasoning.

- **Analysis or inference** → Add to the relevant topic article, clearly marked as *inference* vs. *confirmed fact*, with reasoning. If it produces a follow-up question, add to `wiki/open-questions.md`.

- **New correspondence** → Append to `wiki/correspondence.md`. Update touched topics. Mark resolved items in `wiki/open-questions.md`.

- **Fact change** → Grep across `wiki/` to find every copy. Update all. Leave no stale copies.

## Step 3 — Stamp updated files

Bump `Last updated: YYYY-MM-DD` **only on files actually modified in this sync.** Do not bump untouched files.

Optionally add a brief parenthetical note of what changed, e.g. `Last updated: 2026-04-05 (added instructor class counts)`.

## Step 4 — Report

Tell the user:
- What was processed
- Which files were created or updated
- Any new open questions or follow-ups surfaced
- Any stale information found and fixed

Keep the report short — a bullet list is fine.
