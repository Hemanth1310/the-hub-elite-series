# Updates for Developer - Version A159

**Last Updated:** January 2025
**Purpose:** Complete guide for implementing prototype features into production

---

## 📋 Quick Reference

- **Latest Prototype Version:** A159
- **Key Feature:** Active Now page with full predictions management
- **Database Changes:** Required (see section 3)
- **Breaking Changes:** None (all additive)
- **Priority:** High - Core user functionality

---

## 🎯 What's New Since A81

### Major Features Implemented:
1. **Active Now Page** - Complete prediction submission and management
2. **Round Status Flow** - Open → Locked → Final workflow
3. **MOTW Scoring** - Match of the Week with enhanced points
4. **Save/Edit Flow** - Multiple saves while round is open
5. **Results Display** - Inline results with color-coded points
6. **Compare Feature** - View others' predictions when locked/final
7. **Mobile Responsive** - Full mobile optimization

---

## 📖 Documentation Structure

### Start Here:
1. **CHANGELOG-A81-TO-A159.md** ⭐ - Complete technical changelog
2. **This file (UPDATES-FOR-DEVELOPER.md)** - Overview and quick start
3. **scoring-logic.txt** - Updated scoring rules with MOTW
4. **database-schema.sql** - Required schema changes

### Supporting Docs:
- ADMIN-WORKFLOW.md - Admin round management
- STANDALONE-BUNDLING-RULES.md - Standalone game rules
- SUPABASE-SETUP.md - Auth and database setup

---

## 🗄️ Database Changes Required

### 1. Add New Columns

```sql
-- rounds table
ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS round_type TEXT 
CHECK (round_type IN ('regular', 'standalone')) 
DEFAULT 'regular';

-- matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS is_match_of_the_week BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS result VARCHAR(1) CHECK (result IN ('H', 'U', 'B'));

-- predictions table (if not already present)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES rounds(id),
ADD COLUMN IF NOT EXISTS points INTEGER;
```

### 2. Add Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(round_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_round ON predictions(user_id, round_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);

-- Ensure only one MOTW per round
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches (round_id) 
WHERE is_match_of_the_week = true;
```

### 3. Update Existing Data

```sql
-- Set round_type based on match count (if migrating existing data)
UPDATE rounds r
SET round_type = CASE
  WHEN (
    SELECT COUNT(*) 
    FROM matches m 
    WHERE m.round_id = r.id AND m.include_in_round = true
  ) = 1 THEN 'standalone'
  ELSE 'regular'
END
WHERE round_type = 'regular';
```

**Full schema:** See `/docs/database-schema.sql`

---

## 🔄 Round Status Flow

### Status Definitions

**OPEN**
- Users can submit predictions
- Users can save and edit multiple times
- "Save Predictions" button visible
- Compare with Others: HIDDEN

**LOCKED**
- Auto-locked 5 minutes before first match kickoff
- No more prediction changes allowed (permanent)
- Predictions are frozen
- Compare with Others: VISIBLE
- Matches in progress

**FINAL**
- All matches complete
- Results displayed with points
- Compare with Others: VISIBLE
- Stays in final until admin creates new round

### Backend Logic Required

```typescript
// Cron job: Run every minute
async function autoLockRounds() {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  
  await supabase
    .from('rounds')
    .update({ status: 'locked' })
    .eq('status', 'open')
    .lte('deadline', fiveMinutesFromNow.toISOString());
}

// Trigger: When match marked complete
async function checkAutoFinalize(roundId: string) {
  const { data: matches } = await supabase
    .from('matches')
    .select('status')
    .eq('round_id', roundId)
    .eq('include_in_round', true);
  
  const allComplete = matches.every(m => 
    m.status === 'finished' || m.status === 'completed'
  );
  
  if (allComplete) {
    await supabase
      .from('rounds')
      .update({ status: 'final' })
      .eq('id', roundId);
  }
}
```

---

## 🎲 Scoring Rules (Updated)

### Complete Scoring Matrix

| Match Type | Banker | Correct | Wrong |
|------------|--------|---------|-------|
| Regular | No | +3 | 0 |
| Regular | Yes | +6 | -3 |
| MOTW | No | +6 | 0 |
| MOTW | Yes | +12 | -6 |

### Key Rules

**Banker:**
- Player selects ONE per round
- Doubles points (6 correct / -3 wrong)
- Can be placed on MOTW for 12/-6
- NOT allowed for standalone games
- Required for regular rounds

**MOTW (Match of the Week):**
- Admin designates ONE per round
- Doubles base points (6 vs 3)
- No penalty if wrong (0 points)
- Can be combined with banker (12/-6)
- NOT designated for standalone games

**Standalone Games:**
- All matches worth 3/0 (regular scoring)
- No banker selection
- No MOTW designation

### Calculation Function

```typescript
function calculateMatchPoints(
  prediction: string,
  actualResult: string,
  isBanker: boolean,
  isMOTW: boolean
): number {
  const isCorrect = prediction === actualResult;
  
  if (isBanker && isMOTW) {
    return isCorrect ? 12 : -6;
  }
  
  if (isBanker) {
    return isCorrect ? 6 : -3;
  }
  
  if (isMOTW) {
    return isCorrect ? 6 : 0;
  }
  
  return isCorrect ? 3 : 0;
}
```

**Full details:** See `/docs/scoring-logic.txt`

---

## 💾 Predictions API

### Save Predictions

```typescript
async function savePredictions(
  userId: string, 
  roundId: string, 
  predictions: Prediction[]
) {
  // 1. Validate round is open
  const { data: round } = await supabase
    .from('rounds')
    .select('status, round_type')
    .eq('id', roundId)
    .single();
  
  if (round.status !== 'open') {
    throw new Error('Round is locked. Cannot save predictions.');
  }
  
  // 2. Validate banker rules
  const bankerCount = predictions.filter(p => p.isBanker).length;
  
  if (round.round_type === 'regular' && bankerCount !== 1) {
    throw new Error('You must select exactly one banker');
  }
  
  if (round.round_type === 'standalone' && bankerCount > 0) {
    throw new Error('Banker not allowed for standalone matches');
  }
  
  // 3. Validate all matches have predictions
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('round_id', roundId)
    .eq('include_in_round', true);
  
  if (predictions.length !== matches.length) {
    throw new Error('You must predict all matches');
  }
  
  // 4. Upsert predictions
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      predictions.map(p => ({
        user_id: userId,
        match_id: p.matchId,
        round_id: roundId,
        prediction: p.prediction,
        is_banker: p.isBanker,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'user_id,match_id' }
    );
  
  return { success: true, data };
}
```

### Get User Predictions

```typescript
async function getUserPredictions(userId: string, roundId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select(`
      *,
      match:matches(
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      )
    `)
    .eq('user_id', userId)
    .eq('round_id', roundId);
  
  return { data, error };
}
```

---

## 👥 Compare with Others

### Access Rules

- **Hidden** when round status = 'open'
- **Visible** when round status = 'locked' or 'final'

### Backend Query

```typescript
async function getComparisonData(roundId: string) {
  const { data } = await supabase
    .from('predictions')
    .select(`
      user_id,
      match_id,
      prediction,
      is_banker,
      points,
      user:users(name),
      match:matches(
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        is_match_of_the_week,
        result
      )
    `)
    .eq('round_id', roundId)
    .order('user_id')
    .order('match_id');
  
  return data;
}
```

---

## 🎮 Admin Features

### Set MOTW

```typescript
async function setMatchOfTheWeek(matchId: string, roundId: string) {
  // 1. Clear existing MOTW for this round
  await supabase
    .from('matches')
    .update({ is_match_of_the_week: false })
    .eq('round_id', roundId);
  
  // 2. Set new MOTW
  const { data, error } = await supabase
    .from('matches')
    .update({ is_match_of_the_week: true })
    .eq('id', matchId);
  
  return { data, error };
}
```

### Enter Match Results

```typescript
async function saveMatchResult(matchId: string, result: 'H' | 'U' | 'B') {
  // 1. Update match result
  await supabase
    .from('matches')
    .update({ 
      result: result,
      status: 'finished'
    })
    .eq('id', matchId);
  
  // 2. Calculate points for all predictions on this match
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      id,
      prediction,
      is_banker,
      match:matches(is_match_of_the_week)
    `)
    .eq('match_id', matchId);
  
  for (const pred of predictions) {
    const points = calculateMatchPoints(
      pred.prediction,
      result,
      pred.is_banker,
      pred.match.is_match_of_the_week
    );
    
    await supabase
      .from('predictions')
      .update({ points })
      .eq('id', pred.id);
  }
  
  // 3. Check if round should be finalized
  const match = await supabase
    .from('matches')
    .select('round_id')
    .eq('id', matchId)
    .single();
  
  await checkAutoFinalize(match.data.round_id);
}
```

---

## 📱 Mobile Responsiveness

All pages are now fully mobile-responsive:

- ✅ Stacked layout on small screens
- ✅ Touch-friendly button sizes (min 44px)
- ✅ Horizontal scrolling eliminated
- ✅ Icon-only buttons on mobile where appropriate
- ✅ Readable text at all sizes

**Test on:** 320px, 375px, 414px width viewports

---

## 🧪 Testing Checklist

### Database Tests
- [ ] Add columns successfully
- [ ] Set MOTW on match (only one per round)
- [ ] Try second MOTW → should fail
- [ ] Save predictions with banker
- [ ] Save predictions without banker in regular round → should fail
- [ ] Save predictions with banker in standalone → should fail
- [ ] Lock round → verify predictions frozen
- [ ] Enter match results
- [ ] Verify points calculated correctly (all scenarios)
- [ ] Round auto-finalizes when all matches complete

### API Tests
- [ ] Get current round (open)
- [ ] Save predictions while open → success
- [ ] Edit and save again → success
- [ ] Save predictions while locked → fail
- [ ] Get comparison while open → not accessible
- [ ] Get comparison while locked → success
- [ ] Calculate points: regular (3/0)
- [ ] Calculate points: banker (6/-3)
- [ ] Calculate points: MOTW (6/0)
- [ ] Calculate points: banker+MOTW (12/-6)

### Frontend Tests
- [ ] Display "Round 16" for regular
- [ ] Display "Standalone Match" for standalone
- [ ] Show MOTW badge on correct match
- [ ] Banker star shows on selected match
- [ ] Save predictions → "All predictions saved" message
- [ ] Edit prediction → "Unsaved changes" warning
- [ ] Compare button hidden when open
- [ ] Compare button visible when locked/final
- [ ] Final status shows results with color-coded points
- [ ] Mobile layout works on small screens

---

## 🚀 Deployment Steps

### Phase 1: Database Migration
1. Backup database
2. Run migration scripts (add columns)
3. Add indexes
4. Update existing data (if applicable)
5. Verify with test queries

### Phase 2: Backend Implementation
1. Implement auto-lock cron job (every minute)
2. Implement auto-finalize check (on match complete)
3. Update save predictions API with validation
4. Update get round API
5. Implement comparison API
6. Test all endpoints

### Phase 3: Frontend Integration
1. Replace mock data with API calls
2. Test save/edit flow
3. Test round status transitions
4. Test comparison feature
5. Test mobile responsiveness
6. User acceptance testing

### Phase 4: Admin Tools
1. Implement MOTW selection in admin UI
2. Implement match result entry
3. Test round status management
4. Test bulk operations

---

## 📝 Important Notes

### Single Active Round
- Only ONE round can be 'open' or 'locked' at a time
- Admin must finalize current round before opening next
- See ADMIN-WORKFLOW.md for details

### No User Locking
- Users do NOT lock their own predictions
- System auto-locks 5 min before first match
- Users can save/edit unlimited times while open

### Banker Rules
- Required for regular rounds (validation enforced)
- Forbidden for standalone games (validation enforced)
- Can be placed on MOTW for max points/risk

### MOTW Rules
- One per round (database constraint)
- Set by admin before round opens
- Not applicable to standalone games

---

## 🔗 Quick Links

- **Prototype:** Access at `/version1/active`
- **Changelog:** `/docs/CHANGELOG-A81-TO-A159.md`
- **Scoring:** `/docs/scoring-logic.txt`
- **Schema:** `/docs/database-schema.sql`
- **Admin Guide:** `/docs/ADMIN-WORKFLOW.md`

---

## ❓ FAQ

**Q: Are these breaking changes?**
A: No. All database changes are additive with default values. Existing code continues to work.

**Q: What if users don't save before round locks?**
A: They get 0 points for that round. Frontend should show warnings as deadline approaches.

**Q: Can banker be changed after saving?**
A: Yes, as many times as needed while round is 'open'. Once locked, it's frozen.

**Q: What happens if admin forgets to set MOTW?**
A: Round proceeds normally. All matches use regular scoring (3/0, or 6/-3 for banker).

**Q: How to handle postponed matches?**
A: Set `include_in_round = false`. Bundle into standalone round later.

**Q: Do points need to be stored or calculated on-the-fly?**
A: Either works. Stored points are faster to query, calculated is more flexible. Your choice.

---

## 📞 Need Help?

If anything is unclear:
1. Check the detailed changelog (CHANGELOG-A81-TO-A159.md)
2. Review the prototype at `/version1/active`
3. Test with the interactive controls
4. Reach out with specific questions

**Everything is ready for implementation!** 🎉

---

**Version:** A159  
**Date:** January 2025  
**Status:** Ready for Production ✅
