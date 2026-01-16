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
```

Examples:
- `/article-add how kubernetes networking works`
- `/article-add the history of Unix file permissions`
- `/article-add WebSocket vs Server-Sent Events comparison`

## Queue Storage

The queue is stored in `.claude/article-queue.md` in the project root.

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

### Step 1: Parse the Topic

Extract the topic from the user's input. The topic is everything after `/article-add `.

If no topic is provided, respond with a brief error: "No topic provided. Usage: `/article-add <topic>`"

### Step 2: Read or Create Queue File

1. Check if `.claude/article-queue.md` exists using Read tool
2. If it doesn't exist, create it with the initial template:

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
```

## Error Handling

- If the `.claude/` directory doesn't exist, create it
- If the topic is empty after parsing, prompt for input
- If writing fails, report the error clearly

## Related Skills

- `/article` - Generate an HTML article on a topic
- `/article-queue` - View queue and select a topic to generate
