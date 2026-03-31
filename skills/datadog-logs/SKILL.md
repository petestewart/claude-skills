---
name: datadog-logs
description: >-
  Query Datadog logs via the Logs Search API v2. Use when the user asks to
  "check the logs", "search logs", "find errors in Datadog", "look up logs for",
  "show me production logs", "check for errors", "search Datadog", or any
  request involving log search, error investigation, or production debugging
  that requires Datadog log data.
---

# Datadog Logs

Query Datadog logs using the Logs Search API v2 via curl.

## Setup

Requires env vars configured in Claude settings:
- `DD_API_KEY` — Datadog API key
- `DD_APP_KEY` — Datadog Application key
- `DD_SITE` — Datadog site (default: `datadoghq.com`)

## Usage

```bash
~/.claude/skills/datadog-logs/scripts/query.sh '<json_body>'
```

## Request Body Format

```json
{
  "filter": {
    "query": "<datadog search query>",
    "from": "<start time>",
    "to": "<end time>"
  },
  "sort": "timestamp",
  "page": {
    "limit": 25
  }
}
```

## Filter Query Syntax

- **Text search**: `error`, `"connection timeout"`
- **Field search**: `service:my-api`, `status:error`, `host:ip-172-*`
- **Tag search**: `env:production`, `version:abc123`
- **Attribute search**: `@http.status_code:403`, `@err.type:HttpError`
- **Boolean**: `service:my-api AND status:error`
- **Wildcards**: `service:my-*`
- **Ranges**: `@http.status_code:[400 TO 499]`
- **Negation**: `-status:info`, `NOT service:my-worker`

## Time Formats

- **Relative**: `now-15m`, `now-1h`, `now-1d`, `now-7d`
- **ISO 8601**: `2026-03-18T00:00:00Z`
- **`now`**: current time

## Sort Options

- `timestamp` (newest first, default)
- `-timestamp` (oldest first)

## Pagination

- `page.limit`: max results per request (max 1000, default 10)
- `page.cursor`: cursor from `meta.page.after` in previous response for next page

## Common Queries

### Recent errors for a service
```bash
scripts/query.sh '{"filter":{"query":"service:my-api status:error","from":"now-1h","to":"now"},"page":{"limit":25}}'
```

### HTTP 4xx errors
```bash
scripts/query.sh '{"filter":{"query":"@http.status_code:[400 TO 499]","from":"now-1h","to":"now"},"page":{"limit":25}}'
```

### Errors containing specific text
```bash
scripts/query.sh '{"filter":{"query":"\"connection refused\" status:error","from":"now-6h","to":"now"},"page":{"limit":25}}'
```

## Response Format

The API returns JSON with:
- `data[]` — array of log entries, each with `attributes.message`, `attributes.status`, `attributes.service`, `attributes.timestamp`, and `attributes.attributes` (structured fields)
- `meta.page.after` — cursor for pagination
- `links.next` — next page URL

## jq Patterns

### Summary view
```bash
scripts/query.sh '...' | jq '[.data[] | {timestamp: .attributes.timestamp, service: .attributes.service, status: .attributes.status, message: .attributes.attributes.message}]'
```

### Error details
```bash
scripts/query.sh '...' | jq '[.data[] | {timestamp: .attributes.timestamp, err_type: .attributes.attributes.err.type, err_message: .attributes.attributes.err.message}]'
```

## Limits

- Max 1000 logs per request
- Scanned data limited to log retention period
- Rate limited — avoid rapid repeated queries
