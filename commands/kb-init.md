---
description: Initialize a new knowledge-base project in the current directory with raw/, wiki/, outputs/ structure and starter files
argument-hint: <subject description>
---

Initialize a new knowledge-base project in the current directory following the pattern defined in the `knowledge-base` skill.

Subject description: $ARGUMENTS

## Step 1 — Confirm and gather context

If `$ARGUMENTS` is empty, ask the user for:
- What is this knowledge base about? (subject, scope, purpose)
- Who will use it? (just them, a team, etc.)
- Does the project involve ongoing correspondence (emails, messages)?

If `$ARGUMENTS` is provided, use it as the subject and ask follow-ups only if critical details are missing.

## Step 2 — Create directory structure

Create these directories (only if they don't already exist — do not overwrite):

```
raw/
wiki/
outputs/
```

## Step 3 — Create starter files

Create the following files. If any already exist, stop and ask the user whether to overwrite or merge.

### `CLAUDE.md` (project root)

Use this template, filling in the subject-specific parts from user context:

```markdown
# Knowledge Base

## What This Is
<one-paragraph description of the subject and purpose, derived from $ARGUMENTS and any follow-up answers>

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
- Distinguish confirmed facts from inferences in the text (mark inferences clearly)

## Wiki Update Protocol
Trigger events that require wiki updates:

1. **New file added to raw/**
   - Summarize in wiki/source-documents.md
   - Update every topic article whose facts it touches
   - Update wiki/open-questions.md (resolved or newly surfaced)
   - Update wiki/correspondence.md if it is an email
   - Create a new wiki/<topic>.md and add to INDEX.md if it introduces a new topic

2. **Decision made during a conversation**
   - Log in wiki/decisions.md with date and reasoning

3. **Analysis or inference emerges in conversation**
   - Add to the relevant topic article, clearly marked as inference vs. fact, with reasoning
   - If it produces a follow-up question, add to wiki/open-questions.md

4. **New correspondence exchanged**
   - Append to wiki/correspondence.md
   - Update topic articles whose facts changed
   - Mark resolved items in wiki/open-questions.md

5. **Fact changes** (new balance, new number, new status)
   - Grep across wiki/ to find every copy and update all of them
   - Do not leave stale copies behind

User cues that trigger the protocol:
- "I added X to raw/, process it"
- "Update the wiki with what we learned"
- "Log that decision"
- /kb-sync

## Drafting Outputs: Pre-Send Checks
Before including any question in a draft (email, questionnaire, brief), check whether the answer is already available in existing source material. If it is, drop the question or reframe it to confirm an inference rather than ask cold.
```

### `wiki/INDEX.md`

```markdown
# Knowledge Base — Index

Central index of wiki topics. Last updated YYYY-MM-DD.

## Structural

- [[decisions]] — Running log of decisions.
- [[open-questions]] — Items still awaiting clarification.
- [[source-documents]] — Summaries of every raw document in the knowledge base.

## Topics

(add topic entries here as they are created)

Last updated: <today's date>
```

### `wiki/decisions.md`

```markdown
# Decisions Log

Running log of decisions made about this knowledge base's subject matter. Each entry notes the date, the decision, and the reasoning.

## Decisions

(none yet)

Last updated: <today's date>
```

### `wiki/open-questions.md`

```markdown
# Open Questions

Items where the current state is unknown or awaiting information. Grouped by category as the project grows.

## Unanswered

(none yet)

Last updated: <today's date>
```

### `wiki/source-documents.md`

```markdown
# Source Documents

Summary of every file in `raw/`. Each entry notes what the document is, where it came from, and what it contains. All raw files are read-only; modifications belong in wiki articles.

## Documents

(none yet — add files here as they are dropped into raw/)

Last updated: <today's date>
```

Use today's absolute date (from context) in all "Last updated" lines.

If the project involves correspondence, also create:

### `wiki/correspondence.md`

```markdown
# Correspondence Timeline

Chronological summary of correspondence related to this knowledge base.

## Messages

(none yet)

Last updated: <today's date>
```

## Step 4 — Report

Tell the user:
- What directory structure was created
- What starter files were created
- What to do next: drop raw files into `raw/`, then invoke `/kb-sync` to process them
- Remind them to customize `CLAUDE.md`'s "What This Is" section and add subject-specific communication rules if needed
