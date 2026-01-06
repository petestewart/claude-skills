#!/bin/bash

# Claude Skills Installation Script
# Installs project-planner, orchestrator, subagent, and qa skills

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SOURCE="$SCRIPT_DIR/skills"
SKILLS_DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

echo "Claude Skills Installer"
echo "======================="
echo ""

# Check if source skills exist
if [ ! -d "$SKILLS_SOURCE" ]; then
    echo -e "${RED}Error: Skills directory not found at $SKILLS_SOURCE${NC}"
    exit 1
fi

# Create destination directory if it doesn't exist
if [ ! -d "$SKILLS_DEST" ]; then
    echo -e "${YELLOW}Creating skills directory at $SKILLS_DEST${NC}"
    mkdir -p "$SKILLS_DEST"
fi

# Skills to install
SKILLS=("project-planner" "orchestrator" "subagent" "qa")

# Install each skill
for skill in "${SKILLS[@]}"; do
    if [ -d "$SKILLS_SOURCE/$skill" ]; then
        echo -n "Installing $skill... "

        # Remove existing skill if present
        if [ -d "$SKILLS_DEST/$skill" ]; then
            rm -rf "$SKILLS_DEST/$skill"
        fi

        # Copy the skill
        cp -r "$SKILLS_SOURCE/$skill" "$SKILLS_DEST/"

        echo -e "${GREEN}done${NC}"
    else
        echo -e "${YELLOW}Warning: $skill not found in source, skipping${NC}"
    fi
done

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Skills installed to: $SKILLS_DEST"
echo ""
echo "Installed skills:"
for skill in "${SKILLS[@]}"; do
    if [ -d "$SKILLS_DEST/$skill" ]; then
        echo "  - $skill"
    fi
done
echo ""
echo "Restart Claude Code to load the new skills."
echo ""
echo "Usage:"
echo "  /project-planner  - Create a PLAN.md for a new project"
echo "  /orchestrator     - Execute the plan with subagent coordination"
echo "  /qa               - Create and execute QA test plans"
