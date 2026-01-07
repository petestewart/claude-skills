---
description: Analyze GitHub PR reviews and comments, assess validity, and propose solutions
allowed-tools: Bash(gh pr:*), Bash(gh api:*)
argument-hint: <pr-number>
---

# analyze-pr-feedback

Gather and analyze all reviews and comments for GitHub pull request $1. For each comment:
1. Explain what the comment is requesting or pointing out
2. Assess whether the comment is valid/actionable
3. Propose a solution or next steps if appropriate

## Instructions

1. Use `gh pr view $1 --json title,body,number,author,reviews,comments` to fetch PR details and review summaries
2. Use `gh api repos/{owner}/{repo}/pulls/$1/comments` to get detailed line-level review comments
3. Use `gh api repos/{owner}/{repo}/pulls/$1/reviews` to get full review details including body comments
4. Use `gh api repos/{owner}/{repo}/issues/$1/comments` to get general PR conversation comments

## Analysis Format

For each comment/review, provide:

### Comment Analysis

**Comment by @username** (in `file/path.ext:line_number` or "General comment")
```
[The actual comment text]
```

**Analysis:**
- **What they're asking for:** Clear explanation of the feedback
- **Validity assessment:** Whether this is a valid concern (Valid/Questionable/Invalid and why)
- **Recommended action:** Specific steps to address if valid, or explanation if not applicable

---

## Output Structure

Present the analysis in order of importance/impact:

```
# PR #$1 Feedback Analysis

## Summary
- Total comments: X
- Valid actionable items: Y
- Questions/Discussion: Z

## Critical Issues (if any)
[High priority items that block merge or cause bugs]

## Recommended Changes
[Valid suggestions for improvement]

## Questions & Discussion
[Items requiring clarification or discussion]

## Acknowledged/No Action Needed
[Comments already addressed or not requiring changes]
```

## Important Notes

- DO NOT make any code changes
- Focus on understanding intent and providing analysis
- Group similar comments together
- Distinguish between blocking issues vs. suggestions
- Be objective in validity assessments
- Consider context from the PR description and code changes
