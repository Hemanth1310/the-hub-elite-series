# DB Integration Instructions (Where + What to Change)

This file tells you exactly **where** to replace mock data with Supabase and **what** to do in each spot.

---

## 1) Global Setup (already exists)

### File: `src/lib/supabase.ts`
- Supabase client is already created.
- No change needed unless you want to add typed helpers.

### File: `src/contexts/AuthContext.tsx`
**What to change:**
- Remove mock user import: `currentUser` from `@/mockData`.
- Use Supabase auth session + metadata to populate user.

**Exact location:**
- At the top: `import { currentUser } from '@/mockData';` → remove.
- In `useEffect`, remove the branch that sets mock user.

**Replacement pattern:**
- Always read `supabase.auth.getSession()` and set profile from `user_metadata`.

---

## 2) Pages using mock data (replace with DB queries)

### A) `src/pages/v1/ThisRound.tsx`
**Mock imports to remove:**
- `matches`, `currentRound`, `currentUserPredictions` from `@/mockData`

**Exact place to add DB reads:**
- Add a `useEffect` to fetch:
  - Active round from `rounds` (status = `published`)
  - Matches from `matches` where `round_id = activeRound.id`
  - Current user predictions from `predictions` where `round_id = activeRound.id AND user_id = authUser.id`

**Exact place to add DB write:**
- The **Save Predictions** button handler at the bottom:
  ```tsx
  <Button onClick={() => { ... }}>
  ```
  Replace the toast-only logic with:
  - Build a list of prediction rows.
  - Upsert/insert into `predictions`.
  - Include `round_id` in every row.

**Supabase tables used:** `rounds`, `matches`, `predictions`

---

### B) `src/pages/v1/Rounds.tsx`
**Mock imports to remove:**
- `pastRounds`, `round15Details`, `users`, `currentUser`

**DB reads to add:**
- Fetch past rounds from `rounds` where status in (`final`, `published`) ordered by `round_number`.
- Fetch each round’s predictions from `predictions` joined with `users`.

**Supabase tables used:** `rounds`, `predictions`, `users`

---

### C) `src/pages/v1/CompareRound.tsx`
**Mock imports to remove:**
- `matches`, `currentRound`, `users`, `currentUser`

**DB reads to add:**
- Active round from `rounds`.
- Matches from `matches` for the round.
- Predictions for round + all users.

**Supabase tables used:** `rounds`, `matches`, `predictions`, `users`

---

### D) `src/pages/v1/CompareRoundHistory.tsx`
**Mock imports to remove:**
- `round15Details`, `users`, `currentUser`

**DB reads to add:**
- Fetch specific round by ID.
- Fetch matches + predictions for that round.
- Fetch users list for comparison.

**Supabase tables used:** `rounds`, `matches`, `predictions`, `users`

---

### E) `src/pages/v1/Dashboard.tsx`
**Mock imports to remove:**
- `currentRound`

**DB reads to add:**
- Fetch current active round from `rounds`.

---

### F) `src/pages/v1/Leaderboard.tsx`
**Mock imports to remove:**
- `leaderboard`, `currentUser`

**DB reads to add:**
- Fetch leaderboard from `leaderboard` table.

---

### G) `src/pages/v1/Admin.tsx`
**Mock imports to remove:**
- `competitions`

**DB reads to add:**
- Fetch competitions from `competitions` table.

---

### H) `src/pages/v1/Layout.tsx`
**Mock imports to remove:**
- `competitions`

**DB reads to add:**
- Fetch competitions (or use a cached/global store).

---

### I) `src/pages/v1/Stats.tsx`
**Mock imports to remove:**
- `bestRounds`, `worstRounds`

**DB reads to add:**
- Fetch round_stats joined to rounds for best/worst.

---

## 3) Critical DB insert rule (due to schema change)

### `predictions.round_id` is required
When inserting/upserting predictions, **always include `round_id`**.

**Example insert row:**
```ts
{
  user_id: authUser.id,
  match_id: match.id,
  round_id: round.id,
  prediction: 'H',
  is_banker: false,
  is_locked: false
}
```

---

## 4) Recommended integration order

1. `AuthContext.tsx` (real user)
2. `ThisRound.tsx` (core prediction flow)
3. `AdminRound.tsx` (admin CRUD)
4. `Leaderboard.tsx`, `Rounds.tsx` (read-only views)
5. `CompareRound.tsx`, `CompareRoundHistory.tsx`, `Stats.tsx`

---

## 5) Files that still use mock data (current list)

- `src/contexts/AuthContext.tsx`
- `src/pages/v1/ThisRound.tsx`
- `src/pages/v1/Rounds.tsx`
- `src/pages/v1/CompareRound.tsx`
- `src/pages/v1/CompareRoundHistory.tsx`
- `src/pages/v1/Dashboard.tsx`
- `src/pages/v1/Leaderboard.tsx`
- `src/pages/v1/Admin.tsx`
- `src/pages/v1/Layout.tsx`
- `src/pages/v1/Stats.tsx`

---

If you want, I can start implementing these for you in the correct order.