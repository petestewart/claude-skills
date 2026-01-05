# Subagent Checklist

Use this checklist throughout your work on a ticket. Check items off as you go.

---

## Phase 1: Understand Your Assignment

- [ ] I have the full ticket details (ID, scope, acceptance criteria, validation steps)
- [ ] I can locate my ticket in PLAN.md
- [ ] I understand what the ticket requires in my own words
- [ ] I have read the Orchestrator's notes in the Notes field
- [ ] I understand any constraints mentioned
- [ ] I have listed the files I expect to change
- [ ] I have checked dependencies—all dependencies are marked Done in PLAN.md

## Phase 2: Start Implementing

- [ ] I am working only on my assigned ticket
- [ ] I am following the repo's existing code style and patterns
- [ ] I am making small, focused changes (not refactoring "while I'm at it")
- [ ] I am committing frequently if using git (with clear, atomic commits)
- [ ] I am not touching other tickets or other parts of the codebase

## Phase 3: Validate My Work

- [ ] I have run all validation steps from my ticket
- [ ] Validation steps passed with expected results
- [ ] I have run the repo's test suite (if it exists) and all tests pass
- [ ] I have verified all acceptance criteria are satisfied
- [ ] I have not skipped any validation steps

## Phase 4: Update PLAN.md

- [ ] I have located my ticket in PLAN.md
- [ ] I have updated ONLY the Notes field (no Status/Priority/Owner changes)
- [ ] I have NOT reordered any tickets
- [ ] I have NOT modified any other ticket's fields
- [ ] I have recorded implementation details in Notes
- [ ] I have recorded validation results in Notes
- [ ] I have noted anything the Orchestrator should watch for

## If I Discovered New Work

- [ ] I appended a new ticket to the bottom of Task Backlog
- [ ] The new ticket has a descriptive title
- [ ] The new ticket includes Scope
- [ ] The new ticket includes Acceptance Criteria
- [ ] The new ticket includes Validation Steps
- [ ] The new ticket references my current ticket in Notes (e.g., "Discovered during T007")
- [ ] I noted the new ticket ID in my final report

## If I Found a Bug or Risk

- [ ] I appended an entry to the Discovered Issues Log
- [ ] The entry includes date and time (YYYY-MM-DD HH:MM)
- [ ] The entry includes a short, clear title
- [ ] The entry includes context (why it matters, how it was discovered)
- [ ] I noted this in my final report

## If I Need a Decision

- [ ] I added a row to the Open Questions section
- [ ] The question clearly states what decision is needed
- [ ] The context explains what I tried and why I'm unsure
- [ ] I have NOT guessed or made an arbitrary choice
- [ ] I reported as BLOCKED and stopped working

## Before Reporting COMPLETE

- [ ] All Acceptance Criteria are satisfied ✓
- [ ] All Validation Steps passed ✓
- [ ] I ran the test suite and all tests pass ✓
- [ ] I updated only the Notes field ✓
- [ ] I did not change Status/Priority/Owner ✓
- [ ] I am using the correct reporting format ✓
- [ ] I am ready to stop ✓

## Before Reporting BLOCKED

- [ ] I documented exactly what is blocking me
- [ ] I documented what I attempted
- [ ] I added to Open Questions if a decision is needed
- [ ] I added to Discovered Issues if it's a bug/risk
- [ ] I updated the Notes field with blocker details
- [ ] I am using the correct reporting format ✓
- [ ] I am ready to stop ✓

## PLAN.md Edit Rules Reference

| What | Can Edit? | How |
|------|-----------|-----|
| My ticket's Notes field | ✅ Yes | Direct edit |
| My ticket's Status field | ❌ No | Orchestrator only |
| My ticket's Priority field | ❌ No | Orchestrator only |
| My ticket's Owner field | ❌ No | Orchestrator only |
| My ticket's other fields | ❌ No | Read-only |
| Other tickets | ❌ No | Read-only |
| Task Backlog (append new) | ✅ Yes | Add at bottom only |
| Task Backlog (modify existing) | ❌ No | Read-only |
| Discovered Issues Log (append) | ✅ Yes | Add new row at bottom |
| Discovered Issues Log (modify) | ❌ No | Read-only |
| Open Questions (append) | ✅ Yes | Add new row at bottom |
| Open Questions (modify) | ❌ No | Read-only |
| Everything else | ❌ No | Read-only |

---

## Reporting Format Checklist

### For COMPLETE Reports

Check that your report includes:

```
=== TICKET T### COMPLETE ===

Summary:
[One paragraph of what you did]

Files changed:
- path/to/file1
- path/to/file2

Validation:
- `command`: [output] ✓
- `command`: [output] ✓

Plan updates made:
- Updated Notes field for T###
- [Any new tickets added: T###, T###]
- [Any discovered issues: describe]
- [Any open questions: describe]

Ready for Orchestrator verification.
```

- [ ] I have "=== TICKET T### COMPLETE ===" at the top
- [ ] I have a Summary paragraph
- [ ] I have listed Files changed
- [ ] I have Validation results with checkmarks
- [ ] I have listed Plan updates made
- [ ] I have noted new tickets, issues, and questions

### For BLOCKED Reports

Check that your report includes:

```
=== TICKET T### BLOCKED ===

Blocker:
[One-sentence description of what is blocking me]

Attempted:
- [What I tried to fix it]
- [What didn't work]

Needs:
[Exact description of what would unblock me]

Plan updates made:
- Updated Notes field for T### with blocker details
- [Added to Open Questions: describe]
- [Added to Discovered Issues: describe]

Status: BLOCKED (waiting for Orchestrator)
```

- [ ] I have "=== TICKET T### BLOCKED ===" at the top
- [ ] I have a Blocker section describing the issue clearly
- [ ] I have an Attempted section showing what I tried
- [ ] I have a Needs section stating exactly what would unblock me
- [ ] I have listed Plan updates made
- [ ] I have "Status: BLOCKED" at the end

---

## Edge Cases

### "Can I do this while I'm working on my ticket?"

| Task | Can Do? | Why? |
|------|---------|------|
| Fix a typo in my file | ✅ Yes | Part of your ticket |
| Fix a bug in your code | ✅ Yes | Part of your ticket |
| Refactor another module | ❌ No | Outside your scope |
| Update docs for your change | ✅ Yes | Part of your ticket (if it changes behavior) |
| Update docs for unrelated feature | ❌ No | Outside your scope—log in Discovered Issues |
| Run tests for your code | ✅ Yes | Validation |
| Fix a test that's unrelated | ❌ No | Outside your scope—log in Open Questions |
| Add a helpful comment | ✅ Yes | If it clarifies your changes |
| Reorganize code to be prettier | ❌ No | Refactoring—outside your scope |

### "What if I find multiple issues?"

Create separate entries for each:
- Multiple Discovered Issues? Add multiple rows to the log
- Multiple Open Questions? Add multiple rows
- Multiple new tickets? Add multiple tickets to backlog

### "Can I update Notes multiple times?"

Yes. If you're working for hours, update Notes periodically:
```
Notes:
- Progress: Started implementation, added endpoint skeleton
- Current step: Writing tests
- Blockers: None yet
- Watch for: [Will update before completion]
```

Then update again at the end with full results.

### "What if my ticket's Acceptance Criteria is impossible?"

Add an Open Question:
```
| Is AC1 achievable? | AC says "response time < 1ms for remote API calls". Seems physically impossible due to network latency. Should this be 100ms? | Pending |
```

Then either:
- Implement what you think is right and report COMPLETE with a note
- Report BLOCKED and wait for clarification
- Implement anyway and note the gap in your report

---

## Final Reality Check

Before you report, ask yourself:

1. **Did I read my ticket fully?** Yes / No
2. **Did I implement the exact thing requested?** Yes / No
3. **Did I run the validation steps myself?** Yes / No
4. **Did I only edit Notes in PLAN.md?** Yes / No
5. **Do I have a clear, honest report ready?** Yes / No
6. **Am I ready to stop and wait?** Yes / No

If all are "Yes", you're ready to report.

If any are "No", go back and fix it before reporting.
