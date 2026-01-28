---
name: review-as
description: Review a PR or branch using a specific reviewer's technical preferences. Use when the user says "/review-as <name> <pr-number-or-branch>", "review this as matt", "what would matt say about this PR", or needs code reviewed against a particular person's standards.
version: 1.0.0
---

# Review-As - Personalized Code Review Skill

Review PRs or branch changes using a specific reviewer's documented technical preferences and code standards.

## Usage

```
/review-as <reviewer> <target>
```

Where:
- `<reviewer>` - Name of reviewer (must have a file in `reviewers/` directory)
- `<target>` - One of:
  - PR number (e.g., `4698`)
  - PR URL (e.g., `https://github.com/Trunk-Tools/trunk-tools/pull/4698`)
  - Branch name (reviews diff against main/master)
  - `HEAD` or omitted (reviews current uncommitted changes)

## Examples

```
/review-as tt 4698
/review-as tt https://github.com/org/repo/pull/4698
/review-as tt feature-branch
/review-as tt HEAD
/review-as tt   # reviews current changes
```

## How It Works

### Step 1: Load Reviewer Preferences

Read the reviewer's preferences file from `skills/review-as/reviewers/<name>.md`.

If the reviewer file doesn't exist, inform the user and list available reviewers.

### Step 2: Fetch the Diff

Based on the target:

**For PR number or URL:**
```bash
gh pr diff <number> --repo <owner>/<repo>
```

**For branch name:**
```bash
git diff main...<branch>
# or
git diff master...<branch>
```

**For HEAD or current changes:**
```bash
git diff HEAD
```

Also fetch PR metadata if applicable:
```bash
gh pr view <number> --repo <owner>/<repo> --json title,body,files
```

### Step 3: Analyze Against Preferences

Review the diff against each category in the reviewer's preferences file:

1. Read through the entire diff
2. For each preference category, identify violations or concerns
3. Note specific files and line numbers where issues occur
4. Consider the reviewer's stated priorities and what they care most about

### Step 4: Generate Review

Output a structured review in this format:

```markdown
## Review as [Reviewer Name]

### Summary
[1-2 sentence overall assessment]

### Issues Found

#### [Category Name] (from preferences)

**[File Path]:[Line Number]**
- Issue: [What's wrong]
- Suggestion: [How to fix it]

[Continue for each issue...]

### Approved Patterns
[Note any code that follows the reviewer's preferred patterns well]

### Questions for Author
[Any clarifying questions the reviewer would likely ask]
```

## Reviewer File Format

Reviewer preferences are stored in `skills/review-as/reviewers/<name>.md`:

```markdown
# [Name]'s Code Review Preferences

## Overview
[Brief description of this reviewer's general philosophy]

## Priority Areas
[What this reviewer cares most about, in order]

## [Category 1]
### Prefers
- [Pattern they like]

### Flags
- [Pattern they would call out]

## [Category 2]
...
```

## Adding New Reviewers

To add a new reviewer:

1. Create `skills/review-as/reviewers/<name>.md`
2. Document their technical preferences by analyzing:
   - Their past PR reviews (comments they've left)
   - Their own merged code (patterns they use)
   - Any documented coding standards they follow

Focus on **technical patterns and preferences**, not verbal style.

## Available Reviewers

Check the `skills/review-as/reviewers/` directory for available reviewer profiles.
