# Quick Reference Card

A one-page guide to the Orchestrator + Subagent skills.

---

## Using the Skills

### Orchestrator (Coordinator)
```bash
/orchestrator
```
- Reads PLAN.md
- Assigns tickets to subagents
- Verifies work before marking Done
- Maintains project state

### Subagent (Implementer)
Invoked by Orchestrator with full ticket context. Executes one ticket then reports.

---

## PLAN.md Structure

```markdown
# Project Plan: [Name]

## Definition of Done
- [ ] Criterion 1
- [ ] Criterion 2

## Task Backlog

### T001: Task Title
- Priority: P0 | P1 | P2
- Status: Todo | In Progress | Done
- Owner: (empty until assigned)
- Scope: [what to build]
- Acceptance Criteria:
  - [ ] AC1
  - [ ] AC2
- Validation Steps:
  1. command/check
  2. command/check
- Dependencies: T### (or none)
- Notes: [context/progress]

### T002: ...

## Discovered Issues Log

| Date | Issue | P | Action |

## Open Questions

| Question | Context | Status |
```

---

## Role Responsibilities

| Action | Orchestrator | Subagent |
|--------|--------------|----------|
| Read PLAN.md | ✓ | ✓ |
| Change Status | ✓ Only | |
| Change Priority | ✓ Only | |
| Change Owner | ✓ Only | |
| Edit Notes field | Initial guidance | ✓ Update with results |
| Append new tickets | Rarely | ✓ When discovered |
| Implement code | | ✓ Only |
| Verify validation | ✓ Always | ✓ First |
| Mark ticket Done | ✓ Only | |

---

## Ticket Lifecycle

```
1. Orchestrator finds ticket (Status: Todo, no blockers)
2. Orchestrator sets Owner: Agent-T###, Status: In Progress
3. Orchestrator briefs subagent with full ticket + guidance
4. Subagent implements and validates
5. Subagent reports: "=== TICKET T### COMPLETE ===" OR "=== TICKET T### BLOCKED ==="
6. Orchestrator verifies validation personally
7. Orchestrator sets Status: Done, Owner: Completed
8. Repeat for next ticket
```

---

## Reporting Format

### Subagent: Complete
```
=== TICKET T### COMPLETE ===

Summary:
[What you did - one paragraph]

Files changed:
- path/to/file1
- path/to/file2

Validation:
- `command`: [result] ✓
- `command`: [result] ✓

Plan updates made:
- Updated Notes for T###
[- New tickets: T###]
[- Discovered issues: describe]
[- Open questions: describe]

Ready for verification.
```

### Subagent: Blocked
```
=== TICKET T### BLOCKED ===

Blocker: [one-sentence description]
Attempted: [what you tried]
Needs: [exact requirement to unblock]

Plan updates made:
- Updated Notes with blocker details
[- Added to Open Questions: describe]
[- Added to Discovered Issues: describe]

Status: BLOCKED (waiting)
```

---

## Hard Rules

### Subagent MUST NOT:
- ❌ Change Status, Priority, or Owner fields
- ❌ Reorder tickets
- ❌ Work on multiple tickets
- ❌ Mark their own ticket Done
- ❌ Refactor code outside their scope
- ❌ Modify other tickets

### Subagent CAN:
- ✅ Edit Notes field of their ticket
- ✅ Append new tickets to Task Backlog
- ✅ Append to Discovered Issues Log
- ✅ Append to Open Questions
- ✅ Implement code needed for the ticket
- ✅ Run validation steps themselves

### Orchestrator MUST:
- ✅ Verify validation personally (don't trust subagent)
- ✅ Only mark Done after verification passes
- ✅ Keep PLAN.md state accurate
- ✅ Assign highest-priority ready tickets first
- ✅ Resolve blockers or split tickets to unblock work

---

## Common Scenarios

### Scenario: Work is Blocked by Dependency
**Problem:** T002 depends on T001, but T001 is still Todo
**Solution:** Orchestrator prioritizes T001, assigns to subagent, completes T001 first

### Scenario: Validation Fails
**Problem:** Subagent says Complete, but Orchestrator's validation fails
**Solution:** Orchestrator shares error with subagent, keeps Status: In Progress, subagent debugs and resubmits

### Scenario: Subagent Discovers New Work
**Problem:** While implementing T005, subagent realizes T006 is needed
**Solution:** Subagent appends T006 to Task Backlog with full details. Orchestrator triages it later.

### Scenario: Unclear Acceptance Criteria
**Problem:** Subagent doesn't know what "fast response time" means
**Solution:** Subagent adds to Open Questions with explanation, reports BLOCKED. Orchestrator clarifies.

---

## File Editing Examples

### Before: Ticket as Assigned
```markdown
### T007: Add /health endpoint
- Notes: Use FastAPI, keep simple, no DB checks.
```

### After: Subagent Update
```markdown
### T007: Add /health endpoint
- Notes: Use FastAPI, keep simple, no DB checks.
  - **Implementation**: Added GET /health handler returning {"status":"ok"}
  - **Files**: src/main.py, tests/test_health.py
  - **Validation**:
    * curl localhost:8000/health → 200 OK {"status":"ok"} ✓
    * pytest tests/test_health.py → 1 passed ✓
  - **Watch for**: Endpoint is unauthenticated by design
```

### New Ticket Example (appended by subagent)
```markdown
### T025: Add rate limiting to /health
- Priority: P1
- Status: Todo
- Owner:
- Scope: Limit /health to 100 req/min per IP
- Acceptance Criteria:
  - [ ] >100 req/min returns 429
  - [ ] Counter resets every 60s
- Validation Steps:
  1. for i in {1..105}; do curl /health; done
  2. Verify: first 100 are 200, last 5 are 429
- Dependencies: T007
- Notes: Discovered during T007 (load balancers may DOS it)
```

---

## Check These Before Reporting

### Before: Subagent Reports Complete
- [ ] All Acceptance Criteria satisfied
- [ ] All Validation Steps passed (you ran them)
- [ ] You updated only the Notes field
- [ ] You didn't change Status/Priority/Owner
- [ ] Your report uses exact format
- [ ] Ready to stop and wait

### Before: Orchestrator Marks Done
- [ ] Subagent's validation output is in their report
- [ ] You personally ran validation steps
- [ ] Output matches expected results
- [ ] All Acceptance Criteria verified
- [ ] No other work needed for this ticket

---

## Useful Commands by Tech Stack

### Python (FastAPI/Django)
```bash
pytest tests/
pytest tests/test_file.py::test_function
python -m pytest --tb=short
```

### Node.js (Express/Next)
```bash
npm test
npm run test:unit
npm run test:integration
yarn test --watch
```

### General
```bash
git log --oneline -5           # See recent commits
git diff HEAD                   # See uncommitted changes
git status                      # See current state
curl -i http://localhost:8000  # Test API endpoint
```

---

## Tips for Success

1. **Read fully** - Don't skim tickets, read scope + AC + validation + notes
2. **Run validation yourself** - Always, never assume
3. **Update Notes** - Record what you did for orchestrator
4. **Stop when blocked** - Report immediately, don't keep trying
5. **Ask questions** - Use Open Questions, don't guess
6. **Small commits** - Atomic, logical chunks if using git
7. **Be honest** - If AC is unclear, say so. If implementation took unexpected approach, explain why

---

## File Locations

```
Your project/
├── PLAN.md                    ← Source of truth
├── src/
├── tests/
└── ... (your code)

Skill docs:
~/.claude/skills/orchestrator/
├── SKILL.md                   ← Orchestrator skill
├── subagent-SKILL.md          ← Subagent skill
├── README.md                  ← Overview
├── INTEGRATION_GUIDE.md       ← How they work together
├── USAGE_EXAMPLE.md           ← Real example walkthrough
├── PLAN_TEMPLATE.md           ← Copy-paste PLAN structure
├── subagent-CHECKLIST.md      ← Before-you-submit checklist
├── subagent-TEMPLATES.md      ← Copy-paste PLAN.md entries
└── QUICK_REFERENCE.md         ← This file!
```

---

## When to Ask Questions

**Ask via Open Questions if:**
- AC is unclear or ambiguous
- Scope boundaries aren't defined
- You need a design decision
- You're unsure about environment setup
- Pre-existing test failures block you

**Report as Blocked if:**
- A dependency is not done
- Environment misconfiguration prevents work
- You're stuck after genuine debugging effort (30+ min)
- Acceptance criteria appears impossible

**Report as Complete if:**
- All AC are satisfied
- All validation steps passed
- You've confirmed the behavior works as expected

---

## One-Liner Summary

**Orchestrator**: Coordinator who selects tickets, assigns them, and verifies results.
**Subagent**: Implementer who executes one ticket, validates it, and reports.
**PLAN.md**: Single source of truth where all state lives.

Good luck! 🚀
