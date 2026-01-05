# PLAN.md Template

Use this template when creating a PLAN.md for the orchestrator skill. This is the source of truth for the entire project.

---

# Project Plan: [Project Name]

## Project Overview

**Goal:** [1-2 sentence description of what you're building]

**Success Criteria:** [What does "done" look like?]

**Key Technologies:** [Tech stack, frameworks, etc.]

**Constraints:** [Any limits: timeline, resources, scope]

## Definition of Done

A ticket is Done when:
1. [Criterion 1 - e.g., "All acceptance criteria pass"]
2. [Criterion 2 - e.g., "No test failures"]
3. [Criterion 3 - e.g., "Code reviewed and merged"]
4. [Criterion 4 - e.g., "Documentation updated"]

The **entire project** is Done when:
- All P0 and P1 tickets are Done
- All validation steps pass on main branch
- [Any other final acceptance criteria]

## Task Backlog

### T001: [Task Title]
- Priority: P0
- Status: Todo
- Owner:
- Scope: [What needs to be done]
- Acceptance Criteria:
  - [ ] AC1: [Specific criterion]
  - [ ] AC2: [Specific criterion]
  - [ ] AC3: [Specific criterion]
- Validation Steps:
  1. [Command to run]
  2. [Expected output/result]
- Dependencies: [T###] (if any)
- Notes: [Any context or constraints]

### T002: [Task Title]
- Priority: P1
- Status: Todo
- Owner:
- Scope: [What needs to be done]
- Acceptance Criteria:
  - [ ] AC1: [Specific criterion]
  - [ ] AC2: [Specific criterion]
- Validation Steps:
  1. [Command to run]
  2. [Expected output/result]
- Dependencies: [T001] (must be done first)
- Notes: [Context]

### T003: [Task Title]
- Priority: P2
- Status: Todo
- Owner:
- Scope: [What needs to be done]
- Acceptance Criteria:
  - [ ] AC1: [Specific criterion]
- Validation Steps:
  1. [Command to run]
  2. [Expected output/result]
- Dependencies:
- Notes: [Context]

## Discovered Issues Log

| ID | Issue | Priority | Action |
|----|-------|----------|--------|
| DI-001 | [Description] | P1 | [New ticket created: T###] |
| DI-002 | [Description] | P2 | [Workaround in Notes] |

## Open Questions

- **Q1:** [Question] → **A:** [Decision made]
- **Q2:** [Question] → **A:** [Decision made]

## Progress Summary

| Status | Count | Details |
|--------|-------|---------|
| Done | 0 | |
| In Progress | 0 | |
| Todo | 3 | T001, T002, T003 |
| Blocked | 0 | |

---

## Completion Summary

*(Filled in at project completion)*

All required tickets are Done:
- T001: ✓
- T002: ✓
- T003: ✓

Project Definition of Done verified:
- ✓ Criterion 1
- ✓ Criterion 2
- ✓ Criterion 3

## Follow-Up Work

Future improvements and nice-to-haves:
- [Feature idea 1]
- [Performance improvement]
- [Technical debt to address]

---

# Template Examples

## Example 1: Simple API Endpoint

### T005: Implement GET /users endpoint
- Priority: P0
- Status: Todo
- Owner:
- Scope: Create a GET /users endpoint that returns a JSON list of all users from the database
- Acceptance Criteria:
  - [ ] Endpoint exists at GET /users
  - [ ] Returns HTTP 200
  - [ ] Response is valid JSON with array of user objects
  - [ ] Each user object has id, name, email fields
  - [ ] Handles empty user list correctly
- Validation Steps:
  1. `curl http://localhost:3000/users`
  2. Verify response: 200 OK, Content-Type: application/json
  3. Response body: `[{"id":1,"name":"Alice","email":"alice@test.com"},...]`
  4. Run: `npm test` - all tests pass
- Dependencies: T003 (database setup)
- Notes: Use Express.js. Keep it simple—no pagination needed for v1.

## Example 2: Frontend Component

### T008: Build login form component
- Priority: P1
- Status: Todo
- Owner:
- Scope: Create a React component for user login with email/password inputs
- Acceptance Criteria:
  - [ ] Component renders email and password input fields
  - [ ] Submit button is present and clickable
  - [ ] Form validates email format before submit
  - [ ] Form shows error message for empty fields
  - [ ] Component passes all unit tests
- Validation Steps:
  1. `npm test -- LoginForm.test.js`
  2. Verify: all tests pass (5/5)
  3. Visual check: component renders without errors in Storybook
- Dependencies: T007 (API auth endpoint)
- Notes: Use React hooks. Styling: Tailwind CSS. No external form libraries.

## Example 3: Discovered Issue Turned into Ticket

During T010, subagent discovered caching layer issue.

Task Backlog updated:
```
### T016: Fix caching layer in data service
- Priority: P1
- Status: Todo
- Owner:
- Scope: Cache queries in Redis for 5 minutes to improve response time
- Acceptance Criteria:
  - [ ] Redis connection succeeds on startup
  - [ ] Queries cached for 5 minutes
  - [ ] Cache invalidated when data updates
  - [ ] Response time < 100ms for cached queries
- Validation Steps:
  1. Start server: `npm start`
  2. Make identical request twice: `curl http://localhost:3000/data`
  3. Verify: second request completes in < 100ms
  4. Update data and verify cache clears
- Dependencies: (none)
- Notes: Discovered during T010. Use redis npm package. Simple in-memory cache acceptable if Redis unavailable.
```

Discovered Issues Log updated:
```
| DI-003 | Caching not implemented in data service | P1 | T016 created |
```
