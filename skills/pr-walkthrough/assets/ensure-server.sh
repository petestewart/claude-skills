#!/bin/bash
# Make sure the pr-walkthrough local server is installed and running, so a user
# who installed the skill with `npx skills add` never has to install or start
# anything by hand. Idempotent and cheap: when the server already answers, this
# exits immediately.
#
# On first run it writes the launchd agent (so the server comes back after a
# reboot) and starts it. If launchd is unavailable it falls back to starting
# server-run.sh directly, which lasts until the next reboot.
#
# Exit 0 = server is up. Exit 1 = it isn't; stdout says why.
set -uo pipefail

LABEL="com.trunktools.pr-walkthrough-server"
# The skill directory, resolved from this script (assets/..), so it works from
# ~/.claude/skills, ~/.agents/skills, or a repo checkout.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UID_NUM="$(id -u)"
PLIST_SRC="$DIR/$LABEL.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$LABEL.plist"
PING="http://127.0.0.1:17799/ping"

up() { curl -fsS -m 2 "$PING" >/dev/null 2>&1; }

wait_up() {
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    up && return 0
    sleep 0.5
  done
  return 1
}

why_not() {
  # Surface the launcher's own diagnosis (missing node is the common one)
  # instead of a bare failure.
  local tail_out
  tail_out="$(tail -3 "$DIR/server.log" "$DIR/server.err.log" 2>/dev/null | tr -s '\n' '\n')"
  [ -n "$tail_out" ] && printf '%s\n' "$tail_out"
}

# What the agent for THIS copy of the skill should look like.
rendered=""
[ -f "$PLIST_SRC" ] && rendered="$(sed "s#__SKILL_DIR__#$DIR#g; s#__UID__#$UID_NUM#g" "$PLIST_SRC")"
current=""
[ -f "$PLIST_DST" ] && current="$(cat "$PLIST_DST")"

# Fast path: running AND the installed agent already matches this skill copy.
# The second half matters — a server left over from an older install keeps
# answering while its agent points at a path that no longer exists, so it would
# never come back after a reboot. Checking both is a sed and a string compare.
if up && [ -n "$rendered" ] && [ "$rendered" = "$current" ]; then
  echo "pr-walkthrough server: already running"
  exit 0
fi

# --- Install or refresh the launchd agent ---------------------------------
# Rewrite whenever the rendered plist differs from what's installed, so a skill
# update or a move to a new install path takes effect without a manual reinstall.
if [ -n "$rendered" ]; then
  mkdir -p "$HOME/Library/LaunchAgents"
  if [ "$rendered" != "$current" ]; then
    printf '%s\n' "$rendered" > "$PLIST_DST"
    launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null
    # A server from the previous install still holds the port.
    pkill -f "pr-walkthrough/server.mjs" 2>/dev/null
    sleep 1
    echo "pr-walkthrough server: installed the launchd agent at $PLIST_DST"
  fi
  launchctl bootstrap "gui/$UID_NUM" "$PLIST_DST" 2>/dev/null ||
    launchctl load -w "$PLIST_DST" 2>/dev/null
  launchctl kickstart -k "gui/$UID_NUM/$LABEL" 2>/dev/null
  if wait_up; then
    echo "pr-walkthrough server: running (launchd agent $LABEL, starts on login)"
    exit 0
  fi
fi

# --- Fallback: run it directly for this session ---------------------------
if [ -x "$DIR/server-run.sh" ]; then
  "$DIR/server-run.sh" >/dev/null 2>&1 &
  if wait_up; then
    echo "pr-walkthrough server: running (started directly; launchd install did not take)"
    exit 0
  fi
fi

echo "pr-walkthrough server: could not start (chat panel and Viewed checkboxes will be inactive)"
why_not
exit 1
