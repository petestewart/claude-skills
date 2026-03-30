---
name: workato
description: >-
  Interact with the Workato Developer and Embedded OEM APIs to manage recipes, diagnose job
  failures, debug integrations, and audit customer workspaces. Use when the user asks to check
  Workato job errors, debug a failing recipe, list or update recipes, rerun failed jobs, check
  connection status, scan customer workspaces for issues, or any Workato automation management
  task. Triggers on: "workato", "recipe failed", "job error", "debug recipe", "rerun job",
  "check workato", "workato connection", "managed users", "customer workspace", or references
  to Workato recipe IDs.
---

# Workato

Manage Workato automation recipes via the Developer API and Embedded OEM API. Primary use cases:
- **Diagnose job failures** — find failed jobs, inspect step-level errors
- **Debug recipes** — read recipe code/config, check connections, review versions
- **Update recipes** — modify recipe code, stop/start, swap connections
- **Audit customer workspaces** — scan recipes across all managed customers for issues

## Setup

Credentials stored in `~/.claude/skills/workato/connections.local` (field-per-line format):

```
API_TOKEN=your-bearer-token-here
BASE_URL=https://www.workato.com/api
```

To create a token: Workspace admin > API clients > Create client. The API client role must include **"Customer workspaces"** permissions to access managed user endpoints. See `connections.local.example` for datacenter URLs.

**Credential safety**: The current token is read-only. Write operations (PUT, POST, DELETE) require a separate read-write token — do not store it in `connections.local`. When mutations are needed, ask the user to provide a write token for that session.

## API Script

All API calls go through `scripts/workato-api.sh`:

```bash
scripts/workato-api.sh <METHOD> <endpoint> [json_body]
```

Examples:
```bash
# Vendor workspace
scripts/workato-api.sh GET /recipes
# Customer workspace (OEM)
scripts/workato-api.sh GET /managed_users/12345/recipes
```

## Two API Surfaces

This workspace uses Workato Embedded (OEM). There are two API surfaces sharing the same auth and base URL:

**Developer API** — operates on the vendor workspace (templates):
```
/recipes, /jobs, /connections, /folders
```

**Embedded OEM API** — operates on customer workspaces:
```
/managed_users                              — list all customers
/managed_users/:id/recipes                  — customer's recipes
/managed_users/:id/recipes/:rid/jobs        — customer's jobs
/managed_users/:id/connections              — customer's connections
```

The `:id` can be a numeric Workato ID or an external ID prefixed with `E` (e.g., `EA2300`).

**Response shape differs**: OEM endpoints return data under `"result"` key, while standard endpoints use `"items"`. Always check both when parsing: `data.get("result", data.get("items", []))`.

## Workflows

### Diagnose a Failed Job

1. Identify the customer and recipe (ask user, or search)
   ```bash
   scripts/workato-api.sh GET "/managed_users/:uid/recipes?per_page=100"
   ```

2. List failed jobs
   ```bash
   scripts/workato-api.sh GET "/managed_users/:uid/recipes/:rid/jobs?status=failed"
   ```
   **Note**: The jobs API has no time-based filter (no `after`/`since` param). Filter by `completed_at` or `started_at` in code when looking at a specific time window.

3. Get step-level detail
   ```bash
   scripts/workato-api.sh GET "/managed_users/:uid/recipes/:rid/jobs/:job_id"
   ```
   The `lines` array contains each step's `input`, `output`, and `error`.

4. Analyze: check `error` on the failing step, compare `input` to expected values, check `adapter_name`/`adapter_operation` to identify which connector failed.

5. If the fix is a data issue, rerun:
   ```bash
   scripts/workato-api.sh POST "/managed_users/:uid/recipes/:rid/repeat_jobs" '{"job_ids":[JOB_ID]}'
   ```

### Scan Failed Jobs Across All Customers

When scanning for errors across all customers:

**Performance**: Skip customers with `active_recipe_count == 0` — they have no running recipes and no recent jobs. For large-scale scans, limit job detail fetches (e.g., sample 5 per recipe rather than fetching every failure).

**Error normalization**: Error messages often contain dynamic data (request IDs, timestamps, job IDs, UUIDs). Strip these before grouping to avoid counting the same error type as separate entries. Use regex to normalize:
```python
import re
def normalize_error(msg):
    msg = re.sub(r'"request-id":"[^"]*"', '"request-id":"..."', msg)
    msg = re.sub(r'"date":"[^"]*"', '"date":"..."', msg)
    msg = re.sub(r'job_id: j-[A-Za-z0-9_-]+', 'job_id: ...', msg)
    msg = re.sub(r'Job ID=j-[A-Za-z0-9_-]+', 'Job ID=...', msg)
    return msg[:200]  # truncate for grouping
```

**Cascading failures**: When a monitoring/alerting recipe (e.g., "Job Fail Monitoring") fails alongside the recipe it watches, flag them as related. The root cause is usually the upstream recipe, not the monitor.

### Debug a Recipe

1. Get the full recipe definition (the `code` field is the recipe logic as JSON)
   ```bash
   scripts/workato-api.sh GET /managed_users/:uid/recipes/:rid
   ```

2. Check versions for recent changes
   ```bash
   scripts/workato-api.sh GET "/managed_users/:uid/recipes/:rid/versions?per_page=10"
   ```

3. Check connections
   ```bash
   scripts/workato-api.sh GET /managed_users/:uid/connections
   ```

4. Check stop cause (`trigger_errors_limit`, `action_quota_limit`, `trial_expired`, `txn_quota_limit`)
   ```bash
   scripts/workato-api.sh GET "/managed_users/:uid/recipes?stop_cause=trigger_errors_limit"
   ```

### Scan All Customers for a Recipe Issue

Use Python to iterate managed users and inspect recipe code programmatically. Pattern:

```python
# 1. Get all managed users (paginate)
all_users = []
page = 1
while True:
    data = api(f"/managed_users?per_page=100&page={page}")
    users = data.get("result", [])
    all_users.extend(users)
    if len(users) < 100:
        break
    page += 1

# 2. For each customer, get recipes
for user in all_users:
    uid = user["id"]
    data = api(f"/managed_users/{uid}/recipes?per_page=100")
    recipes = data.get("result", [])  # OEM uses "result", not "items"

    for r in recipes:
        if "Target Recipe Name" in r.get("name", ""):
            # 3. Get full recipe code and inspect
            recipe = api(f"/managed_users/{uid}/recipes/{r['id']}")
            code = json.loads(recipe["code"])
            # 4. Search code tree for the issue pattern
```

When scanning recipe code, use recursive dict/list traversal to find specific field values (e.g., `folder_id` formulas missing `.to_s`).

**Important**: Classify results into three buckets, not two:
- **Needs fix** — has the vulnerable pattern
- **Already fixed** — has the pattern with the fix applied
- **Not applicable** — different recipe structure, pattern absent entirely

Absence of a pattern does NOT mean "fixed." Recipe templates evolve over time, so customer copies may reflect different versions. Always verify by checking for the presence of the pattern before classifying.

**Verify connector type**: When filtering by recipe name, confirm the integration type via the `applications` or `action_applications` fields. Recipe names (e.g., "Batch Sync Folders and Files") are reused across connectors (SharePoint, Egnyte, Dropbox, Box).

### Dry Run a Code Fix

Before applying a fix with write access, validate the transformation locally:

1. Fetch a broken recipe's code
2. Apply the fix in memory (string/regex transformation on the code JSON)
3. Verify the fix is correct:
   - Confirm the target fields were modified
   - Confirm unrelated fields were NOT modified
   - Compare against a known-good fixed recipe if one exists
4. Print before/after for review

This requires only read access. No API writes, no recipe stops.

### Update a Recipe

**Requires read-write token. A recipe must be stopped before updating.**

**CRITICAL: Always back up before modifying.** The Workato API has no version restore endpoint — version endpoints only return metadata, not code. The only way to revert is to PUT the original code back. Save a local backup first.

1. **Back up the recipe** — save the full JSON including `code` to a local file
   ```bash
   scripts/workato-api.sh GET /managed_users/:uid/recipes/:rid > backup_recipe_:rid.json
   ```

2. Stop the recipe
   ```bash
   scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid/stop
   ```

3. Update the recipe
   ```bash
   scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid '{"recipe":{"code":"<JSON string>"}}'
   ```

4. Restart the recipe
   ```bash
   scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid/start
   ```

5. **If something goes wrong** — restore from backup:
   ```bash
   # Extract the code field from the backup and PUT it back
   CODE=$(python3 -c "import json; print(json.dumps(json.load(open('backup_recipe_:rid.json'))['code']))")
   scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid "{\"recipe\":{\"code\":$CODE}}"
   scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid/start
   ```

### Swap a Connection

```bash
scripts/workato-api.sh PUT /managed_users/:uid/recipes/:rid/connect '{"adapter_name":"salesforce","connection_id":456}'
```

## Safety Rules

- **Never delete recipes without explicit user confirmation**
- **Always confirm before stopping a running recipe** — stopping interrupts active jobs
- **Rate limits**: OEM endpoints allow 1000-2000 req/min (higher than standard 60 req/min). Still pause between bulk operations across many customers.
- **Rerun limits**: Max 25 job IDs per repeat request, max 100 reruns per job lifetime
- **Read-only by default**: The stored token should be read-only. Mutations require explicit user action to provide a write token.

## API Reference

For full endpoint documentation including OEM endpoints, pagination patterns, and query parameters, see [references/api-reference.md](references/api-reference.md).
