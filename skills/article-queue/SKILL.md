---
name: article-queue
description: View the article topic queue and optionally select a topic to generate an article. Use when the user invokes "/article-queue" or asks "show my article queue", "what articles are queued", or "list article topics".
version: 1.0.0
---

# Article Queue - View and Manage Article Topics

This skill displays the article topic queue and offers to generate an article from any queued topic.

## Invocation

```
/article-queue
/article-queue -l
```

**Flags:**
- `-g` - Use global queue (default): `~/.claude/article-queue.md`
- `-l` - Use local/project queue: `.claude/article-queue.md`

## Queue Storage

**Two queue locations are supported:**
- **Global** (default): `~/.claude/article-queue.md` - shared across all projects
- **Local**: `.claude/article-queue.md` - project-specific queue

**Queue File Format:**
```markdown
# Article Queue

Topics queued for article generation.

## Topics

- [ ] How kubernetes networking works
- [ ] The history of Unix file permissions
- [x] WebSocket vs Server-Sent Events comparison (generated)
```

Items marked with `[x]` have already been generated.

## Execution Workflow

### Step 1: Determine Queue Location

1. Check for `-l` flag → use local queue (`.claude/article-queue.md`)
2. Check for `-g` flag or no flag → use global queue (`~/.claude/article-queue.md`)

### Step 2: Read Queue File

1. Use Read tool to check if the queue file exists (expand `~` to actual home path for global)
2. If it doesn't exist, inform the user the queue is empty and suggest using `/article-add`

### Step 3: Parse Queue Contents

Extract all topics from the file:
- `- [ ]` items are pending (not yet generated)
- `- [x]` items are completed (already generated)

### Step 4: Display Queue

Present the queue to the user in a clear format:

```
📋 **Article Queue**

**Pending topics:**
1. How kubernetes networking works
2. The history of Unix file permissions
3. Understanding TCP congestion control

**Previously generated:**
- WebSocket vs Server-Sent Events comparison

Use `/article <topic>` to generate any article, or select one below.
```

### Step 5: Offer Selection (if pending topics exist)

If there are pending topics, use **AskUserQuestion** to let the user pick one:

- Header: "Generate"
- Question: "Would you like to generate an article for one of these topics?"
- Options (dynamically built from pending topics, max 4):
  - First pending topic (Recommended)
  - Second pending topic (if exists)
  - Third pending topic (if exists)
  - "Not now" - Just viewing the queue

If there are more than 3 pending topics, show the first 3 and include "Not now" as the 4th option. The user can always invoke `/article` directly for other topics.

### Step 6: Handle Selection

**If user selects a topic:**
1. Mark the topic as in-progress in the queue (optional visual feedback)
2. Invoke the `/article` skill workflow for that topic
3. After article generation completes, update the queue:
   - Change `- [ ] topic` to `- [x] topic (generated)`

**If user selects "Not now":**
- Thank them and remind they can use `/article-add` to add more topics or `/article <topic>` anytime

## Example Interactions

### Empty Queue
```
User: /article-queue

Claude: Your global article queue is empty.

Use `/article-add <topic>` to add topics you'd like to write articles about later.

User: /article-queue -l

Claude: Your local article queue is empty.

Use `/article-add -l <topic>` to add project-specific topics.
```

### Queue with Topics
```
User: /article-queue

Claude: 📋 **Article Queue**

**Pending topics:**
1. How kubernetes networking works
2. The history of Unix file permissions
3. Understanding TCP congestion control

Use `/article <topic>` to generate any article, or select one below.

[AskUserQuestion: Would you like to generate an article for one of these topics?]
- How kubernetes networking works (Recommended)
- The history of Unix file permissions
- Understanding TCP congestion control
- Not now

User: [Selects "How kubernetes networking works"]

Claude: [Proceeds with /article workflow for "How kubernetes networking works"]
        [After completion, marks topic as generated in queue]
```

## Queue Management

### Clearing Completed Items

If the user asks to clear completed items, edit the queue file to remove all `- [x]` lines.

### Removing a Pending Item

If the user asks to remove a specific pending item, edit the queue file to remove that line.

## Error Handling

- If queue file doesn't exist: Report empty queue, suggest `/article-add`
- If queue file is malformed: Attempt to parse what's there, report any issues
- If all topics are already generated: Report this and suggest adding new topics

## Related Skills

- `/article` - Generate an HTML article on a topic
- `/article-add` - Add a new topic to the queue
