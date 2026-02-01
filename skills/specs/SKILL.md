---
name: specs
description: Create technical specifications from PRD.md and PROBLEM.md. Use when the user has a PRD and wants detailed technical specs for implementation. Also use when the user says "/specs", "create specs", "technical specifications", or "spec it out".
---

# Technical Specifications

Transform PRD.md into detailed technical specifications in a `specs/` directory.

## Workflow

### 1. Check Prerequisites

Look for `PRD.md` and `PROBLEM.md` in project root.

**If PRD.md missing**: Ask:
> "No PRD.md found. Would you like me to:
> 1. **Create one first** - Run `/prd` to define requirements
> 2. **Proceed without it** - I'll ask you to describe requirements directly"

**If PROBLEM.md missing**: Note it but continue (PRD should have problem context).

### 2. Gather Technical Context

Ask clarifying questions:
- Technical constraints not captured in PRD?
- Preferred patterns, frameworks, or technologies?
- Any areas needing deeper specification?

### 3. Generate specs/README.md

Create `specs/README.md` as the overview specification:

```markdown
# Technical Specification: [Title]

## Overview
High-level technical summary of the solution.

## Architecture
System architecture overview. Diagrams if helpful.

## Components
List of components that need detailed specs:
- [Component 1](./component-1.md) - Brief description
- [Component 2](./component-2.md) - Brief description

## Technical Decisions
Key technical choices and rationale.

## Constraints
Technical limitations, compatibility requirements, performance targets.

---
*Generated from PRD.md on [date]*
```

Open in Typora: `open -a Typora specs/README.md`

### 4. Review README against PRD

Spawn Explore subagent:
```
Prompt: "Review specs/README.md against PRD.md. Check:
- Does spec address all PRD requirements?
- Are there gaps or contradictions?
- Are assumptions explicit?

Return: 🔴 Critical gaps, 🟡 Missing details, 🟢 Confirmed coverage."
```

Present findings. Ask user which document to update (specs/README.md or PRD.md). Make requested updates.

### 5. Create Component Specs

Based on specs/README.md, create individual spec files as needed:
- `specs/api.md` - Endpoints, request/response shapes, authentication
- `specs/data-model.md` - Database schema, data structures, relationships
- `specs/ui.md` - Components, states, interactions, wireframes
- `specs/[component].md` - Other components identified

Each spec should be implementation-ready. Open each in Typora after creation.

Update specs/README.md links to point to created files.

### 6. Review Spec Files

Spawn Explore subagent:
```
Prompt: "Review all files in specs/ directory. Check:
- Do spec files cover everything in README?
- Are there inconsistencies between files?
- Do implementation details conflict?

Return: 🔴 Critical issues, 🟡 Inconsistencies, 🟢 Aligned details."
```

Present findings. Ask user which files to update. Make requested updates.

### 7. Next Steps

> "Specifications complete. Would you like me to:
>
> 1. **Create implementation plan** - Run `/plan` to create PLAN.md with tasks
> 2. **Final review** - Consistency check across all documents
> 3. **Done** - Proceed with specifications as-is"
