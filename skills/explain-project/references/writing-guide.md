# Writing Guide for FOR[name].md

## Voice and Tone

Write like a senior engineer explaining their project to a friend at a whiteboard. You're proud of the good parts, honest about the ugly parts, and genuinely trying to transfer understanding - not impress anyone.

**Do this:**
> The auth system is basically a bouncer at a club. Every request shows its JWT at the door, the middleware checks if it's legit and not expired, and either lets it through or sends it packing with a 401. Simple - except when refresh tokens enter the picture, and then it gets... interesting.

**Not this:**
> The authentication system utilizes JSON Web Tokens (JWTs) to verify user identity. Requests are validated by middleware which checks token validity and expiration. Invalid tokens receive a 401 Unauthorized response.

The first version teaches. The second version documents. This is not documentation.

## Analogies

Analogies are the single most powerful tool for making architecture stick in someone's brain. Every major concept should have one.

Good analogy patterns:
- **Restaurant kitchen** for request/response pipelines (orders come in, get routed to stations, assembled, sent out)
- **Post office** for message queues (letters get sorted, routed, delivered even if recipient isn't home)
- **Assembly line** for data pipelines (raw materials in, transformed at each station, finished product out)
- **Library card catalog** for databases/indexes (you don't search every book - you look up where to find it)

But don't force them. A bad analogy is worse than none. If the concept is straightforward, just explain it directly.

## Structure Within Sections

### Lead with the punchline
Don't build up to the interesting part. State it, then explain it.

**Do this:**
> The entire frontend is a single 400-line React component. Yes, really. Here's why that's actually not as insane as it sounds...

**Not this:**
> The frontend architecture was designed with simplicity in mind. After evaluating several approaches, the team decided to consolidate the UI into a single component...

### Use concrete numbers
Vague statements are forgettable. Specific numbers are memorable.

**Do this:**
> The database has 3 tables. That's it. Users, posts, and comments. Everything else is derived.

**Not this:**
> The database schema is minimal, with a small number of core tables.

### Show real code sparingly
A 3-line code snippet that shows the actual pattern is worth a paragraph of description. But don't paste walls of code - this isn't a code review.

## The Lessons Section

This is the most valuable part of the document. Write it like war stories.

### Bug stories formula
1. **The symptom** - What went wrong? What did the user/developer see?
2. **The misleading clue** - What did it look like the problem was?
3. **The actual cause** - What was really going on?
4. **The fix** - What changed?
5. **The lesson** - What's the generalizable takeaway?

Example:
> **The Case of the Disappearing Sessions**
>
> Users were getting randomly logged out every few hours, but only in production. Locally, everything worked fine. We spent two days convinced it was a Redis configuration issue - the session store was Redis-backed, and the error logs showed session-not-found errors.
>
> Turns out, we had two load balancers, and they weren't sharing session affinity. A user would authenticate against server A, get a session stored in server A's Redis, then their next request would hit server B, which had no idea who they were. The fix was a one-line nginx config change to enable sticky sessions. The lesson: when something only breaks in production, look at what's *between* your services, not just *in* them.

### Pitfalls formula
1. **The trap** - What seems like a good idea but isn't?
2. **Why it's tempting** - Why would someone fall into this?
3. **What actually happens** - The consequences
4. **What to do instead** - The better path

## Things to Avoid

- **Jargon without context.** If you use a term like "event sourcing" or "CQRS", explain what it means in this project's context, even briefly.
- **Listing without explaining.** "We use React, Redux, TypeScript, Tailwind" is useless. *Why* each one matters is the point.
- **False enthusiasm.** Don't call everything "elegant" or "powerful." Be specific about what's good and why.
- **Hedging everything.** "This might be because..." or "It seems like..." - investigate and commit to a position.
- **Ignoring the ugly parts.** Every project has them. Acknowledging them builds trust and teaches more than pretending everything is clean.
