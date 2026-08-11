---
name: knowledge-base
description: Use when setting up or maintaining an AI-maintained knowledge base project (raw source material + wiki + outputs). Triggers when user mentions "knowledge base", "set up a KB", "wiki", or when the project has a wiki/ + raw/ directory structure. Pairs with /kb-init and /kb-sync commands.
version: 1.0.0
---

# Knowledge Base Pattern

A lightweight convention for managing a project where raw source material (emails, PDFs, docs, screenshots) gets organized into an AI-maintained wiki of topic articles, with generated artifacts kept separately. This skill captures the structure, rules, and update protocol so that Claude can create and maintain these projects consistently across conversations.

## When to Apply This Pattern

- Research projects where source material accumulates over time (acquisitions, investigations, product research, legal discovery, event planning)
- Projects where facts need to be synthesized across many sources and kept current
- Situations where one topic is referenced repeatedly and it helps to have a canonical article per topic
- Anywhere a user wants Claude to be a persistent second brain across sessions

## Directory Structure

```
<project-root>/
├── CLAUDE.md              # Project instructions (includes update protocol)
├── raw/                   # Unprocessed source material. Never modified.
├── wiki/                  # AI-maintained topic articles.
│   ├── INDEX.md           # One-line description of every topic
│   ├── decisions.md       # Running log of decisions
│   ├── open-questions.md  # Items awaiting answers
│   ├── source-documents.md # Summary of every file in raw/
│   └── <topic>.md         # One file per topic
└── outputs/               # Generated reports, drafts, analyses
```

## Wiki Rules

- Every topic gets its own `.md` file in `wiki/`
- Every wiki file starts with a one-paragraph summary
- Every wiki file ends with a `Last updated: YYYY-MM-DD` line
- Bump "Last updated" only on files actually modified in a session (not on every file whenever anything changes)
- Link related topics with `[[topic-name]]` format
- Maintain `INDEX.md` listing every topic with a one-line description
- Distinguish confirmed facts from inferences in the text (mark inferences clearly, explain the reasoning)
- When a fact changes, grep across `wiki/` to find every copy and update all of them — leave no stale copies

## Wiki Update Protocol

Trigger events that require wiki updates:

### 1. New file added to `raw/`
- Summarize it in `wiki/source-documents.md`
- Update every topic article whose facts it touches
- Update `wiki/open-questions.md` (resolved or newly surfaced)
- Update `wiki/correspondence.md` if it is an email (create this file if the project involves correspondence)
- Create a new `wiki/<topic>.md` and add to `INDEX.md` if it introduces a new topic

### 2. Decision made during a conversation
- Log in `wiki/decisions.md` with date and reasoning
- Update relevant strategy/positioning articles if the decision affects them

### 3. Analysis or inference emerges in conversation
- Add to the relevant topic article, clearly marked as *inference* vs. *confirmed fact*, with reasoning
- If it produces a follow-up question, add to `wiki/open-questions.md`

### 4. New correspondence exchanged
- Append to `wiki/correspondence.md`
- Update topic articles whose facts changed
- Mark resolved items in `wiki/open-questions.md`

### 5. Fact changes (new balance, new number, new status)
- Grep across `wiki/` to find every copy and update all of them
- Do not leave stale copies behind

## Companion Commands

- **`/kb-init <subject>`** — scaffolds a new knowledge base project in the current directory with the full structure and starter files.
- **`/kb-sync [args]`** — applies the Wiki Update Protocol to capture new information. With no args, reviews the conversation + `raw/` for pending updates. Common arg patterns:
  - `decision: <text>` — log a decision
  - `ingest: <filename>` — process a specific raw file
  - `email` — capture correspondence from the current session
  - freeform text — treat as a hint about what to capture

## Template: CLAUDE.md for a KB project

When initializing a new KB, include this in `CLAUDE.md`:

```markdown
# Knowledge Base

## What This Is
<one-paragraph description of the subject and purpose>

## How It's Organized
- raw/ contains unprocessed source material. Never modify these files.
- wiki/ contains the organized wiki. AI maintains this entirely.
- outputs/ contains generated reports, answers, and analyses.

## Wiki Rules
- Every topic gets its own .md file in wiki/
- Every wiki file starts with a one-paragraph summary
- Every wiki file ends with a "Last updated: YYYY-MM-DD" line
- Bump "Last updated" only on files actually modified in the current session
- Link related topics with [[topic-name]] format
- Maintain an INDEX.md listing every topic with a one-line description
- Distinguish confirmed facts from inferences (mark inferences clearly)

## Wiki Update Protocol
[Copy the 5-trigger protocol from the knowledge-base skill]

User cues that trigger the protocol:
- "I added X to raw/, process it"
- "Update the wiki with what we learned"
- "Log that decision"
- /kb-sync

## Drafting Outputs: Pre-Send Checks
Before including any question in a draft (email, questionnaire, brief), check whether the answer is already available in existing source material. If it is, drop the question or reframe it to confirm an inference rather than ask cold.
```

## Notes on Application

- The pattern assumes the project has a well-defined subject with accumulating source material. It works poorly for ephemeral chats or rapidly-moving codebases.
- The `outputs/` directory is for user-facing artifacts (reports, drafts, answers). These are NOT the same as wiki articles — outputs are consumable deliverables, wiki articles are reference material.
- `correspondence.md` is optional and only needed for projects involving email or other ongoing dialog.
- The `decisions.md`, `open-questions.md`, and `source-documents.md` files are structural and should exist in every KB project using this pattern.
