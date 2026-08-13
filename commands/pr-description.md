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

[High-level summary of what this PR does and why — not a list of code-level changes or tests]

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
- Give a high-level summary of the change and its purpose — what problem it solves or what capability it adds
- Format: at most 1-2 short lead-in sentences, then a bulleted outline. Prefer bullets over paragraphs everywhere; one idea per bullet; nest sub-bullets rather than writing long bullets
- NEVER use em dashes (—) anywhere in the description; use commas, colons, or separate sentences instead
- Stay at the level a reviewer or stakeholder would care about; do not enumerate code-level details from the diff
- Do not list files, classes, functions, or implementation specifics
- Do not list tests added as part of the feature or bug fix — tests are an implementation detail, not part of the high-level description
- Avoid long lists that mirror the diff
- Use present tense (e.g., "Adds feature X" not "Added feature X")

**References section**:
- Include links from the Jira ticket (Figma designs, RFCs, specs, documentation)
- Infer relevant references from the changes if possible
- Omit this section if there are no references

**QA section**:
- Extract QA/acceptance criteria steps from the Jira ticket
- Add setup steps if dependencies or database changes are detected (e.g., `pnpm install`, `pnpm db:reset`)
- Provide clear UAT steps describing what to test and expected behavior
- Do not mention running tests that were added as part of this PR

**Jira Task(s) section**:
- Always include the link to the Jira ticket using the format: `[TICKET-NUMBER](https://trunktools.atlassian.net/browse/TICKET-NUMBER)`

5. **Generate the PR title**:
   - The PR title MUST start with the Jira ticket number (e.g., `IN-814 Add per-resource-type Flipt flags`)
   - Format: `TICKET-NUMBER <Jira ticket summary>` — use the ticket's summary VERBATIM so the PR and ticket names match. Only deviate if the ticket summary is genuinely misleading about what the PR does, and flag the mismatch to the user instead of silently diverging
   - Keep the title under 70 characters when possible

6. **Output the formatted PR description** that can be directly copied and pasted into GitHub

## Backtick handling (critical)

When the description contains backticks (inline code like `` `pnpm install` `` or fenced code blocks with triple backticks), they MUST be written as literal backticks — never escaped with backslashes.

**When upserting the description to GitHub via `gh pr create` or `gh pr edit`:**
- Always use `--body-file <path>` with a temp file (e.g. `/tmp/pr-body.md`)
- Never use `--body "$(cat <<'EOF' ... EOF)"` or any inline body argument — backticks in inline shell arguments get interpreted as command substitution or end up escaped with backslashes, which breaks code block rendering on GitHub
- Write the markdown file with raw backticks: `` ` `` (single), ```` ``` ```` (triple). Do not write `` \` `` or `` \`\`\` ``
- After upserting, the rendered PR description on GitHub should show clean code blocks with no visible backslashes

Example of correct file contents for a QA section:

````
## QA

Setup:

```
pnpm install
pnpm -C packages/txt-server prisma:generate
pnpm -C packages/txt-server migrate
```
````

Remember:
- Keep descriptions high-level and user-focused
- Prefer bullet points over paragraphs — quick to scan, one idea per bullet
- NEVER use em dashes (—) anywhere in the PR body; grep the final body for "—" before upserting
- Be concise but complete
- Make the description immediately useful to reviewers
- Never escape backticks — write them literally
