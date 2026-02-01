# Task: Create /specs Skill for Claude Code

Create a new skill called `/specs` that follows `/prd` in the document generation workflow. This skill transforms PRD.md and PROBLEM.md into detailed technical specifications.

## Installation Locations

- **Skill directory**: `~/.claude/skills/specs/`
- **Source copy**: `/Users/petestewart/Projects/claude-skills/skills/specs/`
- **Update install.sh**: `/Users/petestewart/Projects/claude-skills/install.sh` (add "specs" to SKILLS array and add usage line)

## Skill File Structure

A skill is a directory containing a single `SKILL.md` file with:
1. YAML frontmatter with `name` and `description` fields
2. Markdown body with workflow instructions

No other files needed for this skill.

## /specs Workflow Requirements

### Phase 1: Create specs/README.md (Overview Spec)

1. Check for PRD.md and PROBLEM.md in project root
   - If PRD.md missing: offer to run `/prd` first or proceed without
   - If PROBLEM.md missing: note it but continue (PRD should have problem summary)

2. Read both files and synthesize into specs/README.md containing:
   - High-level technical specification
   - Architecture overview
   - Component breakdown (what spec files will be needed)
   - Links to individual spec files (placeholders initially)

3. Ask clarifying questions as needed before generating:
   - Technical constraints not in PRD?
   - Preferred patterns or technologies?
   - Any areas needing more detail?

4. Open specs/README.md in Typora: `open -a Typora specs/README.md`

5. Allow dialogue to refine, or user can edit directly

### Phase 2: Review README against PRD

1. Spawn an Explore subagent to review specs/README.md against PRD.md:
   - Does the spec address all PRD requirements?
   - Are there gaps or contradictions?
   - Are there assumptions that should be explicit?

2. Present findings with structured output (🔴 Critical, 🟡 Missing, 🟢 Confirmed)

3. Ask user which document should be updated (specs/README.md or PRD.md)

4. Make requested updates

### Phase 3: Create Individual Spec Files

1. Based on specs/README.md component breakdown, create individual spec files:
   - `specs/api.md` - API contracts, endpoints, request/response shapes
   - `specs/data-model.md` - Database schema, data structures
   - `specs/ui.md` - UI components, states, interactions
   - `specs/[component].md` - Other components as needed

2. Each spec file should be detailed enough for implementation

3. Update specs/README.md to link to created spec files

4. Open each file in Typora as created

### Phase 4: Review Spec Files against README

1. Spawn Explore subagent to review individual spec files against specs/README.md:
   - Do spec files cover everything in README?
   - Are there inconsistencies between spec files?
   - Are there implementation details that contradict each other?

2. Present findings

3. Ask user which files should be updated

4. Make requested updates

### Final Step

Offer next actions:
> "Specifications complete. Would you like me to:
> 1. **Review all specs** - Final consistency check across all documents
> 2. **Done** - Proceed with specifications as-is"

## Key Patterns to Follow

### Subagent Usage
Use `subagent_type: "Explore"` for all review steps to preserve main conversation context. Example prompt structure:

```
Prompt: "Review [file] against [reference]. Check:
- [specific check 1]
- [specific check 2]
...
Return structured findings: 🔴 Critical gaps, 🟡 Missing details, 🟢 Confirmed details."
```

### User Choice Pattern
After reviews, always ask user which document to update rather than assuming.

### Typora Integration
Open files in Typora after creation: `open -a Typora [file]`

## Reference: Existing Skills

### /problem-statement SKILL.md

```markdown
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
```

### /prd SKILL.md

```markdown
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
```

## Skill Writing Guidelines

1. **Frontmatter description is critical** - This is how Claude decides when to use the skill. Include trigger phrases like "/specs", "create specs", "technical specifications", etc.

2. **Keep SKILL.md concise** - Under 150 lines. Claude is smart; only include non-obvious procedural knowledge.

3. **Use imperative form** - "Create file", "Ask user", "Spawn subagent"

4. **Workflow should flow linearly** - Numbered steps, clear progression

5. **Always offer user choice** - Don't assume; present options after each phase

## Deliverables

1. Create `~/.claude/skills/specs/SKILL.md`
2. Copy to `/Users/petestewart/Projects/claude-skills/skills/specs/SKILL.md`
3. Update `/Users/petestewart/Projects/claude-skills/install.sh`:
   - Add "specs" to SKILLS array
   - Add usage line: `echo "  /specs                     - Create technical specifications from PRD.md"`
4. Update /prd skill to offer "/specs" as next step (similar to how /problem-statement offers /prd)

---

Create the /specs skill following these requirements. Start by writing the SKILL.md content, then install it to both locations and update install.sh.
