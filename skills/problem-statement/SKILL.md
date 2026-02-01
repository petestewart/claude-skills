---
name: problem-statement
description: Create a structured problem statement document for a feature, bugfix, or project. Use when starting a project, adding a feature, or fixing a bug and you need to clearly define the problem, context, desired outcome, and success criteria. Accepts input from Jira tickets (via MCP), document links, or text descriptions.
---

# Problem Statement

Create a `PROBLEM.md` document that clearly defines what problem is being solved and what success looks like.

## Workflow

### 1. Gather Input

Ask the user for one of:
- **Jira ticket**: Use the Atlassian MCP tools to fetch ticket details (`mcp__plugin_atlassian_atlassian__getJiraIssue`)
- **Document link**: Fetch and extract relevant context
- **Text description**: User provides details directly

If input is sparse, ask clarifying questions:
- Who is affected by this problem?
- What's the current behavior vs expected behavior?
- Why does this matter now?

### 2. Generate PROBLEM.md

Create the document at project root using this structure:

```markdown
# Problem Statement: [Concise Title]

## Problem
What's broken or missing? Who is affected? Be specific.

## Context
Background information. Current state. Why this matters now.
Include relevant technical context if applicable.

## Desired Outcome
What does success look like? What should be true when this is done?
Describe the end state, not the solution.

## Success Criteria
Measurable or verifiable conditions that confirm the problem is solved.
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Out of Scope
What this work does NOT address. Helps prevent scope creep.
```

### 3. Open in Typora

After creating PROBLEM.md, open it for the user:

```bash
open -a Typora PROBLEM.md
```

### 4. Offer Next Steps

After opening the document, ask the user:

> "I've created PROBLEM.md. Would you like me to:
> 1. **Review for gaps** - Check for unclear areas, missing context, or weak success criteria
> 2. **Expand to PRD** - Run `/prd` to create a full Product Requirements Document
> 3. **Done** - Proceed with the problem statement as-is"

If review is requested:
- Check that the problem is clearly articulated (not solution-focused)
- Verify success criteria are measurable/verifiable
- Identify any ambiguous terms or assumptions
- Suggest improvements and offer to update the document
