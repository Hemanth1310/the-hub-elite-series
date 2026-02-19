# CSV Templates for Supabase Import

## Overview

These CSV templates help you bulk upload rounds and matches to Supabase.

---

## Files

1. **`rounds-template.csv`** - Template for all 30 rounds
2. **`matches-template.csv`** - Template for matches (example for rounds 11-12)

---

## How to Use

### Step 1: Prepare Your Data

#### For Rounds (`rounds-template.csv`)

**Columns:**
- `round_number` - Round number (1-30)
- `competition_id` - Competition identifier (e.g., "premier-league-2024-25")
- `round_type` - Always "regular" (or "standalone" for postponed games)
- `deadline` - Deadline in ISO 8601 format (e.g., "2025-02-01T14:25:00Z") or leave empty
- `status` - "scheduled", "active", "completed", or "final"

**Notes:**
- Deadline format: `YYYY-MM-DDTHH:MM:SSZ` (Z = UTC timezone)
- Default deadline = 5 min before first game (set by admin later)
- Leave deadline empty for rounds 26-30 (no dates yet)
- Past rounds (1-10) = "final", Future rounds (11-30) = "scheduled"

#### For Matches (`matches-template.csv`)

**Columns:**
- `round_number` - Which round this match belongs to
- `home_team` - Full home team name (e.g., "Manchester City")
- `away_team` - Full away team name (e.g., "Arsenal")
- `kickoff` - Match kickoff time in ISO 8601 format or leave empty
- `include_in_round` - true (included) or false (postponed)
- `is_match_of_week` - true (MOTW) or false
- `status` - "scheduled", "postponed", or "final"
- `result` - H, U, B, or leave empty for scheduled matches

**Notes:**
- Only ONE match per round can have `is_match_of_week = true`
- For rounds 26-30, leave `kickoff` empty
- Format kickoff: `YYYY-MM-DDTHH:MM:SSZ`
- Leave `result` empty for future matches

---

## Import to Supabase

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project
2. Click **Table Editor** in sidebar
3. Select your table (e.g., "rounds")
4. Click **Insert** → **Import data from CSV**
5. Upload your CSV file
6. Map columns (should auto-map)
7. Click **Import**

### Method 2: SQL Import (Advanced)

Ask your developer to create SQL scripts from the CSV files.

---

## Example Data

### Rounds Example

```csv
round_number,competition_id,round_type,deadline,status
11,premier-league-2024-25,regular,2025-02-01T14:25:00Z,scheduled
12,premier-league-2024-25,regular,2025-02-08T14:25:00Z,scheduled
```

**Explanation:**
- Round 11 deadline: Feb 1, 2025 at 14:25 UTC (2:25 PM)
- Status: scheduled (not published yet)
- Will become "active" when admin clicks "Publish"

### Matches Example

```csv
round_number,home_team,away_team,kickoff,include_in_round,is_match_of_week,status,result
11,Manchester City,Arsenal,2025-02-01T15:00:00Z,true,false,scheduled,
11,Liverpool,Aston Villa,2025-02-01T15:00:00Z,true,false,scheduled,
11,Tottenham,Chelsea,2025-02-01T17:30:00Z,true,true,scheduled,
```

**Explanation:**
- All three matches for Round 11
- Tottenham vs Chelsea is Match of the Week
- Kickoffs: First two at 15:00, last one at 17:30
- All scheduled (no results yet)
- All included in round (not postponed)

---

## Tips

### Deadline Calculation

**Default rule:** Deadline = First kickoff - 5 minutes

**Example:**
- First game: Feb 1 at 15:00
- Deadline: Feb 1 at 14:55
- In CSV: `2025-02-01T14:55:00Z`

### UTC Timezone

All times are in **UTC** (Coordinated Universal Time)

**UK Time Conversions:**
- GMT (Winter): UTC + 0 hours
- BST (Summer): UTC + 1 hour

**Example:**
- UK BST: 3:00 PM → UTC: 2:00 PM → CSV: `14:00:00Z`
- UK GMT: 3:00 PM → UTC: 3:00 PM → CSV: `15:00:00Z`

### Team Names

Use **full official names** as they appear in the database:
- ✅ "Manchester City"
- ✅ "Manchester United"
- ✅ "Nottingham Forest"
- ❌ "Man City" (don't abbreviate)

---

## Filling Out the Template

### For Rounds 1-10 (Already played)

```csv
round_number,competition_id,round_type,deadline,status
1,premier-league-2024-25,regular,2024-08-16T19:25:00Z,final
```

- Status: `final` (already completed)
- Deadline: Past date when round was played

### For Rounds 11-25 (Scheduled with dates)

```csv
round_number,competition_id,round_type,deadline,status
11,premier-league-2024-25,regular,2025-02-01T14:25:00Z,scheduled
```

- Status: `scheduled` (not published yet)
- Deadline: 5 min before first game
- Add matches with kickoff times

### For Rounds 26-30 (No dates yet)

```csv
round_number,competition_id,round_type,deadline,status
26,premier-league-2024-25,regular,,scheduled
```

- Status: `scheduled`
- Deadline: Empty (will set later)
- Matches can be added without kickoff times

---

## Validation Checklist

Before importing, check:

- ✅ All dates in ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`)
- ✅ Only ONE match per round has `is_match_of_week = true`
- ✅ Past rounds have `status = final`
- ✅ Future rounds have `status = scheduled`
- ✅ Team names match your database exactly
- ✅ Deadline is 5 min before first kickoff
- ✅ No typos in column names (case-sensitive!)

---

## Need Help?

**Common Issues:**

1. **"Invalid date format"**
   - Use: `2025-02-01T14:25:00Z`
   - Not: `01/02/2025 14:25` or `Feb 1, 2025`

2. **"Team not found"**
   - Check team name spelling
   - Use full name, not abbreviation
   - Check your teams table for exact names

3. **"Duplicate round number"**
   - Each round number should appear only once in rounds.csv
   - But can appear multiple times in matches.csv (one per match)

4. **"Multiple MOTW in same round"**
   - Only set `is_match_of_week = true` for ONE match per round

---

## Ask Your Developer

For more complex imports:
- Custom SQL scripts
- Bulk updates
- Data migrations
- Database schema modifications

Your developer can help with:
- Converting these CSVs to SQL INSERT statements
- Setting up foreign key relationships
- Creating stored procedures for imports
- Validating data integrity
