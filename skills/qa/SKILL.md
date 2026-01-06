---
name: QA
description: This skill should be used when the user asks to "run QA", "test the changes", "create a test plan", "verify the implementation", "QA the work", "check if it works", or needs to validate that completed work functions as expected. Generates QA_TEST.md and orchestrates test execution with bug fixing.
version: 1.1.0
---

# QA - Quality Assurance Testing Skill

This skill creates thorough test plans for completed work and **executes them**, including bug detection and fixing.

## CRITICAL: Your Job Is To Execute Tests, Not Document Them

**YOU MUST ACTUALLY EXECUTE THE TESTS.** The following are NOT acceptable outcomes:

❌ "Manual testing required" - YOU are the manual tester
❌ "These tests need to be run with a live environment" - USE the live environment
❌ "Follow the steps in QA_TEST.md" - YOU follow the steps
❌ Creating a report that says tests are "pending" - EXECUTE them first

If the application is running and accessible, you MUST use available tools (especially **dev-browser** for web applications) to interact with the UI and verify functionality. You are not a documentation generator - you are a QA tester.

### When You Cannot Execute Tests

The ONLY acceptable reasons to not execute a test:

1. **Environment not running** - Ask the user to start it, then continue
2. **Missing credentials/access** - Ask the user for them, then continue
3. **Test requires physical hardware** - Document as BLOCKED with specific reason
4. **After multiple genuine attempts** - Document what you tried and why it failed

"I don't know how" or "this requires manual testing" are NOT valid reasons. Figure it out using the tools available to you.

## Overview

The QA skill operates in three phases:
1. **Planning Phase** - Gather context and create QA_TEST.md
2. **Approval Phase** - Present plan to user and get approval
3. **Execution Phase** - Execute tests using available tools, fix issues found

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

### Execute Tests Yourself

Once the user approves, **you execute the tests directly**. Do not spawn agents just to avoid doing the work - you are the QA tester.

### Browser Automation with dev-browser

For web applications, use the **dev-browser** skill/MCP tools to interact with the UI:

```
Key dev-browser capabilities:
- mcp__chrome-devtools__navigate_page - Go to URLs
- mcp__chrome-devtools__take_snapshot - Get page content/elements (prefer this over screenshots)
- mcp__chrome-devtools__click - Click buttons, links, toggles
- mcp__chrome-devtools__fill - Enter text in inputs
- mcp__chrome-devtools__fill_form - Fill multiple form fields
- mcp__chrome-devtools__take_screenshot - Visual verification
- mcp__chrome-devtools__list_network_requests - Verify API calls
- mcp__chrome-devtools__list_console_messages - Check for errors
```

**Workflow for each UI test case:**

1. Navigate to the relevant page
2. Take a snapshot to understand the current state
3. Perform the test actions (click, fill, etc.)
4. Take another snapshot to verify the result
5. Check console for errors if relevant
6. Record PASS/FAIL with evidence

### Test Execution Rules

**Sequential Execution:**
- Execute test cases one at a time, in order
- Only proceed to the next test case after the current one passes
- Track status: PASS, FAIL, BLOCKED, SKIPPED

**Be Persistent:**
- If something doesn't work the first time, try alternative approaches
- If a UI element isn't found, take a snapshot and look for it
- If the page structure is unexpected, adapt your approach
- Only mark as BLOCKED after genuine attempts to work around issues

**On Test Failure:**
1. Document the failure clearly (what happened vs. what was expected)
2. Include evidence (snapshots, screenshots, console errors)
3. Spawn a subagent using the `/subagent` skill with:
   - A clear description of the failing test
   - The expected vs. actual behavior
   - Instructions to diagnose and fix the bug
4. Wait for subagent to complete and report back
5. If bug was fixed: Re-run the failed test case
6. If larger issue found: Assess if remaining tests can continue

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
**What I Did:** [Specific actions taken - e.g., "Navigated to /settings, clicked 'Enable' toggle, verified state change"]
**Evidence:** [What you observed - UI state, console output, API responses, database values]
**Notes:** [Any additional observations]
[If FAIL: Include failure details and resolution attempt]
[If BLOCKED: Include reason, what was tried, and ticket reference]

### TC-002: [Test Name] - [Status]
[Continue for all tests - EVERY test must have "What I Did" and "Evidence"]

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

### Other Verification Methods

Beyond browser automation, use appropriate tools for each test type:

- **API tests:** Use Bash with curl, or check network requests via dev-browser
- **Database verification:** Query the database directly if accessible
- **File system checks:** Use Read/Glob to verify file creation/modification
- **Background jobs:** Check logs, database records, or job queues
- **Console output:** Use list_console_messages to check for errors/warnings

### Deliver Final Report

When test execution completes:
1. Save the full report to `QA_REPORT.md`
2. **Every test must have a definitive status** - no "pending" or "not executed"
3. **Include evidence for each test** - what you saw, snapshots taken, etc.
4. Present a summary to the user
5. Highlight any bugs fixed
6. Flag any outstanding issues that need attention

**The report must demonstrate you actually executed each test, not just planned them.**

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

**Primary Tools for Test Execution:**
- `dev-browser` / `mcp__chrome-devtools__*` - Web UI interaction
- `Bash` - CLI commands, curl for APIs, database queries
- `Read` / `Glob` - File verification
- `Grep` - Log analysis

**Test Priorities:**
- **Critical:** Core functionality, data integrity, security
- **High:** Main user workflows, important features
- **Medium:** Secondary features, edge cases
- **Low:** Nice-to-have validations, cosmetic checks

## Remember

You are a QA tester, not a test plan writer. Your job is complete when:

✅ Every test case has been **executed** (not just documented)
✅ Every test has a definitive PASS/FAIL/BLOCKED status with evidence
✅ Failed tests have been investigated and bugs fixed or documented
✅ The QA_REPORT.md shows **what you did**, not what needs to be done

If you find yourself writing "manual testing required" - stop and use the tools available to you.
