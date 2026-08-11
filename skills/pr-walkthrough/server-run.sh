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

# Fallback: newest installed nvm node of any version.
if [ -z "$node_bin" ]; then
  match="$(ls -d "$NVM_DIR"/versions/node/v* 2>/dev/null | sort -V | tail -1 || true)"
  [ -n "$match" ] && [ -x "$match/bin/node" ] && node_bin="$match/bin/node"
fi

# No nvm: node may come from Homebrew, mise, asdf, fnm, volta, or the system.
if [ -z "$node_bin" ]; then
  candidate="$(command -v node 2>/dev/null || true)"
  [ -n "$candidate" ] && [ -x "$candidate" ] && node_bin="$candidate"
fi

# launchd starts us with a bare PATH, so probe the usual absolute locations too.
if [ -z "$node_bin" ]; then
  for candidate in \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    /usr/bin/node \
    "$HOME/.local/bin/node" \
    "$HOME/.local/share/mise/shims/node" \
    "$HOME/.asdf/shims/node" \
    "$HOME/.volta/bin/node" \
    "$HOME/Library/Application Support/fnm/aliases/default/bin/node"; do
    if [ -x "$candidate" ]; then node_bin="$candidate"; break; fi
  done
fi

# Last resort: ask a login shell, which sources the profile that sets up any
# version manager we did not probe for.
if [ -z "$node_bin" ]; then
  candidate="$(/bin/bash -lc 'command -v node' 2>/dev/null || true)"
  [ -n "$candidate" ] && [ -x "$candidate" ] && node_bin="$candidate"
fi

if [ -z "$node_bin" ]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) server-run.sh: no node found (checked $NVM_DIR, PATH, common install paths, login shell)" >> "$DIR/server.log"
  exit 1
fi

exec "$node_bin" "$DIR/server.mjs"