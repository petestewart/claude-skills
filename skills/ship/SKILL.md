---
name: ship
description: Create a GitHub PR with a generated title, description, and optional reviewer assignment. Use when the user says "/ship", "ship it", "create a PR", "open a PR", "ship this", or wants to push their branch and open a pull request. Handles the full workflow from branch push through PR creation. Optionally integrates with Jira (for ticket-linked titles) and Slack (for notifications) when available.
---

# Ship

Push the current branch, create a GitHub PR with a generated description, and optionally assign reviewers and notify via Slack.

## Workflow

### 1. Check for a ticket number

Run `git branch --show-current` and look for a ticket number using pattern `([A-Z]+-\d+)`.

- Example: `IN-626-migrate-webhooks-to-gateway` → `IN-626`
- The user may also provide a ticket number as an argument (e.g., `/ship IN-626`).
- **If no ticket found**: Skip Jira integration entirely. Do not prompt for a ticket number — proceed without one.

### 2. Determine PR title

**If a ticket number exists** and the Atlassian MCP tools are available: Fetch the Jira ticket using `getJiraIssue` and use `TICKET: Jira summary` as the title (e.g., `IN-626: Migrate webhooks to gateway`).

**Otherwise**: Derive a clear, concise title from the branch name and `git diff main...HEAD --stat`. Format as a short imperative description of the change (e.g., `Migrate webhooks to gateway`). If a ticket number was found but Jira isn't available, prefix it: `IN-626: Migrate webhooks to gateway`.

### 3. Generate PR description

1. Run `git diff main...HEAD --stat` and `git diff main...HEAD` to analyze changes
2. Generate a description using this template:

```
## Description

[Concise bullet points of what changed — present tense, high-level, user-focused]

## References

[Links from Jira (Figma, RFCs, specs) if available. Omit section if none.]

## QA

[Setup steps if needed]
[What to test, expected behavior]

## Ticket

[TICKET](https://YOUR_DOMAIN.atlassian.net/browse/TICKET)
```

Guidelines:
- Present tense ("Adds X" not "Added X")
- Focus on WHAT changed, not HOW
- Bullet points over paragraphs
- Extract QA/acceptance criteria from the Jira ticket when available
- Omit the References section if no links are available
- Omit the Ticket section if no ticket number exists

### 4. Push branch and create PR

```bash
git push -u origin HEAD
```

Then create the PR targeting `main`:

```bash
gh pr create \
  --base main \
  --title "Title here" \
  --body "$(cat <<'EOF'
[generated description]
EOF
)"
```

If the user specifies reviewers (as arguments or in project configuration), add `--reviewer`. Otherwise omit it.

Capture the PR URL from the output.

### 5. Notify via Slack (optional)

**Only if the `/slack-notify` skill is installed** (check for `~/.claude/skills/slack-notify/`): Send a Slack notification with the PR link using that skill.

If `/slack-notify` is not installed, skip this step silently.
