#!/bin/bash
# Usage: workato-api.sh <method> <endpoint> [json_body]
# Example: workato-api.sh GET /recipes
# Example: workato-api.sh GET /managed_users/12345/recipes
# Example: workato-api.sh PUT /recipes/123/stop
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONNECTIONS_FILE="$SKILL_DIR/connections.local"

if [ ! -f "$CONNECTIONS_FILE" ]; then
  echo "ERROR: No connections.local found at $CONNECTIONS_FILE" >&2
  echo "Copy connections.local.example to connections.local and fill in your credentials." >&2
  exit 1
fi

read_field() {
  grep "^${1}=" "$CONNECTIONS_FILE" 2>/dev/null | head -1 | cut -d= -f2-
}

API_TOKEN=$(read_field "API_TOKEN")
BASE_URL=$(read_field "BASE_URL")

if [ -z "$API_TOKEN" ]; then
  echo "ERROR: API_TOKEN not set in $CONNECTIONS_FILE" >&2
  exit 1
fi

# Default to US datacenter
BASE_URL="${BASE_URL:-https://www.workato.com/api}"
# Strip trailing slash
BASE_URL="${BASE_URL%/}"

METHOD="${1:?Usage: workato-api.sh <GET|POST|PUT|PATCH|DELETE> <endpoint> [json_body]}"
ENDPOINT="${2:?Usage: workato-api.sh <GET|POST|PUT|PATCH|DELETE> <endpoint> [json_body]}"
BODY="${3:-}"

# Build curl args
CURL_ARGS=(
  -s
  -X "$METHOD"
  -H "Authorization: Bearer $API_TOKEN"
  -H "Content-Type: application/json"
)

if [ -n "$BODY" ]; then
  CURL_ARGS+=(-d "$BODY")
fi

# Make the request
RESPONSE=$(curl "${CURL_ARGS[@]}" -w "\n%{http_code}" "${BASE_URL}${ENDPOINT}")

# Split response body and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY_RESPONSE=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 400 ]; then
  echo "HTTP $HTTP_CODE Error:" >&2
  if [ -n "$BODY_RESPONSE" ]; then
    echo "$BODY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BODY_RESPONSE" >&2
  else
    echo "(empty response body)" >&2
  fi
  exit 1
fi

# Output response — pretty-print JSON if possible, otherwise raw
if [ -z "$BODY_RESPONSE" ]; then
  echo "{}"
else
  echo "$BODY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BODY_RESPONSE"
fi
