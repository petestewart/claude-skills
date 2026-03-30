---
name: standup
description: Generate a standup update from GitHub and Jira activity. Use when the user says "/standup", "standup update", "what did I work on", or needs to summarize recent work for a standup.
argument-hint: [yesterday|today|YYYY-MM-DD]
---

# Standup

Generate a standup update by gathering GitHub PR activity and Jira ticket activity from the relevant time period, then formatting it as a concise bulleted list.

## Arguments

- No argument or `yesterday`: Activity from yesterday and this morning (default — covers a typical standup window)
- `today`: Activity from today only
- A specific date like `2026-03-25`: Activity from that date forward

## Workflow

### Step 1: Determine the date range

Calculate the start date based on the argument. Default is yesterday's date. Use the current date from context.

### Step 2: Gather GitHub activity (run these in parallel)

**2a. Merged PRs:**
```bash
gh pr list --author @me --state merged --limit 20 --json title,mergedAt,url,number,headRefName \
  --jq '.[] | select(.mergedAt >= "YYYY-MM-DDT00:00:00Z")'
```

**2b. PRs the user commented on or reviewed (excluding own PRs):**
```bash
gh api "search/issues?q=commenter:@me+updated:>=YYYY-MM-DD+is:pr&per_page=30" \
  --jq '.items[] | {title, html_url, updated_at, state}'
```

Then for each PR found that is NOT authored by the user, fetch the user's review comments:
```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --jq '.[] | select(.user.login=="USERNAME") | {created_at, body: .body[:200]}'
```

**IMPORTANT:** Do NOT include PRs that were closed without merging. Only include merged PRs.

### Step 3: Gather Jira activity

Use the Atlassian MCP tools with cloud ID `3310222b-5c17-46fe-8d06-b7dfb2e214da`.

**3a. Tickets assigned to the user that were updated:**
```
JQL: assignee = currentUser() AND updated >= "YYYY-MM-DD" ORDER BY updated DESC
Fields: summary, status, issuetype, updated, comment
```

**3b. Tickets the user commented on (not assigned to them):**
```
JQL: comment ~ currentUser() AND updated >= "YYYY-MM-DD" AND assignee != currentUser() ORDER BY updated DESC
```

For each ticket, check for recent comments by the user to understand what work was done.

### Step 4: Categorize activity

**IMPORTANT:** Always use the Jira ticket status as the source of truth for categorization. Never infer a ticket is "In Progress" from the local git branch or working directory — the current branch may be a leftover from already-merged work. If a ticket's Jira status is Done/Resolved but it has no merged PR in the date window, look up the PR explicitly (e.g., `gh pr list --search "TICKET-123" --state merged`) before categorizing.

Sort everything into these categories (omit any category with no items):

1. **Merged** — PRs that were merged during the period. Extract ticket number from branch name (pattern `([A-Z]+-\d+)`) and use it as a prefix with the Jira summary if available.
2. **Investigated** — Tickets the user worked on that involve investigation, debugging, or analysis (Discovery type, or Bug tickets in progress). Mention who the user communicated with if there were comment exchanges.
3. **Reviewed** — PRs authored by others that the user reviewed or commented on. Reference as `PR #NUMBER: title`.
4. **Filed** — New tickets the user created during the period.
5. **In Progress** — Tickets actively being worked on (Jira status = In Progress, In Review, Code Review, etc.) that had meaningful updates. Only use Jira status to determine this — never the local git branch.
6. **Followed up on** — Tickets where the user left a comment but the ticket is Done/Resolved (closing the loop, confirming fixes, etc.). Format as inline text, not sub-bullets.

### Step 5: Format the output

Use this exact format:

```
• Merged:
    ◦ TICKET-123: Brief description from Jira summary
    ◦ TICKET-456: Brief description from Jira summary
• Investigated:
    ◦ TICKET-789: Brief description — communicated with [names], [short context]
• Reviewed:
    ◦ PR #1234: PR title
• Filed:
    ◦ TICKET-101: Brief description
• Followed up on TICKET-202 (brief context) — confirmed resolved with [name]
```

## Formatting Rules

- Use `•` for top-level bullets and `◦` for sub-bullets (4-space indent)
- Keep descriptions concise — one line each
- For ticket references, use the Jira ticket key and summary
- When mentioning collaboration on tickets, use "communicated with [name]" — never "back and forth"
- Do NOT mention PRs that were closed without merging
- Do NOT include overly verbose descriptions — this is a standup, not a report
- "Followed up on" items with a single ticket can be a single bullet with inline context (no sub-list needed)
- Omit empty categories entirely
- If a merged PR's branch contains a ticket number, always use the ticket number + Jira summary as the description rather than the PR title

## Final Step: Copy to clipboard

After displaying the standup update, copy the formatted text to the clipboard. Use `printf '%s' "..." | pbcopy` to avoid a trailing newline, and ensure no leading/trailing whitespace is included in the string — strip it before piping.

```bash
printf '%s' "the formatted standup text with no leading/trailing whitespace" | pbcopy
```

Confirm to the user that it has been copied.
