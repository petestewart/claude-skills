---
description: Analyze a GitHub PR and provide a high-level explanation with suggested file review order
allowed-tools: Bash(gh pr:*), Bash(git fetch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*)
argument-hint: <pr-number>
---

# review-pr

Analyze GitHub pull request $1 and provide:

1. A high-level explanation of what the PR does
2. The main changes and their purpose
3. A suggested order to review the files to understand the flow

## Instructions

1. Use `gh pr view $1 --json title,body,files` to fetch PR details
2. Use `git fetch origin pull/$1/head:pr-$1` to fetch the PR branch
3. Use `git log origin/main..pr-$1` to see commits
4. Use `git diff --name-only origin/main...pr-$1` to list changed files
5. Examine key files to understand the flow (API specs, controllers, components)
6. Provide a concise summary organized as:
   - **High-level explanation**: What does this PR accomplish?
   - **Key changes**: What are the main modifications?
   - **Suggested review order**: Group files logically (e.g., shared/API contracts → backend → frontend)

## Output Format

Present the review order with numbered sections and file paths, grouping related files together. Include brief annotations explaining what each file/group does.

Example structure:
```
## High-Level Explanation
Brief description of PR purpose

## Suggested File Review Order

### 1️⃣ API Contracts (Shared)
1. path/to/api/spec.ts - What it defines
2. path/to/another/spec.ts - What it defines

### 2️⃣ Backend Implementation
3. path/to/controller.ts - What it does
4. path/to/service.ts - What it does

### 3️⃣ Frontend Components
5. path/to/component.tsx - What it does
```

Focus on creating a logical learning path through the changes, not just listing files alphabetically.
