#!/bin/bash
# Launcher for the pr-walkthrough local server; resolves the nvm default node
# and execs server.mjs. launchd cannot resolve nvm's shell function, so do the
# lookup with absolute paths.
set -euo pipefail

NVM_DIR="$HOME/.nvm"
DIR="$HOME/.claude/skills/pr-walkthrough"

# The default alias (e.g. "22" or "v22.21.1") → newest matching installed dir.
node_bin=""
if [ -f "$NVM_DIR/alias/default" ]; then
  alias_val="$(cat "$NVM_DIR/alias/default")"
  # Try exact match first (default may already be a full version like v22.21.1).
  if [ -x "$NVM_DIR/versions/node/$alias_val/bin/node" ]; then
    node_bin="$NVM_DIR/versions/node/$alias_val/bin/node"
  elif [ -x "$NVM_DIR/versions/node/v$alias_val/bin/node" ]; then
    node_bin="$NVM_DIR/versions/node/v$alias_val/bin/node"
  else
    # Alias is a major version like "22"; pick the highest v22.* installed.
    match="$(ls -d "$NVM_DIR"/versions/node/v"$alias_val".* 2>/dev/null | sort -V | tail -1 || true)"
    [ -n "$match" ] && [ -x "$match/bin/node" ] && node_bin="$match/bin/node"
  fi
fi

# Fallback: newest installed node of any version.
if [ -z "$node_bin" ]; then
  match="$(ls -d "$NVM_DIR"/versions/node/v* 2>/dev/null | sort -V | tail -1 || true)"
  [ -n "$match" ] && [ -x "$match/bin/node" ] && node_bin="$match/bin/node"
fi

if [ -z "$node_bin" ]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) server-run.sh: could not resolve an nvm node under $NVM_DIR" >> "$DIR/server.log"
  exit 1
fi

exec "$node_bin" "$DIR/server.mjs"