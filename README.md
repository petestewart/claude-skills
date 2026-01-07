# Claude Code Skills

A collection of custom skills and commands for Claude Code, including project planning, orchestration tools, QA testing, and PR workflow utilities.

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
- Creates thorough test plans (QA_TEST.md)
- Gets user approval before execution
- Executes tests using available tools (including browser automation)
- Automatically fixes bugs found during testing
- Generates detailed test reports (QA_REPORT.md)

**When to use:**
- When you say "run QA", "test the changes", "verify the implementation"
- After completing implementation work that needs validation
- When you want to systematically test new functionality

### 5. Typora Markdown (`/typora-markdown`)

Opens markdown content in Typora for enhanced viewing and editing. Useful for viewing plans, PR reviews, analysis reports, or any substantial markdown content.

**When to use:**
- When creating plan files
- After generating PR reviews
- For codebase analysis reports
- When generating documentation
- When explicitly requested to view markdown in Typora

**Note:** The skill will automatically skip if you say "don't open in Typora", "skip Typora", "no Typora", or "terminal only".

## Commands Included

### `/review-pr <pr-number>`

Analyzes a GitHub pull request and provides:
- A high-level explanation of what the PR does
- The main changes and their purpose
- A suggested order to review the files to understand the flow

### `/pr-description`

Generates a GitHub pull request description by:
- Extracting the Jira ticket number from the current git branch
- Fetching Jira ticket details (if available)
- Analyzing git changes
- Creating a formatted PR description with Description, References, QA steps, and Jira links

### `/analyze-pr-feedback <pr-number>`

Gathers and analyzes all reviews and comments for a GitHub PR. For each comment:
- Explains what the comment is requesting
- Assesses whether the comment is valid/actionable
- Proposes solutions or next steps

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
cp -r skills/typora-markdown ~/.claude/skills/

# Copy each command
cp commands/review-pr.md ~/.claude/commands/
cp commands/pr-description.md ~/.claude/commands/
cp commands/analyze-pr-feedback.md ~/.claude/commands/
```

### Verify Installation

After installation, restart Claude Code and verify the skills and commands are loaded:

```
/project-planner
/orchestrator
/qa
/typora-markdown
/review-pr
/pr-description
/analyze-pr-feedback
```

You should see these listed in your available commands.

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

### Running QA Tests

1. Complete implementation work that needs testing
2. Invoke the QA skill:
   ```
   /qa
   ```
3. The skill will:
   - Analyze what needs to be tested
   - Create a `QA_TEST.md` test plan
   - Request your approval
   - Execute the tests
   - Generate a `QA_REPORT.md` with results

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
Repeat until project complete
      |
      v
User: "Run QA" or "/qa"
      |
      v
QA creates test plan, executes, reports
```

## File Structure

```
claude-skills/
├── README.md              # This file
├── install.sh             # Installation script
├── commands/
│   ├── analyze-pr-feedback.md
│   ├── pr-description.md
│   └── review-pr.md
└── skills/
    ├── project-planner/
    │   ├── SKILL.md       # Main skill definition
    │   └── PLAN_TEMPLATE.md
    ├── orchestrator/
    │   ├── SKILL.md       # Main skill definition
    │   ├── README.md      # Orchestrator documentation
    │   ├── PLAN_TEMPLATE.md
    │   ├── QUICK_REFERENCE.md
    │   ├── INTEGRATION_GUIDE.md
    │   ├── USAGE_EXAMPLE.md
    │   ├── SUBAGENT_REFERENCE.md
    │   ├── subagent-SKILL.md
    │   ├── subagent-CHECKLIST.md
    │   └── subagent-TEMPLATES.md
    ├── subagent/
    │   ├── SKILL.md       # Main skill definition
    │   ├── PLAN_TEMPLATE.md
    │   ├── TEMPLATES.md
    │   ├── CHECKLIST.md
    │   └── INTEGRATION_GUIDE.md
    ├── qa/
    │   └── SKILL.md       # Main skill definition
    └── typora-markdown/
        ├── SKILL.md       # Main skill definition
        └── scripts/
            └── open-in-typora.sh
```

## Requirements

- Claude Code CLI (version 2.0.20 or later)
- Skills support enabled (default in recent versions)
- For PR commands: GitHub CLI (`gh`) installed and authenticated
- For `/pr-description`: Jira MCP configured (optional, will work without it)
- For `/typora-markdown`: Typora installed

## Updating

To update the skills, pull the latest changes and re-run the install script:

```bash
cd claude-skills
git pull
./install.sh
```

## Uninstalling

To remove the skills and commands:

```bash
# Remove skills
rm -rf ~/.claude/skills/project-planner
rm -rf ~/.claude/skills/orchestrator
rm -rf ~/.claude/skills/subagent
rm -rf ~/.claude/skills/qa
rm -rf ~/.claude/skills/typora-markdown

# Remove commands
rm -f ~/.claude/commands/review-pr.md
rm -f ~/.claude/commands/pr-description.md
rm -f ~/.claude/commands/analyze-pr-feedback.md
```

## Contributing

Feel free to open issues or submit pull requests to improve these skills.

## License

MIT License - see individual skill files for details.
