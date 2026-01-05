# Orchestrator + Subagent Skill Package

A complementary pair of skills for coordinated project execution. The Orchestrator coordinates work while Subagents focus on implementation.

## What's Included

### Core Skills

1. **SKILL.md** - Orchestrator skill
   - Coordinates project execution from PLAN.md
   - Assigns tickets to subagents
   - Verifies work before marking Done
   - Maintains plan accuracy

2. **subagent-SKILL.md** - Subagent skill
   - Executes a single ticket with focus
   - Implements changes and validates them
   - Updates PLAN.md and reports results
   - Stops when complete or blocked

### Supporting Documentation

3. **INTEGRATION_GUIDE.md** - How they work together
   - Information flow patterns
   - PLAN.md contract details
   - Common patterns and edge cases
   - Troubleshooting guide

4. **SUBAGENT_REFERENCE.md** - Subagent interaction patterns
   - Subagent lifecycle
   - Communication protocols
   - Error recovery scenarios
   - File editing rules

5. **PLAN_TEMPLATE.md** - PLAN.md structure
   - Template for creating a project plan
   - Ticket format with examples
   - Definition of Done patterns

6. **subagent-CHECKLIST.md** - Pre-work checklist
   - Phase-by-phase checklist
   - File editing rules quick reference
   - Edge case handling
   - Final verification steps

7. **subagent-TEMPLATES.md** - PLAN.md entry templates
   - Notes field updates
   - New ticket creation
   - Discovered issue logging
   - Open question format
   - Real examples with before/after

## Quick Start

### For Orchestrators

```bash
/orchestrator
```

This will:
1. Verify PLAN.md exists
2. Read current project state
3. Select next ready ticket
4. Assign it to a subagent
5. Follow the workflow loop

### For Subagents

Receive a ticket from the Orchestrator with full context, then:

1. Understand your ticket completely
2. Implement the required changes
3. Run validation steps yourself
4. Update the Notes field in PLAN.md
5. Report: `=== TICKET T### COMPLETE ===` or `=== TICKET T### BLOCKED ===`
6. Stop and wait for next assignment

## Key Improvements Over Original

### 1. Clear PLAN.md Contract
- Explicit field-by-field editing rules
- Orchestrator controls: Status, Priority, Owner
- Subagent controls: Notes, appends new work
- Single source of truth

### 2. Robust Communication Protocol
- Exact reporting format (`=== TICKET T### COMPLETE ===`)
- Validation results included in report
- Blocker reporting with specific format
- No ambiguity about what's done

### 3. File Format Clarity
- Concrete examples of PLAN.md structure
- Before/after templates showing edits
- Markdown formatting conventions defined
- Copy-paste ready templates

### 4. Edge Case Handling
- What if PLAN.md is missing?
- What if validation fails?
- What if environment is different?
- What if scope is ambiguous?
- All documented with solutions

### 5. Better Verification Workflow
- Orchestrator must run validation personally
- Don't trust subagent's output blindly
- Clear separation: implementation vs verification
- Explicit "mark Done" decision point

### 6. Scope Creep Prevention
- Explicit "do not refactor" rules
- Hard rules (non-negotiable)
- Checklist for staying focused
- Clear guidance on what's in scope

### 7. Flexible Blocking
- Subagents can report blockers without implementing
- Open Questions for decisions needed
- Discovered Issues for bugs/risks found
- Orchestrator triages and decides action

### 8. No Fragile Dependencies
- Doesn't assume tmux availability
- Works with any Claude Code session
- Works with async or serial execution
- Pure file-based state management

## File Structure in Repo

When using these skills, your repo will have:

```
repo/
├── PLAN.md              ← Source of truth (Orchestrator + Subagent read/write)
├── src/
├── tests/
└── ... (your project)
```

PLAN.md format:
```
# Project Plan: [Name]

## Definition of Done
...

## Task Backlog

### T001: Task Title
- Priority: P0
- Status: Todo
- Owner: (empty until assigned)
- Scope: [description]
- Acceptance Criteria:
  - [ ] Criterion
- Validation Steps:
  1. Command
- Dependencies: (none)
- Notes: [context/results after work]

### T002: ...

## Discovered Issues Log

| Date | Issue | Priority | Action |

## Open Questions

| Question | Context | Status |
```

## Typical Workflow

```
1. User creates PLAN.md (manually or via project-planner skill)
2. User invokes /orchestrator
3. Orchestrator reads PLAN.md
4. Orchestrator assigns T001 to Agent-T001
5. Subagent implements T001
6. Subagent reports completion with validation results
7. Orchestrator verifies and marks T001 Done
8. Loop back to step 3 until all required tickets are Done
9. Orchestrator finalizes PLAN.md with completion summary
```

## Rules Summary

### Hard Rules (Orchestrator)
- Only you change Status, Priority, Owner
- PLAN.md is always correct
- Verify work before marking Done
- One ticket per subagent

### Hard Rules (Subagent)
- Only edit Notes field of your ticket
- Don't change Status, Priority, Owner
- Don't reorder tickets
- Stop when complete or blocked

## Integration Points

### Orchestrator → Subagent
- Full ticket details
- Scope and acceptance criteria
- Validation steps
- Orchestrator guidance (Notes field)
- Repo context and commands

### Subagent → Orchestrator
- Completion report with validation results
- OR Blocker report with details
- Updated Notes field in PLAN.md
- New tickets appended (if discovered)
- Discovered issues logged
- Open questions added

### Both → PLAN.md
- Orchestrator: Updates Status/Priority/Owner, reads everything
- Subagent: Updates Notes field, appends new work

## Common Questions

**Q: Can the subagent work on multiple tickets?**
A: No. Each subagent gets exactly one ticket.

**Q: What if a ticket depends on another?**
A: Orchestrator sees this in Dependencies field. Orders tickets so dependencies are ready before dependent work starts.

**Q: What if validation fails?**
A: Orchestrator sends subagent back with specific error. Subagent debugs and resubmits.

**Q: What if the subagent discovers new work?**
A: They append a new ticket to Task Backlog. Orchestrator triages it.

**Q: Can the subagent ask questions?**
A: Yes, via Open Questions section. Report as BLOCKED and let Orchestrator answer.

**Q: Who marks a ticket Done?**
A: Only the Orchestrator, after verifying validation.

**Q: Can subagent commit code?**
A: Yes, atomic commits are recommended. Use git as normal.

## Dependencies

- No external tools required
- Works with any repo structure
- Uses pure markdown (PLAN.md)
- No database or API needed
- Works offline

## License

See LICENSE.txt for complete terms.

---

## Next Steps

1. **Create a PLAN.md** using PLAN_TEMPLATE.md as a starting point
2. **Invoke the orchestrator skill**: `/orchestrator`
3. **Orchestrator assigns first ticket** to Agent-T###
4. **Provide subagent with full context** and let them implement
5. **Review reported results** and verify validation
6. **Mark Done** and continue

Good luck!
