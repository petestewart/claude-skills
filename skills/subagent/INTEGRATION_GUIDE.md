# Orchestrator + Subagent Integration Guide

This document explains how the Orchestrator and Subagent skills work together, what information flows between them, and how to avoid common pitfalls.

---

## High-Level Workflow

```
User: "Start building"
      ↓
Orchestrator reads PLAN.md
      ↓
Orchestrator selects ticket T###
      ↓
Orchestrator creates Subagent assignment
      ↓
Subagent receives full ticket details + context
      ↓
Subagent implements ticket
      ↓
Subagent reports COMPLETE or BLOCKED
      ↓
Orchestrator verifies and updates PLAN.md
      ↓
Repeat until done
```

---

## What the Orchestrator Does

**Role**: Coordinator and Verifier

**Responsibilities:**
1. Read PLAN.md and assess current state
2. Select the highest-priority ready ticket
3. Assign a ticket to a subagent (set Owner: Agent-T###)
4. Provide clear guidance (via Notes field)
5. Wait for subagent completion report
6. **Verify validation steps personally** before marking Done
7. Update PLAN.md status fields
8. Maintain plan accuracy and dependencies

**What the Orchestrator Controls:**
- Priority field (can reorder tickets)
- Status field (Todo → In Progress → Done)
- Owner field (assigns tickets)
- The decision to mark tickets Done
- Overall project progress and plan maintenance

**What the Orchestrator Does NOT Do:**
- Implement code
- Change Notes field (reads it, doesn't write)
- Mark their own work as Done
- Append new tickets (only subagents do that)

---

## What the Subagent Does

**Role**: Focused Implementer

**Responsibilities:**
1. Receive ticket assignment from Orchestrator
2. Understand scope and acceptance criteria
3. Implement required changes
4. Run validation steps themselves
5. Update Notes field with results
6. Report completion or blocker
7. Stop and wait for next assignment

**What the Subagent Controls:**
- Code changes (implementing the ticket)
- Notes field (updating with results)
- Appending new tickets (if discovered)
- Appending discovered issues
- Appending open questions

**What the Subagent Does NOT Do:**
- Change Status, Priority, or Owner fields
- Reorder tickets
- Mark their own ticket Done
- Make coordinating decisions
- Work on multiple tickets

---

## Information Flow: Orchestrator → Subagent

### How the Orchestrator Briefs a Subagent

The Orchestrator provides everything a subagent needs in a single message. This includes:

```
You are a subagent working on ticket T###.

## Your Ticket

[Full ticket details from PLAN.md:
 - Title
 - Priority
 - Scope
 - Acceptance Criteria
 - Validation Steps
 - Dependencies
 - Current Notes]

## Orchestrator Guidance

[Added to Notes before assignment:
 - Intended approach
 - Key constraints
 - Any gotchas or context]

## Repo Context

[File structure, tech stack, how to run things]

## Useful Commands

[Commands to start server, run tests, etc.]

## PLAN.md Location

Path to PLAN.md in the repo

---

Now implement this ticket. When you complete it:
1. Run the validation steps yourself
2. Update the Notes field with results
3. Report: "=== TICKET T### COMPLETE ===" with validation output

If blocked, report: "=== TICKET T### BLOCKED ===" with details.
```

### Example Orchestrator Briefing

```
You are a subagent working on T007: Add /health endpoint

## Your Ticket

### T007: Add /health endpoint
- Priority: P0
- Status: In Progress
- Owner: Agent-T007
- Scope: Create GET /health endpoint returning {"status":"ok"} with 200 status
- Acceptance Criteria:
  - [ ] Endpoint exists at GET /health
  - [ ] Returns HTTP 200
  - [ ] Response is {"status":"ok"} JSON
- Validation Steps:
  1. curl http://localhost:8000/health
  2. Verify 200 OK with correct JSON
- Dependencies: (none)

## Orchestrator Guidance

Notes:
- Use FastAPI's @app.get decorator
- Keep simple—no database checks needed
- Endpoint is intentionally unauthenticated (load balancers use it)
- Server is already running on localhost:8000

## Repo Context

FastAPI app in src/main.py
Tests in tests/

## Useful Commands

Start server: uvicorn src.main:app --reload --port 8000
Run tests: pytest tests/
View main app: cat src/main.py

---

Implement the endpoint. Run validation steps yourself. Report completion with results.
```

---

## Information Flow: Subagent → Orchestrator

### How the Subagent Reports Back

The subagent reports in two cases:

**Case 1: Work is Complete**
```
=== TICKET T### COMPLETE ===

Summary:
[One paragraph describing what you did]

Files changed:
- path/to/file1
- path/to/file2

Validation:
- `curl ...`: [output] ✓
- `pytest ...`: [output] ✓

Plan updates made:
- Updated Notes field for T###
[- New tickets: T###, T###]
[- Discovered issues: describe]
[- Open questions: describe]

Ready for Orchestrator verification.
```

**Case 2: Work is Blocked**
```
=== TICKET T### BLOCKED ===

Blocker:
[Description of what is blocking]

Attempted:
[What you tried]

Needs:
[What would unblock]

Plan updates made:
- Updated Notes field for T### with blocker details
[- Added to Open Questions: describe]
[- Added to Discovered Issues: describe]

Status: BLOCKED (waiting)
```

### What the Orchestrator Does With the Report

1. **If COMPLETE:**
   - Read the summary
   - Run the exact validation steps the subagent ran
   - If validation passes in the Orchestrator's environment too:
     - Set `Status: Done` in PLAN.md
     - Set `Owner: Completed`
     - Move to next ticket
   - If validation fails:
     - Send subagent back with specific error
     - Keep Status as `In Progress`
     - Request re-run

2. **If BLOCKED:**
   - Diagnose the blocker
   - Fix it, clarify it, or split the ticket
   - Re-brief the subagent or move to next ticket

---

## PLAN.md: The Contract Between Them

PLAN.md is the **single source of truth**. Both agents interact with it, but in different ways:

### What the Orchestrator Updates

```
### T007: Add /health endpoint
- Priority: P0           ← Orchestrator may change
- Status: In Progress    ← Orchestrator may change
- Owner: Agent-T007      ← Orchestrator may change
- Scope: [...]           ← Read-only
- Acceptance Criteria:   ← Read-only
  [...]
- Validation Steps:      ← Read-only
  [...]
- Dependencies: (none)   ← Read-only
- Notes: [initial guidance] ← Orchestrator writes initial, subagent updates
```

### What the Subagent Updates

```
### T007: Add /health endpoint
- Priority: P0           ← Read-only
- Status: In Progress    ← Read-only
- Owner: Agent-T007      ← Read-only
- Scope: [...]           ← Read-only
- Acceptance Criteria:   ← Read-only
  [...]
- Validation Steps:      ← Read-only
  [...]
- Dependencies: (none)   ← Read-only
- Notes:                 ← Subagent appends to this
  [guidance from orchestrator]
  - Implementation: [what subagent did]
  - Files: [what changed]
  - Validation: [results]
  - Watch for: [concerns]
```

### Appends Only

Both agents can **append** to three sections (never modify existing entries):

1. **Task Backlog** (append at bottom)
   - Orchestrator: rarely, only if they discover work
   - Subagent: when they discover necessary work

2. **Discovered Issues Log** (append new rows)
   - Orchestrator: rarely
   - Subagent: when they find bugs, risks, or problems

3. **Open Questions** (append new rows)
   - Orchestrator: when they need decisions
   - Subagent: when they need decisions

---

## Common Patterns

### Pattern 1: Happy Path (Ticket Completes)

```
Orchestrator:
1. Reads PLAN.md
2. Finds T007 is ready (no dependencies)
3. Sets Status: In Progress, Owner: Agent-T007
4. Adds to Notes: "Use FastAPI decorator, keep simple, unauth OK"
5. Sends subagent the ticket details + briefing

Subagent:
1. Reads full ticket and Notes
2. Implements @app.get("/health")
3. Runs: curl http://localhost:8000/health
4. Verifies: 200 OK with {"status":"ok"}
5. Updates Notes with implementation details
6. Reports: "=== TICKET T007 COMPLETE ===" with validation output

Orchestrator:
1. Receives report
2. Runs: curl http://localhost:8000/health (personally verifies)
3. Confirms: 200 OK, output matches
4. Sets Status: Done, Owner: Completed
5. Moves to next ticket
```

### Pattern 2: Blocker (Subagent Discovers Dependency Issue)

```
Subagent working on T012:
1. Reads ticket: depends on T005 (database migration)
2. Checks PLAN.md: T005 is still Todo
3. Cannot proceed without database
4. Reports: "=== TICKET T012 BLOCKED ==="
   Blocker: Depends on T005 which is not Done

Orchestrator:
1. Receives blocker report
2. Checks T005: Status is Todo
3. Prioritizes T005, assigns to different subagent
4. When T005 is Done, goes back to T012
5. Re-briefs subagent on T012 with "T005 now complete, proceed"
```

### Pattern 3: Validation Fails

```
Subagent reports: "COMPLETE" with validation output

Orchestrator:
1. Runs validation steps personally
2. Gets different result than subagent reported
3. Sends back: "Validation failed. Running curl returned 500 error: [error]. Please debug and resubmit."
4. Keeps Status: In Progress
5. Waits for subagent to fix and resubmit

Subagent:
1. Receives feedback: "Your validation failed"
2. Debugs the issue
3. Fixes the code
4. Runs validation again
5. Resubmits: "COMPLETE" with corrected output
```

### Pattern 4: Discovered New Work

```
Subagent implementing T007 (health endpoint):
1. Realizes: "Load balancers might hit this constantly. Should rate-limit it."
2. Appends new ticket to Task Backlog: T025 (rate limiting)
3. Notes in T025: "Discovered during T007 implementation"
4. Reports: "COMPLETE" but mentions "Also created T025: Add rate limiting"

Orchestrator:
1. Sees T007 is done
2. Reviews new ticket T025
3. Triages it: assigns Priority: P1, reasonable scope
4. Adds to task queue
5. Proceeds with next ticket
```

---

## Edge Cases and How to Handle Them

### Edge Case 1: Subagent Cannot Find PLAN.md

**Subagent action:**
```
BLOCKER: Cannot locate PLAN.md in repo root.
Status: BLOCKED
```

**Orchestrator action:**
- Verify PLAN.md path is correct
- Re-brief with full path: "/path/to/PLAN.md"
- Or: share file content directly
- Resume subagent

### Edge Case 2: Validation Passes for Subagent, Fails for Orchestrator

Possible causes:
- Different environment (versions, config, state)
- Race condition or timing issue
- Subagent didn't run the full validation steps

**Orchestrator action:**
1. Share exact error output
2. Ask subagent to debug in their environment
3. Or: reproduce locally and provide more info
4. Keep Status: In Progress until resolved

### Edge Case 3: Orchestrator and Subagent Disagree on Scope

**Scenario:**
- Ticket says: "Implement login"
- Subagent implements: "Login with password hashing, 2FA, rate limiting, email verification..."
- Orchestrator expected: "Login with password, no extra features"

**Prevention:**
- Orchestrator provides clear notes on scope boundaries
- Subagent asks in Open Questions if unsure

**Resolution:**
- If extra work is useful: Create new ticket for each feature, mark current as Done with note
- If out of scope: Remove extra code, re-validate, report Complete with note

### Edge Case 4: Subagent Adds New Ticket But Doesn't Know Ticket Number

When subagent appends a new ticket to PLAN.md, they don't know what number to assign (T### is automatic or assigned by Orchestrator).

**Solution:**
- Subagent: Append as "T??? [Title]" or "T-NEW [Title]"
- Orchestrator: Assigns proper number when triaging
- Or: Subagent can ask in notes: "Appended new ticket, suggest numbering as T###"

### Edge Case 5: Orchestrator Needs to Interrupt a Subagent

**Scenario:**
- T007 is in progress
- High-priority bug discovered (P0)
- Need subagent to stop T007 and work on bug instead

**Orchestrator action:**
1. Send message: "Please stop T007. Change Priority to P1, revert to Status: Todo"
2. Add new ticket for bug (high priority)
3. Reassign subagent to bug ticket
4. Subagent should stop work and switch

---

## Best Practices for Orchestrator + Subagent Alignment

### For Orchestrators

1. **Be explicit in Notes**
   - Don't assume subagent will figure it out
   - State exact approach, constraints, gotchas
   - Include example commands

2. **Verify personally**
   - Always run validation yourself
   - Don't trust subagent's output blindly
   - Check the actual behavior

3. **Provide fast feedback**
   - If validation fails, respond immediately
   - If blocker exists, fix it or clarify quickly
   - Keep subagent unblocked

4. **Maintain PLAN.md accuracy**
   - Keep Status fields up-to-date
   - Triage new tickets subagents add
   - Review Open Questions and respond

### For Subagents

1. **Read the whole ticket**
   - Scope, AC, Validation, Dependencies, Notes
   - Understand fully before starting

2. **Ask if unclear**
   - Add to Open Questions
   - Don't guess
   - Better to be blocked than implement wrong thing

3. **Validate personally**
   - Run every validation step yourself
   - Don't assume it will work
   - Include real output in your report

4. **Update Notes carefully**
   - Only edit the Notes field
   - Record what you did and what validation showed
   - Flag concerns for Orchestrator

5. **Stop when done or blocked**
   - Don't keep iterating
   - Report and wait
   - Let Orchestrator decide next steps

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Subagent keeps failing validation | Validation steps are unclear or impossible | Orchestrator: Clarify AC or adjust validation steps |
| Subagent can't find files | Wrong file paths provided | Orchestrator: Give exact relative paths from repo root |
| Subagent says "Complete" but work isn't done | Scope misunderstood | Orchestrator: Re-brief with specific examples of what "done" looks like |
| Orchestrator validation differs from subagent | Environment differences | Debug together: what's different? (versions, config, state) |
| Too many discovered issues | Tickets too large or scope unclear | Orchestrator: Split tickets into smaller, more focused units |
| Circular dependencies in tickets | Planning issue | Orchestrator: Review dependencies, reorder, or split tickets |
| Subagent modifying other tickets | Misunderstood rules | Subagent: Re-read hard rules, only edit Notes of assigned ticket |
| Orchestrator keeping ticket In Progress too long | Verification taking too long | Orchestrator: Move on, mark Done, revisit later if issues arise |

---

## Summary

**Orchestrator:**
- Coordinates, verifies, maintains plan
- Controls Status, Priority, Owner
- Responsible for overall accuracy

**Subagent:**
- Implements, validates, reports
- Controls code changes and Notes updates
- Responsible for doing the work right

**PLAN.md:**
- Single source of truth
- Both read it, only appropriate fields are written
- Append-only for new work/issues/questions

**Communication:**
- Orchestrator briefs subagent with full context
- Subagent reports completion or blocker
- Orchestrator verifies and updates state
- Repeat until done

This separation of concerns allows:
- **Orchestrators** to focus on coordination without implementation details
- **Subagents** to focus on implementation without making decisions
- **Clear accountability** for different aspects of project management
- **Easy verification** by having all state in one place
