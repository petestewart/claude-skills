---
name: article-add
description: Add a topic to the article queue for later generation. Use when the user invokes "/article-add <topic>" or says "add to article queue", "queue up an article about", or "save this topic for an article later".
version: 1.0.0
---

# Article Add - Add Topics to Article Queue

This skill adds topics to a queue for later article generation using the `/article` skill.

## Invocation

```
/article-add <topic>
/article-add -l <topic>
```

**Flags:**
- `-g` - Use global queue (default): `~/.claude/article-queue.md`
- `-l` - Use local/project queue: `.claude/article-queue.md`

Examples:
- `/article-add how kubernetes networking works` - adds to global queue
- `/article-add -l project-specific notes` - adds to local project queue
- `/article-add the history of Unix file permissions`

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
- [ ] WebSocket vs Server-Sent Events comparison
```

## Execution Workflow

### Step 1: Parse Input and Flags

1. Check for `-l` flag → use local queue (`.claude/article-queue.md`)
2. Check for `-g` flag or no flag → use global queue (`~/.claude/article-queue.md`)
3. Extract the topic (everything after the command and flags)

If no topic is provided, respond with a brief error: "No topic provided. Usage: `/article-add <topic>`"

### Step 2: Read or Create Queue File

1. Determine queue path based on flag (global is default)
2. Check if the queue file exists using Read tool (expand `~` to actual home path for global)
3. If it doesn't exist, create it with the initial template:

```markdown
# Article Queue

Topics queued for article generation.

## Topics

```

### Step 3: Add Topic to Queue

1. Read the current queue file
2. Add a new unchecked item `- [ ] <topic>` under the `## Topics` section
3. Write the updated file

### Step 4: Confirm to User

**Keep confirmation minimal.** Report only:
- The topic that was added
- The current queue count

**Do NOT:**
- Ask follow-up questions
- Suggest generating the article now
- Prompt for any additional input

## Example Interaction

```
User: /article-add understanding TCP congestion control

Claude: Added "understanding TCP congestion control" to queue (3 topics).

User: /article-add -l project architecture overview

Claude: Added "project architecture overview" to local queue (1 topic).
```

## Error Handling

- If queue directory doesn't exist (`~/.claude/` or `.claude/`), create it
- If the topic is empty after parsing, report error with usage
- If writing fails, report the error clearly

## Related Skills

- `/article` - Generate an HTML article on a topic
- `/article-queue` - View queue and select a topic to generate
