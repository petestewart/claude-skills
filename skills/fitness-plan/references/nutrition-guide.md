# Nutrition Guide

Detailed instructions for generating the nutrition content that goes into the dashboard: meal plan, snack swaps, personal rules, timeline, hydration, and supplements.

## 7-Day Meal Plan

### Rules

- **Hit the targets every day.** Total calories and protein across all meals must land within 5% of target. Protein must hit the full day target — don't leave a large shortfall to be made up by snacks.
- **Use the user's favourite foods as inspiration.** Build meals around what they already love. If they said "Thai food, curries, steak, fajitas, pasta" — make days that feel like those cuisines.
- **Respect dietary restrictions and hated foods absolutely.** If they're vegetarian, no meat. If they said they hate mushrooms, zero mushrooms anywhere. If they're gluten-free, no wheat anywhere including soy sauce (use tamari), croutons, flour tortillas (use corn), etc. Double-check every ingredient.
- **No boring chicken and broccoli** unless they specifically asked for that style.
- **Give every day a theme.** Makes it feel fun, not clinical. Examples:
  - Monday: Mediterranean Monday
  - Tuesday: Tex-Mex Tuesday
  - Wednesday: Wok Wednesday
  - Thursday: Thai Thursday
  - Friday: Fakeaway Friday
  - Saturday: Smokehouse Saturday
  - Sunday: Sunday Roast (Rebuilt)
- **Include at least 2 "treat meals" per week** that feel indulgent but secretly hit macros (e.g., high-protein pizza, lean smash burger with homemade fries).
- **Flag batch-cook meals** — meals where the user can cook 3-4 portions at once.
- **Flag quick meals** — under 15 minutes for busy days.
- **If they drink alcohol**, allocate those calories into specific days (e.g., Saturday) rather than ignoring them. Reduce food calories those days proportionally.

### Meal Structure Per Day

- Breakfast
- Lunch
- Dinner
- Optional dessert or evening snack (use remaining kcal budget)

### Output Format Per Meal

Include in the HTML dashboard:
- Meal name (e.g., "Greek chicken bowl with tzatziki")
- 1-2 line description/key ingredients
- Calories
- Protein, carbs, fat in grams
- Badges where relevant: `Batch cook` / `Treat` / `Quick` / `Meal prep`

### Calibration

Before finalising, verify each day:
```
sum(meal_calories) ≈ target_calories (±5%)
sum(meal_protein) ≥ target_protein
sum(meal_fat) ≥ target_fat × 0.85
```

## Snack Swaps

Look at the user's current snack answers. For each of their current snacks, provide a healthier alternative that **scratches the same itch**:

- Sweet cravings → sweet alternative
- Crunchy → crunchy alternative
- Creamy → creamy alternative
- Salty → salty alternative

Provide **at least 5 swaps total**. Each swap:
- Names the original snack
- Names the swap
- Gives the calorie count of the swap
- Explains briefly why it works (scratches same craving)

**Don't make them boring.** Make the user excited to eat them.

### Examples

| Original | Swap | Why |
|----------|------|-----|
| Milk chocolate bar (230 kcal) | Frozen Greek yogurt bark with dark chocolate chips (120 kcal) | Sweet + creamy, 15g protein |
| Crisps (180 kcal) | Salted roasted chickpeas or air-popped popcorn with sea salt (90 kcal) | Crunchy + salty |
| Late-night biscuits | Protein mug cake (microwave, 3 min, 200 kcal, 25g protein) | Sweet, warm, fills you up |
| Takeaway kebab | Homemade chicken shawarma wrap (450 kcal) | Same flavour, half the calories |

## 5 Personal Fat Loss Rules

Write 5 rules **specific to this user** based on what they told you. Each rule should connect to something they said.

**Format each rule:**
1. Short command headline
2. 1-2 sentences of context/reasoning

### Examples (customise to user)

If they said they drink a lot:
> **Rule 1: Frontload the week, manage the weekend.**
> You drink 12-15 units on Saturdays. Don't cut it out — you won't stick. Instead, build a 600-calorie surplus allowance into Saturdays and shave 100 kcal off Mon-Fri. Keep the social life, keep the deficit.

If they said they struggle with late-night snacking:
> **Rule 2: Save 250 calories for after 9pm.**
> You snack at night out of habit. Don't fight it. Plan for it. A 250-calorie protein dessert (yogurt + berries + dark chocolate) scratches the itch without wrecking the day.

If they said they have a desk job:
> **Rule 3: Walk while you work.**
> You sit 8+ hours. Two 10-minute walks during meetings/calls adds 2,000+ steps with zero effort. Do it daily.

If they said they're always busy:
> **Rule 4: Cook once, eat three times.**
> Every Sunday, batch-cook two proteins (chicken thighs + turkey mince) and two carbs (rice + sweet potatoes). Lunches and dinners assemble in 5 minutes all week.

If they said they struggle with protein:
> **Rule 5: Protein first at every meal.**
> Build meals around the protein source, then add carbs and fats. Hit 40g+ per meal and the day takes care of itself.

## Timeline Projection

Give the user a realistic week-by-week or fortnight-by-fortnight projection for 12 weeks. Be honest — no false promises.

### Template

```
Week 1-2:  -2 to -4 lbs (water + initial fat loss, rapid early drop)
Week 3-4:  -1.5 to -2 lbs per week (settling into rhythm)
Week 5-6:  Progress slows slightly; this is where consistency matters most
Week 7-8:  Halfway point — photos should show visible change. ~8-12 lbs down.
Week 9-10: Potential plateau — may need to drop calories 100-150 or add walking
Week 11-12: Final push — ~12-18 lbs down total if consistent
```

Customise to their starting weight and target. Include encouraging, realistic framing. Warn them about the week 5-6 motivation dip.

## Hydration

### Calculation

- Base: 35ml × weight_kg
- Exercise bonus: +500ml × hours_of_exercise_per_day
- Job bonus: +500ml (mixed/physical) or +1000ml (heavy physical/outdoor)

Round to nearest 0.25L for display.

### Practical Tips (customise to their lifestyle)

Give 3-4 tips specific to them:
- Desk job: "1L bottle at your desk, refill after lunch — hits 2L by 3pm"
- Physical job: "2L water bottle in the van/on the site, carry it with you"
- Early gym: "500ml on waking, 500ml during workout"
- Parent: "Glass of water while kids have breakfast — habit-stack"

### Fat Loss Connection

Include a short explainer (2-3 sentences):
> Dehydration suppresses metabolism, increases hunger signals (which read as thirst), and tanks gym performance. Hitting your water target isn't optional — it multiplies the effect of everything else you're doing.

## Supplements

Recommend ONLY evidence-backed supplements. Don't recommend anything unnecessary.

Food, training, sleep, consistency = 99%. Supplements = 1%.

### Consider Based On User's Answers

| Supplement | When to Recommend | Dose | Timing |
|-----------|-------------------|------|--------|
| Whey protein | Struggling to hit protein from food | 25-40g | Post-workout or between meals |
| Creatine monohydrate | Always recommend | 3-5g | Any time, daily, consistent |
| Caffeine | Trains early / energy slumps | 100-200mg | 30 min pre-workout |
| Vitamin D3 | Low sunlight climate OR winter | 1000-2000 IU | With a meal containing fat |
| Omega-3 fish oil | Joint issues, physical worker, gym regular | 1-2g EPA+DHA | With meals |
| Magnesium glycinate | Sleep issues, high stress, muscle cramps | 200-400mg | Evening |

### Per Supplement, Include

- Dose
- Best time to take
- Why it's relevant to **this specific user** (connect to their answers)
- Budget-friendly note: "Any reputable brand works — don't overpay for marketing"

### Framing

Be clear upfront:
> These are the 1%. Don't let any supplement convince you it's doing the work. It isn't. Calories, protein, training, sleep, consistency are doing the work. These just nudge the edges.
