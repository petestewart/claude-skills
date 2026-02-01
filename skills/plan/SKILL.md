---
name: plan
description: Create implementation plan from PRD.md and specs/. Use when the user has specifications and wants an actionable task list. Also use when the user says "/plan", "create a plan", "implementation plan", "task breakdown", or "plan the work".
---

# Implementation Plan

Transform PRD.md and specs/ into an actionable PLAN.md with phased tasks.

## Workflow

### 1. Check Prerequisites

Look for `PRD.md` and `specs/README.md` in project root.

**If PRD.md missing**: Ask:
> "No PRD.md found. Would you like me to:
> 1. **Create one first** - Run `/prd` to define requirements
> 2. **Proceed without it** - I'll ask you to describe requirements directly"

**If specs/README.md missing**: Ask:
> "No specs/ found. Would you like me to:
> 1. **Create specs first** - Run `/specs` to define technical approach
> 2. **Proceed without them** - Plan will be less precise"

Read all available docs: PRD.md, specs/README.md, and all specs/*.md files.

### 2. Generate PLAN.md

Create `PLAN.md` at project root:

```markdown
# Plan: [Title from PRD]

## Overview
Brief summary of what we're building and success criteria (from PRD).

## Architecture Reference
Link to specs/README.md and summary of key architectural decisions.

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
*Generated from PRD.md and specs/ on [date]*
```

**Task generation rules:**
- Create 10-25 tasks organized into logical phases
- Each task independently completable
- Reference specific spec files where applicable
- Include setup/infrastructure tasks at start
- Include validation/testing tasks throughout
- Status values: `pending` | `in-progress` | `blocked` | `done`
- **Checkbox rule**: Only use `[ ]` checkboxes for actionable tasks that a developer or agent can complete. Never use checkboxes for questions, decisions, open items, or anything that cannot be accomplished by an agent executing code/commands.

Open in Typora: `open -a Typora PLAN.md`

### 3. Review Plan

Ask:
> "I've created PLAN.md with [N] tasks across [M] phases. Would you like me to:
> 1. **Review the plan** - Check for gaps and spec coverage
> 2. **Done** - Proceed with the plan as-is"

If review requested, spawn Explore subagent:
```
Prompt: "Review PLAN.md against PRD.md and specs/. Check:
- Does the plan cover all requirements from PRD?
- Does each spec component have corresponding tasks?
- Are task dependencies correct?
- Are acceptance criteria testable?

Return: 🔴 Critical gaps, 🟡 Missing coverage, 🟢 Well-covered areas."
```

Present findings. Ask user what to update. Make requested changes.

### 4. Next Steps

> "Plan is ready. Would you like me to:
> 1. **Start implementation** - Begin working on the first task
> 2. **Done** - Keep the plan for manual execution"
