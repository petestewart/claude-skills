#!/bin/bash

MAX_TOKENS=200000
DUMB_ZONE_TOKENS=100000
DANGER_ZONE_TOKENS=170000
PLAN_FILE="PLAN.md"
TAB_NAME="$(basename "$PWD")"

set_tab() { echo -ne "\033]1;$1 ${TAB_NAME}\007\033]6;1;bg;red;brightness;$2\a\033]6;1;bg;green;brightness;$3\a\033]6;1;bg;blue;brightness;$4\a"; }

# Set tab: running (yellow)
set_tab "🆁" 200 200 50

while grep -q '\- \[ \]' "$PLAN_FILE"; do
  echo "=== Running next task ==="

  if command -v jq >/dev/null 2>&1; then
    claude -p "$(cat prompt.md)" \
      --output-format=stream-json \
      --include-partial-messages \
      --verbose \
      --dangerously-skip-permissions \
      | jq -rj --argjson max_tokens "$MAX_TOKENS" --argjson dumb_zone "$DUMB_ZONE_TOKENS" --argjson danger_zone "$DANGER_ZONE_TOKENS" '
        if .type == "stream_event" then
          if .event.type == "content_block_start" and .event.content_block.type == "text" then
            "\u001b[97m🤖 "
          elif .event.type == "content_block_delta" and .event.delta.type == "text_delta" then
            .event.delta.text
          elif .event.type == "content_block_stop" then
            "\u001b[0m\n"
          else empty end
        elif .type == "user" and .tool_use_result then
          "\u001b[90m➜ " + (
            (if (.tool_use_result | type) == "object" then
                (.tool_use_result.stdout // .content // "result")
             else
                .tool_use_result
             end) | tostring
          )[0:200] + "\u001b[0m\n"
        elif .type == "assistant" and .message.usage then
          ((.message.usage.input_tokens // 0) + (.message.usage.cache_read_input_tokens // 0) + (.message.usage.cache_creation_input_tokens // 0)) as $tokens |
          (($tokens * 100 / $max_tokens) | floor) as $pct |
          (if $tokens > $danger_zone then "\u001b[31m" elif $tokens > $dumb_zone then "\u001b[33m" else "\u001b[32m" end) as $color |
          $color + "context: " + ($pct | tostring) + "% (" + ($tokens | tostring) + " tokens)\u001b[0m\n"
        else empty end
      ' | perl -e '$|=1; while(sysread(STDIN,$c,64)){
        $c=~s/`/$t=!$t; $t?"\e[96m":"\e[97m"/ge; print $c}'
    exit_code=${PIPESTATUS[0]}
    echo ""
  else
    stdbuf -oL -eL claude -p "$(cat prompt.md)" --output-format=stream-json \
      --include-partial-messages \
      --verbose \
      --dangerously-skip-permissions
    exit_code=$?
  fi

  if [ $exit_code -ne 0 ]; then
    # Set tab: error (red)
    set_tab "🆁" 200 50 50
    echo ""
    echo "Claude exited with error (exit code: $exit_code). Waiting 15 minutes before retry..."
    for ((i=15; i>0; i--)); do
      printf "\rTime remaining: %02d:00" $i
      sleep 60
    done
    echo ""
    # Set tab: running (yellow)
    set_tab "🆁" 200 200 50
  fi
done

# Set tab: done (green)
set_tab "🅁" 80 200 80

echo "All tasks complete!"
