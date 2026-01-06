#!/bin/bash
# Opens a markdown file in Typora
# Usage: open-in-typora.sh <file_path>
#    or: open-in-typora.sh <file_path> --stdin (reads content from stdin)

set -e

FILE_PATH="$1"
MODE="$2"

mkdir -p ~/.claude/typora

if [[ "$MODE" == "--stdin" ]]; then
    mkdir -p "$(dirname "$FILE_PATH")"
    cat > "$FILE_PATH"
fi

if [[ ! -f "$FILE_PATH" ]]; then
    echo "Error: File not found: $FILE_PATH" >&2
    exit 1
fi

open -a Typora "$FILE_PATH"
echo "Opened in Typora: $FILE_PATH"
