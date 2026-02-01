---
name: prd
description: Expand a problem statement into a Product Requirements Document (PRD). Use when the user has a PROBLEM.md and wants to create a fuller PRD.md with technical approach, dependencies, affected systems, and open questions. Also use when the user says "/prd", "create a PRD", "expand to PRD", or "product requirements document".
---

# PRD (Product Requirements Document)

Expand a problem statement into a comprehensive PRD that bridges problem definition with implementation planning.

## Workflow

### 1. Check for PROBLEM.md

Look for `PROBLEM.md` in the project root.

**If found**: Read it and use as the foundation for the PRD.

**If not found**: Ask the user:
> "No PROBLEM.md found. Would you like me to:
> 1. **Create one first** - Run `/problem-statement` to define the problem clearly
> 2. **Proceed without it** - I'll ask you to describe the problem directly"

If proceeding without PROBLEM.md, gather:
- What problem are we solving?
- Who is affected?
- What does success look like?

### 2. Gather Scope Information

Ask the user:
> "What systems or repositories does this work touch?"

Also ask if not already clear from context:
- Are there existing patterns or approaches we should follow?
- Who are the stakeholders or reviewers?
- Any hard constraints (timeline, technology, dependencies)?

### 3. Generate PRD.md

Create `PRD.md` at project root using this structure:

```markdown
# PRD: [Title from Problem Statement]

## Problem Statement

[Copy or summarize from PROBLEM.md - Problem, Context, Desired Outcome, Success Criteria]

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
[Carry forward from PROBLEM.md, expand if needed]

## Risks & Open Questions

### Risks
- Risk 1: Description and mitigation
- Risk 2: Description and mitigation

### Open Questions
- [ ] Question that needs answering before/during implementation
- [ ] Another unresolved question

## Success Criteria

[Carry forward from PROBLEM.md]

---
*Generated from PROBLEM.md on [date]*
```

### 4. Open in Typora

```bash
open -a Typora PRD.md
```

### 5. Offer Review

After opening:
> "I've created PRD.md. Would you like me to:
> 1. **Review for gaps** - Check for missing technical details, unclear scope, or unaddressed risks
> 2. **Done** - Proceed with the PRD as-is"

If review requested, spawn a subagent using the Task tool with `subagent_type: "Explore"` to analyze the codebase and validate the PRD:

```
Prompt: "Review PRD.md against the actual codebase. Check:
- Does the technical approach align with existing patterns?
- Are affected systems complete? Search for implicit dependencies.
- Do the APIs/endpoints mentioned actually exist? Verify response shapes.
- Are there existing implementations we should reference or follow?
- Are there vague areas that could cause scope creep?
- Are risks adequately identified?

Return structured findings: 🔴 Critical gaps, 🟡 Missing details, 🟢 Confirmed details."
```

After the subagent returns, present findings and offer options:
1. Update PRD with findings
2. Leave as-is for discussion

If user requests updates and needs clarification (e.g., exploring existing patterns), spawn additional Explore agents as needed.

### 6. Offer Next Steps

After review is complete (or if user chose "Done"):

> "PRD is ready. Would you like me to:
>
> 1. **Create technical specs** - Run `/specs` to create detailed specifications
> 2. **Done** - Proceed with the PRD as-is"
