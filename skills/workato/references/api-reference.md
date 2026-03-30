# Workato API Reference

## Authentication

All requests (both Developer and OEM) use Bearer token authentication:
```
Authorization: Bearer <api_token>
```

## Base URLs

| Region | Base URL |
|--------|----------|
| US | `https://www.workato.com/api` |
| EU | `https://app.eu.workato.com/api` |
| JP | `https://app.jp.workato.com/api` |
| SG | `https://app.sg.workato.com/api` |
| AU | `https://app.au.workato.com/api` |

## Rate Limits

### Developer API (vendor workspace)
| Endpoint | Limit |
|----------|-------|
| Most endpoints | 60 req/min |
| POST /recipes (create) | 1 req/sec |
| POST /recipes/:id/health | 20 req/min |
| POST /recipes/:recipe_id/repeat_jobs | 1 req/sec |
| Connection mutations | 1 req/sec |

### OEM/Embedded API (customer workspaces)
| Endpoint | Limit |
|----------|-------|
| List/Get recipes | 2,000 req/min |
| Other recipe endpoints | 1,000 req/min |
| Repeat jobs | 1 req/sec |
| Other job endpoints | 1,000 req/min |

## Response Shape

**Developer API** returns lists under `"items"`:
```json
{ "items": [ ... ] }
```

**OEM/Embedded API** returns lists under `"result"`:
```json
{ "result": [ ... ] }
```

Always handle both: `data.get("result", data.get("items", []))`

---

## Embedded OEM API — Managed Users

All OEM endpoints are prefixed with `/managed_users/:managed_user_id/`. The `:managed_user_id` can be:
- A numeric Workato ID (e.g., `7577739`)
- An external ID prefixed with `E` and URL-encoded (e.g., `EA2300`)

For environments, append `_dev`, `_test`, or `_prod` to the managed user ID.

### List all customers
```
GET /managed_users?page=1&per_page=100
```
Query params: `page`, `per_page` (max 100), `category_id`

Response includes: `id`, `external_id`, `name`, `active_recipe_count`, `active_connection_count`, `task_count`, `plan_id`, `time_zone`

### Get customer
```
GET /managed_users/:id
```

### Create customer
```
POST /managed_users
```

### Update customer
```
PUT /managed_users/:id
```

### Delete customer
```
DELETE /managed_users/:id
```

---

## Recipes

### Developer API (vendor workspace)
```
GET    /recipes?page=1&per_page=100
GET    /recipes/:id
POST   /recipes
PUT    /recipes/:id                    # must be stopped first
DELETE /recipes/:id
PUT    /recipes/:id/start
PUT    /recipes/:id/stop
POST   /recipes/:id/copy
POST   /recipes/:recipe_id/reset_trigger
POST   /recipes/:recipe_id/poll_now
PUT    /recipes/:recipe_id/connect
GET    /recipes/:recipe_id/versions?page=1&per_page=100
GET    /recipes/:recipe_id/versions/:id
```

### OEM API (customer workspace)
Same endpoints prefixed with `/managed_users/:uid/`:
```
GET    /managed_users/:uid/recipes?page=1&per_page=100
GET    /managed_users/:uid/recipes/:id
POST   /managed_users/:uid/recipes
PUT    /managed_users/:uid/recipes/:id
DELETE /managed_users/:uid/recipes/:id
PUT    /managed_users/:uid/recipes/:id/start
PUT    /managed_users/:uid/recipes/:id/stop
POST   /managed_users/:uid/recipes/:id/copy
POST   /managed_users/:uid/recipes/:rid/reset_trigger
POST   /managed_users/:uid/recipes/:rid/poll_now
PUT    /managed_users/:uid/recipes/:rid/connect
GET    /managed_users/:uid/recipes/:rid/versions?page=1&per_page=100
```

### List recipes query params
`folder_id`, `adapter_names_any`, `adapter_names_all`, `running` (true/false), `stop_cause`, `updated_after`, `stopped_after`, `since_id`, `order` (created_at_asc/desc, updated_at_asc/desc), `with_subfolders`, `exclude_code`, `per_page` (max 100), `page`, `project_id`

### Update recipe
**Recipe must be stopped first.**
Body: `{ "recipe": { "name": "...", "code": "<JSON string>" } }`

### Copy recipe
Body: `{ "folder_id": 123 }`

### Swap connection
Body: `{ "adapter_name": "salesforce", "connection_id": 456 }`

---

## Jobs

### Developer API
```
GET    /recipes/:recipe_id/jobs
GET    /recipes/:recipe_id/jobs/:job_id
POST   /job/resume
POST   /recipes/:recipe_id/repeat_jobs
```

### OEM API
```
GET    /managed_users/:uid/recipes/:rid/jobs
GET    /managed_users/:uid/recipes/:rid/jobs/:job_id
POST   /managed_users/:uid/recipes/:rid/repeat_jobs
```

### List jobs query params
`status` ("succeeded", "failed", "pending"), `rerun_only` (boolean), `offset_job_id`, `prev` (boolean for cursor direction)

Uses cursor-based pagination: pass `offset_job_id` from previous response.

### Job detail response
Returns step-by-step execution in `lines` array with:
- `input` — data entering the step
- `output` — data produced by the step
- `error` — error message if step failed
- `adapter_name` / `adapter_operation` — which connector/action
- Performance stats

### Repeat (rerun) jobs
Body: `{ "job_ids": [1, 2, 3] }` (max 25 per request, max 100 reruns per job)

---

## Connections

### Developer API
```
GET    /connections
POST   /connections
PUT    /connections/:connection_id
POST   /connections/:connection_id/disconnect
DELETE /connections/:connection_id
```

### OEM API
```
GET    /managed_users/:uid/connections
POST   /managed_users/:uid/connections
PUT    /managed_users/:uid/connections/:cid
POST   /managed_users/:uid/connections/:cid/disconnect
DELETE /managed_users/:uid/connections/:cid
```

### List connections query params
`folder_id`, `project_id`, `external_id`, `updated_after`, `includes[]=tags`

---

## Folders

```
GET /folders
GET /managed_users/:uid/folders
```
Query params: `parent_id`, `page`, `per_page`

---

## Pagination Patterns

**Page-based** (recipes, versions, folders, managed_users): `?page=1&per_page=100`

**Cursor-based** (jobs): `?offset_job_id=<last_job_id>` with `prev=true/false`
