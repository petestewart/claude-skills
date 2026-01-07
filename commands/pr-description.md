# Generate PR Description

Generate a GitHub pull request description using Jira ticket information and git changes.

## Instructions

When this command is invoked:

1. **Extract the Jira ticket number from the current git branch**:
   - Run `git branch --show-current` to get the branch name
   - Extract the ticket number using the pattern `([A-Z]+-\d+)` (e.g., IN-257, TXT-1234)
   - If no ticket number is found, ask the user to provide it

2. **Fetch the Jira ticket details**:
   - Use the Jira MCP `getIssue` tool to retrieve ticket details using the extracted ticket number
   - If the Jira MCP fails or is not available, continue with just the git changes

3. **Analyze the git changes**:
   - Run `git diff main...HEAD --stat` to see which files changed
   - Run `git diff main...HEAD` to understand what was modified
   - Focus on understanding what was added/changed at a high level

4. **Generate the PR description** using this exact template format:

```
## Description

[Concise bullet points describing what changed or was added]

## References

[Links from Jira ticket or inferred from changes - e.g., Figma, RFCs, specs]

## QA

[Setup steps like `pnpm install`, `pnpm db:reset` if needed]
[UAT steps - what to test, expected behavior]

## Jira Task(s)

[TICKET-NUMBER](https://trunktools.atlassian.net/browse/TICKET-NUMBER)
```

## Guidelines for content:

**Description section**:
- Use concise one-sentence bullet points
- Focus on WHAT was added/changed, not HOW it was implemented
- Avoid verbose paragraphs and technical implementation details
- Group related changes together
- Use present tense (e.g., "Adds feature X" not "Added feature X")

**References section**:
- Include links from the Jira ticket (Figma designs, RFCs, specs, documentation)
- Infer relevant references from the changes if possible
- Omit this section if there are no references

**QA section**:
- Extract QA/acceptance criteria steps from the Jira ticket
- Add setup steps if dependencies or database changes are detected (e.g., `pnpm install`, `pnpm db:reset`)
- If tests were added, mention running them
- Provide clear UAT steps describing what to test and expected behavior

**Jira Task(s) section**:
- Always include the link to the Jira ticket using the format: `[TICKET-NUMBER](https://trunktools.atlassian.net/browse/TICKET-NUMBER)`

5. **Output the formatted PR description** that can be directly copied and pasted into GitHub

Remember:
- Keep descriptions high-level and user-focused
- Prefer bullet points over paragraphs
- Be concise but complete
- Make the description immediately useful to reviewers
