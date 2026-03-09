---
name: prd
description: Expand a problem description into a Product Requirements Document (PRD). Use when the user says "/prd", "create a PRD", "expand to PRD", or "product requirements document". Accepts an inline description, a file path, or reads from PROBLEM.md. Example: "/prd add role-based access control to the admin panel".
---

# PRD (Product Requirements Document)

Expand a problem description into a comprehensive PRD that bridges problem definition with implementation planning. Works from whatever context is available — an inline description, a referenced file, PROBLEM.md, or any combination.

## Workflow

### 1. Gather Context

Determine the input sources. Multiple sources can be combined.

**A) User-provided description**: Check if the user provided arguments with the command (e.g., `/prd add role-based access control`). If so, this is the primary problem description.

**B) Referenced file**: If the user points to a specific file (e.g., `/prd from notes.md`), read that file as the problem description.

**C) PROBLEM.md**: Look for `PROBLEM.md` in the project root. If found, read it as supplementary context.

**If no description, no file, AND no PROBLEM.md exists**: Ask the user to describe the problem. Do not suggest running other skills — just ask directly:
> "What problem are you trying to solve? Describe it and I'll create a PRD."

### 2. Gather Scope Information (interactive only)

**If running interactively**, ask:
> "What systems or repositories does this work touch?"

Also ask if not already clear from context:
- Are there existing patterns or approaches we should follow?
- Any hard constraints (timeline, technology, dependencies)?

**If running headless**, infer scope from the description and codebase exploration. Do not prompt.

### 3. Generate PRD.md

Create `PRD.md` at project root using this structure:

```markdown
# PRD: [Title]

## Problem Statement

[Summarize the problem — from PROBLEM.md, the user's description, or the referenced file]

## Proposed Solution

### Technical Approach
High-level description of how to solve this. Focus on the "what" and "why", not implementation details.

### Key Design Decisions
Important choices and their rationale. Include alternatives considered if relevant.

## Scope

### Affected Systems
- System/repo 1: What changes here
- System/repo 2: What changes here

### Dependencies
External systems, services, or teams this work depends on.

### Out of Scope
What this work intentionally does not cover.

## Risks & Open Questions

### Risks
- Risk 1: Description and mitigation
- Risk 2: Description and mitigation

### Open Questions
- [ ] Question that needs answering before/during implementation
- [ ] Another unresolved question

## Success Criteria

How we know this work is done and successful.

---
*Generated on [date]*
```

Open in Typora: `open -a Typora PRD.md`

### 4. Offer Review (interactive only)

**If running interactively**, ask:
> "I've created PRD.md. Would you like me to:
> 1. **Review for gaps** - Check for missing technical details, unclear scope, or unaddressed risks
> 2. **Done** - Proceed with the PRD as-is"

If review requested, spawn a subagent using the Task tool with `subagent_type: "Explore"` to analyze the codebase and validate the PRD:

```
Prompt: "Review PRD.md against the actual codebase. Check:
- Does the technical approach align with existing patterns?
- Are affected systems complete? Search for implicit dependencies.
- Are there existing implementations we should reference or follow?
- Are there vague areas that could cause scope creep?
- Are risks adequately identified?

Return structured findings: 🔴 Critical gaps, 🟡 Missing details, 🟢 Confirmed details."
```

Present findings. Ask user what to update. Make requested changes.

**If running headless**, skip the review prompt and proceed directly.

### 5. Next Steps (interactive only)

**If running interactively**, ask:
> "PRD is ready. Would you like me to:
> 1. **Create technical specs** - Run `/specs` to create detailed specifications
> 2. **Done** - Proceed with the PRD as-is"

**If running headless**, stop after creating PRD.md.
