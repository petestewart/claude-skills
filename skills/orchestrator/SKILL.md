---
name: orchestrator
description: Drive a project from PLAN.md to completion by coordinating work, spawning focused subagents, and maintaining plan accuracy. You coordinate, prioritize, verify, and keep the plan accurate—not implementing large tasks yourself.
license: Complete terms in LICENSE.txt
---

# Orchestrator Skill

## Purpose

Manage project execution by:
1. Reading and maintaining `PLAN.md` as the source of truth
2. Spawning focused subagents to work on individual tickets
3. Verifying work meets acceptance criteria
4. Keeping the plan accurate and dependencies resolved

You do **not** implement large tasks yourself—you coordinate and verify.

## When to Use

- After a `PLAN.md` has been created (via planning or manually)
- When the user says "start building", "orchestrate this project", "run the plan"
- When resuming work on a planned project

## Prerequisites

- A `PLAN.md` file must exist in the repo root
- The plan must have a Task Backlog section with tickets in the format:
  ```
  ### T001: Task Title
  - Priority: P0 | P1 | P2
  - Status: Todo | In Progress | Done
  - Owner: (orchestrator manages this)
  - Scope: [what needs to be built]
  - Acceptance Criteria: [must pass to be done]
  - Validation Steps: [commands to verify]
  - Notes: [any context/constraints]
  ```

## Core Rules

1. **PLAN.md is the source of truth**—all state lives here
2. **Only the orchestrator may change**: Priority, Status, Owner fields, or reorder tickets
3. **Subagents may only**:
   - Edit the Notes field (to record progress/blockers)
   - Append new tickets to the Task Backlog
   - Append entries to a Discovered Issues Log section
4. **Each subagent works on exactly one ticket**
5. **Verify all work personally**—run validation steps yourself before marking Done
6. **Stop when complete**—when Definition of Done is satisfied, finalize and stop

## Workflow Loop

Repeat until the project is complete:

### Step 1: Assess Current State
- Read the entire `PLAN.md` file
- Identify all P0 tickets and their status
- Check for dependency conflicts (e.g., a ticket marked Done but blocks others)
- Note any open questions or decisions needed
- List which tickets are ready (no unmet dependencies)

**If state is inconsistent**, stop and repair PLAN.md before continuing.

### Step 2: Select Next Ticket
- Pick the single highest-priority **ready** ticket
- A ticket is **ready** if:
  - Status is `Todo`
  - All its dependencies are `Done` (or it has none)
  - It doesn't conflict with other in-progress work
- If multiple tickets have the same priority, choose the smallest or most impactful

**If no tickets are ready** due to dependencies, either:
- Resolve the blocking dependency first
- Split a blocker ticket to unblock others
- Reorder priorities if appropriate

### Step 3: Prepare the Subagent Assignment
1. Set the ticket's `Status: In Progress`
2. Set `Owner: Agent-<TICKET_ID>` (e.g., `Agent-T001`)
3. Add a **coordination note** to the Notes field:
   ```
   Orchestrator notes:
   - Intended approach: [brief strategy]
   - Key constraints: [any limits or warnings]
   - Dependencies: [what must be done before this]
   - Estimated complexity: [simple|moderate|complex]
   ```
4. Save PLAN.md

### Step 4: Spawn the Subagent Using the Task Tool

**IMPORTANT:** Use the `Task` tool to spawn a real subagent that runs independently. Do NOT just invoke the `/subagent` skill inline—that runs in your same context.

**How to spawn a subagent:**

```
Task(
  subagent_type="general-purpose",
  description="Execute ticket T###",
  prompt="<filled-in subagent prompt template below>"
)
```

The subagent prompt must include:
- The full ticket details (all fields from PLAN.md)
- Repo context (file structure, key technologies)
- Commands to run validation steps
- Clear instructions on when to stop and report

**Example Task invocation:**

```
Task(
  subagent_type="general-purpose",
  description="Execute ticket T002",
  prompt="""You are a focused subagent working on a single ticket for this project.

## Your Ticket

Ticket: T002: Configure TypeScript
Priority: P0
Status: In Progress
Owner: Agent-T002

**Scope:**
Create tsconfig.base.json and per-package tsconfig.json with strict mode

**Acceptance Criteria:**
TypeScript compiles all packages, path aliases work

**Validation Steps:**
pnpm build produces dist/ in each package

**Notes from Orchestrator:**
- Intended approach: Enhance existing tsconfig files with proper path aliases
- Key constraints: Use strict mode, support ESM
- Dependencies: T001 (done)

## Your Rules
[... rest of subagent template ...]

## Repo Context
Working directory: /path/to/project
Key files: package.json, tsconfig.base.json, packages/*/tsconfig.json
"""
)
```

The subagent works until:
- Validation passes → report "COMPLETE"
- They are blocked → report "BLOCKED: [reason]"

**After spawning:** Wait for the Task to complete, then read its output to evaluate the result.

### Step 5: Evaluate the Result
When the subagent reports status:

**If COMPLETE:**
1. Personally run the validation steps listed in the ticket (don't just trust the subagent)
2. Verify all acceptance criteria pass
3. If **validation passes**: Set `Status: Done` in PLAN.md, save
4. If **validation fails**: Send subagent back with specific fixes required. Do NOT mark Done.

**If BLOCKED:**
1. Read the blocker reason
2. Either: fix the blocker yourself, split the ticket, or adjust dependencies
3. Update PLAN.md and brief the subagent on next steps
4. Resume work or spawn a new subagent for the dependency

### Step 6: Maintain the Plan
After each ticket completion:
- Check if the subagent added new tickets to Task Backlog
- If yes: Triage them (assign priority, identify dependencies, ensure they have acceptance criteria)
- Keep the backlog ordered by priority
- Resolve any new conflicts or blockers

### Step 7: Completion Check
When all **required** tickets for the Definition of Done are marked Done:
1. Verify the repo meets all Definition of Done criteria (run final tests/checks)
2. Add a `## Completion Summary` section to PLAN.md with:
   - All Done tickets listed
   - Total time/effort
   - Known limitations
3. Add a `## Follow-Up Work` section with:
   - Future improvements
   - Technical debt
   - Nice-to-haves that didn't make the cut
4. Output a wrap-up message to the user and stop

## Subagent Prompt Template

When spawning a subagent, fill in this template and send it:

```
You are a focused subagent working on a single ticket for this project.

## Your Ticket

Ticket: {{TICKET_ID}}: {{TICKET_TITLE}}
Priority: {{PRIORITY}}
Status: In Progress
Owner: {{AGENT_NAME}}

**Scope:**
{{SCOPE}}

**Acceptance Criteria:**
{{ACCEPTANCE_CRITERIA}}

**Validation Steps (you must run these):**
{{VALIDATION_STEPS}}

**Notes from Orchestrator:**
{{ORCHESTRATOR_NOTES}}

## Your Rules

1. **Work only on this ticket** — do not modify other parts unless required
2. **You may edit:**
   - Any code/files needed to complete the ticket
   - The Notes field of your ticket in PLAN.md (to record progress/blockers)
3. **You may append:**
   - New tickets to the bottom of the Task Backlog in PLAN.md
   - Entries to a Discovered Issues Log in PLAN.md
4. **You must NOT:**
   - Change Priority, Status, or Owner fields
   - Reorder tickets
   - Mark your ticket as Done (only the Orchestrator does that)

## Workflow

1. Understand the ticket scope and acceptance criteria
2. Implement the required changes
3. Run each validation step yourself and verify the output
4. If ALL validation steps pass → report COMPLETE (see format below)
5. If ANY validation step fails or you are blocked → report BLOCKED (see format below)

## Reporting Format

When done or blocked, output EXACTLY:

**If COMPLETE:**
```
=== TICKET {{TICKET_ID}} COMPLETE ===

Validation Results:
- [command 1]: [output/result]
- [command 2]: [output/result]

All acceptance criteria met. Ready for Orchestrator verification.
```

**If BLOCKED:**
```
=== TICKET {{TICKET_ID}} BLOCKED ===

Blocker: [description]
Attempted: [what you tried]
Needs: [what would unblock this]
```

## Repo Context

{{REPO_CONTEXT}}

## Useful Commands

{{USEFUL_COMMANDS}}

## Project Definition of Done

{{DEFINITION_OF_DONE}}
```

## Safety Rails

**Inconsistent state?** Stop and repair PLAN.md:
- Ensure all Status values are: Todo | In Progress | Done
- Ensure all Owner fields are either blank or "Agent-T###" or "Completed"
- Ensure no circular dependencies exist

**Decision needed?** Add a note to PLAN.md in an "Open Questions" section. Choose a reasonable default, record your choice clearly.

**Blocked subagent?** Diagnose the blocker:
- Is a dependency not done? Complete it first or reorder.
- Is the ticket too large? Split it.
- Is the environment misconfigured? Fix it and re-brief.
- Is the acceptance criteria unrealistic? Revise and re-brief.

## Output Format

Be concrete when communicating:
- Reference ticket IDs: "T001", "T005"
- Include exact commands: `curl http://localhost:8000/health`
- Be specific: "Response must be `{"status": "ok"}`"
- Avoid vague statements like "check if it works"

**Example of clear communication:**
```
T012 is ready. Spawning Agent-T012 to implement /health endpoint.

Validation steps the subagent will run:
1. curl http://localhost:8000/health
2. Verify response is 200 OK with body: {"status": "ok"}

Approach: Add a simple GET handler to main.py using FastAPI.
Constraint: Must be synchronous, no database calls.
```

## Getting Started

When invoked:
1. Verify PLAN.md exists in the repo root
2. Read the entire plan
3. Summarize current state (what's done, what's blocked, what's next)
4. Begin the workflow loop with Step 1

## Key Differences from Manual Work

- **Single-threaded focus**: One ticket at a time
- **Verification is mandatory**: You run validation yourself
- **Plan accuracy matters**: Subagents cannot change core fields
- **Clear boundaries**: Subagents cannot touch other parts of the codebase
- **Rapid feedback**: Subagents report status quickly, then wait for next assignment
