---
name: QA
description: This skill should be used when the user asks to "run QA", "test the changes", "create a test plan", "verify the implementation", "QA the work", "check if it works", or needs to validate that completed work functions as expected. Generates QA_TEST.md and orchestrates test execution with bug fixing.
version: 1.0.0
---

# QA - Quality Assurance Testing Skill

This skill creates thorough manual test plans for completed work and orchestrates their execution, including bug detection and fixing.

## Overview

The QA skill operates in three phases:
1. **Planning Phase** - Gather context and create QA_TEST.md
2. **Approval Phase** - Present plan to user and get approval
3. **Execution Phase** - Spawn QA Test Manager to execute tests and fix issues

## Phase 1: Planning - Create the Test Plan

### Step 1: Gather Context

Collect information about what needs to be tested from these sources (in priority order):

1. **PLAN.md** - Check if a PLAN.md exists in the project root. Look for completed tickets/tasks that describe implemented functionality.

2. **User Description** - If the user describes the functionality directly, use that as the primary source.

3. **Code Analysis** - If neither of the above provides sufficient context, analyze recently modified or created files to understand what was implemented.

### Step 2: Resolve Ambiguity

If the scope of testing is unclear, ask the user clarifying questions:

- "What specific functionality should be tested?"
- "Are there any edge cases or error conditions that are particularly important?"
- "What user workflows should be validated?"
- "Are there any integrations or dependencies that need verification?"

Do not proceed until there is a clear understanding of what needs to be tested.

### Step 3: Create QA_TEST.md

Create a thorough test plan document at `QA_TEST.md` in the project root.

**Document Structure:**

```markdown
# QA Test Plan

## Overview
[Brief description of what is being tested]

## Test Environment
[Any setup requirements, prerequisites, or environment configuration needed]

## Test Cases

### TC-001: [Test Case Name]
**Feature:** [Feature being tested]
**Priority:** [Critical/High/Medium/Low]

**Preconditions:**
- [Any required state or setup]

**Test Steps:**
1. [Specific action to perform]
2. [Next action]
3. [Continue with numbered steps]

**Expected Result:**
- [What should happen if the feature works correctly]

**Verification Method:**
- [How to verify - visual check, CLI output, database query, etc.]

---

### TC-002: [Next Test Case]
[Continue pattern for all test cases]

## Edge Cases and Error Handling

### EC-001: [Edge Case Name]
[Same structure as test cases, focusing on boundary conditions]

## Summary
- Total Test Cases: [N]
- Critical: [N]
- High: [N]
- Medium: [N]
- Low: [N]
```

**Test Plan Guidelines:**

- Create specific, actionable test steps (not vague instructions)
- Include both happy path and error scenarios
- Test boundary conditions and edge cases
- Verify data persistence where applicable
- Test user-facing output and feedback
- Include rollback/cleanup steps if needed
- Prioritize test cases (Critical tests first)

## Phase 2: Approval - Get User Sign-off

### Present the Plan

After creating QA_TEST.md, display the complete test plan to the user using the Read tool and present it clearly.

### Request Approval

Ask the user explicitly:

> "I've created the QA test plan. Please review QA_TEST.md above.
>
> - Is anything missing that should be tested?
> - Would you like any test cases modified or expanded?
> - Are the priorities correctly assigned?
>
> Let me know if you'd like changes, or confirm approval to proceed with test execution."

### Handle Modifications

If the user requests changes:
1. Update QA_TEST.md with the requested modifications
2. Show the updated plan
3. Request approval again

Do not proceed to execution until the user explicitly approves.

## Phase 3: Execution - Run the Test Plan

### Spawn the QA Test Manager

Once the user approves, spawn a background agent to manage test execution:

```
Use the Task tool with:
- subagent_type: "general-purpose"
- A prompt that includes:
  1. The complete QA_TEST.md content
  2. Instructions to execute tests sequentially
  3. The QA Test Manager behavioral rules below
```

### QA Test Manager Behavioral Rules

The QA Test Manager agent must follow these rules:

**Sequential Execution:**
- Execute test cases one at a time, in order
- Only proceed to the next test case after the current one passes
- Track status: PASS, FAIL, BLOCKED, SKIPPED

**On Test Failure:**
1. Document the failure clearly (what happened vs. what was expected)
2. Spawn a subagent using the `/subagent` skill with:
   - A clear description of the failing test
   - The expected vs. actual behavior
   - Instructions to diagnose and fix the bug
3. Wait for subagent to complete and report back
4. If bug was fixed: Re-run the failed test case
5. If larger issue found: Assess if remaining tests can continue

**Subagent Responsibilities:**
When spawning a subagent for a failed test, the subagent must:
- Diagnose the root cause of the failure
- If it's a bug: Fix it, commit the changes, report the fix
- If it's a larger missing feature: Create a ticket in PLAN.md, report findings
- Always report back with: diagnosis, action taken, result

**Handling Larger Issues:**
If a subagent reports a missing feature or larger architectural issue:
1. Document the issue in the test report
2. Mark the test as BLOCKED with reason
3. Assess if subsequent tests depend on this functionality
4. Continue with independent tests, skip dependent ones

**Test Report Structure:**

```markdown
# QA Test Execution Report

## Execution Summary
- **Date:** [timestamp]
- **Total Tests:** [N]
- **Passed:** [N]
- **Failed:** [N]
- **Blocked:** [N]
- **Skipped:** [N]

## Test Results

### TC-001: [Test Name] - [PASS/FAIL/BLOCKED/SKIPPED]
**Status:** [Status]
**Notes:** [Any observations]
[If FAIL: Include failure details and resolution]
[If BLOCKED: Include reason and ticket reference]

### TC-002: [Test Name] - [Status]
[Continue for all tests]

## Bugs Found and Fixed
| Bug ID | Description | Test Case | Fix Applied | Commit |
|--------|-------------|-----------|-------------|--------|
| BUG-001 | [Description] | TC-XXX | [Fix summary] | [hash] |

## Issues Requiring Further Work
| Issue | Description | Ticket Created | Impact |
|-------|-------------|----------------|--------|
| [Issue] | [Description] | [PLAN.md ref] | [Tests blocked] |

## Conclusion
[Overall assessment of the tested functionality]
[Recommendations if any]
```

### Deliver Final Report

When the QA Test Manager completes:
1. Save the full report to `QA_REPORT.md`
2. Present a summary to the user
3. Highlight any bugs fixed
4. Flag any outstanding issues that need attention

## Quick Reference

**Trigger Phrases:**
- "run QA"
- "test the changes"
- "create a test plan"
- "verify the implementation"
- "QA the work"
- "check if it works"

**Output Files:**
- `QA_TEST.md` - The test plan (created in Phase 1)
- `QA_REPORT.md` - The execution report (created in Phase 3)

**Agent Hierarchy:**
```
User
  └── Claude (runs /qa skill)
        └── QA Test Manager (background agent)
              └── Subagents (spawned via /subagent for failures)
```

**Test Priorities:**
- **Critical:** Core functionality, data integrity, security
- **High:** Main user workflows, important features
- **Medium:** Secondary features, edge cases
- **Low:** Nice-to-have validations, cosmetic checks
