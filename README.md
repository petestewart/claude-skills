# Claude Code Skills: Project Planning & Orchestration

A collection of custom skills for Claude Code that enable structured project planning and coordinated task execution.

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

## Installation

### Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/claude-skills.git

# Run the install script
cd claude-skills
./install.sh
```

### Manual Install

Copy the skills to your Claude Code skills directory:

```bash
# Create the skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Copy each skill
cp -r skills/project-planner ~/.claude/skills/
cp -r skills/orchestrator ~/.claude/skills/
cp -r skills/subagent ~/.claude/skills/
```

### Verify Installation

After installation, restart Claude Code and verify the skills are loaded:

```
/project-planner
/orchestrator
```

You should see the skills listed in your available commands.

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
```

## File Structure

```
claude-skills/
├── README.md              # This file
├── install.sh             # Installation script
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
    └── subagent/
        ├── SKILL.md       # Main skill definition
        ├── PLAN_TEMPLATE.md
        ├── TEMPLATES.md
        ├── CHECKLIST.md
        └── INTEGRATION_GUIDE.md
```

## Requirements

- Claude Code CLI (version 2.0.20 or later)
- Skills support enabled (default in recent versions)

## Updating

To update the skills, pull the latest changes and re-run the install script:

```bash
cd claude-skills
git pull
./install.sh
```

## Uninstalling

To remove the skills:

```bash
rm -rf ~/.claude/skills/project-planner
rm -rf ~/.claude/skills/orchestrator
rm -rf ~/.claude/skills/subagent
```

## Contributing

Feel free to open issues or submit pull requests to improve these skills.

## License

MIT License - see individual skill files for details.
