# Usage Example: From PLAN to Completion

This document walks through a real example of how the Orchestrator and Subagent skills work together to complete a project.

---

## The Setup

You have a project with a PLAN.md file. It looks like this:

```markdown
# Project Plan: User Authentication System

## Definition of Done
- [ ] All P0 tickets are Done
- [ ] All tests pass
- [ ] README updated with setup instructions

## Task Backlog

### T001: Create user model in database
- Priority: P0
- Status: Todo
- Owner:
- Scope: Create a User table with id, email, password_hash, created_at fields
- Acceptance Criteria:
  - [ ] Table exists with all required fields
  - [ ] email field has unique constraint
  - [ ] Migration file created
- Validation Steps:
  1. alembic upgrade head
  2. psql -c "SELECT * FROM users LIMIT 0;" (should show schema)
- Dependencies: (none)
- Notes:

### T002: Implement POST /login endpoint
- Priority: P0
- Status: Todo
- Owner:
- Scope: Create login endpoint that accepts email/password and returns JWT token
- Acceptance Criteria:
  - [ ] Endpoint exists at POST /login
  - [ ] Accepts JSON body: {"email": "...", "password": "..."}
  - [ ] Returns JWT token if credentials valid
  - [ ] Returns 401 if credentials invalid
- Validation Steps:
  1. curl -X POST http://localhost:8000/login -d '{"email":"test@test.com","password":"password"}' -H "Content-Type: application/json"
  2. Verify response includes "token" field and 200 status
- Dependencies: T001
- Notes:

### T003: Add rate limiting to /login endpoint
- Priority: P1
- Status: Todo
- Owner:
- Scope: Limit login attempts to 5 per minute per IP address
- Acceptance Criteria:
  - [ ] More than 5 requests/min from same IP returns 429 status
  - [ ] Counter resets every 60 seconds
- Validation Steps:
  1. for i in {1..6}; do curl -s -X POST http://localhost:8000/login ... ; done
  2. Verify: first 5 are 200, 6th is 429
- Dependencies: T002
- Notes:

## Discovered Issues Log

(empty)

## Open Questions

(empty)
```

---

## Step 1: Start the Orchestrator

You invoke the skill:
```bash
/orchestrator
```

### What the Orchestrator Does

The Orchestrator:

1. **Reads PLAN.md**
   - Finds 3 tickets: T001 (P0), T002 (P0), T003 (P1)
   - Sees all are Todo with no blockers

2. **Summarizes state**
   ```
   Project: User Authentication System
   Status: 0/3 tickets done

   Ready tickets (no dependencies):
   - T001: Create user model (P0)

   Blocked tickets (waiting for dependencies):
   - T002: Implement /login (waiting for T001)
   - T003: Rate limiting (waiting for T002)
   ```

3. **Selects T001** (highest priority, ready)
   - Sets `Status: In Progress`
   - Sets `Owner: Agent-T001`
   - Adds guidance to Notes:
     ```
     Notes: Use SQLAlchemy ORM. Create migration with alembic. Keep it simple—just the 4 required fields for now.
     ```
   - Saves PLAN.md

4. **Briefs the subagent**
   ```
   You are working on T001: Create user model in database

   Priority: P0
   Status: In Progress
   Owner: Agent-T001

   Scope: Create a User table with id, email, password_hash, created_at fields

   Acceptance Criteria:
   - [ ] Table exists with all required fields
   - [ ] email field has unique constraint
   - [ ] Migration file created

   Validation Steps:
   1. alembic upgrade head
   2. psql -c "SELECT * FROM users LIMIT 0;" (should show schema)

   Orchestrator Notes:
   - Use SQLAlchemy ORM
   - Create migration with alembic
   - Keep it simple—just the 4 required fields for now

   Repo: FastAPI app in src/main.py, models in src/models.py, migrations in alembic/

   Commands:
   - Start DB: docker-compose up postgres
   - Run migration: alembic upgrade head
   - Check schema: psql -c "SELECT * FROM users LIMIT 0;"
   ```

---

## Step 2: Subagent Works on T001

### Subagent Receives Assignment

The subagent:

1. **Understands the ticket**
   ```
   Scope: Create a User table with 4 fields: id, email, password_hash, created_at

   Files I'll modify:
   - src/models.py (add User class)
   - alembic/versions/... (create migration)

   Acceptance criteria all clear:
   - AC1: Table exists ✓ (clear)
   - AC2: email unique ✓ (clear)
   - AC3: migration file ✓ (clear)

   Dependencies: None ✓ (can start immediately)
   ```

2. **Implements the User model**

   **src/models.py:**
   ```python
   from sqlalchemy import Column, Integer, String, DateTime
   from sqlalchemy.ext.declarative import declarative_base
   from datetime import datetime

   Base = declarative_base()

   class User(Base):
       __tablename__ = "users"

       id = Column(Integer, primary_key=True)
       email = Column(String(255), unique=True, nullable=False)
       password_hash = Column(String(255), nullable=False)
       created_at = Column(DateTime, default=datetime.utcnow)
   ```

3. **Creates alembic migration**
   ```bash
   alembic revision --autogenerate -m "Create users table"
   ```

   **alembic/versions/..._create_users_table.py:**
   ```python
   def upgrade():
       op.create_table(
           'users',
           sa.Column('id', sa.Integer(), nullable=False),
           sa.Column('email', sa.String(255), nullable=False),
           sa.Column('password_hash', sa.String(255), nullable=False),
           sa.Column('created_at', sa.DateTime(), nullable=True),
           sa.PrimaryKeyConstraint('id'),
           sa.UniqueConstraint('email')
       )
   ```

4. **Validates the work** (runs validation steps personally)

   ```bash
   $ docker-compose up postgres
   $ alembic upgrade head
   INFO [alembic.runtime.migration] Running upgrade 123abc -> 456def,
   Create users table

   $ psql -U postgres -d myapp -c "SELECT * FROM users LIMIT 0;"
    id | email | password_hash | created_at
   ----+-------+---------------+------------
   (0 rows)
   ```

   ✓ All validation passed!

5. **Updates Notes field**
   ```
   Notes: Use SQLAlchemy ORM. Create migration with alembic. Keep it simple—just the 4 required fields for now.
   - **Implementation**: Added User SQLAlchemy model in src/models.py with 4 fields. Used alembic autogenerate to create migration file.
   - **Files**: src/models.py (new User class), alembic/versions/001_create_users_table.py (new migration)
   - **Validation**:
     * alembic upgrade head: Successfully created users table ✓
     * psql schema check: users table exists with id, email, password_hash, created_at columns ✓
     * email column has unique constraint: Verified ✓
   - **Watch for**: Migration uses simple String for password_hash (not hashed yet). Hashing will be done in login endpoint. Migration file name depends on alembic version.
   ```

6. **Reports completion**
   ```
   === TICKET T001 COMPLETE ===

   Summary:
   Created User SQLAlchemy model with id, email, password_hash, created_at fields.
   Created alembic migration to set up users table with unique constraint on email.

   Files changed:
   - src/models.py (added User class)
   - alembic/versions/001_create_users_table.py (new migration)

   Validation:
   - alembic upgrade head: Successfully applied migration ✓
   - psql SELECT * FROM users: Schema verified with all 4 fields and unique email constraint ✓

   Plan updates made:
   - Updated Notes field for T001 with implementation and validation details

   Ready for Orchestrator verification.
   ```

---

## Step 3: Orchestrator Verifies T001

### Orchestrator Receives Completion Report

1. **Reads the report**
   - Subagent says: Complete
   - Validation output included
   - Files changed listed

2. **Verifies personally** (runs validation themselves)

   ```bash
   $ alembic upgrade head
   INFO [alembic.runtime.migration] Running upgrade 123abc -> 456def,
   Create users table

   $ psql -U postgres -d myapp -c "SELECT * FROM users LIMIT 0;"
    id | email | password_hash | created_at
   ----+-------+---------------+------------
   (0 rows)
   ```

   ✓ Output matches! All AC passed!

3. **Marks T001 Done**

   Updates PLAN.md:
   ```
   ### T001: Create user model in database
   - Priority: P0
   - Status: Done          ← Changed from In Progress
   - Owner: Completed      ← Changed from Agent-T001
   - Scope: [same]
   - Acceptance Criteria: [same]
   - Validation Steps: [same]
   - Dependencies: (none)
   - Notes: [subagent's full notes]
   ```
   Saves PLAN.md

---

## Step 4: Orchestrator Moves to T002

1. **Re-reads PLAN.md**
   - T001: Done ✓
   - T002: Todo, depends on T001 ✓ (now ready!)
   - T003: Todo, depends on T002 (still blocked)

2. **Selects T002** (next priority, now ready)
   - Sets `Status: In Progress`
   - Sets `Owner: Agent-T002`
   - Adds guidance to Notes:
     ```
     Notes: Use FastAPI's dependency injection for auth. Hash passwords with bcrypt before storing. Return JWT with exp=1 hour. See src/auth.py for JWT utility.
     ```

3. **Briefs subagent on T002** (similar to T001 briefing)

---

## Step 5: Subagent Works on T002

Subagent:
1. Reads ticket (note: T001 is now Done, dependency satisfied)
2. Implements POST /login endpoint with JWT
3. Validates: curl test returns token for valid credentials, 401 for invalid
4. Updates Notes with implementation details
5. Reports completion

---

## Step 6: Orchestrator Verifies T002, Then T003

Orchestrator:
1. Verifies T002 validation personally
2. Marks T002 Done
3. Sees T003 is now ready (T002 is Done)
4. Selects T003, briefs subagent
5. Subagent implements rate limiting
6. Orchestrator verifies and marks T003 Done

---

## Step 7: Project Complete

Orchestrator:
1. Checks PLAN.md
   - T001: Done ✓
   - T002: Done ✓
   - T003: Done ✓

2. Verifies Definition of Done criteria
   - All P0 tickets Done ✓
   - Run `pytest tests/` → all pass ✓
   - README updated with auth setup ✓

3. Updates PLAN.md with completion summary
   ```
   ## Completion Summary

   Project: User Authentication System
   Status: COMPLETE ✓

   Tickets completed:
   - T001: Create user model → Done by Agent-T001
   - T002: Implement /login endpoint → Done by Agent-T002
   - T003: Add rate limiting → Done by Agent-T003

   Definition of Done verified:
   - ✓ All P0 tickets complete
   - ✓ All tests passing (3/3)
   - ✓ README updated with setup instructions

   Total effort: ~6 hours
   All acceptance criteria met.

   ## Follow-Up Work

   Future improvements:
   - Add refresh token endpoint
   - Implement logout with token blacklist
   - Add password reset flow
   - Security: rotate JWT secret periodically
   - Performance: cache user lookups with Redis
   ```

4. **Stops and reports to user**
   ```
   Project Complete! ✓

   All tickets are Done and verified:
   - T001: User model ✓
   - T002: Login endpoint ✓
   - T003: Rate limiting ✓

   Definition of Done satisfied.
   Ready for deployment.
   ```

---

## Key Takeaways

1. **Clear assignments** - Orchestrator tells subagent exactly what to do
2. **Focused work** - Each subagent works on one ticket only
3. **Verified results** - Orchestrator always verifies before marking Done
4. **Single source of truth** - PLAN.md tracks all state
5. **Fast feedback** - Subagent reports quickly, Orchestrator responds quickly
6. **Parallel ready** - Multiple subagents could work on independent tickets simultaneously

---

## What Makes This Work

✓ **Clear scope** - Each ticket has acceptance criteria and validation steps
✓ **Explicit rules** - Hard rules about what each role can do
✓ **No ambiguity** - Reporting format is fixed, status is unambiguous
✓ **Verification** - Orchestrator doesn't trust, always verifies
✓ **Blockers are clear** - Dependencies prevent simultaneous work on related tasks
✓ **Focus is enforced** - Subagent can't stray into other work

This pattern scales from 3-ticket projects to 50+ ticket projects because the coordination overhead stays constant (Orchestrator's effort is linear, not exponential).
