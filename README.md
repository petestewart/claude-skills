# Claude Code Skills

A collection of custom skills and commands for Claude Code, including project planning, orchestration tools, article generation, and utilities for PR workflows and markdown viewing.

## Skills Included

### 1. Project Planner (`/project-planner`)

Generates a comprehensive `PLAN.md` file at the start of any new project. This plan serves as the single source of truth that an Orchestrator agent (or human) can use to drive the entire build.

**When to use:**
- Starting a new project from scratch
- When you say "plan this project", "create a plan", or "help me scope this"
- When a project needs structured planning before implementation

### 2. Orchestrator (`/orchestrator`)

Manages project execution by:
- Reading and maintaining `PLAN.md` as the source of truth
- Spawning focused subagents to work on individual tickets
- Verifying work meets acceptance criteria
- Keeping the plan accurate and dependencies resolved

**When to use:**
- After a `PLAN.md` has been created
- When you say "start building", "orchestrate this project", "run the plan"
- When resuming work on a planned project

### 3. Subagent (`/subagent`)

A focused implementation agent that:
- Executes a single ticket from the plan
- Implements required changes
- Runs validation steps
- Reports completion or blockers

**When to use:**
- Automatically spawned by the Orchestrator via the Task tool
- Should not be invoked directly by users

### 4. QA (`/qa`)

Quality assurance testing skill that:
- Creates thorough test plans (`docs/qa/<scope>/TEST_PLAN.md`)
- Gets user approval before execution
- Spawns agents to execute tests sequentially
- Automatically fixes bugs found during testing
- Generates detailed test reports (`docs/qa/<scope>/REPORT.md`)

**When to use:**
- When you say "run QA", "test the changes", "verify the implementation"
- After completing implementation work that needs validation
- When you want to systematically test new functionality

### 5. Article (`/article <subject>`)

Generates self-contained HTML articles with inline SVG diagrams, light/dark themes, and polished styling that can be viewed offline in any browser.

**Features:**
- Accepts plain text topics, file paths, or URLs as input
- Asks clarifying questions about audience, depth, and focus areas
- Creates 11-section structured content with diagrams and quizzes
- Outputs accessible, offline-viewable HTML

**When to use:**
- When you say "write an article about...", "create an article on...", or "explain this topic"
- To generate educational content from documentation or URLs
- Use `--oneshot` flag to skip clarifying questions and use defaults

**Examples:**
```
/article how kubernetes pods work
/article ./docs/PLAN.md
/article https://example.com/guide --oneshot
```

### 6. Typora Markdown (`/typora-markdown`)

Opens markdown content in Typora for enhanced viewing and editing. Useful for viewing plans, PR reviews, analysis reports, or any substantial markdown content.

**When to use:**
- When creating plan files
- After generating PR reviews
- For codebase analysis reports
- When generating documentation
- When explicitly requested to view markdown in Typora

**Note:** The skill will automatically skip if you say "don't open in Typora", "skip Typora", "no Typora", or "terminal only".

## Commands Included

### `/review-pr <number>`

Analyzes a GitHub PR and provides a high-level explanation with suggested file review order and Mermaid diagrams showing relationships.

### `/pr-description`

Generates a PR description from the current branch, including summary, changes, and test plan.

### `/analyze-pr-feedback`

Analyzes GitHub PR reviews and comments, assesses their validity, and proposes solutions.

### `/planterview [file]`

Interactive interview to refine a spec file (default: SPEC.md). Asks clarifying questions to improve project specifications.

## Installation

### Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/petestewart/claude-skills.git

# Run the install script
cd claude-skills
./install.sh
```

### Manual Install

Copy the skills and commands to your Claude Code directories:

```bash
# Create the directories if they don't exist
mkdir -p ~/.claude/skills
mkdir -p ~/.claude/commands

# Copy each skill
cp -r skills/project-planner ~/.claude/skills/
cp -r skills/orchestrator ~/.claude/skills/
cp -r skills/subagent ~/.claude/skills/
cp -r skills/qa ~/.claude/skills/
cp -r skills/article ~/.claude/skills/
cp -r skills/typora-markdown ~/.claude/skills/

# Copy each command
cp commands/*.md ~/.claude/commands/
```

### Verify Installation

After installation, restart Claude Code and verify the skills are loaded:

```
/project-planner
/orchestrator
/qa
/article
/typora-markdown
/review-pr
/pr-description
/analyze-pr-feedback
/planterview
```

You should see the skills and commands listed in your available commands.

## Usage

### Creating a Project Plan

1. Start a new Claude Code session in your project directory
2. Invoke the planner:
   ```
   /project-planner
   ```
3. Provide the requested information (project name, goals, constraints)
4. The skill will create a `PLAN.md` file in your repository root

### Running the Orchestrator

1. Ensure you have a `PLAN.md` in your repository root
2. Invoke the orchestrator:
   ```
   /orchestrator
   ```
3. The orchestrator will:
   - Read and assess the current plan state
   - Select the next ready ticket
   - Spawn subagents to implement tickets
   - Verify completed work
   - Update the plan as work progresses

### Generating an Article

1. Invoke with a topic, file, or URL:
   ```
   /article how DNS works
   ```
2. Answer the clarifying questions about audience, depth, and focus
3. The skill generates an HTML file you can open in your browser

### Workflow Overview

```
User: "Plan my new project"
      |
      v
Project Planner creates PLAN.md
      |
      v
User: "Start building" or "/orchestrator"
      |
      v
Orchestrator reads PLAN.md
      |
      v
Orchestrator assigns ticket to Subagent
      |
      v
Subagent implements and validates
      |
      v
Subagent reports COMPLETE or BLOCKED
      |
      v
Orchestrator verifies and marks Done
      |
      v
User: "/qa" to verify implementation
      |
      v
Repeat until project complete
```

## File Structure

```
claude-skills/
├── README.md              # This file
├── install.sh             # Installation script
├── commands/
│   ├── analyze-pr-feedback.md
│   ├── planterview.md
│   ├── pr-description.md
│   └── review-pr.md
└── skills/
    ├── article/
    │   └── SKILL.md
    ├── orchestrator/
    │   ├── SKILL.md
    │   └── ... (reference files)
    ├── project-planner/
    │   ├── SKILL.md
    │   └── PLAN_TEMPLATE.md
    ├── qa/
    │   └── SKILL.md
    ├── subagent/
    │   ├── SKILL.md
    │   └── ... (reference files)
    └── typora-markdown/
        ├── SKILL.md
        └── scripts/
            └── open-in-typora.sh
```

## Requirements

- Claude Code CLI (version 2.0.20 or later)
- Skills support enabled (default in recent versions)
- Typora (optional, for `/typora-markdown` skill)
- GitHub CLI (`gh`) for PR-related commands

## Updating

To update the skills, pull the latest changes and re-run the install script:

```bash
cd claude-skills
git pull
./install.sh
```

## Uninstalling

To remove all skills and commands:

```bash
# Remove skills
rm -rf ~/.claude/skills/project-planner
rm -rf ~/.claude/skills/orchestrator
rm -rf ~/.claude/skills/subagent
rm -rf ~/.claude/skills/qa
rm -rf ~/.claude/skills/article
rm -rf ~/.claude/skills/typora-markdown

# Remove commands
rm -f ~/.claude/commands/analyze-pr-feedback.md
rm -f ~/.claude/commands/planterview.md
rm -f ~/.claude/commands/pr-description.md
rm -f ~/.claude/commands/review-pr.md
```

## Contributing

Feel free to open issues or submit pull requests to improve these skills.

## License

MIT License - see individual skill files for details.
