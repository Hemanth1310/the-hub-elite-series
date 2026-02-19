# Terminology Change: Conviction → Banker

## Overview
Throughout the entire codebase, "conviction" has been renamed to "banker". This document lists all the changes needed.

## Database Changes (Already Updated in schema)
- Column: `is_conviction` → `is_banker`
- Column: `conviction_correct` → `banker_correct`
- Column: `conviction_success` → `banker_success`
- Column: `conviction_fail` → `banker_fail`
- Function parameter: `p_is_conviction` → `p_is_banker`
- Index name: `idx_one_conviction_per_round_per_user` → `idx_one_banker_per_round_per_user`

## TypeScript Types (Already Updated)
```typescript
// types.ts
interface Prediction {
  isBanker: boolean;  // was: isConviction
}

interface LeaderboardEntry {
  bankerCorrect: number;  // was: convictionCorrect
  bankerWrong: number;     // was: convictionWrong
  bankerNet: number;       // was: convictionNet
}
```

## Mock Data (Already Updated)
```typescript
// mockData.ts
isBanker: boolean       // was: isConviction
bankerCorrect: number   // was: convictionCorrect
bankerWrong: number     // was: convictionWrong
bankerNet: number       // was: convictionNet
banker: number          // was: conviction
```

## UI Text Changes Needed

### Find and Replace in All Page Files:
- "Conviction" → "Banker"
- "conviction" → "banker"
- "Conv" → "Bnk" (in table headers)

### Files to Update:

#### `/src/pages/v1/`
- [x] Leaderboard.tsx - Table headers and stats
- [ ] Stats.tsx - Statistics labels
- [ ] CompareRound.tsx - Comparison view
- [ ] CompareRoundHistory.tsx - Historical comparison
- [ ] ThisRound.tsx - Match selection labels
- [ ] Rounds.tsx - Round details
- [ ] Admin.tsx - Admin labels (if any)
- [ ] AdminRound.tsx - Round management (if any)

#### `/src/pages/v2/`
- [ ] All files same as v1

#### `/src/pages/v3/`
- [ ] All files same as v1

## Common UI Text Patterns

### Button/Label Text:
```typescript
// OLD
"Set as Conviction"
"Conviction Pick"
"Your Conviction"
"Conviction: ✓" or "Conviction: ✗"

// NEW
"Set as Banker"
"Banker Pick"
"Your Banker"
"Banker: ✓" or "Banker: ✗"
```

### Tooltips/Help Text:
```typescript
// OLD
"Double your points on this match (conviction)"
"You can only select one conviction per round"
"Conviction doubles your score - right or wrong!"

// NEW
"Double your points on this match (banker)"
"You can only select one banker per round"
"Banker doubles your score - right or wrong!"
```

### Table Headers:
```typescript
// OLD
<TableHead>Conv ✓</TableHead>
<TableHead>Conv ✗</TableHead>
<TableHead>Conviction</TableHead>

// NEW
<TableHead>Bnk ✓</TableHead>
<TableHead>Bnk ✗</TableHead>
<TableHead>Banker</TableHead>
```

### Badges/Indicators:
```tsx
// OLD
<Badge>Conviction</Badge>
{prediction.isConviction && <span>⭐</span>}

// NEW
<Badge>Banker</Badge>
{prediction.isBanker && <span>⭐</span>}
```

## API Function Changes (Already Updated in docs)
```typescript
// OLD
setConviction(matchId, userId)
is_conviction: boolean

// NEW
setBanker(matchId, userId)
is_banker: boolean
```

## Comments in Code
Update all code comments that mention "conviction" to "banker":
```typescript
// OLD: // Set conviction for this match
// NEW: // Set banker for this match

// OLD: // Only one conviction allowed per round
// NEW: // Only one banker allowed per round
```

## Scoring Documentation
All scoring documentation has been updated:
- Regular + Banker: 6 pts correct, -3 pts wrong
- MOTW + Banker: 12 pts correct, -6 pts wrong

## Testing After Changes
After updating all files, test:
1. [ ] Banker selection works (only one per round)
2. [ ] Banker indicator shows correctly in UI
3. [ ] Points calculate correctly for banker picks
4. [ ] Leaderboard shows banker stats correctly
5. [ ] Comparison view shows banker picks
6. [ ] Admin can see who picked banker on which match

## Quick Find/Replace Commands

### For VS Code:
1. Open Find in Files (Ctrl+Shift+F)
2. Find: `isConviction` → Replace: `isBanker`
3. Find: `convictionCorrect` → Replace: `bankerCorrect`
4. Find: `convictionWrong` → Replace: `bankerWrong`
5. Find: `convictionNet` → Replace: `bankerNet`
6. Find: `Conviction` → Replace: `Banker`
7. Find: `conviction` → Replace: `banker`
8. Find: `Conv ` → Replace: `Bnk ` (with space after)

### Files to Check:
```bash
# Find all files that still contain "conviction"
grep -r "conviction" src/pages/
grep -r "Conviction" src/pages/
grep -r "Conv " src/pages/
```

## Priority Order
1. ✅ Database schema (done)
2. ✅ TypeScript types (done)
3. ✅ Mock data (done)
4. ✅ API documentation (done)
5. ✅ One leaderboard page (done - v1)
6. ⏳ Remaining UI files (in progress)

---

**Note to Developer:** Use find/replace carefully. Make sure to:
- Search case-sensitively where needed
- Keep the star emoji (⭐) or other indicators intact
- Update tooltips and help text
- Check all three version folders (v1, v2, v3)
