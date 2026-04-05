# Training Guide

Detailed instructions for generating the 12-week training programme, recovery protocol, injury prevention prehab, and progress tracking system.

## Training Architecture: Block-Based Design

**Critical: design the programme as blocks with session templates, not as 12 individual weeks.** This gives clean code, consistent progressions, and makes every week's routine visible to the user.

### The 5 Blocks

| Block | Weeks | Focus | Volume |
|---|---|---|---|
| **Foundation** | 1-3 | Volume accumulation, form, dialling in technique | Moderate, 3-4 sets |
| **Deload** | 4 | Recovery | Cut to 2 sets, 70-75% weights |
| **Hypertrophy** | 5-7 | Muscle growth, volume push | 4-5 sets on compounds |
| **Deload** | 8 | Recovery | Same as week 4 |
| **Strength** | 9-11 | Heavier loads, lower reps | 4 × 5-6 on compounds, longer rest |
| **Test Week** | 12 | Capture numbers | Minimal volume, top sets only |

### Data Structure (for HTML dashboard)

```js
const BLOCKS = {
    foundation: { sessions: [ { name, exercises: [[name, sets×reps, tempo, rest], ...], cues }, ... ] },
    deload: { sessions: [...] },
    hypertrophy: { sessions: [...] },
    strength: { sessions: [...] },
    test: { sessions: [...] },
};

const TRAINING = [
    { week: 1, block: "Foundation — Volume Accumulation", blockKey: "foundation", note: "Dial in form..." },
    { week: 2, block: "Foundation — Volume Accumulation", blockKey: "foundation", note: "Add 2.5kg..." },
    // ... weeks 3-12
];
```

The week renderer looks up `BLOCKS[week.blockKey]` to get session templates, then renders all exercises for that week. **Every week shows the actual routine**, not "follow week 1 structure."

### Block-Specific Adjustments

- **Foundation**: base session template, moderate sets/reps
- **Deload**: cut set counts by ~50%, skip finishers
- **Hypertrophy**: add 1 set on compounds, extend rep ranges, push volume on accessories
- **Strength**: switch compounds to 4 × 5-6, extend rest to 2-3 min, keep accessories 8-12
- **Test**: minimal accessories, 3 × 3-5 top sets on each compound

## Training Split Selection

Match the split to the user's training frequency and other activities.

### 3-Day Split (common for people doing yoga, sports, or active recovery)

Default to a 3-day Pull/Legs/Push split when user lifts 2-3 days + other activities (yoga, sports, running).

**Example structure:**
- Day 1: Pull + Back Focus
- Day 2: Legs + Core
- Day 3: Push + Back Accessory

This leaves 4 days for rest days and other modalities. Works great alongside yoga (Bikram, power), running, cycling, sports.

### 4-Day Upper/Lower

If user lifts 4 days/week as primary training:
- Day 1: Upper Strength
- Day 2: Lower Strength
- Day 4: Upper Hypertrophy
- Day 5: Lower Hypertrophy

### 5-Day PPL + Upper/Lower

Advanced lifters, 5+ sessions/week:
- Push / Pull / Legs / Upper / Lower

## Equipment Adaptation

Every exercise prescribed must be executable with the user's equipment. Ask specifically about their gym setup in Phase 1.

### Home Gym Patterns

**Smith machine setups** (e.g., Mikolo M4 2.0, Force USA):
- Replace free barbell exercises with Smith variants
- Use for: squat, bench, RDL, overhead press, rows
- Usually includes attached lat pulldown + cable crossover
- Cable work is the user's back development tool (lat pulldown, cable row, face pulls)

**Dumbbell + bench:**
- DB bench press, incline press, flyes, rows, curls, shoulder press
- DB pullover, lateral raise, hammer curl
- DB walking lunges, goblet squat, RDL

**Kettlebells** — extremely valuable when available:
- KB swing (explosive hinge, glutes, conditioning — unique movement pattern)
- KB goblet squat (natural grip)
- KB walking lunges (racked or goblet)
- KB single-leg RDL
- KB suitcase carry / farmer carry (anti-lateral flexion core)
- KB clean & press (if advanced)

**Pull-up bar:**
- Pull-ups, chin-ups (assisted with band if needed)
- Hanging leg raise
- Dead hangs

**Cable crossover / lat pulldown (often part of Smith rack):**
- Wide-grip + neutral-grip pulldowns
- Close-grip cable row
- Face pulls (cable + rope)
- Cable lateral raise
- Tricep pushdown
- Cable crunch

## Exercise Format

Store each exercise as a 4-element tuple:

```js
["Exercise name", "Sets × Reps", "Tempo", "Rest"]
```

Example:
```js
["Smith back squat", "4 × 8-10", "3-1-1", "2 min"],
["Smith Romanian deadlift", "4 × 8-10", "3-1-1", "90 sec"],
["Hip thrust (DB/KB)", "3 × 10-12", "2-1-1", "75 sec"],
```

**Tempo notation**: eccentric-pause-concentric
- `3-1-1` = 3s down, 1s pause, 1s up
- `2-0-2` = 2s down, no pause, 2s up
- `slow` = controlled, no momentum (for core work)
- `-` = no specific tempo (planks, carries, timed holds)
- `explosive` = fast concentric (KB swing, jumps)

## Finishers (end-of-session conditioning)

Include 1 finisher at the end of Day 1 (Pull) and Day 2 (Legs) in volume blocks. Skip in deload and test weeks.

**Day 1 (Pull) finisher options:**
- KB suitcase carry — 3 × 30 sec/side (anti-lateral flexion core, grip, traps)
- Farmer carry — 3 × 30m (grip, traps, whole-body bracing)

**Day 2 (Legs) finisher options:**
- KB swing — 3 × 12-15 (explosive hinge, glutes, conditioning)
- Goblet squat burnout — 2 × 20 (metabolic)

Finishers add 5-8 minutes but provide conditioning that supports fat loss.

## Must-Include Exercises (glute / posterior chain gap)

A common plan gap: **no glute-focused exercise**. Squats and RDLs hit glutes but aren't glute-dominant. Always include:

- **Hip thrust (DB/KB)** on Day 2 after RDL — fills the glute gap, supports lower back health

## Progressive Overload

Week-to-week progression within blocks:
- **Foundation weeks**: Add 2.5kg to compounds each week, or add 1 rep if weight stays
- **Deload**: No progression, reduce volume
- **Hypertrophy weeks**: Add 2.5kg or 1 rep, push top of rep ranges on accessories
- **Strength weeks**: Push top set weight each week, heavier loads
- **Test week**: Work up to heavy top sets on each main compound, capture numbers

When all prescribed sets hit the top of the rep range with good form, add weight next session. When lifts drop 2+ weeks running, deficit is too aggressive.

## Session Time Expectations

Include these estimates in the plan so users know what they're committing to:

| Block | Pull (Day 1) | Legs (Day 2) | Push (Day 3) |
|---|---|---|---|
| Foundation | ~50-55 min | ~65-70 min | ~45-50 min |
| Hypertrophy | ~55-60 min | ~70-75 min | ~55-60 min |
| Strength | ~65-70 min | ~75-85 min | ~60-65 min |
| Deload | ~35 min | ~45 min | ~35 min |
| Test | ~30-35 min | ~35-40 min | ~30-35 min |

**Day 2 (Legs) is consistently longest.** If sessions run over, the most redundant exercise to drop is usually a light goblet squat (when Smith squat already covers the pattern).

## Session Cues

Include 1-2 coaching cues per session, focusing on the main compound lifts:

- Squat: "Brace hard before descending. Knees track over toes. Drive through mid-foot."
- Bench: "Retract shoulder blades. Elbows ~45° from body. Control the bar — no bouncing."
- RDL: "Hinge at hips, flat back, push hips back. Feel stretch in hamstrings."
- Hip thrust: "Drive through heels, squeeze glutes hard at top — 1 sec hold."
- KB swing: "Hinge, don't squat. Explosive hip drive. Bell floats on its own."

## Recovery Protocol

### Sleep Routine (priority #1)

- Target: 7-9 hours
- Consistent bedtime within ±30 min window
- Dark, cool room (16-19°C)
- No screens 30 min before bed
- Caffeine cutoff 8 hours before bed
- Same wake time daily — even weekends

### Daily Mobility (20 min max, optional)

- World's greatest stretch (2 min each side)
- 90/90 hip switches (2 min)
- Cat-cow + thread the needle (2 min)
- Couch stretch (2 min each side)
- Deep squat hold (2 min)
- Dead hangs (60 sec × 2)

### Downregulation (post-training + before bed)

Box breathing: 4 in, 4 hold, 4 out, 4 hold, 5-10 rounds. Lowers cortisol.

### Deload Strategy

Every 4 weeks (weeks 4, 8, 12). Keep training frequency, cut volume by 40-50%, keep intensity moderate (70-75% of working weights).

**Signs a deload is needed sooner**: lifts dropping week-over-week, sleep disrupted, persistent joint niggles, resting HR up 5+ bpm.

### Under-Recovery Warning Signs

- Lifts dropping 2+ weeks in a row
- Disrupted sleep despite 8+ hours in bed
- Elevated resting HR
- Persistent soreness that doesn't clear in 48h

**Protocol**: deload immediately, add a rest day, sleep 8+ hours for 3 nights, bump calories 200-300 for 2-3 days.

## Injury Prevention (Prehab) — 20 min, 3× per week

Include every prehab exercise as a clickable link (same video modal system as main programme).

### Shoulders
- Band pull-apart: 3 × 20
- Scapular wall slide: 3 × 10
- External rotation (band): 3 × 15/side

### Hips
- 90/90 hip rotation: 2 × 10/side
- Hip airplane: 2 × 8/side
- Cossack squat: 2 × 8/side

### Knees
- Tibialis raise: 3 × 20
- Terminal knee extension (band): 3 × 15
- Reverse Nordic curl: 3 × 8-10

### Lower Back / Core
- Dead bug: 3 × 10/side
- Bird dog: 3 × 10/side
- McGill curl-up: 3 × 10

### Elbows / Wrists
- Wrist curl: 3 × 15
- Reverse wrist curl: 3 × 15
- Tennis ball squeeze: 2 min

### Pre-Lift Warm-Up (5-10 min)
1. 3-5 min easy cardio (row/bike/walk)
2. Dynamic mobility specific to session
3. Empty bar → 40% → 60% → 80% ramping on main lift
4. First working set

### Training Around Niggles

- Reduce load 20-30%
- Reduce range of motion to pain-free zone
- Sub in alternative exercise
- Do NOT train through sharp pain

### Red Flags (stop, see physio)

- Sharp, localised pain during a lift
- Pain persisting 72+ hours
- Numbness, tingling, weakness
- Swelling
- Pain that wakes you at night

## Progress Tracking System

### Weekly Check-In

Log:
- Morning weight (fasted, same time)
- 7-day rolling average
- Key lift numbers (top set of each compound)
- Sleep average
- Training adherence (workouts done / planned)
- Subjective: energy, mood, motivation (1-5 each)

### Monthly Check-In

- Progress photos (front, side, back — same lighting/time)
- Measurements: waist, chest, arms, thighs
- 1RM estimates on compounds

### Decision Rules

| What's happening | What to do |
|---|---|
| Weight hasn't moved in 2 weeks | Drop calories 150-200 OR add 1000 steps/day |
| Weight dropping faster than 1% BW/week | Bump calories 150, too aggressive |
| Lifts dropping week-over-week | Deficit too aggressive, add 200 kcal |
| Feeling wrecked, sleep bad | Add rest day, bump calories 200-300 for 3 days |
| Weight stable but measurements dropping | Recomping — keep going |

### Photo Protocol

- Same lighting, location, poses
- Morning, fasted, before water
- Same clothes
- Weekly

### Avoiding Scale Obsession

- Weigh daily, trust the 7-day rolling average
- Scale fluctuations = water, sodium, glycogen (not fat)
- Trust 2-week trends, not daily readings

## Step Maxxing

Target: 8,000-10,000 steps/day. Include as a daily non-negotiable in the dashboard.

- Desk workers: 20 min incline treadmill is elite for fat loss
- Walking doesn't interfere with recovery
- Track with watch (more accurate than phone)
