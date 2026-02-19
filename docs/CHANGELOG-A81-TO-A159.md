# Changelog: Version A81 to A159

**Date:** January 2025
**Purpose:** Database-relevant changes for developer implementation

---

## Overview

Major development of the **Active Now** page functionality, including predictions management, round status flow, MOTW scoring rules, and results display. This document focuses on changes that require database schema updates or backend implementation.

---

## 1. Round Status Management

### Database Schema Changes

**Table:** `rounds`

**Status Flow Updated:**

```sql
-- Old statuses (if different)
-- 'scheduled', 'open', 'active', 'completed', 'scored'

-- New/Clarified statuses
-- 'open' - Users can submit/edit predictions
-- 'locked' - Predictions frozen (5 min before first match), matches in progress
-- 'final' - All matches complete, results available
```

### Status Transition Rules

1. **Open → Locked**
   - Triggered by admin/system 5 minutes before first match kickoff
   - Users can no longer edit predictions
   - All predictions must be saved before this point

2. **Locked → Final**
   - Triggered when all matches in round are complete
   - Results are now visible to users
   - Points calculated and displayed

3. **Final → Open (next round)**
   - Admin creates and opens new round
   - Previous round remains in 'final' state indefinitely

### Required Backend Logic

```typescript
// Auto-lock rounds approaching deadline
async function autoLockRounds() {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  
  await supabase
    .from('rounds')
    .update({ status: 'locked' })
    .eq('status', 'open')
    .lte('deadline', fiveMinutesFromNow.toISOString());
}

// Auto-finalize completed rounds
async function autoFinalizeRounds() {
  // Get all locked rounds
  const { data: lockedRounds } = await supabase
    .from('rounds')
    .select('id')
    .eq('status', 'locked');
  
  for (const round of lockedRounds) {
    // Check if all matches are complete
    const { data: matches } = await supabase
      .from('matches')
      .select('status')
      .eq('round_id', round.id)
      .eq('include_in_round', true);
    
    const allComplete = matches.every(m => 
      m.status === 'finished' || m.status === 'completed'
    );
    
    if (allComplete) {
      await supabase
        .from('rounds')
        .update({ status: 'final' })
        .eq('id', round.id);
    }
  }
}
```

---

## 2. Predictions Management

### User Prediction Flow

**Key Rules:**
- Users can save predictions multiple times while round is **Open**
- Clicking "Save Predictions" does NOT change round status
- Users can edit after saving (while still Open)
- Once **Locked**, no more editing allowed (permanent)
- Once **Final**, predictions remain locked, results shown

### Database Operations

**Save Predictions (While Open):**

```typescript
async function savePredictions(userId: string, roundId: string, predictions: Prediction[]) {
  // Check round status
  const { data: round } = await supabase
    .from('rounds')
    .select('status')
    .eq('id', roundId)
    .single();
  
  if (round.status !== 'open') {
    throw new Error('Round is locked. Cannot save predictions.');
  }
  
  // Upsert predictions (update if exists, insert if new)
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      predictions.map(p => ({
        user_id: userId,
        match_id: p.matchId,
        prediction: p.prediction,
        is_banker: p.isBanker,
        round_id: roundId,
      })),
      { onConflict: 'user_id,match_id' }
    );
  
  return { data, error };
}
```

### UI Feedback States

**Frontend should track:**
- `isSaved` - Boolean indicating if current predictions are saved
- Set to `false` when user changes any prediction or banker
- Set to `true` after successful save
- Used to show "Unsaved changes" warning or "All predictions saved" confirmation

---

## 3. MOTW (Match of the Week) Scoring

### Database Schema

**Table:** `matches`

**Column:** `is_match_of_the_week` (or `isMatchOfTheWeek`)

```sql
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS is_match_of_the_week BOOLEAN DEFAULT false;
```

**Rules:**
- Only ONE match per round can be MOTW
- Admin designates which match
- MOTW is NOT applicable to standalone games

### Scoring Logic

**Complete Scoring Rules:**

| Scenario | Correct | Wrong |
|----------|---------|-------|
| **Regular Match** | +3 | 0 |
| **Banker Only** | +6 | -3 |
| **MOTW Only** | +6 | 0 |
| **Banker + MOTW** | +12 | -6 |

### Backend Calculation

```typescript
function calculateMatchPoints(
  prediction: string,
  actualResult: string,
  isBanker: boolean,
  isMOTW: boolean
): number {
  const isCorrect = prediction === actualResult;
  
  // Banker + MOTW (same match)
  if (isBanker && isMOTW) {
    return isCorrect ? 12 : -6;
  }
  
  // Banker only
  if (isBanker) {
    return isCorrect ? 6 : -3;
  }
  
  // MOTW only
  if (isMOTW) {
    return isCorrect ? 6 : 0;
  }
  
  // Regular match
  return isCorrect ? 3 : 0;
}
```

### MOTW Validation

```sql
-- Ensure only one MOTW per round
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches (round_id) 
WHERE is_match_of_the_week = true;
```

---

## 4. Banker Selection Rules

### Database Schema

**Table:** `predictions`

**Column:** `is_banker` (boolean)

### Validation Rules

**For Regular Rounds:**
- User MUST select exactly ONE banker
- Banker can be any match in the round
- Banker can be the MOTW (for 12/-6 scoring)

**For Standalone Games:**
- NO banker selection allowed
- `is_banker` must be `false` for all predictions in standalone rounds

### Backend Validation

```typescript
async function validateBankerSelection(
  userId: string, 
  roundId: string,
  predictions: Prediction[]
): Promise<{ valid: boolean; error?: string }> {
  // Get round type
  const { data: round } = await supabase
    .from('rounds')
    .select('round_type')
    .eq('id', roundId)
    .single();
  
  const bankerCount = predictions.filter(p => p.isBanker).length;
  
  // Standalone: no banker allowed
  if (round.round_type === 'standalone') {
    if (bankerCount > 0) {
      return {
        valid: false,
        error: 'Banker selection not allowed for standalone matches'
      };
    }
  }
  
  // Regular round: exactly one banker required
  if (round.round_type === 'regular') {
    if (bankerCount === 0) {
      return {
        valid: false,
        error: 'You must select one banker'
      };
    }
    if (bankerCount > 1) {
      return {
        valid: false,
        error: 'You can only select one banker'
      };
    }
  }
  
  return { valid: true };
}
```

---

## 5. Match Results Storage

### Database Schema

**Table:** `matches`

**Column:** `result` (for storing actual match outcome)

```sql
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS result VARCHAR(1) CHECK (result IN ('H', 'U', 'B'));
```

**Values:**
- `H` - Home win
- `U` - Draw (Undecided)
- `B` - Away win (Borte in Norwegian)
- `NULL` - Match not yet played

### Admin Result Entry

```typescript
async function saveMatchResult(
  matchId: string,
  result: 'H' | 'U' | 'B'
) {
  // Update match result
  const { data, error } = await supabase
    .from('matches')
    .update({ 
      result: result,
      status: 'finished' // or 'completed'
    })
    .eq('id', matchId);
  
  return { data, error };
}
```

### Points Calculation Trigger

After all match results are entered, calculate points:

```typescript
async function calculateRoundPoints(roundId: string) {
  // Get all predictions for this round
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      *,
      match:matches(result, is_match_of_the_week)
    `)
    .eq('round_id', roundId);
  
  // Calculate points for each prediction
  const pointsUpdates = predictions.map(pred => {
    const points = calculateMatchPoints(
      pred.prediction,
      pred.match.result,
      pred.is_banker,
      pred.match.is_match_of_the_week
    );
    
    return {
      id: pred.id,
      points: points
    };
  });
  
  // Update predictions with points
  // (Alternatively, calculate on-the-fly when displaying)
  for (const update of pointsUpdates) {
    await supabase
      .from('predictions')
      .update({ points: update.points })
      .eq('id', update.id);
  }
}
```

---

## 6. Standalone Game Rules

### Differences from Regular Rounds

**Standalone games:**
- Can have 1-4 matches (flexible)
- NO banker selection
- NO MOTW designation
- Each match worth 3 points (correct) or 0 points (wrong)

### Display Logic

```typescript
// Get current round with type detection
const { data: currentRound } = await supabase
  .from('rounds')
  .select(`
    *,
    matches(*)
  `)
  .eq('status', 'open') // or 'locked'
  .single();

// Frontend display
if (currentRound.round_type === 'standalone') {
  // Show: "Standalone Match" (or "Standalone Matches")
  // Hide: Banker selection column
  // Hide: MOTW badges
} else {
  // Show: "Round {round_number}"
  // Show: Banker selection column
  // Show: MOTW badge on designated match
}
```

---

## 7. Compare with Others Functionality

### Access Rules

**Compare button visibility:**
- **Hidden** when round status = 'open' (users still predicting)
- **Visible** when round status = 'locked' or 'final'

### Database Query

```typescript
async function getComparisonData(roundId: string, currentUserId: string) {
  // Get all users' predictions for this round
  const { data: allPredictions } = await supabase
    .from('predictions')
    .select(`
      user_id,
      match_id,
      prediction,
      is_banker,
      points,
      user:users(name)
    `)
    .eq('round_id', roundId)
    .order('user_id');
  
  // Group by user and match for comparison table
  // Frontend will display side-by-side predictions
  
  return allPredictions;
}
```

---

## 8. Results Display (Final Status)

### UI Requirements

When round status = 'final', display for each match:
1. User's prediction (H/U/B)
2. Actual result (H/U/B) - from `matches.result`
3. Points earned - calculated based on scoring rules

### Color Coding

```typescript
// Frontend color logic
const points = calculateMatchPoints(...);

const colorClass = 
  points > 0 ? 'text-green-400' :  // Correct (green)
  points < 0 ? 'text-red-400' :     // Wrong banker (red)
  'text-slate-500';                 // Wrong regular (gray)
```

---

## 9. Email Notifications (Future)

### Notification Triggers

**Round Opened:**
- Send when round status changes to 'open'
- "Round X is now open! Submit your predictions before [deadline]"

**Round Closing Soon:**
- Send 24 hours before deadline
- Send 1 hour before deadline
- "Last chance to submit predictions for Round X!"

**Round Results:**
- Send when round status changes to 'final'
- "Round X results are in! You scored X points"

### Database Table (if storing templates)

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 10. Time Display Updates

### Extended Countdown Support

**Updated logic for durations over 24 hours:**

```typescript
function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Closed';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}, ${hours} hr${hours !== 1 ? 's' : ''}, ${minutes} min`;
  }
  
  if (hours > 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}, ${minutes} min`;
  }
  
  return `${minutes} min`;
}
```

---

## 11. Admin Role Management

### Clarification

**User roles:**
- Determined by Supabase Auth registration (NOT by `profiles.role`)
- Admin users registered separately
- Admin users can also be players (same login, dual role)
- Admin name displayed as regular player (no role indicator visible to others)

### Database Structure

```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT -- May exist but NOT used for admin determination
);

-- Admin status determined by Supabase Auth
-- Check: auth.users metadata or separate admin table
```

### Backend Check

```typescript
async function isAdmin(userId: string): Promise<boolean> {
  // Method 1: Supabase Auth metadata
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata?.role === 'admin';
  
  // Method 2: Separate admin table
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !!data;
}
```

---

## 12. Database Schema Summary

### New/Updated Columns

**Table: `rounds`**
```sql
-- Existing: id, competition_id, round_number, deadline, status, created_at
round_type TEXT CHECK (round_type IN ('regular', 'standalone')) DEFAULT 'regular'
```

**Table: `matches`**
```sql
-- Existing: id, round_id, home_team_id, away_team_id, kickoff, status, include_in_round
is_match_of_the_week BOOLEAN DEFAULT false,
result VARCHAR(1) CHECK (result IN ('H', 'U', 'B'))
```

**Table: `predictions`**
```sql
-- Existing: id, user_id, match_id, prediction, is_banker, created_at, updated_at
round_id UUID REFERENCES rounds(id), -- If not already present
points INTEGER -- Optional: can calculate on-the-fly
```

### Indexes for Performance

```sql
-- Ensure efficient queries
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_round ON predictions(user_id, round_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);

-- MOTW constraint
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches (round_id) 
WHERE is_match_of_the_week = true;
```

---

## 13. Migration Steps

### Step 1: Add New Columns

```sql
-- Add round_type (safe, has default)
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS round_type TEXT 
CHECK (round_type IN ('regular', 'standalone')) 
DEFAULT 'regular';

-- Add MOTW flag
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS is_match_of_the_week BOOLEAN DEFAULT false;

-- Add match result
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS result VARCHAR(1) 
CHECK (result IN ('H', 'U', 'B'));

-- Add points column (optional)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS points INTEGER;
```

### Step 2: Update Existing Data

```sql
-- Set round_type based on match count
UPDATE rounds r
SET round_type = CASE
  WHEN (
    SELECT COUNT(*) 
    FROM matches m 
    WHERE m.round_id = r.id AND m.include_in_round = true
  ) = 1 THEN 'standalone'
  ELSE 'regular'
END
WHERE round_type = 'regular'; -- Only update defaults

-- Verify
SELECT round_number, round_type, 
       (SELECT COUNT(*) FROM matches WHERE round_id = rounds.id AND include_in_round = true) as match_count
FROM rounds
ORDER BY round_number;
```

### Step 3: Add Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_round ON predictions(user_id, round_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches (round_id) 
WHERE is_match_of_the_week = true;
```

---

## 14. Testing Checklist

### Database Tests
- [ ] Create regular round with 8 matches
- [ ] Create standalone round with 1 match
- [ ] Set MOTW on one match in regular round
- [ ] Try to set MOTW on two matches → should fail (constraint)
- [ ] Save predictions with one banker → success
- [ ] Save predictions with zero bankers in regular round → should fail
- [ ] Save predictions with banker in standalone → should fail
- [ ] Lock round → verify users cannot save predictions
- [ ] Enter match results
- [ ] Calculate points with MOTW + banker scenarios
- [ ] Set round to final → verify results display

### API Function Tests
- [ ] Get current round (open status)
- [ ] Save predictions while open → success
- [ ] Save predictions while locked → should fail
- [ ] Get comparison data while open → should not be accessible
- [ ] Get comparison data while locked/final → success
- [ ] Calculate points for all scoring scenarios
- [ ] Auto-lock round 5 min before deadline

### Frontend Tests
- [ ] Display "Round X" for regular rounds
- [ ] Display "Standalone Match" for standalone
- [ ] Hide Compare button while open
- [ ] Show Compare button when locked/final
- [ ] Display MOTW badge correctly
- [ ] Show banker star on selected match
- [ ] Save predictions → see "All predictions saved" message
- [ ] Edit prediction → see "Unsaved changes" warning
- [ ] View final results with color-coded points
- [ ] Mobile responsiveness on all screens

---

## 15. Files Updated

### Documentation
- ✅ `/docs/CHANGELOG-A81-TO-A159.md` - This file
- ✅ `/docs/UPDATES-FOR-DEVELOPER.md` - Updated with latest info
- ✅ `/docs/database-schema.sql` - Add new columns/indexes
- ✅ `/docs/scoring-logic.txt` - Update with MOTW rules

### Prototype Frontend (Reference)
- `/src/pages/v1/ThisRound.tsx` - Full Active Now implementation
- `/src/types.ts` - Updated interfaces
- `/src/mockData.ts` - Sample data with new fields
- `/src/lib/timeUtils.ts` - Extended time formatting

---

## 16. Key Takeaways for Developer

### Critical Database Changes
1. **Add `round_type` column** to `rounds` table
2. **Add `is_match_of_the_week` column** to `matches` table
3. **Add `result` column** to `matches` table
4. **Add unique constraint** on MOTW (one per round)
5. **Add indexes** for performance

### Critical Business Logic
1. **Status flow:** open → locked (5 min before) → final (after completion)
2. **Predictions:** Can save multiple times while open, locked forever after
3. **Banker:** Required for regular rounds, forbidden for standalone
4. **MOTW scoring:** 6/0 vs regular 3/0, stacks with banker (12/-6)
5. **Compare:** Only accessible when locked or final

### No Breaking Changes
- All changes are additive (new columns have defaults)
- Existing code continues to work
- New features are opt-in

---

## Questions?

For clarification on any point in this changelog:
- Review the prototype at `/version1/active`
- Check `/docs/database-schema.sql` for complete schema
- Test the interactive controls to see all states

**This is ready for backend implementation!** 🚀
