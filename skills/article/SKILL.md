---
name: Article
description: This skill should be used when the user asks to "write an article", "create an article", "explain this topic", or invokes "/article <subject>". Generates self-contained HTML articles with inline SVG diagrams, proper structure, and polished styling. Handles plain text subjects, file paths (.md, .txt), and URLs as input.
version: 1.0.0
---

# Article - HTML Article Generator

This skill creates self-contained, educational HTML articles with inline SVG diagrams, proper structure, and polished styling that can be viewed offline in any browser.

## Invocation

```
/article <subject>
/article <subject> --oneshot
```

The subject can be:
- **Plain text**: `/article how to set up kubernetes`
- **File path**: `/article implementation_plan.md` - reads and explains the file content
- **URL**: `/article https://example.com/some-guide` - fetches and creates an article from the content

**Flags:**
- `--oneshot` - Skip clarifying questions and generate the article immediately using defaults

## Input Processing

### Step 1: Determine Input Type

1. **URL** - If input starts with `http://` or `https://`, use WebFetch to retrieve the content
2. **File path** - If input ends with common file extensions (`.md`, `.txt`, `.pdf`, etc.) or contains `/`, use Read tool to get the content
3. **Plain text** - Otherwise, treat as a topic/subject for original article creation

### Step 2: Extract Subject Matter

- **From URL**: Fetch the page, extract the core topic and key information
- **From file**: Read the file, identify the main subject and concepts to explain
- **From plain text**: Use the text directly as the topic

### Step 3: Check for --oneshot Flag

If `--oneshot` is present in the input, skip to the Output Requirements section and generate immediately with these defaults:
- Audience: "developers who are smart but new to the topic"
- Depth: comprehensive
- Focus: balanced coverage of all aspects

### Step 4: Ask Clarifying Questions (unless --oneshot)

Use the **AskUserQuestion** tool to gather preferences before writing. Ask these questions in a single call:

**Question 1: Audience**
- Header: "Audience"
- Question: "Who is the target audience for this article?"
- Options:
  - "Complete beginners" - No prior knowledge assumed
  - "Developers new to topic" - Technical background, new to this specific subject (Recommended)
  - "Intermediate practitioners" - Some experience, looking to deepen understanding
  - "Advanced/Reference" - Experienced users wanting comprehensive details

**Question 2: Depth**
- Header: "Depth"
- Question: "How deep should the article go?"
- Options:
  - "Quick overview" - 5-10 minute read, key concepts only
  - "Standard tutorial" - 15-20 minute read, practical depth (Recommended)
  - "Comprehensive guide" - 30+ minute read, thorough coverage
  - "Reference documentation" - Exhaustive detail, all edge cases

**Question 3: Focus Areas** (multiSelect: true)
- Header: "Focus"
- Question: "What aspects should be emphasized?"
- Options:
  - "Practical examples" - Heavy on code/hands-on walkthroughs
  - "Conceptual understanding" - Focus on mental models and theory
  - "Common pitfalls" - Emphasis on mistakes and how to avoid them
  - "Comparisons" - Compare alternatives, tradeoffs, when to use what

After receiving answers, incorporate them into the article generation.

## Output Requirements

Generate a **single HTML file** with these characteristics:

### File Output
- Save to a logical location, typically `./article-<slugified-subject>.html`
- Announce the file path so the user can open it in their browser

### Content Structure

Use these sections in this exact order:

1. **Title** - Clear, descriptive title
2. **Why this matters** - Strong hook explaining relevance
3. **The 60 second version** - Quick summary for skimmers
4. **Key concepts and vocabulary** - Terms defined on first use
5. **The core mechanism** - How it actually works
6. **Walkthrough with an example** - Step-by-step guided example
7. **Worked examples** - At least 2 practical examples
8. **Common mistakes and how to avoid them** - Pitfalls and solutions
9. **Mental models and diagrams** - Visual representations
10. **Quick quiz** - Self-assessment with answers in `<details>` elements
11. **Summary and next steps** - Recap and where to go next

### Learning Design Requirements

Include these pedagogical elements:

- **"By the end of this article you will..."** learning outcomes near the top
- **Sticky table of contents** with anchor links
- **Simple mental model first**, then progressively deeper detail
- **"Stop and check" moments** - questions before revealing answers
- **Callout boxes** for important notes and warnings
- **Comparison tables** when discussing tradeoffs or approaches
- **Rules of thumb** made explicit when applicable

### Diagram Requirements

Include **at least 3 inline SVG diagrams**:

1. **Flow diagram** - Shows steps using arrows (process, workflow, or sequence)
2. **Architecture diagram** - Shows components in system-style boxes
3. **Concept diagram** - Illustrates a key mental model or relationship

Each diagram must have:
- A title (inside SVG or as figure caption)
- Labels on all significant elements
- A caption explaining what to notice
- `aria-label` for accessibility

### Styling Requirements

All styles inline in a `<style>` tag:

- **Light and dark themes** using `prefers-color-scheme`
- **Max-width content column** (readable line length)
- **Sticky mini-TOC** on right side for wide screens
- **Collapsible TOC** on narrow screens (responsive)
- **Modern typography** with generous spacing
- **Sufficient contrast** for accessibility
- **Code blocks** styled with syntax-friendly formatting

### Technical Requirements

- **Self-contained**: No external images, fonts, or scripts
- **Offline viewable**: Everything inline
- **Semantic HTML**: Proper heading hierarchy, sections, figures
- **Accessible**: Alt text equivalents, keyboard navigable, readable fonts

## Writing Guidelines

### Tone
- Confident, friendly, and precise
- Assume the reader is smart but new to the topic
- Use accurate terminology; define terms on first use
- Avoid hand-waving or vague explanations

### Content Quality
- Prefer concrete examples over abstract explanations
- If math is needed, use clear notation with explanations
- If code is needed, keep it minimal and instructional
- Include error messages or outputs when relevant

## Output Format

**Critical**: Output only the HTML file content. No markdown. No commentary. No code fences.

The output must:
- Start with `<!DOCTYPE html>`
- End with `</html>`
- Be immediately saveable and viewable in a browser

## Example Usage

```
User: /article how kubernetes pods work
Claude: [Processes input as plain text topic]
        [Uses AskUserQuestion to ask about audience, depth, and focus]
User: [Selects: "Developers new to topic", "Standard tutorial", "Practical examples" + "Common pitfalls"]
Claude: [Generates HTML article tailored to selections]
        [Saves to ./article-kubernetes-pods.html]
        [Announces file location to user]

User: /article how DNS works --oneshot
Claude: [Detects --oneshot flag, skips questions]
        [Generates article with default settings]
        [Saves to ./article-how-dns-works.html]

User: /article ./docs/PLAN.md
Claude: [Reads the PLAN.md file]
        [Asks clarifying questions]
User: [Selects preferences]
Claude: [Creates an article explaining the plan's concepts]
        [Saves to ./article-plan-overview.html]

User: /article https://react.dev/learn/thinking-in-react --oneshot
Claude: [Fetches the React documentation page]
        [Skips questions due to --oneshot]
        [Creates article with default settings]
        [Saves to ./article-thinking-in-react.html]
```

## Execution Workflow

1. **Parse input** to determine type (URL, file, or plain text) and check for `--oneshot` flag
2. **Gather source material** using appropriate tool (WebFetch, Read, or knowledge)
3. **Ask clarifying questions** using AskUserQuestion (skip if `--oneshot`)
4. **Generate the HTML article** following all requirements above, tailored to user preferences
5. **Save the file** to the current directory with a descriptive filename
6. **Report completion** with the file path for the user to open

## Quick Reference

| Input Type | Detection | Action |
|------------|-----------|--------|
| URL | Starts with `http://` or `https://` | WebFetch the content |
| File | Contains `/` or ends with `.md`, `.txt`, `.pdf` | Read the file |
| Topic | Everything else | Generate from knowledge |

**Trigger Phrases:**
- `/article <subject>`
- `/article <subject> --oneshot`
- "write an article about..."
- "create an article on..."
- "explain this topic as an article..."

**Flags:**
- `--oneshot` - Skip clarifying questions, use defaults

**Output:** Single self-contained HTML file viewable in any browser offline.