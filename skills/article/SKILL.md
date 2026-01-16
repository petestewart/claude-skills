---
name: article
description: This skill should be used when the user asks to "write an article", "create an article", "explain this topic", or invokes "/article <subject>". Generates self-contained HTML articles with inline SVG diagrams, proper structure, and polished styling. Handles plain text subjects, file paths (.md, .txt), and URLs as input.
version: 1.1.0
---

# Article - HTML Article Generator

This skill creates self-contained, educational HTML articles with inline SVG diagrams, proper structure, and polished styling that can be viewed offline in any browser.

## Invocation

```
/article <subject>
/article <subject> --oneshot
/article --all
```

The subject can be:
- **Plain text**: `/article how to set up kubernetes`
- **File path**: `/article implementation_plan.md` - reads and explains the file content
- **URL**: `/article https://example.com/some-guide` - fetches and creates an article from the content

**Flags:**
- `--oneshot` - Skip clarifying questions and generate the article immediately using defaults
- `--all` - Generate all articles from the queue (implies `--oneshot` behavior for each)

## Input Processing

### Step 1: Determine Input Type

1. **URL** - If input starts with `http://` or `https://`, use WebFetch to retrieve the content
2. **File path** - If input ends with common file extensions (`.md`, `.txt`, `.pdf`, etc.) or contains `/`, use Read tool to get the content
3. **Plain text** - Otherwise, treat as a topic/subject for original article creation

### Step 2: Extract Subject Matter

- **From URL**: Fetch the page, extract the core topic and key information
- **From file**: Read the file, identify the main subject and concepts to explain
- **From plain text**: Use the text directly as the topic

### Step 3: Check for --all Flag (Batch Mode)

If `--all` is present, enter batch mode:

1. **Read the queue file** at `~/.claude/article-queue.md` (expand `~` to actual home path)
2. **Extract unchecked topics** - items matching `- [ ] <topic>`
3. **If queue is empty**, report "No articles in queue" and exit
4. **For each topic**:
   - Generate the article using `--oneshot` defaults (no clarifying questions)
   - Save to `./article-<slugified-topic>.html`
   - Mark the topic as complete in the queue file: `- [x] <topic>`
   - Track the generated file path
5. **After all articles are generated**:
   - If 5 or fewer articles were created, open them all automatically
   - If more than 5 were created, list the file paths without opening (to avoid browser tab overload)
6. **Report completion** with count and file paths

### Step 4: Check for --oneshot Flag

If `--oneshot` is present in the input (but not `--all`), skip to the Output Requirements section and generate immediately with these defaults:
- Audience: "developers who are smart but new to the topic"
- Depth: comprehensive
- Focus: balanced coverage of all aspects

### Step 5: Ask Clarifying Questions (unless --oneshot or --all)

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
- **Collapsible inline TOC** using `<details>` element near the top of the article
- **Simple mental model first**, then progressively deeper detail
- **"Stop and check" moments** - questions before revealing answers
- **Callout boxes** for important notes and warnings
- **Comparison tables** when discussing tradeoffs or approaches
- **Rules of thumb** made explicit when applicable

**Important**: Do NOT use floating/sticky sidebar TOCs. They complicate responsive layout and cause centering issues. Use an inline collapsible TOC instead.

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

**Diagram Sizing (Critical)**:
- Wrap each SVG in a container `<div class="diagram">` with padding and background
- **Constrain height**: Apply `max-height: 280-380px` to prevent diagrams from becoming enormous
- Use `max-width: 100%` but never let diagrams expand unbounded vertically
- Diagrams should fit comfortably on screen without scrolling

Example CSS for diagrams:
```css
.diagram {
    background: var(--paper-warm);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    overflow-x: auto;
}

.diagram svg {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
    max-height: 350px;
}
```

### Layout Requirements

**Container Layout (Critical)**:
```css
.container {
    width: 90%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 0;
}
```

- Use **90% viewport width** for the main container, centered with `margin: 0 auto`
- Set **max-width: 1400px** to prevent excessive line length on ultra-wide screens
- **Never use margin offsets** for floating elements - keep layout simple and centered
- Scale to 92% width on mobile with `@media (max-width: 768px)`

### Styling Requirements

All styles inline in a `<style>` tag:

**Theme Toggle (Required)**:
- Include a theme toggle button in the header that allows users to switch between light and dark modes
- Default to system preference using `prefers-color-scheme`, but allow manual override
- Store preference in localStorage so it persists across page reloads
- Use a simple toggle button with sun/moon icons or "Light/Dark" text

Example theme toggle implementation:
```html
<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
    <span class="light-icon">☀️</span>
    <span class="dark-icon">🌙</span>
</button>

<script>
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

// Initialize theme
(function() {
    const saved = localStorage.getItem('theme');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved || preferred);
})();
</script>
```

Use `[data-theme="dark"]` and `[data-theme="light"]` selectors instead of `@media (prefers-color-scheme: ...)` when implementing the toggle.

**Color Palette**:
- Avoid generic blue/purple schemes (#228be6, etc.) - these look like "AI slop"
- Use warmer, more refined palettes:
  - Warm paper tones for backgrounds (e.g., `#fdfcfa`, `#f7f5f0`)
  - Muted accent colors (e.g., teal `#2d6a6a`, terracotta `#c45d3a`, gold `#9a7b4f`)
- Define semantic color variables: `--ink`, `--paper`, `--accent` (not `--primary`, `--secondary`)

**Typography**:
- Use Google Fonts for distinctive typography - the `<link>` tag is acceptable for fonts
- Recommended combinations:
  - Headers: Fraunces, Playfair Display, or another distinctive serif
  - Body: Outfit, Source Sans 3, or another clean sans-serif
  - Code: JetBrains Mono, Fira Code, or Source Code Pro
- Apply proper font weights and letter-spacing for refinement
- Use `clamp()` for responsive font sizes on headings

Example font imports:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Outfit:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Other Styling**:
- **Collapsible TOC** near the top using `<details>` element
- **Modern typography** with generous spacing (line-height: 1.7)
- **Sufficient contrast** for accessibility
- **Code blocks** styled with syntax-friendly formatting, rounded corners, and subtle borders

### Technical Requirements

- **Mostly self-contained**: Google Fonts `<link>` tags are acceptable; no other external dependencies
- **Offline viewable**: Everything else inline (styles, scripts, SVGs)
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

## CSS Reference Template

Use this as a starting point for article styling:

```css
:root {
    --ink: #1a1a1a;
    --ink-light: #4a4a4a;
    --ink-muted: #767676;
    --paper: #fdfcfa;
    --paper-warm: #f7f5f0;
    --accent: #c45d3a;
    --accent-light: #fef6f3;
    --teal: #2d6a6a;
    --teal-light: #e8f4f4;
    --gold: #9a7b4f;
    --gold-light: #faf6ef;
    --border: #e5e2dc;
}

[data-theme="dark"] {
    --ink: #e8e6e1;
    --ink-light: #b8b5ad;
    --ink-muted: #8a877f;
    --paper: #141413;
    --paper-warm: #1c1b19;
    --accent: #e07a58;
    --accent-light: #2a1f1a;
    --teal: #5aa3a3;
    --teal-light: #1a2626;
    --gold: #c9a66b;
    --gold-light: #1f1c16;
    --border: #2e2d2a;
}

.container {
    width: 90%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 3rem 0;
}

.diagram svg {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    max-height: 350px;
}
```

## Example Usage

```
User: /article how kubernetes pods work
Claude: [Processes input as plain text topic]
        [Uses AskUserQuestion to ask about audience, depth, and focus]
User: [Selects: "Developers new to topic", "Standard tutorial", "Practical examples" + "Common pitfalls"]
Claude: [Generates HTML article tailored to selections]
        [Saves to ./article-kubernetes-pods.html]
        [Opens article in browser automatically]

User: /article how DNS works --oneshot
Claude: [Detects --oneshot flag, skips questions]
        [Generates article with default settings]
        [Saves and opens ./article-how-dns-works.html]

User: /article ./docs/PLAN.md
Claude: [Reads the PLAN.md file]
        [Asks clarifying questions]
User: [Selects preferences]
Claude: [Creates an article explaining the plan's concepts]
        [Saves and opens ./article-plan-overview.html]

User: /article https://react.dev/learn/thinking-in-react --oneshot
Claude: [Fetches the React documentation page]
        [Skips questions due to --oneshot]
        [Creates article with default settings]
        [Saves and opens ./article-thinking-in-react.html]

User: /article --all
Claude: [Reads .claude/article-queue.md]
        [Finds 3 unchecked topics]
        [Generates article 1/3: "TCP congestion control"]
        [Generates article 2/3: "WebSocket vs SSE"]
        [Generates article 3/3: "Unix file permissions"]
        [Marks all 3 as complete in queue]
        [Opens all 3 articles (fewer than 5)]
        Generated 3 articles and opened them in your browser.
```

## Execution Workflow

### Standard Mode (single article)
1. **Parse input** to determine type (URL, file, or plain text) and check for flags
2. **Gather source material** using appropriate tool (WebFetch, Read, or knowledge)
3. **Ask clarifying questions** using AskUserQuestion (skip if `--oneshot`)
4. **Generate the HTML article** following all requirements above, tailored to user preferences
5. **Save the file** to the current directory with a descriptive filename
6. **Open the article** automatically using Bash: `open <filepath>` (macOS) or `xdg-open <filepath>` (Linux)
7. **Report completion** briefly confirming the article was generated and opened

### Batch Mode (`--all` flag)
1. **Read queue** from `~/.claude/article-queue.md`
2. **Extract unchecked topics** matching `- [ ] <topic>`
3. **For each topic**: generate article with defaults, save file, mark complete in queue
4. **Open articles** if 5 or fewer were generated; otherwise just list file paths
5. **Report completion** with count and paths

## Quick Reference

| Input Type | Detection | Action |
|------------|-----------|--------|
| URL | Starts with `http://` or `https://` | WebFetch the content |
| File | Contains `/` or ends with `.md`, `.txt`, `.pdf` | Read the file |
| Topic | Everything else | Generate from knowledge |

**Trigger Phrases:**
- `/article <subject>`
- `/article <subject> --oneshot`
- `/article --all`
- "write an article about..."
- "create an article on..."
- "explain this topic as an article..."

**Flags:**
- `--oneshot` - Skip clarifying questions, use defaults
- `--all` - Generate all queued articles (opens if ≤5, lists paths if >5)

**Output:** Single HTML file with Google Fonts, viewable in any browser.

## Common Mistakes to Avoid

| Mistake | Why It Happens | Correct Approach |
|---------|---------------|------------------|
| Floating sidebar TOC | Trying to maximize screen use | Use inline collapsible TOC with `<details>` |
| Fixed narrow width (800px) | "Readable line length" misinterpreted | Use `width: 90%; max-width: 1400px` |
| Unbounded diagram height | No explicit sizing | Add `max-height: 280-380px` to SVGs |
| Generic blue color scheme | Default AI aesthetic | Use warm, refined palettes |
| System fonts only | "Self-contained" taken too literally | Google Fonts `<link>` is acceptable |
| No theme toggle | Relying only on system preference | Add button for manual light/dark switching |

## Related Skills

- `/article-add <topic>` - Add a topic to your article queue for later generation
- `/article-queue` - View queued topics and select one to generate
