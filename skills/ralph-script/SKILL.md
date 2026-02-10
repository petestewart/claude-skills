---
name: ralph-script
description: >
  Add a Ralph Wiggum autonomous loop to the current project. Creates ralph-loop.sh
  and prompt.md files that enable Claude to autonomously work through a PLAN.md task
  list. Use when the user says "/ralph-script", "add ralph loop", "set up ralph
  script", "add autonomous loop", or wants to bootstrap the Ralph Wiggum loop files
  into a project. Supports a --force flag to skip interactive checks.
---

# Ralph Script

Add `ralph-loop.sh` and `prompt.md` to the current project from bundled templates.

## Workflow

### 1. Parse arguments

Check if the user passed `--force`. If so, set `FORCE=true` and skip all interactive checks in step 2.

### 2. Check referenced files

The ralph loop references these files at runtime:

| File | How it's used | Required format |
|------|--------------|----------------|
| `PLAN.md` | Loop continues while `- [ ]` checkboxes exist | Must contain `- [ ]` / `- [x]` markdown checkboxes |
| `PROBLEM.md` | Read for troubleshooting context | Any markdown |
| `PRD.md` | Read for troubleshooting context | Any markdown |
| `specs/README.md` | Read for troubleshooting context | Any markdown |

For each file, check if it exists in the project root.

**If a file is missing** (and not `--force`): Warn the user. List all missing files in a single message. Do not offer to create them — just note they will need to exist before running the loop.

**If PLAN.md exists**: Read it and verify it contains `- [ ]` style checkboxes. If it uses a different task format (numbered lists, `TODO:` markers, other patterns), use AskUserQuestion to ask:
- "PLAN.md uses [detected format] instead of `- [ ]` checkboxes. The ralph-loop.sh script checks for `- [ ]` to determine if tasks remain. Should I: (a) update the script's grep pattern to match your format, or (b) leave as-is (you'll convert PLAN.md yourself)?"
- If (a): note the needed grep pattern change for step 3.

**If prompt.md references files that don't exist** (and not `--force`): Optionally ask whether to remove those references from the generated prompt.md. Only ask if 2+ referenced troubleshooting files are missing — if just one is missing, simply warn.

### 3. Copy templates

Copy the template files from this skill's assets directory into the project root:
- `assets/ralph-loop.sh` → `./ralph-loop.sh`
- `assets/prompt.md` → `./prompt.md`

If either file already exists in the project, use AskUserQuestion to confirm overwrite (unless `--force`).

Apply any modifications determined in step 2 (e.g., adjusted grep pattern).

Make `ralph-loop.sh` executable:
```bash
chmod +x ralph-loop.sh
```

### 4. Report

Print a summary:
- Files created
- Any warnings about missing referenced files
- How to run: `./ralph-loop.sh`
- Remind that `jq` is optional but provides colored output with context usage tracking
