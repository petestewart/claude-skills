# Dashboard HTML Specification

Complete specification for generating `fitness-plan.html` — a single self-contained HTML file with 5 tabs, inline exercise videos, daily tracking, progress charts, and accessibility controls.

## File Structure

One HTML file. Save to `./fitness-plan.html`.

**External dependencies (CDN only):**
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js`
- Google Fonts: `<link>` for typography

**Everything else inline**: styles, scripts, SVGs, plan data, default videos.

## Serving Options (critical for YouTube embeds)

### file:// (default, local)
- Double-click to open
- **YouTube embedding often fails** with "Error 153" — browsers send no referrer from file://, YouTube refuses
- Fine for meal plan + training display + daily log
- Saved videos fall back to YouTube search in new tab

### http://localhost (local server)
Create `start.sh`:
```bash
#!/bin/bash
PORT=8787
DIR="$(cd "$(dirname "$0")" && pwd)"
(sleep 1 && open "http://localhost:$PORT/fitness-plan.html") &
cd "$DIR" && python3 -m http.server $PORT
```
Fixes YouTube embedding. But ties you to one machine.

### https:// (GitHub Pages — recommended for mobile)
Public URL, works on phones, HTTPS unlocks YouTube embedding. Deployment steps in SKILL.md Phase 5.

## Top-Level Layout

```
┌──────────────────────────────────────────────────────┐
│  HEADER                                              │
│  Title + subtitle    [Week badge] [A−] [A+] [🌙/☀️]  │
├──────────────────────────────────────────────────────┤
│  TABS                                                │
│  [Overview] [Meals] [Training] [Log] [Progress]      │
├──────────────────────────────────────────────────────┤
│  TAB CONTENT                                         │
└──────────────────────────────────────────────────────┘
```

## Styling

### Color Palette (warm, motivating — NOT generic AI blue/purple)

```css
:root {
    --ink: #1a1a1a;
    --ink-light: #4a4a4a;
    --ink-muted: #767676;
    --paper: #fdfcfa;
    --paper-warm: #f7f5f0;
    --card: #ffffff;
    --accent: #c45d3a;        /* terracotta */
    --accent-light: #fef6f3;
    --success: #2d6a4f;       /* forest green */
    --success-light: #e8f5ee;
    --warn: #c8860d;          /* amber */
    --warn-light: #fdf7e8;
    --border: #e5e2dc;
}
[data-theme="dark"] { /* ... invert ... */ }
```

### Typography

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- Headers: Fraunces (distinctive serif)
- Body/UI: Inter (clean sans-serif)
- Numbers: Inter with `font-variant-numeric: tabular-nums`

### Layout

- Main container: `width: 92%; max-width: 1200px; margin: 0 auto;`
- Cards: 8-12px border radius, subtle shadow
- Mobile responsive — stack columns at 768px

## Header Controls

Four controls in the header:

1. **Week badge** — "Week X of 12" (calculated from start date)
2. **A− / A+ font size buttons** — 7 scale levels (0.85× to 1.5×)
3. **Theme toggle** — sun/moon icon

## Tab 1: Overview

Sections stacked vertically:

### Stats Bar (top, 4-6 cards)
Current weight, goal weight, daily target kcal, protein target, hydration target, weeks remaining.

### Your Numbers
BMR/TDEE/deficit calculation shown step-by-step + macro bar visualization.

### Timeline Projection
Week-by-week realistic expected progress.

### 5 Personal Rules
Card per rule, each specific to user's answers.

### Hydration Plan
Large target number + 3-4 practical tips specific to lifestyle.

### Supplements
Evidence-based only (creatine, protein, D3, magnesium, omega-3, caffeine where relevant).

### Sleep Callout
If user's sleep is < 7 hours, flag it prominently as #1 priority.

## Tab 2: Meal Plan

### 7-Day Meal Plan
Each day = collapsible card with:
- Day title + theme (e.g., "Taco Monday")
- Daily totals bar (kcal, P, C, F)
- Meals (breakfast, lunch, dinner, optional dessert)
- Badges: `quick`, `batch`, `treat`

Monday expanded by default.

### Snack Swaps
5+ swap cards matching user's current habits.

## Tab 3: Training

### Week Selector
Button row, weeks 1-12. Click to navigate. Active week highlighted.

### Selected Week View
- Week overview card (block name + week-specific note, color-coded by block type: foundation/deload/hypertrophy/strength/test)
- Full session cards for all 3 (or 4) days
- **Every week shows full session detail** — no "follow week 1 structure" fallback

### Prehab Routine Section
5 cards (shoulders, hips, knees, lower back, elbows), all exercise names clickable.

### Deload Guidance Callout
Brief explainer about weeks 4, 8, 12.

### Your Video Library Section (bottom)
Count of saved videos + Export/Import backup buttons.

## Tab 4: Log (Daily Tracker)

### Today's Log Form
Fields: date, weight, calories, protein, carbs, fat, steps, sleep, water, mood, training done checkbox, training notes textarea.

Save button writes to localStorage under `fitness_log`.

### Today vs Target
Progress bars (calories, protein, carbs, fat, steps, water) with color states: green (95-105%), amber (80-95%), grey (<80%), terracotta (over 105% for calories).

### Past 14 Days
Table with editable rows (click to populate form).

## Tab 5: Progress

Chart.js visualizations:
- Weight over time (line, with goal line)
- Calorie adherence (bar, colored by target match)
- Protein adherence (bar)
- Steps + sleep (dual-axis line)
- Consistency score (% of last 14 days logged)

## Exercise Video System (the big one)

### Architecture

Every exercise name in training sessions + prehab is clickable. Users click to play a video demo in an inline modal. URLs are saved per-exercise to localStorage. Default videos are baked into the HTML for immediate availability.

### DEFAULT_VIDEOS constant

Bake curated video IDs into the HTML. These are the "starter library" — available on every device without import.

```js
const DEFAULT_VIDEOS = {
    "Smith bent-over row": "abcXXXXXXXX",
    "Lat pulldown (wide grip)": "defYYYYYYYY",
    // ... one per exercise
};
```

**Initial build**: leave empty `{}`. Users populate it themselves via the ✎ icon. After a few iterations, paste the user's exported backup IDs back into this constant to make them permanent defaults.

### Storage & merge

```js
function getVideos() {
    const stored = JSON.parse(localStorage.getItem('fitness_videos') || '{}');
    return { ...DEFAULT_VIDEOS, ...stored };  // localStorage overrides defaults
}
function setVideos(videos) {
    localStorage.setItem('fitness_videos', JSON.stringify(videos));
}
```

User overrides defaults. If user "removes" a video (blanks it), default comes back.

### Exercise link rendering

```js
function exerciseLink(name) {
    const videos = getVideos();
    const saved = videos[name];
    const escaped = name.replace(/'/g, "\\'");
    const indicator = saved ? '<span class="saved-indicator"></span>' : '';
    const editBtn = `<a href="#" class="exercise-edit" onclick="event.preventDefault();editExerciseVideo('${escaped}')" title="Set custom video URL">✎</a>`;
    if (saved) {
        // Opens modal with inline embed
        return `<a href="#" class="exercise-link" onclick="event.preventDefault();openVideoModal('${escaped}')">${name}</a>${indicator}${editBtn}`;
    }
    // No video → opens YouTube search in new tab
    const url = videoUrlFor(name);
    return `<a href="${url}" target="_blank" rel="noopener" class="exercise-link">${name}</a>${editBtn}`;
}
```

### Video URL extraction

Supports multiple formats:

```js
function extractVideoId(url) {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed; // bare ID
    const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = trimmed.match(p);
        if (m) return m[1];
    }
    return null;
}
```

### Edit via prompt()

Native browser prompt, no custom modal needed:

```js
function editExerciseVideo(name) {
    const videos = getVideos();
    const current = videos[name];
    const currentUrl = current ? `https://www.youtube.com/watch?v=${current}` : '';
    const input = prompt(`Set YouTube video URL for "${name}"\n\nPaste the URL. Blank to remove, Cancel to keep current.`, currentUrl);
    if (input === null) return;
    if (input.trim() === '') {
        // User cleared it — remove from localStorage, default (if any) comes back
        const stored = JSON.parse(localStorage.getItem('fitness_videos') || '{}');
        delete stored[name];
        localStorage.setItem('fitness_videos', JSON.stringify(stored));
    } else {
        const videoId = extractVideoId(input);
        if (!videoId) { alert("Couldn't find a YouTube video ID in that URL."); return; }
        const stored = JSON.parse(localStorage.getItem('fitness_videos') || '{}');
        stored[name] = videoId;
        localStorage.setItem('fitness_videos', JSON.stringify(stored));
    }
    refreshExerciseLinks();
}
```

### Video modal

Full-screen overlay, centered modal, embedded iframe:

```js
function openVideoModal(name) {
    const videoId = getVideos()[name];
    if (!videoId) return;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalBody').innerHTML = `
        <div class="video-wrapper">
            <iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0" allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        </div>
        <div class="video-footer-link">
            <a href="${watchUrl}" target="_blank" rel="noopener">Open on YouTube ↗</a>
            <span class="divider">·</span>
            <a href="#" onclick="event.preventDefault();closeVideoModal();editExerciseVideo('${name.replace(/'/g, "\\'")}')">Change video</a>
        </div>`;
    document.getElementById('videoModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    modal.classList.remove('open');
    document.getElementById('modalBody').innerHTML = ''; // critical: stops playback
    document.body.style.overflow = '';
}
```

**Modal UX:**
- Click outside modal → close
- Escape key → close
- Clear innerHTML on close to stop video playback
- Use `youtube-nocookie.com` for better embed compatibility (more lenient referrer checks)
- Include "Open on YouTube ↗" as fallback for videos with embedding disabled

### YouTube search fallback

When no video is saved, clicking the exercise name opens a YouTube search in a new tab:

```js
function videoUrlFor(exerciseName) {
    const videos = getVideos();
    const videoId = videos[exerciseName];
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    const cleaned = exerciseName.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    const query = encodeURIComponent(cleaned + ' proper form tutorial');
    return `https://www.youtube.com/results?search_query=${query}`;
}
```

### Visual indicators

- **Green dot** (`.saved-indicator`) next to exercise names with saved videos
- **✎ icon** for editing (small, low opacity until hover)
- **Dotted underline** on exercise names to show clickability

## Export/Import Backup

User safety net — protects saved videos from loss.

### UI (Training tab, bottom section)

```html
<div class="card">
    <div class="stat-value" id="videoCount">0</div>
    <button class="btn secondary" onclick="exportVideos()">⬇ Export backup</button>
    <label class="btn secondary"><input type="file" accept=".json" onchange="importVideos(event)" hidden>⬆ Import backup</label>
</div>
```

### Implementation

```js
function exportVideos() {
    const data = { exported: new Date().toISOString(), videos: getVideos() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-videos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importVideos(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const incoming = data.videos || data;
            const stored = JSON.parse(localStorage.getItem('fitness_videos') || '{}');
            const merged = { ...stored, ...incoming };
            setVideos(merged);
            refreshExerciseLinks();
            alert(`Imported ${Object.keys(incoming).length} videos.`);
        } catch (err) {
            alert("Could not read that file.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
```

## Exercise Name Migrations

When exercises get renamed across plan iterations, saved videos should follow:

```js
const EXERCISE_NAME_MIGRATIONS = {
    "DB goblet squat": "KB goblet squat",
    "Walking DB lunges": "KB walking lunges",
};
function migrateExerciseNames() {
    const migrationKey = 'fitness_migrations_v1';
    if (localStorage.getItem(migrationKey)) return;
    const stored = JSON.parse(localStorage.getItem('fitness_videos') || '{}');
    let changed = false;
    for (const [oldName, newName] of Object.entries(EXERCISE_NAME_MIGRATIONS)) {
        if (stored[oldName] && !stored[newName]) {
            stored[newName] = stored[oldName];
            delete stored[oldName];
            changed = true;
        }
    }
    if (changed) localStorage.setItem('fitness_videos', JSON.stringify(stored));
    localStorage.setItem(migrationKey, '1');
}
```

Call from `init()` before rendering. Increment migration key (`v1`, `v2`, ...) when adding new migrations.

## Font Size Controls

Accessibility feature, particularly useful on mobile / for older users.

```js
const FONT_SCALES = [0.85, 0.95, 1.0, 1.1, 1.2, 1.35, 1.5];
const FONT_BASE_PX = 15;

function applyFontScale() {
    const idx = getFontScaleIdx();
    const px = FONT_BASE_PX * FONT_SCALES[idx];
    document.documentElement.style.fontSize = px + 'px';
    if (document.body) document.body.style.fontSize = px + 'px';
    // Disable buttons at bounds
    document.getElementById('fontDownBtn').disabled = (idx === 0);
    document.getElementById('fontUpBtn').disabled = (idx === FONT_SCALES.length - 1);
}

// Apply immediately (pre-render, prevents flash)
(function initFontSize() {
    const idx = getFontScaleIdx();
    document.documentElement.style.fontSize = (FONT_BASE_PX * FONT_SCALES[idx]) + 'px';
})();
```

Because the CSS uses `rem` units throughout, changing the root font-size scales everything proportionally.

## Training Data Structure

**Critical**: Use block templates + week mapping, NOT inline sessions per week:

```js
const BLOCKS = {
    foundation: { sessions: [ /* Day 1, Day 2, Day 3 */ ] },
    deload: { sessions: [ /* reduced volume versions */ ] },
    hypertrophy: { sessions: [ /* added sets, higher volume */ ] },
    strength: { sessions: [ /* 4×5-6, longer rest */ ] },
    test: { sessions: [ /* minimal volume, top sets */ ] },
};

const TRAINING = [
    { week: 1, block: "Foundation — Volume Accumulation", blockKey: "foundation", note: "..." },
    { week: 2, block: "Foundation — Volume Accumulation", blockKey: "foundation", note: "..." },
    // ... all 12 weeks
];

function renderWeekView(weekNum) {
    const w = TRAINING.find(x => x.week === weekNum);
    const block = BLOCKS[w.blockKey];
    // Render w.note in the overview card
    // Render block.sessions as session cards
}
```

This means **every week has full session detail**, not fallback messages.

### Block color coding

- Foundation, Hypertrophy, Strength: use `--accent` (terracotta)
- Deload: use `--warn` (amber)
- Test: use `--success` (green)

## localStorage Schema

Single-key namespaced per data type:

```
fitness_theme: "dark" | "light"
fitness_fontScaleIdx: "2" (index into FONT_SCALES)
fitness_activeTab: "overview" | "meals" | ...
fitness_week: "3" (current training week selected)
fitness_startDate: "2026-04-04"
fitness_log: JSON array of day entries
fitness_videos: JSON { exerciseName: videoId }
fitness_migrations_v1: "1" (migration flag)
```

## Keyboard Shortcuts

- **Escape** — close modal
- Use `document.addEventListener('keydown', ...)` and check for `classList.contains('open')`

## Delivery

After writing the file:

```bash
open ./fitness-plan.html
```

Brief the user on:
1. File location
2. Tab tour (5 tabs)
3. Clickable exercises + ✎ icon + modal
4. Font controls + theme toggle
5. Export backup recommendation
6. Deployment option (Phase 5)

## Common Pitfalls to Avoid

| Pitfall | Why It Happens | Fix |
|---|---|---|
| file:// YouTube embed fails | No HTTP referrer sent | Use HTTPS (GitHub Pages) or document the limitation |
| Videos lost on rename | Storage is name-keyed | Use migration system |
| Generic blue color scheme | Default aesthetic | Warm terracotta palette |
| Week-by-week rendering | Duplicated data | Block templates + week mapping |
| No video export | Users fear data loss | Always include export/import backup |
| Font size hardcoded | No accessibility | A−/A+ buttons + rem units |
| Modal video keeps playing after close | iframe persists | Clear innerHTML on close |
| Goblet squat redundant with main squat | Over-scoped session | Offer to drop when sessions too long |
