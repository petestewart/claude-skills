#!/bin/bash

# Claude Skills Installation Script
# Installs skills and commands for Claude Code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SOURCE="$SCRIPT_DIR/skills"
COMMANDS_SOURCE="$SCRIPT_DIR/commands"
SKILLS_DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
COMMANDS_DEST="${CLAUDE_COMMANDS_DIR:-$HOME/.claude/commands}"

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
SKILLS=("project-planner" "orchestrator" "subagent" "qa" "typora-markdown" "article" "article-add" "article-queue" "review-as" "problem-statement" "prd" "specs" "plan" "ralph-script" "explain-project" "ship" "test-review")

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

# Commands to install
COMMANDS=("analyze-pr-feedback.md" "excalidraw.md" "planterview.md" "pr-description.md" "review-pr.md")

# Create commands destination directory if it doesn't exist
if [ ! -d "$COMMANDS_DEST" ]; then
    echo -e "${YELLOW}Creating commands directory at $COMMANDS_DEST${NC}"
    mkdir -p "$COMMANDS_DEST"
fi

echo ""

# Install each command
for cmd in "${COMMANDS[@]}"; do
    if [ -f "$COMMANDS_SOURCE/$cmd" ]; then
        echo -n "Installing command $cmd... "
        cp "$COMMANDS_SOURCE/$cmd" "$COMMANDS_DEST/"
        echo -e "${GREEN}done${NC}"
    else
        echo -e "${YELLOW}Warning: $cmd not found in source, skipping${NC}"
    fi
done

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Skills installed to: $SKILLS_DEST"
echo "Commands installed to: $COMMANDS_DEST"
echo ""
echo "Installed skills:"
for skill in "${SKILLS[@]}"; do
    if [ -d "$SKILLS_DEST/$skill" ]; then
        echo "  - $skill"
    fi
done
echo ""
echo "Installed commands:"
for cmd in "${COMMANDS[@]}"; do
    cmd_name="${cmd%.md}"
    if [ -f "$COMMANDS_DEST/$cmd" ]; then
        echo "  - /$cmd_name"
    fi
done
echo ""
echo "Restart Claude Code to load the new skills and commands."
echo ""
echo "Usage:"
echo "  /problem-statement        - Create PROBLEM.md from Jira ticket or description"
echo "  /prd                      - Expand PROBLEM.md into full PRD.md"
echo "  /specs                    - Create technical specifications from PRD.md"
echo "  /plan                     - Create implementation plan from specs"
echo "  /project-planner          - Create a PLAN.md via interactive planning"
echo "  /orchestrator             - Execute the plan with subagent coordination"
echo "  /qa                       - Create and execute QA test plans"
echo "  /article <subject>        - Generate HTML article from topic, file, or URL"
echo "  /article-add <topic>      - Add a topic to the article queue"
echo "  /article-queue            - View and manage the article queue"
echo "  /ship                     - Push branch and create a GitHub PR"
echo "  /review-as <name> <target> - Review PR/branch using a reviewer's standards"
echo "  /test-review [path]       - Review unit tests for quality and patterns"
echo "  /explain-project [name]   - Generate a project explainer document"
echo "  /typora-markdown          - Open markdown content in Typora for viewing"
echo "  /ralph-script             - Add Ralph Wiggum autonomous loop to project"
echo "  /review-pr <number>       - Analyze a PR with suggested review order"
echo "  /pr-description           - Generate a PR description from branch/Jira"
echo "  /analyze-pr-feedback      - Analyze PR reviews and comments"
echo "  /planterview [file]       - Interview to refine a spec (default: SPEC.md)"
echo "  /excalidraw <description> - Generate Excalidraw diagram in Chrome"