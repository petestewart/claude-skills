# Claude Code Skills

A collection of custom skills and commands for Claude Code, including project planning pipelines, orchestration tools, article generation, code review utilities, and PR workflows.

## Skills Included

### Planning & Execution Pipeline

These skills form a progressive refinement pipeline: define the problem, expand into requirements, create specs, plan tasks, then execute.

#### Problem Statement (`/problem-statement`)

Creates a structured `PROBLEM.md` document that clearly defines what problem is being solved and what success looks like. Accepts input from Jira tickets (via MCP), document links, or text descriptions.

**When to use:**
- Starting a new project, feature, or bugfix
- When you need to clearly define the problem before jumping into solutions
- When you say "define the problem", "what are we solving", or "create a problem statement"

#### PRD (`/prd`)

Expands a problem statement into a comprehensive Product Requirements Document (`PRD.md`). Bridges problem definition with implementation planning by adding technical approach, dependencies, affected systems, and open questions.

**When to use:**
- After creating a `PROBLEM.md`
- When you say "create a PRD", "expand to PRD", or "product requirements"
- Will prompt to create `PROBLEM.md` first if one doesn't exist

#### Specs (`/specs`)

Transforms `PRD.md` into detailed technical specifications in a `specs/` directory. Creates a `specs/README.md` overview and individual spec files for each component.

**When to use:**
- After creating a `PRD.md`
- When you say "create specs", "technical specifications", or "spec it out"
- When you need detailed implementation blueprints before coding

#### Plan (`/plan`)

Creates an actionable `PLAN.md` with phased tasks from whatever context is available — a user-provided description, `PRD.md`, `specs/`, or any combination. Unlike Project Planner, this skill is flexible about input sources.

**When to use:**
- When you say "create a plan", "implementation plan", or "task breakdown"
- Accepts inline descriptions: `/plan add dark mode to settings`
- Works with or without PRD/specs — adapts to available context

#### Project Planner (`/project-planner`)

Generates a comprehensive `PLAN.md` file at the start of any new project through an interactive session. This plan serves as the single source of truth that an Orchestrator agent (or human) can use to drive the entire build.

**When to use:**
- Starting a new project from scratch with interactive planning
- When you say "plan this project", "help me scope this"
- When a project needs structured planning before implementation

#### Orchestrator (`/orchestrator`)

Manages project execution by:
- Reading and maintaining `PLAN.md` as the source of truth
- Spawning focused subagents to work on individual tickets
- Verifying work meets acceptance criteria
- Keeping the plan accurate and dependencies resolved

**When to use:**
- After a `PLAN.md` has been created
- When you say "start building", "orchestrate this project", "run the plan"
- When resuming work on a planned project

#### Subagent (`/subagent`)

A focused implementation agent that:
- Executes a single ticket from the plan
- Implements required changes
- Runs validation steps
- Reports completion or blockers

**When to use:**
- Automatically spawned by the Orchestrator via the Task tool
- Should not be invoked directly by users

#### QA (`/qa`)

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

### Article Generation

#### Article (`/article <subject>`)

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

#### Article Add (`/article-add <topic>`)

Adds a topic to the article queue for later generation. Supports both global and project-local queues.

**Flags:**
- `-g` - Use global queue (default): `~/.claude/article-queue.md`
- `-l` - Use local/project queue: `.claude/article-queue.md`

**Examples:**
```
/article-add how kubernetes networking works
/article-add -l project-specific architecture notes
```

#### Article Queue (`/article-queue`)

Displays the article topic queue and offers to generate an article from any queued topic.

**Flags:**
- `-g` - Use global queue (default)
- `-l` - Use local/project queue

**When to use:**
- When you say "show my article queue", "what articles are queued", or "list article topics"

### Code Review & PRs

#### Ship (`/ship`)

Pushes the current branch, creates a GitHub PR with a generated title and description, and optionally assigns reviewers and notifies via Slack.

**Features:**
- Auto-detects Jira ticket numbers from branch names for PR titles
- Generates structured PR descriptions from the diff
- Optionally assigns reviewers and sends Slack notifications

**When to use:**
- When you say "ship it", "create a PR", "open a PR"
- When you're ready to push and open a pull request

#### Review As (`/review-as <reviewer> <target>`)

Reviews a PR or branch using a specific reviewer's documented technical preferences and code standards. Requires reviewer preference files in a `reviewers/` directory.

**Where target can be:**
- PR number (e.g., `4698`)
- PR URL
- Branch name (reviews diff against main/master)
- `HEAD` or omitted (reviews current uncommitted changes)

**Examples:**
```
/review-as tt 4698
/review-as tt feature-branch
/review-as tt HEAD
```

#### Test Review (`/test-review [path]`)

Reviews unit tests for quality, coverage, consistency, and adherence to established codebase patterns. Optionally targets a specific directory or file.

**Examples:**
```
/test-review                           # Review all tests
/test-review spec/                     # Review Ruby specs
/test-review tests/unit/               # Review specific directory
/test-review src/__tests__/auth.test.ts  # Review specific file
```

### Utilities

#### Explain Project (`/explain-project`)

Generates a detailed `FOR[name].md` document that explains an entire project in plain language. Covers technical architecture, codebase structure, technology choices, and lessons learned. Written in a conversational, memorable style with analogies and anecdotes.

**Features:**
- Accepts an optional name argument (e.g., `/explain-project Sarah`)
- Investigates the project by spawning parallel research agents
- Opens the finished document in Typora

**When to use:**
- When you say "explain this project", "write a project explainer", or "help me understand this codebase"
- When onboarding someone new to a project

#### Typora Markdown (`/typora-markdown`)

Opens markdown content in Typora for enhanced viewing and editing. Useful for viewing plans, PR reviews, analysis reports, or any substantial markdown content.

**When to use:**
- When creating plan files
- After generating PR reviews
- For codebase analysis reports
- When generating documentation
- When explicitly requested to view markdown in Typora

**Note:** The skill will automatically skip if you say "don't open in Typora", "skip Typora", "no Typora", or "terminal only".

#### Ralph Script (`/ralph-script`)

Bootstraps the Ralph Wiggum autonomous loop into your project by creating `ralph-loop.sh` and `prompt.md`. The loop drives Claude through a `PLAN.md` task list unattended, with colored output and context usage tracking.

**When to use:**
- When you say "add ralph loop", "set up ralph script", or "add autonomous loop"
- When bootstrapping autonomous execution for a planned project
- Supports `--force` to skip interactive checks

## Commands Included

### `/excalidraw <description>`

Generates an Excalidraw diagram from a text description and renders it in Chrome. Uses the Claude in Chrome extension to inject the diagram into excalidraw.com via localStorage.

**Requires:** Claude in Chrome browser extension

**Examples:**
```
/excalidraw simple flowchart with start, process, end
/excalidraw architecture diagram showing frontend, API, and database layers
/excalidraw decision tree for user authentication flow
```

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
cp -r skills/article-add ~/.claude/skills/
cp -r skills/article-queue ~/.claude/skills/
cp -r skills/typora-markdown ~/.claude/skills/
cp -r skills/ralph-script ~/.claude/skills/
cp -r skills/explain-project ~/.claude/skills/
cp -r skills/plan ~/.claude/skills/
cp -r skills/prd ~/.claude/skills/
cp -r skills/specs ~/.claude/skills/
cp -r skills/problem-statement ~/.claude/skills/
cp -r skills/review-as ~/.claude/skills/
cp -r skills/ship ~/.claude/skills/
cp -r skills/test-review ~/.claude/skills/

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
/article-add
/article-queue
/typora-markdown
/ralph-script
/explain-project
/plan
/prd
/specs
/problem-statement
/review-as
/ship
/test-review
/review-pr
/pr-description
/analyze-pr-feedback
/planterview
/excalidraw
```

You should see the skills and commands listed in your available commands.

## Usage

### Planning Pipeline

The recommended workflow for new projects follows a progressive refinement pipeline:

```
/problem-statement  →  Define the problem
       |
       v
     /prd           →  Expand into requirements
       |
       v
     /specs          →  Create technical specifications
       |
       v
     /plan           →  Break into actionable tasks (PLAN.md)
       |
       v
  /orchestrator      →  Execute the plan with subagents
       |
       v
     /qa             →  Verify the implementation
       |
       v
     /ship           →  Push and create a PR
```

You can enter the pipeline at any stage — `/plan` works with or without prior PRD/specs.

### Generating an Article

1. Invoke with a topic, file, or URL:
   ```
   /article how DNS works
   ```
2. Answer the clarifying questions about audience, depth, and focus
3. The skill generates an HTML file you can open in your browser

Or queue topics for later:
```
/article-add how DNS resolution works
/article-queue
```

## File Structure

```
claude-skills/
├── README.md              # This file
├── install.sh             # Installation script
├── commands/
│   ├── analyze-pr-feedback.md
│   ├── excalidraw.md
│   ├── planterview.md
│   ├── pr-description.md
│   └── review-pr.md
└── skills/
    ├── article/
    ├── article-add/
    ├── article-queue/
    ├── explain-project/
    ├── orchestrator/
    ├── plan/
    ├── prd/
    ├── problem-statement/
    ├── project-planner/
    ├── qa/
    ├── ralph-script/
    ├── review-as/
    ├── ship/
    ├── specs/
    ├── subagent/
    ├── test-review/
    └── typora-markdown/
```

## Requirements

- Claude Code CLI (version 2.0.20 or later)
- Skills support enabled (default in recent versions)
- Typora (optional, for `/typora-markdown` and `/explain-project` skills)
- GitHub CLI (`gh`) for PR-related commands and `/ship`
- Atlassian MCP (optional, for Jira integration in `/problem-statement` and `/ship`)

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
rm -rf ~/.claude/skills/article-add
rm -rf ~/.claude/skills/article-queue
rm -rf ~/.claude/skills/typora-markdown
rm -rf ~/.claude/skills/ralph-script
rm -rf ~/.claude/skills/explain-project
rm -rf ~/.claude/skills/plan
rm -rf ~/.claude/skills/prd
rm -rf ~/.claude/skills/specs
rm -rf ~/.claude/skills/problem-statement
rm -rf ~/.claude/skills/review-as
rm -rf ~/.claude/skills/ship
rm -rf ~/.claude/skills/test-review

# Remove commands
rm -f ~/.claude/commands/analyze-pr-feedback.md
rm -f ~/.claude/commands/excalidraw.md
rm -f ~/.claude/commands/planterview.md
rm -f ~/.claude/commands/pr-description.md
rm -f ~/.claude/commands/review-pr.md
```

## Contributing

Feel free to open issues or submit pull requests to improve these skills.

## License

MIT License - see individual skill files for details.
