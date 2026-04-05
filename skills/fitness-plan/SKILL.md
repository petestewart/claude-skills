---
name: fitness-plan
description: Generate a personalized fitness and nutrition plan as an interactive HTML dashboard with inline exercise video demos, daily tracking, and progress charts. Use when the user wants to create a workout plan, nutrition plan, fat loss plan, cutting plan, meal plan, training programme, fitness dashboard, or body recomposition plan. Walks through an interactive Q&A to gather stats, lifestyle, equipment, and food preferences, then generates a complete single-file HTML app with personalized meal plans, a 12-week periodised training programme, clickable exercise names that pop up YouTube form demos, daily tracker with localStorage, progress charts, snack swaps, hydration targets, supplement recommendations, font size controls, and an export/import backup system. Can be deployed to GitHub Pages for mobile access. Triggers on phrases like "fitness plan", "get shredded", "lose fat", "build muscle", "meal plan", "workout plan", "training programme", or "/fitness-plan".
---

# Fitness Plan Generator

Creates a personalized, actionable fitness plan through a guided Q&A, then outputs everything as a self-contained HTML dashboard the user can open in their browser. The dashboard includes their meal plan, training programme, daily tracker with localStorage persistence, and progress charts.

## Invocation

- `/fitness-plan` — run the full interactive flow
- "build me a fitness plan"
- "I want to get shredded for summer"
- "create a meal plan and training programme for me"

## Philosophy

The plan is built on five non-negotiable pillars:

1. **Calorie deficit** — 300-500 kcal below maintenance for fat loss
2. **Protein intake** — 1g per lb bodyweight to preserve muscle
3. **Progressive overload** — 4 training sessions/week, tracked and progressed
4. **Daily movement** — 8,000-10,000 steps
5. **Sleep** — 7-9 hours for recovery and hormonal balance

Consistency over perfection. Weekend blowouts erase weekday deficits. Track everything.

## Workflow

Work through four phases in order. Do not skip phases.

### Phase 1: Gather Information

Ask the user for information across 4 sections, **one section at a time**. Wait for the user's response before moving to the next section. Use AskUserQuestion where a clear set of options exists; use plain conversational questions for open-ended answers like favourite foods.

Keep the tone warm, encouraging, and straight-talking — like a knowledgeable friend, not a clinical questionnaire.

**Before asking questions, briefly explain what you'll be building** so they know what to expect:

> "I'm going to ask you a few questions across four sections — your stats, lifestyle, food preferences, and snack habits. Then I'll calculate your calorie targets and generate a complete dashboard with your meal plan, training programme, and daily tracker. Should take about 10 minutes. Let's start."

#### Section 1 — Stats

Collect:
- Age
- Biological sex (male/female)
- Height (cm or ft/in — convert to cm)
- Current weight (kg or lbs — convert to kg)
- Goal weight (or target look/feel if no specific number)
- Timeline preference: "steady and sustainable" vs "as fast as safely possible"

#### Section 2 — Lifestyle

Collect:
- Job type: desk job / mixed (on feet sometimes) / physical/manual labour
- Exercise: days per week and type (strength, cardio, classes, yoga, etc.)
- Sleep: typical hours per night
- Stress: low / moderate / high
- Alcohol: units per week (or none)
- **Equipment / gym access**: commercial gym / home gym / specific equipment (Smith machine, cables, dumbbells, kettlebells, pull-up bar, bench, etc.)

Equipment details are critical — they determine every exercise in the training plan. If user mentions a home gym, ask specifically what they have. Smith machines, cables, dumbbells, kettlebells all dramatically shape the programme.

#### Section 3 — Food Preferences

Ask conversationally:
- Top 5 favourite meals or dishes
- Any foods they hate and would never eat
- Dietary restrictions/allergies (vegetarian, vegan, dairy-free, gluten-free, nut allergy, etc.)
- Cooking style preference: from scratch / quick meals / batch meal prep
- Food adventurousness on a 1-10 scale

#### Section 4 — Snack Habits

Collect:
- Current go-to snacks
- Snacking trigger: hunger / boredom / habit / stress
- Sweet vs savoury preference
- Late-night snacking (yes/no)

### Phase 2: Calculate Targets

Show the user the full calculation step-by-step so they understand where the number comes from.

**Important warning to give first:** Tell the user that generic online calorie calculators often underestimate TDEE for people with physical jobs, and that the most accurate approach is to track intake for 2 weeks without changing anything — if weight is stable, that's their real maintenance. The calculation below is a strong starting point.

#### Step 1: BMR (Mifflin-St Jeor)

- **Men**: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
- **Women**: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161

#### Step 2: TDEE (apply activity multiplier)

Combine job type AND exercise frequency — not just one:

| Category | Multiplier | Description |
|----------|-----------|-------------|
| Sedentary | 1.2 | Desk job, no exercise |
| Lightly active | 1.375 | Desk job + 1-3 workouts/week |
| Moderately active | 1.55 | Light physical job OR desk + 4-5 workouts |
| Very active | 1.725 | Physical job + 4-5 workouts/week |
| Extremely active | 1.9 | Heavy manual labour + daily training |

TDEE = BMR × multiplier

#### Step 3: Deficit

Target: 500 kcal below TDEE for ~1 lb fat loss per week. Never go more than 500 below TDEE for active individuals. If the user said "as fast as possible", still cap at 500 — anything more burns muscle and wrecks energy.

Target calories = TDEE − 500

#### Step 4: Macros

- **Protein**: 1g per lb bodyweight (2.2g per kg). Protects muscle, increases satiety.
- **Fat**: minimum 0.8g per kg bodyweight. Essential for hormones.
- **Carbs**: remaining calories ÷ 4.

Calculation:
```
protein_grams = weight_lbs × 1
protein_kcal = protein_grams × 4
fat_grams = weight_kg × 0.9  (mid-range)
fat_kcal = fat_grams × 9
carb_kcal = target_calories - protein_kcal - fat_kcal
carb_grams = carb_kcal / 4
```

#### Step 5: Hydration

- Base: 35ml per kg bodyweight
- Add 500ml per hour of exercise per day
- Add 500-1000ml for physical or outdoor jobs

Express in litres, rounded to nearest 0.25L.

### Phase 3: Generate Plan Content

Create all content elements before building the HTML. See reference files for detailed instructions on each:

1. **7-Day Meal Plan** (breakfast, lunch, dinner, optional dessert) — see `references/nutrition-guide.md`
2. **12-Week Training Programme** (periodised, based on their schedule) — see `references/training-guide.md`
3. **5+ Snack Swaps** based on their current habits — see `references/nutrition-guide.md`
4. **5 Personalised Fat Loss Rules** specific to them — see `references/nutrition-guide.md`
5. **Week-by-week Timeline** with realistic expectations — see `references/nutrition-guide.md`
6. **Supplement Recommendations** (evidence-based only) — see `references/nutrition-guide.md`
7. **Recovery Protocol** (sleep routine, mobility, deloads) — see `references/training-guide.md`
8. **Injury Prevention Prehab** (20-min routine, 3x/week) — see `references/training-guide.md`

### Phase 4: Generate HTML Dashboard

Generate a single self-contained HTML file with all plan content, interactive daily tracking, progress charts, clickable exercise videos, and font size controls. See `references/dashboard-spec.md` for complete specifications.

**Dashboard features** (all specified in detail in dashboard-spec.md):
- 5 tabs: Overview, Meal Plan, Training, Daily Log, Progress
- **Clickable exercise names** → open YouTube video demos in a modal (or YouTube search for un-set videos)
- **✎ edit icon** next to every exercise → paste a YouTube URL to save that exercise's video
- **Font size controls** (A−/A+) in the header for accessibility
- **Theme toggle** (light/dark, respects system preference)
- **Export/import backup** for saved videos — safety net against data loss
- **12-week training programme** with full session detail for every week (block-based architecture)
- **Video library** section with persistence stats
- **Daily log form** with today-vs-target progress bars
- **Progress tab** with Chart.js visualizations
- All data persists in localStorage (per-browser, per-origin)

**Output steps:**
1. Write the HTML file to `./fitness-plan.html` (in the current working directory)
2. Open it in the browser: `open ./fitness-plan.html` (macOS)
3. Tell the user the file path and give them a brief tour of the tabs
4. Offer Phase 5 (deployment)

**After delivery**, remind them:
- All data saves to their browser's localStorage — persists across sessions but is per-browser
- Saved videos + default videos work together (defaults baked in, user overrides stored)
- Export their video backup regularly (safety net)
- They can re-run the skill anytime to regenerate with updated stats
- The plan is a strong starting point; they should adjust after 2 weeks based on real results

### Phase 5: Deploy for Mobile Access (Optional)

Ask the user if they want to access the dashboard on their phone. If yes:

**Option A: GitHub Pages (recommended)**

1. Create a local start script `start.sh` for testing: `python3 -m http.server 8787` with auto-open browser
2. Use `gh repo create` to create a GitHub repo (public — Pages requires public on free tier)
3. Push the files
4. Enable GitHub Pages via `gh api -X POST /repos/{user}/{repo}/pages -f "source[branch]=main" -f "source[path]=/"`
5. Give user the public URL
6. Warn: dashboard contains personal stats — repo will be public. Private repos with public Pages require GitHub Pro.

**Important HTTPS benefit:** Serving via HTTPS (GitHub Pages) fixes YouTube embed issues. When opened via `file://`, browsers send no referrer, and many YouTube videos refuse to embed with "Error 153". HTTPS sites get valid referrers, so embeds work properly.

**Option B: Local server only**

Create `start.sh` that runs `python3 -m http.server 8787` and opens `http://localhost:8787/fitness-plan.html`. Works for desktop but not phones without extra networking.

**Mobile setup:**
- User opens GitHub Pages URL on phone Safari
- Tap Share → "Add to Home Screen" for app-like icon
- localStorage is per-device — videos/logs don't auto-sync between laptop and phone
- Use Export/Import backup to carry data between devices

**Post-deployment workflow:**

When the user wants to update the plan, make the change locally, then:
```bash
git add fitness-plan.html && git commit -m "update: ..." && git push
```
Pages rebuilds in ~30 seconds.

## Tone Throughout

- Encouraging and knowledgeable — world-class coach in their corner
- Straight-talking — no false promises, no sugar-coating
- Specific to them — never generic
- Motivating without being preachy

Never recommend supplements or approaches the user didn't ask about beyond what's evidence-based. Food, training, sleep, and consistency are 99%. Supplements are the 1%.

## Post-Delivery Iteration (expect this)

Users will almost always want to refine the plan after seeing it. Common requests:

- **Swap exercises** — "I prefer X over Y" → use exercise name migrations so saved videos follow renames
- **Add missing exercises** — hip thrusts, KB swings, cable crunch, etc. → update the `BLOCKS` const
- **Remove an exercise** — drop redundant accessories
- **Adjust deficit** — slightly more/less aggressive
- **Adjust training split** — fewer/more days, different pairings

**When modifying the plan after delivery:**
1. Preserve localStorage — never change file path or rename `fitness_videos` key
2. When renaming exercises, add to `EXERCISE_NAME_MIGRATIONS` so saved videos migrate
3. Make surgical Edits, not full rewrites, to minimize change blast radius
4. Flag changes that affect saved data and confirm before running them
5. After changes, commit + push if deployed

**Watch for these user frustrations** (from real sessions):
- Sessions running too long → offer to drop redundant exercises (e.g., goblet squat when Smith squat covers it)
- YouTube embed failures from file:// → recommend HTTPS deployment
- Videos getting lost → always build export/import backup into the dashboard
- Over-complicated UI → keep modals and prompts simple, one action per click

## Reference Files

- [references/dashboard-spec.md](references/dashboard-spec.md) — Complete HTML dashboard specification (layout, tabs, components, styling, localStorage, Chart.js)
- [references/nutrition-guide.md](references/nutrition-guide.md) — Meal plan rules, snack swaps, supplements, hydration, personal rules
- [references/training-guide.md](references/training-guide.md) — 12-week programme structure, recovery protocol, injury prevention, progress tracking

## Example Interaction

```
User: /fitness-plan

Claude: I'm going to ask you a few questions across four sections — your stats,
        lifestyle, food preferences, and snack habits. Then I'll calculate your
        calorie targets and generate a complete dashboard with your meal plan,
        training programme, and daily tracker. Should take about 10 minutes. Let's start.

        SECTION 1 — STATS
        [asks questions]

User: [provides stats]

Claude: Great. SECTION 2 — LIFESTYLE
        [asks questions]

[...continues through all 4 sections...]

Claude: Perfect. Let me calculate your targets.

        Your BMR: 1,780 kcal
        Your TDEE: 2,759 kcal (moderately active)
        Your target: 2,259 kcal/day
        Protein: 170g  |  Fat: 75g  |  Carbs: 235g
        Hydration: 3.25L/day

        Now building your dashboard...
        [generates HTML, saves to ./fitness-plan.html, opens in browser]

        Done. Your dashboard is open. Here's what's inside:
        - Overview: targets, timeline, your 5 personal rules
        - Meal Plan: 7-day themed plan with macros per meal
        - Training: full 12-week programme
        - Tracker: daily logging (saves to your browser)
        - Progress: charts that populate as you log

        12 weeks. Lock in. Let's go.
```
