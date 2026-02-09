---
name: explain-project
description: >
  Generate a detailed, engaging FOR[name].md document that explains an entire project in plain language.
  Covers technical architecture, codebase structure, technology choices, and lessons learned (bugs,
  pitfalls, best practices). Written in a conversational, memorable style with analogies and anecdotes.
  Use when the user invokes "/explain-project" or asks to "explain this project", "write a project
  explainer", "write a FOR[name].md", "document this project for me", or "help me understand this
  codebase". Accepts an optional name argument (e.g., "/explain-project Pete").
---

# Explain Project

Generate a comprehensive, engaging project explanation document (FOR[name].md) in the project root.

## Process

1. **Determine the name** - Use the argument if provided (e.g., `/explain-project Sarah`), otherwise default to the current user's name from the system (e.g., `whoami` or git config). Never ask - just use a sensible default.
2. **Investigate the project** - Follow the research steps below.
3. **Write the document** - Follow the writing guide and document structure below.
4. **Save** - Write to `FOR[name].md` in the project root.
5. **Open** - Run `open -a Typora FOR[name].md` to open the finished document in Typora.

## Step 1: Investigate the Project

Explore the codebase systematically. Spawn parallel subagents where possible to speed this up.

### Codebase structure

**IMPORTANT: Always exclude dependency and build directories when searching.** Never glob or search inside `node_modules/`, `vendor/`, `dist/`, `build/`, `.next/`, `__pycache__/`, `target/`, `.gradle/`, `venv/`, `.venv/`, or similar generated directories. Use `src/**` or other source-specific paths rather than `**/*` patterns.

- List top-level files and directories (use `ls`, not recursive glob) to understand the project layout
- Read README.md, CLAUDE.md, package.json, Cargo.toml, pyproject.toml, Gemfile, go.mod, or equivalent to identify the project's purpose, dependencies, and tech stack
- Glob for key entry points using source-specific paths (e.g., `src/**/*.ts`, `app/**/*.rb`, `lib/**/*.py` - not `**/*`)
- Read the most important 10-15 files to understand architecture and how pieces connect

### Technology choices
- Identify the core technologies, frameworks, and libraries
- Look for config files that reveal tooling decisions (bundler config, linter config, CI config, Docker files, etc.)
- Note any unusual or interesting dependency choices

### Git archaeology
- `git log --oneline -100` for recent history and project trajectory
- `git log --all --oneline --grep="fix" --grep="bug" --grep="revert" --grep="broken" --grep="workaround" --grep="hack" -i` to find bug fixes and pain points
- For the most interesting bug-fix commits, read the diff: `git show <hash> --stat` then `git show <hash>` for the actual changes
- `git log --diff-filter=D --summary --oneline | head -40` to find deleted files (often reveals abandoned approaches)
- `git shortlog -sn --no-merges | head -10` for contributor patterns
- Look for large commits that restructured the project (refactors, migrations)

### Patterns and decisions
- Search for TODO, FIXME, HACK, WORKAROUND comments - these reveal known issues and compromises
- Look at test files to understand what the team considers important to test
- Check for environment/config patterns that reveal deployment concerns

## Step 2: Write the Document

### Writing style

Read [references/writing-guide.md](references/writing-guide.md) before writing.

Core principles:
- **Conversational, not clinical.** Write like explaining the project over coffee to a smart engineer who hasn't seen it.
- **Analogies are your best friend.** Abstract architecture becomes concrete when compared to familiar things.
- **Show the scars.** Bugs, wrong turns, "oh no" moments - these are the most valuable parts.
- **Be opinionated.** Say what's clever, what's janky, what you'd do differently.

### Document structure

Adapt this outline to fit the project. Not every project needs every section.

```markdown
# FOR [Name]: [Project Name]

## What Is This Thing?
[2-3 paragraph elevator pitch. What does it do, who is it for, why does it exist?
Frame around the problem it solves, not the technology.]

## The Big Picture
[High-level architecture. Use a mental model or analogy. Describe the request
lifecycle, command flow, or data pipeline - whatever the core loop is.
Draw the satellite view before zooming in.]

## A Tour of the Codebase
[Walk the directory structure as a narrative, not a listing. Group related pieces.
Explain WHY things are organized this way. Call out the most important files.]

## The Tech Stack (and Why)
[Don't just list technologies - explain the reasoning. What problem does each
solve? Alternatives considered? Trade-offs? Group by category.]

## How the Pieces Connect
[API contracts, data flow, event systems, shared state. The connective tissue
that's hardest to understand from reading code alone.]

## Lessons from the Trenches

### Bugs That Bit Us
[Specific bugs from git history. What happened, why it was hard to find,
how it was fixed, what the takeaway is. Mini case studies.]

### Pitfalls to Watch For
[Not bugs yet but easily could be. Fragile patterns, implicit assumptions,
leaky abstractions.]

### Things Done Well
[Good engineering worth learning from. Patterns, clever solutions, good abstractions.]

## What I'd Want to Know on Day One
[Practical advice: how to run it, test it, common workflows, where to look
when something breaks.]
```

### Calibration

- **Length**: 2000-4000 words depending on project complexity.
- **Depth**: High-level architecture with zoomed-in detail where it matters. The 20% that gives 80% understanding.
- **Audience**: Senior engineer, smart but no context on this project or necessarily its stack. Don't assume domain knowledge, don't over-explain fundamentals.
- **Tone**: Experienced colleague walking you through the project - knowledgeable, casual, occasionally funny, never condescending.
