# Subagent Reference Guide

This document explains how the orchestrator coordinates with subagents and how to handle common scenarios.

## Subagent Lifecycle

```
Orchestrator                          Subagent
─────────────────────────────────────────────────
1. Select ticket
2. Set Status: In Progress
3. Provide Subagent Prompt ──────→ 4. Execute ticket work
                                     5. Run validation steps
                                     6. Report completion or blocker
                    ←──────── 7. COMPLETE or BLOCKED
8. Verify results
9. Mark Status: Done (or resend)
```

## Subagent Prompt Structure

The subagent prompt MUST include:
1. **Ticket Details** - Full ticket from PLAN.md
2. **Rules** - What they can and cannot do
3. **Workflow** - Specific steps to follow
4. **Reporting Format** - Exact format for completion/blocker messages
5. **Context** - Repo structure, tech stack
6. **Validation Steps** - Commands they will run themselves

Example minimal prompt:
```
You are a subagent for ticket T005.

## Your Ticket
T005: Add user authentication
Priority: P0
Scope: Implement JWT-based login endpoint
Acceptance Criteria: POST /login with email/password returns JWT token
Validation Steps:
  1. curl -X POST http://localhost:8000/login -d '{"email":"test@test.com","password":"pass"}'
  2. Verify response contains "token" field

## Rules
- Only edit code needed for this ticket
- Update Notes field in PLAN.md if blocked
- Cannot mark ticket Done yourself
- Report completion exactly as: "=== TICKET T005 COMPLETE ===" followed by validation results

## Repo Context
- FastAPI app in src/main.py
- Start with: uvicorn src.main:app --reload

## Go!
Implement the login endpoint. When done, run the validation steps and report completion.
```

## Communication Patterns

### Pattern 1: Simple Completion

Subagent runs validation and reports:
```
=== TICKET T008 COMPLETE ===

Validation Results:
- npm test: PASS (all 24 tests pass)
- npm run build: PASS (no warnings)
- yarn lint: PASS (0 errors)

All acceptance criteria met. Ready for Orchestrator verification.
```

**Orchestrator action:**
1. Run validation steps yourself
2. If they pass: Mark `Status: Done`
3. If they fail: Send subagent back with specific failures

### Pattern 2: Blocked by Dependency

Subagent discovers a dependency and reports:
```
=== TICKET T010 BLOCKED ===

Blocker: Requires database schema migration (T009)
Attempted: Tried to add user table but schema module doesn't exist yet
Needs: T009 must be done first
```

**Orchestrator action:**
1. Check T009 status in PLAN.md
2. If T009 is Todo: Prioritize it, mark T010 as Todo (revert to In Progress)
3. If T009 is Done: Unblock T010 and re-brief subagent

### Pattern 3: Blocker Cannot Be Resolved

Subagent discovers acceptance criteria may be wrong:
```
=== TICKET T015 BLOCKED ===

Blocker: Acceptance criteria appears impossible
Attempted: Created all required fields, validation still fails
Needs: Clarification on "response time must be < 1ms" for remote API calls

This seems physically impossible for network requests. Can this be relaxed to 100ms?
```

**Orchestrator action:**
1. Review the acceptance criteria in PLAN.md
2. If the criteria is wrong: Fix it and re-brief subagent
3. If the criteria is correct: Explain why and provide guidance
4. Update Notes with the decision for future reference

### Pattern 4: Subagent Discovers New Work

Subagent finds an issue and reports:
```
=== TICKET T012 COMPLETE ===

Validation Results:
- [validation commands pass]

Also discovered: The caching layer isn't working. This should be a separate ticket.
Appended to Task Backlog:
- T016: Fix caching layer in data service (Priority: P1, simple fix)
```

**Orchestrator action:**
1. Verify validation steps pass
2. Mark T012 as Done
3. Review T016 in Task Backlog
4. Triage it: assign priority, ensure it has acceptance criteria
5. Update dependencies if needed

## Error Recovery

### Recovery Scenario 1: Validation Fails

**Subagent said:** "COMPLETE"
**You found:** curl request returned 500 error

**Steps:**
1. Share the error with subagent: "Validation failed: curl returned 500. Error: [error message]"
2. Revert Status to `In Progress` in PLAN.md
3. Add to Notes: "Validation failed on orchestrator's run: [specific error]"
4. Send subagent back with instructions to debug

### Recovery Scenario 2: Partial Completion

**Subagent said:** "COMPLETE"
**You found:** 2 of 3 acceptance criteria pass

**Steps:**
1. Identify which criteria failed
2. Update Notes in PLAN.md with the gap
3. Send subagent back: "AC#3 failed: [specific issue]. Please fix and resubmit."
4. Keep Status as `In Progress`

### Recovery Scenario 3: Environment Issue

**Subagent said:** "BLOCKED: Cannot start server"
**You found:** It's an environment setup issue, easily fixable

**Steps:**
1. Fix the environment (install dependencies, set config, etc.)
2. Update PLAN.md Notes: "Fixed: [what was wrong]"
3. Re-brief subagent on next steps
4. Keep Status as `In Progress`

## File Editing Rules for Subagents

### What They CAN Edit

1. **Implementation files** - Any code/config needed for their ticket
2. **Notes field** - Only their ticket's Notes field in PLAN.md
3. **Task Backlog** - Append new tickets at the bottom
4. **Discovered Issues Log** - Append new discoveries with timestamp

### What They CANNOT Edit

- **Status field** - Only orchestrator changes this
- **Priority field** - Only orchestrator changes this
- **Owner field** - Only orchestrator changes this
- **Reorder tickets** - Only orchestrator can move tickets up/down
- **Other tickets' fields** - Only their own ticket's Notes

**Example allowed edit:**
```markdown
### T005: Add user authentication
- Status: In Progress
- Owner: Agent-T005
- Notes: Found issue with JWT library version compatibility (see T016). Using jwt 4.8.1 instead.
```

**Example NOT allowed:**
```markdown
### T005: Add user authentication
- Status: Done          ❌ Only orchestrator can change this
- Priority: P0         ❌ Only orchestrator can change this
- Owner: Agent-T006    ❌ Wrong—must stay as Agent-T005
```

## Best Practices

1. **Be specific in subagent prompts** - Include exact commands, expected outputs
2. **Verify yourself** - Never trust subagent validation; always run it personally
3. **Quick feedback loops** - Report back to subagent quickly if issues arise
4. **Clear blocker resolution** - When a subagent is blocked, fix the blocker or explain why it's blocked
5. **Maintain Notes** - Keep Notes field rich with context for future reference
6. **Batch-check state** - Before each new ticket, re-read PLAN.md and verify consistency
