# Terminology Change: Banker

## Overview
Throughout the entire codebase, the terminology is standardized to "banker". This document lists all the changes needed.

## Database Changes (Already Updated in schema)
- Column: `is_banker`
- Column: `banker_correct`
- Column: `banker_success`
- Column: `banker_fail`
- Function parameter: `p_is_banker`
- Index name: `idx_one_banker_per_round_per_user`

## TypeScript Types (Already Updated)
```typescript
// types.ts
interface Prediction {
  isBanker: boolean;
}

interface LeaderboardEntry {
  bankerCorrect: number;
  bankerWrong: number;
  bankerNet: number;
}
```

## Mock Data (Already Updated)
```typescript
// mockData.ts
isBanker: boolean
bankerCorrect: number
bankerWrong: number
bankerNet: number
banker: number
```

## UI Text Changes Needed

### Find and Replace in All Page Files:
- "Banker"
- "banker"
- "Bnk" (in table headers)

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
"Set as Banker"
"Banker Pick"
"Your Banker"
"Banker: ✓" or "Banker: ✗"

// NEW
"Set as Banker"
"Banker Pick"
"Your Banker"
"Banker: ✓" or "Banker: ✗"
```

### Tooltips/Help Text:
```typescript
// OLD
"Double your points on this match (banker)"
"You can only select one banker per round"
"Banker doubles your score - right or wrong!"

// NEW
"Double your points on this match (banker)"
"You can only select one banker per round"
"Banker doubles your score - right or wrong!"
```

### Table Headers:
```typescript
// OLD
<TableHead>Bnk ✓</TableHead>
<TableHead>Bnk ✗</TableHead>
<TableHead>Banker</TableHead>

// NEW
<TableHead>Bnk ✓</TableHead>
<TableHead>Bnk ✗</TableHead>
<TableHead>Banker</TableHead>
```

### Badges/Indicators:
```tsx
// OLD
<Badge>Banker</Badge>
{prediction.isBanker && <span>⭐</span>}

// NEW
<Badge>Banker</Badge>
{prediction.isBanker && <span>⭐</span>}
```

## API Function Changes (Already Updated in docs)
```typescript
// OLD
setBanker(matchId, userId)
is_banker: boolean

// NEW
setBanker(matchId, userId)
is_banker: boolean
```

## Comments in Code
Update all code comments that mention "conviction" to "banker":
```typescript
// Set banker for this match
// Only one banker allowed per round
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
2. Find: `isBanker`
3. Find: `bankerCorrect`
4. Find: `bankerWrong`
5. Find: `bankerNet`
6. Find: `Banker`
7. Find: `banker`
8. Find: `Bnk ` (with space after)

### Files to Check:
```bash
# Find all files that still contain "banker"
grep -r "banker" src/pages/
grep -r "Banker" src/pages/
grep -r "Bnk " src/pages/
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
