---
description: Read a spec file and conduct an in-depth interview to refine requirements, covering technical implementation, UI/UX, concerns, and tradeoffs. Writes refined spec back to the file.
argument-hint: [spec-file-path]
---

# planterview

Conduct a comprehensive, in-depth interview based on a specification document to surface hidden assumptions, clarify requirements, and identify potential issues before implementation begins.

## Instructions

### Step 1: Load the Spec File

**Determine the spec file path:**
- If an argument is provided (`$1`), use that as the spec file path
- If no argument is provided, default to `SPEC.md` in the current working directory

**Read the spec file:**
- Use the Read tool to load the entire contents of the spec file
- If the file doesn't exist, inform the user and ask if they'd like to create a new spec from scratch

### Step 2: Analyze the Spec

Before beginning the interview, thoroughly analyze the spec to identify:
- Stated requirements and goals
- Implicit assumptions that need validation
- Gaps in technical detail
- Potential architectural decisions not yet made
- UI/UX considerations that may be underspecified
- Edge cases and error scenarios not addressed
- Integration points and dependencies
- Security, performance, and scalability implications
- Areas of ambiguity or contradiction

### Step 3: Conduct the Interview

Use the AskUserQuestion tool to interview the user. Follow these principles:

**Question Quality Guidelines:**
- Ask **non-obvious** questions - don't ask things clearly answered in the spec
- Probe **second-order effects** - "If X, then what happens to Y?"
- Challenge **implicit assumptions** - "The spec assumes X, but what if...?"
- Explore **edge cases** - "What should happen when...?"
- Surface **tradeoffs** - "We could do A (faster but less flexible) or B (slower but more extensible). Which aligns better with your priorities?"
- Dig into **failure modes** - "How should the system behave when X fails?"
- Question **scope boundaries** - "Is X in scope? What about Y which seems related?"

**Topic Categories to Cover:**

1. **Technical Implementation**
   - Architecture decisions and rationale
   - Data models and storage strategies
   - API design and contracts
   - Error handling approaches
   - Performance requirements and bottlenecks
   - Technology stack justifications
   - Integration patterns

2. **UI & UX**
   - User flows and journeys
   - Interaction patterns
   - Feedback and loading states
   - Accessibility requirements
   - Responsive behavior
   - Empty states and first-run experience
   - Error presentation to users

3. **Concerns & Risks**
   - Security considerations
   - Privacy implications
   - Compliance requirements
   - Scalability limits
   - Maintenance burden
   - Technical debt tradeoffs
   - Dependency risks

4. **Tradeoffs & Priorities**
   - Speed vs. quality
   - Simplicity vs. flexibility
   - Build vs. buy
   - MVP scope vs. full vision
   - Consistency vs. innovation

**Interview Process:**

1. Start with high-impact questions that could significantly affect the design
2. Group related questions together (up to 4 per AskUserQuestion call)
3. Use follow-up questions to dig deeper based on answers
4. Document insights and decisions as you go
5. Continue until all major ambiguities are resolved

**IMPORTANT:** Do not ask questions that are:
- Already clearly answered in the spec
- Trivially obvious from context
- Yes/no questions when deeper exploration is needed
- Multiple questions disguised as one

### Step 4: Synthesize and Update the Spec

After the interview is complete:

1. Summarize key decisions and clarifications discovered
2. Update the spec file with:
   - Resolved ambiguities
   - New requirements discovered
   - Clarified edge cases
   - Documented tradeoffs and their rationale
   - Technical decisions with context
3. Add a "Decisions Log" section if one doesn't exist, documenting the interview outcomes
4. Write the updated spec to the same file path

### Step 5: Present the Final Spec

1. Show the user the updated spec
2. Highlight the major changes and additions
3. Ask if any final refinements are needed

## Interview Completion Criteria

The interview is complete when:
- All major architectural questions are answered
- Edge cases have been considered and documented
- Tradeoffs have been explicitly decided
- The spec is detailed enough for implementation to begin
- The user confirms they have no more to add

## Output

The command produces:
- An updated spec file at the original path with all clarifications incorporated
- A "Decisions Log" section documenting key choices made during the interview

## Example Interview Questions

These are examples of the **depth** expected, not a checklist:

- "The spec mentions real-time updates but doesn't specify latency requirements. What's the maximum acceptable delay before the UX feels broken?"
- "You've described the happy path for user registration. What happens if they close the browser mid-flow? Should we save partial progress?"
- "The data model shows a one-to-many relationship between X and Y. Have you considered scenarios where this might need to become many-to-many?"
- "Authentication is mentioned but not detailed. Are you envisioning session-based auth, JWTs, or delegating to an external provider? Each has different implications for the architecture."
- "The error handling section is light. When the external API fails, should we show degraded functionality, a full error state, or silently retry?"
