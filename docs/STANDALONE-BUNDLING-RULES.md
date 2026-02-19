# Standalone Bundling Rules

## Overview

When matches are postponed, they are published as **Standalone bundles**. Admin decides whether games are bundled together or published separately, which determines the locking behavior for users.

---

## Key Rules

### 1. Only ONE Active at a Time

**Rule:** Only ONE round OR standalone can have status "Active" at any time.

**Examples:**
- ✅ Round 16 is Active → No standalones can be Active
- ✅ Standalone #1 is Active → No rounds or other standalones can be Active
- ❌ Round 16 + Standalone #1 both Active = NOT ALLOWED

**To switch:**
1. Change current Active to "Scheduled"
2. Then publish the new round/standalone

---

### 2. Admin Controls Locking Behavior

**Rule:** When admin creates a standalone, the NUMBER of games determines locking behavior:

| Admin Creates | User Locking |
|--------------|--------------|
| **1 game** in standalone | Lock once (single game) |
| **2+ games** in standalone | Lock all together (one action) |

**Note:** Kickoff times don't matter! If admin bundles games together, users lock them together - even if kickoffs are different.

---

## Examples

### Example 1: Single Game Standalone

**Admin creates:**
```
Standalone #1
└─ Man City vs Arsenal - Wednesday 20:00
```

**User experience:**
1. User predicts the game
2. Clicks "Lock Pick"
3. Done ✅

---

### Example 2: Multi-Game Bundle (Same Times)

**Admin creates:**
```
Standalone #2
├─ Man City vs Arsenal    - Wednesday 20:00
└─ Liverpool vs Chelsea   - Wednesday 20:00
```

**User experience:**
1. User predicts both games
2. Clicks "Lock Picks" ONCE
3. Both locked together ✅

---

### Example 3: Multi-Game Bundle (Different Times)

**Admin creates:**
```
Standalone #3
├─ Man City vs Arsenal    - Wednesday 19:30
├─ Liverpool vs Chelsea   - Wednesday 20:15
└─ Everton vs Wolves      - Wednesday 20:45
```

**User experience:**
1. User predicts all 3 games (before 19:25 deadline)
2. Clicks "Lock Picks" ONCE
3. All 3 locked together ✅

**Why bundle different times?**
Admin decides these should be treated as one set. Maybe they're all midweek games, or strategically grouped. Users lock them all at once before first kickoff.

---

### Example 4: Separate Standalones

**Admin creates three separate standalones:**

```
Standalone #1 (Active now)
└─ Man City vs Arsenal - Wednesday 19:30

Then later...

Standalone #2 (Will be Active after #1 is Final)
└─ Liverpool vs Chelsea - Wednesday 20:15

Then later...

Standalone #3 (Will be Active after #2 is Final)
└─ Everton vs Wolves - Wednesday 20:45
```

**User experience:**
- Predict and lock game #1 before 19:25
- After #1 is Final, predict and lock game #2 before 20:10
- After #2 is Final, predict and lock game #3 before 20:40

**Why separate?**
Admin wants players to focus on one game at a time, or games were postponed at different times.

---

## Admin Decision Guide

### When to Bundle Games Together

✅ **Bundle when:**
- Games rescheduled for the same evening/day
- You want players to predict them all at once
- They're strategically related
- Easier for admin to manage as one unit

### When to Keep Separate

✅ **Keep separate when:**
- Games postponed at different times
- You want players to focus on one at a time
- Deadline timing matters (let early predicters lock early games)
- Different strategic importance

---

## Admin Workflow

### Creating a Single-Game Standalone

1. **Go to Admin Panel** → "Postponed Games" tab
2. **Click** "Add Postponed Game"
3. **Add ONE game:**
   - Select teams
   - Set kickoff time
   - Set deadline (default: 5 min before kickoff)
4. **Click** "Publish" → Status becomes Active
5. **Result:** Users lock this one game

---

### Creating a Multi-Game Bundle

1. **Go to Admin Panel** → "Postponed Games" tab
2. **Click** "Add Postponed Game"
3. **Add multiple games:**
   - Add game #1 (e.g., Man City vs Arsenal)
   - Click "Add Match"
   - Add game #2 (e.g., Liverpool vs Chelsea)
   - Click "Add Match"
   - Add game #3 (e.g., Everton vs Wolves)
   - Continue as needed
4. **Set kickoff times** for each game (can be same OR different)
5. **Set deadline** (5 min before FIRST game)
6. **Click** "Publish" → Status becomes Active
7. **Result:** Users lock all games together in one action

---

## Deadline Rules

**For Multi-Game Bundles:**
- Deadline = 5 minutes before FIRST kickoff
- Users must predict ALL games before deadline
- Users lock ALL games together before deadline
- After deadline, all games are locked

**Example:**
```
Bundle with 3 games:
- Game 1: 19:30
- Game 2: 20:15
- Game 3: 20:45

Deadline: 19:25 (5 min before 19:30)

User must:
- Predict all 3 games by 19:25
- Lock all 3 together by 19:25
```

---

## Auto-Complete Timer

**Rule:** Standalone automatically changes to "Completed" status 130 minutes after LAST kickoff.

**Example:**
```
Standalone with 3 games:
- Game 1: 19:30
- Game 2: 20:15
- Game 3: 20:45 (LAST)

Auto-Complete: 23:15 (130 min after 20:45)
```

---

## Only ONE Active Rule

### Scenario: Want to Publish New Standalone

**If another is Active:**

```
❌ ERROR MESSAGE:
"Another round/standalone is already Active. 
Please change Standalone #1 to Scheduled before publishing this one."
```

**Solution:**
1. Go to current Active standalone/round
2. Click "Unpublish"
3. Status changes to Scheduled
4. Now publish your new standalone

---

## Timeline Examples

### Example 1: Bundle All Together

```
ADMIN CREATES:
Standalone #1 (3 games bundled)
├─ Man City vs Arsenal    - Wed 19:30
├─ Liverpool vs Chelsea   - Wed 20:15
└─ Everton vs Wolves      - Wed 20:45

Deadline: Wed 19:25

USER FLOW:
19:00 - User predicts all 3 games
19:20 - User clicks "Lock Picks" → All 3 locked together ✅
19:30 - Game 1 starts
20:15 - Game 2 starts
20:45 - Game 3 starts
23:15 - AUTO: Status → Completed (130 min after 20:45)
23:20 - Admin clicks "Set Final"
```

---

### Example 2: Publish Separately

```
ADMIN CREATES 3 SEPARATE STANDALONES:

Wednesday:
19:00 - Admin publishes Standalone #1 (1 game)
        └─ Man City vs Arsenal - 19:30
        Deadline: 19:25

19:50 - Admin sets Standalone #1 to Final
20:00 - Admin publishes Standalone #2 (1 game)
        └─ Liverpool vs Chelsea - 20:15
        Deadline: 20:10

20:30 - Admin sets Standalone #2 to Final
20:35 - Admin publishes Standalone #3 (1 game)
        └─ Everton vs Wolves - 20:45
        Deadline: 20:40

USER FLOW:
19:15 - User predicts & locks game #1
20:05 - User predicts & locks game #2
20:35 - User predicts & locks game #3

Each standalone handled separately ✅
```

---

## Summary Table

| Admin Creates | Games in Bundle | User Locking | Deadline |
|--------------|-----------------|--------------|----------|
| Standalone #1 | 1 game | Lock once | 5 min before kickoff |
| Standalone #2 | 2 games (same time) | Lock together | 5 min before first game |
| Standalone #3 | 3 games (different times) | Lock together | 5 min before first game |
| 3 Separate | 1 game each | Lock each separately | Each has own deadline |

---

## Key Decisions for Admin

### Question: Should I bundle or keep separate?

**Bundle together if:**
- ✅ All postponed for same reason
- ✅ All rescheduled for same evening
- ✅ Want players to predict as one set
- ✅ Easier management

**Keep separate if:**
- ✅ Postponed at different times
- ✅ Want to stagger player engagement
- ✅ Different strategic importance
- ✅ Large time gaps between games

---

## Best Practices

### ✅ DO:
- Bundle games rescheduled for the same evening
- Use separate standalones if games are days apart
- Set deadline 5 min before first game in bundle
- Remember only ONE Active at a time

### ❌ DON'T:
- Bundle games that are days apart
- Forget to unpublish current Active before publishing new one
- Set deadline after first game starts
- Worry about kickoff times - admin bundling controls locking!

---

## Questions & Answers

**Q: If I bundle 2 games with different kickoff times, how does locking work?**
A: Users lock both together before the first game's deadline. Admin bundling = lock together, regardless of times.

**Q: Can users lock early game and wait for second game?**
A: No. If admin bundles them, users must lock all together before first deadline.

**Q: What if I want users to lock games at different times?**
A: Create separate standalones! Each will have its own deadline and locking.

**Q: Why would I bundle games with different kickoff times?**
A: Common scenario: 3 postponed games all rescheduled for Wednesday evening (7:30 PM, 8:00 PM, 8:30 PM). Easier to manage as one bundle, and players predict all three together.

**Q: What if one game in my bundle gets cancelled?**
A: Unpublish the standalone, remove that game, and republish.

**Q: Can I move a game from one standalone to another?**
A: Not directly. Delete from one, add to another. Or unpublish both, reorganize, republish.

---

## The Simple Rule

**If admin puts games in same standalone → Users lock them together**

**If admin puts games in separate standalones → Users lock them separately**

**Admin controls the grouping. Grouping controls the locking. Simple! ✅**
