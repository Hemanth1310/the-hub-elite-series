# Database Changelog

This file tracks all database schema changes starting from Version A81.

## Version A88 - Business Rule: No Predictions = 0 Points
**Date:** January 2025

### Business Rule Clarification
**Rule:** If a player does not complete their picks OR does not lock their predictions before the admin locks the round, the player will have NO PICKS for that round and will receive 0 points.

### Applies To:
- Regular rounds (must have all 8 predictions + 1 banker selected)
- Standalone matches (must have prediction submitted)

### UI Fix
- Removed standalone matches section from bottom of page during prototype testing
- Standalone matches now only visible when **[Standalone]** toggle is selected
- Applied to both v1 and v2

### Documentation Updated
- `/docs/scoring-logic.txt` - Added SUBMISSION RULES section with critical rule

---

## Version A87 - Removed Version 3
**Date:** January 2025

### Changes
- **DELETED:** All Version 3 files (9 files total)
  - `/src/pages/v3/Admin.tsx`
  - `/src/pages/v3/AdminRound.tsx`
  - `/src/pages/v3/CompareRound.tsx`
  - `/src/pages/v3/CompareRoundHistory.tsx`
  - `/src/pages/v3/Layout.tsx`
  - `/src/pages/v3/Leaderboard.tsx`
  - `/src/pages/v3/Rounds.tsx`
  - `/src/pages/v3/Stats.tsx`
  - `/src/pages/v3/ThisRound.tsx`
- **REMOVED:** All v3 routes from `App.tsx`
- **REMOVED:** All v3 imports from `App.tsx`

### Rationale
Version 3 will not be used. Focus remains on Version 1 (Analytics Minimal) and Version 2 (Premium Minimalism) only.

---

## Version A86 - Fixed Round/Standalone Toggle and Banker Rules
**Date:** January 2025

### UI Changes - Round/Standalone Toggle
- Fixed toggle to properly switch between regular rounds and standalone matches
- When **Round** selected: Shows all regular matches (8 games), hides standalone section
- When **Standalone** selected: Shows only standalone/postponed matches, different title

### UI Changes - Banker Restrictions for Standalone
- **V1 & V2:** Banker button now disabled in standalone mode
  - Added `opacity-30 cursor-not-allowed` styling
  - Added to disabled condition: `prototypeRoundType === 'standalone'`
  - Updated instructions to show "Banker not available for standalone matches"
  - Lock validation updated: banker not required in standalone mode
- **V3:** Not updated (will be removed)

### Files Modified
- `/src/pages/v1/ThisRound.tsx`
- `/src/pages/v2/ThisRound.tsx`

---

## Version 81 - January 2025

### Added: Round Type Support (Round vs Standalone)

**Date:** January 2025
**Reason:** Improve UX - users struggled to find standalone matches when mixed with regular rounds

#### Schema Changes

**1. Added `round_type` column to `rounds` table:**

```sql
ALTER TABLE rounds 
ADD COLUMN round_type TEXT CHECK (round_type IN ('regular', 'standalone')) DEFAULT 'regular';
```

**Purpose:** Distinguish between regular weekend rounds (8 matches) and standalone midweek matches (1 match)

**Values:**
- `regular` - Normal weekend round with multiple matches (default)
- `standalone` - Single midweek match (postponed/rescheduled game)

---

#### Status Flow Change

**New Rule:** Only ONE round can be "open" (active for predictions) at a time.

**Status Definitions:**
- `scheduled` - Created by admin, users can see fixtures, but cannot predict yet
- `open` - Currently active, accepting predictions (**ONLY ONE at a time**)
- `locked` - Predictions locked, awaiting results
- `final` - Complete, moved to history

**Updated status check constraint:**
```sql
-- Already exists in schema, no change needed
status TEXT CHECK (status IN ('scheduled', 'published', 'final'))
```

**Note:** The constraint uses 'published' but we now treat this as 'open' in the application logic.

---

#### Admin Workflow Changes

**Before (Version 80):**
- Admin could have multiple rounds "open" simultaneously
- "This Round" page showed ALL open rounds + standalone matches

**After (Version 81):**
- Admin creates rounds with status = 'scheduled'
- Admin manually "publishes" (opens) ONE round at a time
- "Active Now" page shows ONLY the currently open round OR standalone match
- Other scheduled items wait in queue

**Example Admin Flow:**
```sql
-- 1. Admin creates future items (all scheduled)
INSERT INTO rounds (competition_id, round_number, status, round_type)
VALUES 
  ('comp-id', 12, 'scheduled', 'regular'),
  ('comp-id', 13, 'scheduled', 'regular');

INSERT INTO rounds (competition_id, round_number, status, round_type)
VALUES ('comp-id', 12.5, 'scheduled', 'standalone');  -- Using decimal for standalone

-- 2. Admin publishes (opens) Round 12
UPDATE rounds SET status = 'published' WHERE round_number = 12;

-- 3. After matches, admin finalizes
UPDATE rounds SET status = 'final' WHERE round_number = 12;

-- 4. Admin can now publish the standalone match
UPDATE rounds SET status = 'published' WHERE round_number = 12.5;
```

---

#### Application Logic Changes

**Query for "Active Now" page:**
```sql
-- Get the currently active (open) round or standalone match
SELECT * FROM rounds 
WHERE status = 'published' 
  AND competition_id = 'current-competition'
ORDER BY created_at DESC 
LIMIT 1;
```

**Validation Rule (enforce at application level or trigger):**
```sql
-- Optional: Add trigger to prevent multiple published rounds
CREATE OR REPLACE FUNCTION check_single_published_round()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' THEN
    -- Check if another round is already published
    IF EXISTS (
      SELECT 1 FROM rounds 
      WHERE status = 'published' 
        AND competition_id = NEW.competition_id
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Only one round can be published at a time. Please finalize the current round first.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_single_published
BEFORE UPDATE ON rounds
FOR EACH ROW
EXECUTE FUNCTION check_single_published_round();
```

---

#### Frontend Changes

**UI Rename:**
- Page name: "This Round" → **"Active Now"**
- Route: `/version1/this-round` → `/version1/active-now` (or keep route, just change display name)

**Dynamic Title:**
```tsx
// Display title based on round_type
{activeRound.round_type === 'regular' ? (
  <h1>Round {activeRound.round_number}</h1>
) : (
  <h1>Standalone Match</h1>
)}
```

**Prototype Testing Controls (for demonstration):**
```tsx
// Existing controls
[Open] [Locked] [Final]

// NEW controls added
[Round] [Standalone]
```

---

#### Migration Script

**For existing data (if database already has data):**

```sql
-- Step 1: Add the column
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS round_type TEXT CHECK (round_type IN ('regular', 'standalone')) DEFAULT 'regular';

-- Step 2: Infer round_type from existing data
-- If a round has only 1 match, mark it as standalone
UPDATE rounds r
SET round_type = 'standalone'
WHERE (
  SELECT COUNT(*) 
  FROM matches m 
  WHERE m.round_id = r.id 
    AND m.include_in_round = true
) = 1;

-- Step 3: Everything else is regular
UPDATE rounds 
SET round_type = 'regular' 
WHERE round_type IS NULL;
```

---

#### Impact Summary

**Database:**
- ✅ One new column: `rounds.round_type`
- ✅ Optional trigger for enforcing single published round
- ✅ No breaking changes to existing structure

**API Functions:**
- ✅ Update "Get Current Round" to fetch only ONE published round
- ✅ Update admin "Publish Round" to check for existing published rounds
- ✅ Add validation: prevent publishing multiple rounds simultaneously

**Frontend:**
- ✅ UI rename: "This Round" → "Active Now"
- ✅ Dynamic title based on round_type
- ✅ Simplified view (no more mixed round + standalone)

**User Experience:**
- ✅ Clear focus on one active item at a time
- ✅ Standalone matches get proper visibility
- ✅ Less confusion about what to predict

---

## Future Changes

_(Track any additional database changes here)_

### Template for Future Changes:

```markdown
### Added: [Feature Name]

**Date:** [Date]
**Reason:** [Why this change was needed]

#### Schema Changes
[SQL commands]

#### Migration Script
[How to update existing data]

#### Impact Summary
[What changed and why]
```

---

## Notes for Developer

1. **Backwards Compatibility:** The `round_type` column has a default value ('regular'), so existing code will continue to work.

2. **Testing:** Use the prototype testing controls to verify behavior with both round types.

3. **Gradual Rollout:** If preferred, you can:
   - Add the column first (no trigger)
   - Test the application logic
   - Add the trigger later for stricter enforcement

4. **Questions?** Reach out anytime if anything is unclear about these changes.
