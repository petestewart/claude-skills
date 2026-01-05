# PLAN.md Templates for Subagents

When you discover new work, encounter issues, or need decisions, use these templates to add entries to PLAN.md.

All templates follow the same format as the orchestrator uses. This ensures consistency between orchestrator and subagent.

---

## Pattern 1: Update Your Ticket's Notes Field

### What to Do

Your ticket is assigned to you. When you complete work, update ONLY the Notes field to record what you did.

### Template

```markdown
Notes:
- Implementation: [What changes did you make?]
- Files: [List files you created/modified, comma-separated]
- Validation:
  * [command 1]: [result/output]
  * [command 2]: [result/output]
- Watch for: [Anything the Orchestrator should know?]
```

### Full Example

Before (your ticket as assigned):
```markdown
### T007: Add /health endpoint
- Priority: P0
- Status: In Progress
- Owner: Agent-T007
- Scope: Create a GET /health endpoint that returns {"status": "ok"} with 200 status code
- Acceptance Criteria:
  - [ ] Endpoint exists at GET /health
  - [ ] Returns HTTP 200 status
  - [ ] Response body is valid JSON: {"status": "ok"}
- Validation Steps:
  1. curl http://localhost:8000/health
  2. Verify response is 200 OK with correct JSON body
- Dependencies: (none)
- Notes: Use FastAPI. Keep simple, no database checks.
```

After (your update):
```markdown
### T007: Add /health endpoint
- Priority: P0
- Status: In Progress
- Owner: Agent-T007
- Scope: Create a GET /health endpoint that returns {"status": "ok"} with 200 status code
- Acceptance Criteria:
  - [ ] Endpoint exists at GET /health
  - [ ] Returns HTTP 200 status
  - [ ] Response body is valid JSON: {"status": "ok"}
- Validation Steps:
  1. curl http://localhost:8000/health
  2. Verify response is 200 OK with correct JSON body
- Dependencies: (none)
- Notes: Use FastAPI. Keep simple, no database checks.
  - **Implementation**: Added GET /health handler to src/main.py using FastAPI's @app.get decorator. Returns {"status": "ok"} with default 200 status.
  - **Files**: src/main.py (added handler), tests/test_health.py (added test)
  - **Validation**:
    * `curl http://localhost:8000/health`: HTTP/1.1 200 OK, {"status":"ok"} ✓
    * `pytest tests/test_health.py`: 1 passed ✓
    * `pytest tests/`: 23 passed (all tests) ✓
  - **Watch for**: Endpoint is unauthenticated by design (load balancers need access). May need security review.
```

**Key points:**
- Only Notes field changed
- Status, Priority, Owner, Scope, AC, Validation Steps all remain the same
- Validation results are included so Orchestrator can verify
- Any concerns are noted for Orchestrator attention

---

## Pattern 2: Append a New Ticket to Task Backlog

### What to Do

If you discover necessary work while implementing your ticket, append a new ticket to the bottom of the Task Backlog section.

### Template

```markdown
### T###: [Title]
- Priority: P0 | P1 | P2
- Status: Todo
- Owner:
- Scope: [What needs to be done? Be specific and bounded.]
- Acceptance Criteria:
  - [ ] [Testable criterion 1]
  - [ ] [Testable criterion 2]
  - [ ] [Testable criterion 3]
- Validation Steps:
  1. [Command or action to verify AC1]
  2. [Command or action to verify AC2]
- Dependencies: [T###] (other tickets that must be done first, or "none")
- Notes: Discovered during T### implementation. [Any other context.]
```

### Full Example

While implementing T007 (health endpoint), you realize: "Load balancers will call this frequently. We should rate-limit it to prevent DOS."

You append to Task Backlog:

```markdown
### T025: Add rate limiting to /health endpoint
- Priority: P1
- Status: Todo
- Owner:
- Scope: Implement rate limiting on /health endpoint (100 requests per minute per IP address) to prevent abuse by load balancers or malicious clients.
- Acceptance Criteria:
  - [ ] /health endpoint rejects requests beyond 100/min per IP with 429 status
  - [ ] Other endpoints are unaffected
  - [ ] Rate limit counter resets every 60 seconds
  - [ ] Valid requests still return {"status":"ok"}
- Validation Steps:
  1. `for i in {1..105}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/health; done | tail -6`
  2. Verify: First 100 responses are 200, last 5 are 429
  3. Wait 61 seconds, repeat step 1: responses should all be 200 again
- Dependencies: T007
- Notes: Discovered during T007 implementation. Optional for v1, but recommended to prevent abuse. Can use simple in-memory counter or Redis if available.
```

**Key points:**
- New ticket appended at the BOTTOM of Task Backlog
- Uses standard format (Priority, Status, Owner, Scope, AC, Validation, Dependencies, Notes)
- Priority assigned based on importance (P1 for rate limiting is reasonable)
- Notes mentions discovery context ("during T007")
- Dependencies correctly state T007 (must be done first)
- Validation steps are specific and runnable

---

## Pattern 3: Log a Discovered Issue

### What to Do

If you find a bug, risk, or problem that's not directly within your ticket scope, log it in the Discovered Issues Log so the Orchestrator can triage it.

### Template

```markdown
| YYYY-MM-DD HH:MM | [Issue title] | P0|P1|P2 | [Action needed] |
```

### Full Examples

**Example 1: Found a pre-existing bug**
```markdown
| 2025-01-03 14:45 | Flaky test: test_user_creation fails intermittently | P1 | Create ticket or investigate |
```

**Example 2: Security concern discovered**
```markdown
| 2025-01-03 15:20 | /health endpoint has no rate limiting; could be DOS vector | P1 | Create T025 (rate limiting ticket) |
```

**Example 3: Performance issue**
```markdown
| 2025-01-03 15:45 | Database queries in loop; N+1 problem in user fetch | P2 | Investigate efficiency |
```

**Example 4: Missing documentation**
```markdown
| 2025-01-03 16:00 | README doesn't mention how to set DATABASE_URL env var | P2 | Update docs or create ticket |
```

**Key points:**
- Include timestamp (YYYY-MM-DD HH:MM in 24-hour format)
- Keep title short but descriptive
- Assign a priority: P0 (critical), P1 (important), P2 (nice-to-have)
- State what action is needed (create ticket, investigate, update docs, review, etc.)

---

## Pattern 4: Add an Open Question

### What to Do

If you need a decision from the Orchestrator but cannot proceed without it, add a row to the Open Questions section.

### Template

```markdown
| [What is the question?] | [What did you try? Why is it unclear?] | Pending |
```

### Full Examples

**Example 1: Unclear acceptance criteria**
```markdown
| What does "fast API response" mean in T010? | AC says "fast" but no numeric target. Implemented basic endpoint but unsure if it meets criteria. Should it be < 100ms? < 500ms? | Pending |
```

**Example 2: Missing environment variable**
```markdown
| What is the DATABASE_URL for staging? | Cannot run migration without it. Checked .env file and environment. Not set anywhere. Need correct connection string. | Pending |
```

**Example 3: Scope ambiguity**
```markdown
| Should /login require rate limiting? | AC doesn't mention it. Other auth endpoints in codebase have rate limits. Should I add it to stay consistent? | Pending |
```

**Example 4: Dependency conflict**
```markdown
| Can T008 proceed without T007? | T008 spec says it depends on T007, but T007 is not done yet. Should I implement with mock data or wait? | Pending |
```

**Key points:**
- Question clearly states what decision is needed
- Context explains what you tried and why you're blocked
- Status remains "Pending" (Orchestrator will answer it)
- These trigger the Orchestrator to revisit and clarify

---

## Pattern 5: Your Complete Notes Update (Real Example)

Here's what a real, complete Notes update looks like after successfully implementing a ticket:

```markdown
### T012: Implement user authentication with JWT
- Priority: P0
- Status: In Progress
- Owner: Agent-T012
- Scope: [... unchanged ...]
- Notes:
  - **Implementation**: Added JWT token generation in POST /login endpoint. Uses HS256 algorithm with SECRET_KEY from environment. Token includes user_id and exp (1 hour). Added middleware to verify token on protected routes. Protected /users and /profile endpoints.
  - **Files**: src/auth.py (new), src/main.py (modified), tests/test_auth.py (modified), tests/test_jwt.py (new)
  - **Validation**:
    * `curl -X POST http://localhost:8000/login -d '{"email":"test@test.com","password":"password"}' -H "Content-Type: application/json"`: Returns 200 with token field ✓
    * `curl http://localhost:8000/profile -H "Authorization: Bearer <TOKEN>"`: Returns 200 with user data ✓
    * `curl http://localhost:8000/profile (no auth header)`: Returns 401 Unauthorized ✓
    * `pytest tests/test_auth.py`: 8 passed ✓
    * `pytest tests/test_jwt.py`: 5 passed ✓
    * `pytest tests/`: 36 passed (all tests) ✓
  - **Watch for**:
    * SECRET_KEY is read from environment variable. Must be set in production or JWT will fail.
    * Token expiration is 1 hour. May need adjustment based on UX testing.
    * Discovered during testing: password not being hashed. Created T024 to add bcrypt hashing (blocking this ticket? No, but critical security fix).
    * Middleware assumes Bearer token format; will fail with other schemes.
```

This Notes field tells the Orchestrator:
- Exactly what was implemented
- Which files changed
- Proof that validation passed (real command outputs)
- Important context (env var requirement, token TTL, discovered issue, potential issues)

---

## Combining Multiple Patterns

### Example: Implementation with Discovered Issue and Open Question

You're implementing T015 (add user search). You discover:
1. A bug in the database (existing)
2. Need a decision on pagination

Your complete PLAN.md updates:

**Your ticket's Notes:**
```markdown
Notes:
- **Implementation**: Added GET /users/search?q=<query> endpoint. Returns array of users matching query string. Searches name and email fields.
- **Files**: src/search.py (new), src/main.py (modified), tests/test_search.py (new)
- **Validation**:
  * `curl "http://localhost:8000/users/search?q=alice"`: Returns users with "alice" in name/email ✓
  * `pytest tests/test_search.py`: 6 passed ✓
- **Watch for**: Pre-existing database bug found. See DI-004. Does not block T015 but should be fixed soon.
```

**New ticket appended to Task Backlog:**
```markdown
### T026: Implement pagination for search results
- Priority: P2
- Status: Todo
- Owner:
- Scope: Add limit and offset parameters to /users/search endpoint so results can be paginated (e.g., 50 results per page)
- Acceptance Criteria:
  - [ ] /search accepts ?limit=50&offset=0 parameters
  - [ ] Returns up to 50 results starting from offset
  - [ ] Response includes total_count and current_page metadata
  - [ ] Default limit is 50, max is 200
- Validation Steps:
  1. `curl "http://localhost:8000/users/search?q=test&limit=10&offset=0"`: Returns 10 results with metadata
  2. `curl "http://localhost:8000/users/search?q=test&limit=500"`: Capped at 200 results
- Dependencies: T015
- Notes: Discovered during T015. Search currently returns all results unbounded, which could be slow for large datasets.
```

**Discovered issue logged:**
```markdown
| 2025-01-03 15:30 | Database index missing on users.email column | P1 | Create performance ticket or add index |
```

**Open question added:**
```markdown
| Should search results be cached? | Search runs every request. For large databases, could be slow. But data changes frequently so caching might be stale. Should I implement caching now or wait for performance issues? | Pending |
```

---

## Final Format Checklist

Before submitting Notes updates or new entries:

- [ ] YAML-style field format: `- FieldName: value`
- [ ] Markdown headers: `### T###: Title`
- [ ] Checklists use `- [ ]` for unchecked items
- [ ] Inline formatting: **bold** for section headers, `code` for commands
- [ ] No trailing spaces or extra blank lines
- [ ] Consistent indentation (2 spaces)
- [ ] No duplicate ticket numbers
- [ ] References to other tickets: T### (e.g., T007, T015)
- [ ] Timestamps in Discovered Issues: YYYY-MM-DD HH:MM

---

## Quick Reference: What You're Editing

| Section | Your Role |
|---------|-----------|
| Task Backlog - your ticket | Append new tickets only |
| Task Backlog - others' tickets | Read-only |
| Discovered Issues Log | Append new issues only |
| Open Questions | Append new questions only |
| Notes field of your ticket | **Update fully** |
| All other fields | Read-only |

Stay focused. Update only what you're responsible for.
