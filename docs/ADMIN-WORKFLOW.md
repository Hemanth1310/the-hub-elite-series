# Admin Workflow Guide

## Round Status Flow

```
Scheduled → Active → Completed → Final
            ↓_________________↗
        (Admin can skip directly to Final)
```

- **Scheduled**: Round is created but not yet available to players
- **Active**: Round is live and available for predictions/viewing
- **Completed**: (AUTOMATIC) All games finished - awaiting admin finalization
- **Final**: Round is complete with final results locked

---

## Automatic Status Changes

### Active → Completed (AUTOMATIC)

**Trigger:** 130 minutes after the last scheduled kickoff time in the round

**Why 130 minutes?**
- 90 min match + 15 min injury time + 25 min buffer = 130 min
- Covers delays, extra time, VAR reviews, etc.
- Safe assumption all games are finished

**Example:**
```
Round 16 - Saturday games:
- First game: 12:30 kickoff
- Last game: 17:30 kickoff

Timeline:
12:00 - Admin publishes round (Status: Active)
17:30 - Last game starts
20:00 - AUTOMATIC: Status → "Completed" (130 min after 17:30)
```

**Important:** Admin can click "Set Final" at ANY time during "Active" status to skip directly to "Final" (bypassing "Completed")

---

## Setting Up Rounds

### Initial Setup (First Time)

1. Upload all 30 rounds to Supabase
2. For each round, add the 10 matches
3. Set dates/times for the first 10 games only
4. **Default deadline**: Automatically set to 5 minutes before first game starts
5. Games without dates = remain in "Scheduled" status

### Round Setup Workflow

#### 1. Create/Edit Round (Status: Scheduled)

**Actions available:**
- ✅ Add matches
- ✅ Set match dates/times
- ✅ Select Match of the Week (MOTW)
- ✅ **Postpone match** (moves to Postponed Games section)
- ✅ **Delete match** (with confirmation)
- ✅ Edit deadline
- ✅ Save changes
- ✅ Publish round

**Rules:**
- Can postpone any match → moves to Postponed section with original round number
- Delete requires confirmation: "Are you sure you want to delete this match?"
- Postpone requires confirmation: "Are you sure you want to postpone this match?"
- Only ONE round can be Active at a time
- If trying to publish when another round is Active → Show warning: "Change current active round to Scheduled before publishing this one"
- **MOTW must be selected BEFORE publishing** - cannot change once Active

---

#### 2. Publish Round (Status: Scheduled → Active)

When you click "Publish Round":
- Round becomes Active
- Players can now make predictions
- Deadline countdown starts
- **MOTW is LOCKED** (cannot be changed)
- **Matches are LOCKED** (cannot add/remove)

**Note:** Only ONE Active round/standalone at a time. To publish a different round:
1. Go to current Active round
2. Click "Unpublish" to change it to Scheduled
3. Now you can publish the new round

---

#### 3. Manage Active Round (Status: Active)

**During predictions (before deadline):**
- Players can make/edit predictions
- Players can see countdown timer
- Home page shows "OPEN" with timer

**After deadline but games ongoing:**
- Predictions locked
- Matches show as "In Progress"
- Home page shows "IN PROGRESS - Games underway"
- Active Now page shows "Games underway - Results pending"
- **Admin can ONLY edit results** (no MOTW changes, no adding matches)

**To change MOTW or add/remove matches when Active:**
1. Click "Unpublish" → Status changes to Scheduled
2. Make your changes (MOTW, add/delete matches)
3. Click "Publish" → Status back to Active
4. **Note:** This will affect live predictions, use carefully!

---

#### 4. Automatic Transition (Status: Active → Completed)

**Happens automatically 130 minutes after last scheduled kickoff**

When status changes to "Completed":
- Clear signal to admin: "All games should be finished"
- Admin enters/verifies any remaining results
- Results still hidden from players
- Admin clicks "Set Final" when confident

**Note:** Admin doesn't have to wait for this - can click "Set Final" during "Active" status to skip directly to "Final"

---

#### 5. Enter Results (Status: Active or Completed)

**Actions available:**
- ✅ Enter result for each match (H/U/B)
- ✅ Save changes
- ✅ Unpublish (revert to Scheduled - only from Active)
- ✅ Set Final (only if ALL matches have results)

**Rules:**
- "Set Final" button is **disabled** until ALL matches have results
- If clicking "Set Final" with missing results → Error message: "All games must have results before setting final"
- Shows count: "Cannot set final: 2 match(es) still missing results"

---

#### 6. Set Final (Status: Active/Completed → Final)

When you click "Set Final":
- Round is locked as Final
- Results are published to all players
- Points are calculated
- Leaderboard is updated
- Players can see their scores

**Can be done from:**
- ✅ Active status (skip Completed)
- ✅ Completed status (after automatic change)

**If you need to edit results after finalizing:**
1. Click "Edit Round"
2. Status changes back to Active
3. Edit the results
4. Click "Set Final" again

---

## Postponed Games Workflow

### Moving a Match to Postponed

1. In round edit (Status: Scheduled)
2. Click "Postpone" button on a match
3. Confirm: "Are you sure you want to postpone this match?"
4. Match is removed from round
5. Match appears in "Postponed Games" section
6. Stores: game info + original round number + NO dates set

**Postponed section shows:**
```
┌──────────────────────────────────┐
│ Postponed Games (3)              │
│                                  │
│ Man City vs Arsenal              │
│ From Round 16          [POSTPONED]│
│                                  │
│ Liverpool vs Chelsea             │
│ From Round 17          [POSTPONED]│
└──────────────────────────────────┘
```

---

### Publishing Postponed Games (Standalones)

Each postponed game is published as part of a standalone bundle:

**Status: Scheduled**
1. Go to "Postponed Games" section
2. Click "Add Postponed Game" or edit existing
3. ✅ Add one or multiple postponed games to the bundle
4. ✅ Set date/time for each game
5. ✅ Set deadline (default: 5 min before first game)
6. ✅ Delete games if needed
7. Click "Publish" - Status changes to Active

**Status: Active**
- ❌ Cannot add/remove matches
- ❌ Cannot change dates/times
- ❌ Cannot change deadline
- ✅ Can ONLY edit results
- **No MOTW selection** (already determined from original round)

**To change dates/times or add/remove matches when Active:**
1. Click "Unpublish" → Status changes to Scheduled
2. Make your changes (dates, times, add/remove matches)
3. Click "Publish" → Status back to Active
4. **Note:** This will affect live predictions, use carefully!

**Admin Controls Locking:**
- **1 game in standalone** → Users lock once (single game)
- **2+ games in standalone** → Users lock all together (one action)
- Kickoff times don't matter - admin bundling controls locking behavior

**Multiple Games in Same Bundle:**
- ✅ You CAN bundle games with different kickoff times (e.g., 3:00 PM and 4:00 PM)
- ✅ You CAN bundle games from different original rounds
- ✅ All games bundled together = Users lock together
- ✅ Games in separate standalones = Users lock separately

**Only ONE Active Standalone Rule:**
- Only ONE standalone bundle can have status "Active" at a time
- Only ONE regular round can have status "Active" at a time
- Only ONE of either (standalone OR round) can be Active total
- To activate another: Change current Active to "Scheduled" first

---

## Admin Page Overview

### Rounds List

Shows all rounds with status badges:

```
Round 18  [SCHEDULED]  - Edit | Publish
Round 17  [ACTIVE]     - Edit | Unpublish | Set Final
Round 16  [COMPLETED]  - Edit | Set Final
Round 15  [FINAL]      - View | Edit
Round 14  [FINAL]      - View | Edit
```

### Postponed Games List

Shows all postponed standalones:

```
Man City vs Arsenal  [From Round 16]  [SCHEDULED] - Edit | Publish
Liverpool vs Chelsea [From Round 17]  [ACTIVE]    - Edit | Unpublish
```

---

## User Experience During Different Statuses

### Status: Scheduled
- **Players don't see this round** (hidden from them)
- Only admins can see and edit

### Status: Active (Before deadline)
```
Home Page:
┌────────────────────────┐
│ Round 16  [OPEN]       │
│ Time Remaining         │
│ ⏰ 1h 59m              │
│ → Go to Active Now     │
└────────────────────────┘

Active Now Page:
- Shows all matches
- Prediction form active
- Timer visible
- "Lock Picks" button enabled
```

### Status: Active (Matches in progress)
```
Home Page:
┌────────────────────────┐
│ Round 16  [IN PROGRESS]│
│ Games underway         │
│ Results pending        │
│ → View your picks      │
└────────────────────────┘

Active Now Page:
- Shows "Games underway"
- Your predictions visible
- Matches show "In Progress"
- "Results pending" message
```

### Status: Completed (All matches finished - automatic after 130 min)
```
Home Page:
┌────────────────────────┐
│ Round 16  [COMPLETED]  │
│ All games finished     │
│ Final results pending  │
│ → View your picks      │
└────────────────────────┘

Active Now Page:
- Shows "All games finished"
- Your predictions visible
- Matches show scores
- "Final results pending" message
- Admin: "Finalize this round to publish results"
```

### Status: Final
```
Home Page:
┌────────────────────────┐
│ Round 16  [FINAL]      │
│ Round Complete         │
│ → See results          │
└────────────────────────┘

Active Now Page:
- Shows final results
- Your score visible
- Points breakdown shown
- Correct/incorrect highlighted
```

---

## Quick Reference

### Status Changes
```
Scheduled → Active (Manual: Admin clicks "Publish")
Active → Completed (Automatic: 130 min after last kickoff)
Active → Final (Manual: Admin clicks "Set Final" - skips Completed)
Completed → Final (Manual: Admin clicks "Set Final")
Final → Active (Manual: Admin clicks "Edit Round")
```

### Automatic Rules
- ✅ Active → Completed after 130 minutes from last scheduled kickoff
- ✅ Only ONE Active round at a time
- ✅ All matches must have results before Set Final

### Confirmations Required
- ✅ Delete match
- ✅ Postpone match
- ❌ Add match (no confirmation)
- ❌ Edit result (no confirmation)
- ❌ Set Final (validation only)

### Validation Rules
- ✅ Only ONE Active round at a time
- ✅ All matches must have results before Set Final
- ✅ Cannot change MOTW after publishing
- ✅ Cannot edit matches in Final status (must unlock first)

### Button Labels
- "Postpone" (not "Move to Postponed")
- "Publish Round" (changes Scheduled → Active)
- "Unpublish" (changes Active → Scheduled)
- "Set Final" (changes Active/Completed → Final)
- "Edit Round" (unlocks Final → Active)

---

## Timeline Examples

### Example 1: Quick Finalization (Admin sets Final early)
```
Round 16 - All games Saturday at 15:00
15:00 - Last game starts
16:45 - Admin enters all results
16:46 - Admin clicks "Set Final" (Status: Active → Final)
       ✅ Skipped "Completed" entirely
```

### Example 2: Automatic Completion
```
Round 17 - Games spread across weekend
Saturday 12:30 - First game
Sunday 16:30 - Last game starts
Sunday 18:40 - AUTOMATIC: Status → Completed (130 min after 16:30)
Sunday 19:00 - Admin reviews results
Sunday 19:05 - Admin clicks "Set Final" (Status: Completed → Final)
```

### Example 3: Postponed Game (Standalone)
```
Standalone - Man City vs Arsenal (from Round 16)
Wednesday 20:00 - Kickoff
Wednesday 22:10 - AUTOMATIC: Status → Completed (130 min after 20:00)
Wednesday 22:15 - Admin clicks "Set Final"
```

---

## Troubleshooting

### "Cannot publish round - another round is Active"
**Solution:** Go to current Active round → Click "Unpublish" → Go back and publish new round

### "Cannot set final - matches missing results"
**Solution:** Enter results for all matches before clicking "Set Final"

### "Where did my postponed match go?"
**Solution:** Check "Postponed Games" section - it's there with original round number

### "Players can't see the round I just created"
**Solution:** Round is still "Scheduled" - click "Publish Round" to make it Active

### "Status still says Active but games are finished"
**Solution:** Either:
1. Wait for automatic change to "Completed" (130 min after last kickoff)
2. OR enter all results and click "Set Final" now (skips Completed)

### "I clicked Set Final but need to change a result"
**Solution:** Click "Edit Round" → Changes from Final to Active → Edit results → Click "Set Final" again
