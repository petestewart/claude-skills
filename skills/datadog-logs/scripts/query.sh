#!/usr/bin/env bash
# Query Datadog Logs Search API v2
# Usage: query.sh <json_body>
# Env: DD_API_KEY, DD_APP_KEY, DD_SITE (default: datadoghq.com)

set -euo pipefail

SITE="${DD_SITE:-datadoghq.com}"
BODY="$1"

if [[ -z "${DD_API_KEY:-}" || -z "${DD_APP_KEY:-}" ]]; then
  echo "Error: DD_API_KEY and DD_APP_KEY must be set" >&2
  exit 1
fi

curl -s -X POST "https://api.${SITE}/api/v2/logs/events/search" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
  -d "${BODY}"
