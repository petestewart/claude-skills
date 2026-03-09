---
name: plan
description: Create an implementation plan from a description, PRD.md, specs/, or any combination. Use when the user says "/plan", "create a plan", "implementation plan", "task breakdown", or "plan the work". Accepts an inline description as arguments (e.g., "/plan add dark mode to settings").
---

# Implementation Plan

Generate an actionable PLAN.md with phased tasks from whatever context is available — a user-provided description, PRD.md, specs/, or any combination.

## Workflow

### 1. Gather Context

Determine the input sources. Multiple sources can be combined — they are additive, not exclusive.

**A) User-provided description**: Check if the user provided arguments with the command (e.g., `/plan add a notifications system`). If so, this is the primary description of what to build.

**B) Project docs**: Look for `PRD.md` and `specs/README.md` in the project root. If found, read them along with any `specs/*.md` files. These supplement the description with detailed requirements and architecture.

**If no description AND no PRD.md exists**: Ask the user to describe what they want to build. Do not suggest running other skills — just ask directly:
> "What would you like to build? Describe the feature or project and I'll create a plan."

Read all available docs: PRD.md, specs/README.md, and all specs/*.md files (if they exist).

### 2. Generate PLAN.md

Create `PLAN.md` at project root:

```markdown
# Plan: [Title]

## Overview
Brief summary of what we're building and success criteria.

## Architecture Reference
Summary of key architectural decisions. Link to specs/README.md if it exists.

## Tasks

### Phase 1: [Phase Name]
- [ ] **Task title** `[pending]`
  - Spec: specs/component.md#section (if applicable)
  - Scope: What this task covers
  - Acceptance: How we know it's done

### Phase 2: [Phase Name]
...

## Dependencies
External dependencies or prerequisites.

## Open Questions
Unresolved questions that may affect implementation.

---
*Generated on [date]*
```

**Task generation rules:**
- Create 10-25 tasks organized into logical phases
- Each task independently completable
- Reference specific spec files where applicable
- Include setup/infrastructure tasks at start
- Include validation/testing tasks throughout
- Status values: `pending` | `in-progress` | `blocked` | `done`
- If working from a brief description, explore the existing codebase to inform task scope and architecture decisions

Open in Typora: `open -a Typora PLAN.md`

### 3. Review Plan

**If running interactively**, ask:
> "I've created PLAN.md with [N] tasks across [M] phases. Would you like me to:
> 1. **Review the plan** - Check for gaps and spec coverage
> 2. **Done** - Proceed with the plan as-is"

If review requested, spawn Explore subagent:
```
Prompt: "Review PLAN.md for completeness. Check:
- Does the plan cover all stated requirements (from PRD.md, specs/, or the overview)?
- Are task dependencies correct and phases logically ordered?
- Are acceptance criteria testable?
- Are there obvious gaps or missing edge cases?

Return: 🔴 Critical gaps, 🟡 Missing coverage, 🟢 Well-covered areas."
```

Present findings. Ask user what to update. Make requested changes.

**If running headless** (e.g., via `-p` flag or as a subagent), skip the review prompt and proceed directly.

### 4. Next Steps

**If running interactively**, ask:
> "Plan is ready. Would you like me to:
> 1. **Start implementation** - Begin working on the first task
> 2. **Done** - Keep the plan for manual execution"

**If running headless**, stop after creating PLAN.md. The caller decides what happens next.
