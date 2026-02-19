# League Information - Eliteserie 2026

## Overview

**Eliteserie** is the top division of Norwegian football (soccer). This application is built for the 2026 season.

## League Details

- **Country:** Norway 🇳🇴
- **Season:** 2026
- **Number of Teams:** 16
- **Typical Season:** April - November (Norwegian summer season)
- **Match Days:** Usually weekends (Saturday/Sunday)

## Teams (2026 Season)

| Team Name | Short Code | City |
|-----------|------------|------|
| Bodø/Glimt | B/G | Bodø |
| Viking FK | VIK | Stavanger |
| Tromsø IL | TIL | Tromsø |
| Rosenborg BK | RBK | Trondheim |
| Molde FK | MOL | Molde |
| SK Brann | BRA | Bergen |
| Sarpsborg 08 | S08 | Sarpsborg |
| Vålerenga | VIF | Oslo |
| Fredrikstad FK | FFK | Fredrikstad |
| Lillestrøm SK | LSK | Lillestrøm |
| Sandefjord Fotball | SAN | Sandefjord |
| Kristiansund BK | KBK | Kristiansund |
| Hamarkameratene | HAM | Hamar |
| Aalesund FK | AAFK | Ålesund |
| KFUM | KFUM | Oslo |
| IK Start | IKS | Kristiansand |

## Season Structure

### Number of Rounds
- **Total Rounds:** 30
- **Formula:** (16 teams × 2) - 2 = 30 rounds
- Each team plays every other team twice (home and away)

### Typical Round Schedule
- **Rounds per month:** ~4-5 during peak season
- **Matches per round:** 8 matches
- **Typical kickoff times:** 18:00 or 20:00 (weekdays), 16:00 or 18:00 (weekends)

### Season Timeline (Estimated)
- **Round 1:** Early April 2026
- **Mid-season break:** Usually 2-3 weeks in July
- **Final round (Round 30):** Early November 2026

## Important Notes for Developer

### When Creating Rounds
```sql
-- Example: Create Round 1
INSERT INTO rounds (competition_id, round_number, deadline)
VALUES (
  'competition-uuid',
  1,
  '2026-04-05 16:00:00+02'  -- 2 hours before first kickoff
);
```

### Norwegian Time Zone
- **Time Zone:** Central European Time (CET) / UTC+1
- **Summer Time:** Central European Summer Time (CEST) / UTC+2
- Norway observes daylight saving time (March-October)

### Match Scheduling
- Most rounds have matches spread across 2-3 days (Friday-Sunday)
- Some midweek rounds during European competition periods
- Occasional postponements due to:
  - Weather conditions (especially in northern cities like Tromsø)
  - European cup fixtures
  - International breaks

### Character Encoding
- Team names contain Norwegian characters (ø, å)
- Ensure database uses UTF-8 encoding: `encoding = 'UTF8'`
- Handle special characters in team names like "Bodø/Glimt" (forward slash)

## Useful Resources

### Official Sources
- **Official Website:** https://www.fotball.no/eliteserien/
- **Fixtures & Results:** Usually published via NFF (Norwegian Football Federation)
- **Live Scores:** https://www.fotball.no

### API Data Sources (Optional)
If you want to auto-import fixtures:
- **Football-Data.org** - Has Eliteserie data
- **API-Football (RapidAPI)** - Comprehensive football data
- **TheSportsDB** - Free football data API

## Database Verification

After running the schema, verify teams are inserted correctly:

```sql
-- Check all teams are present
SELECT COUNT(*) FROM teams;  -- Should return 16

-- View all teams
SELECT name, short_name FROM teams ORDER BY name;

-- Check competition is created
SELECT * FROM competitions WHERE slug = 'eliteserie-2026';
```

## Setting Up First Round (Example)

```sql
-- 1. Get competition ID
SELECT id FROM competitions WHERE slug = 'eliteserie-2026';

-- 2. Create first round
INSERT INTO rounds (competition_id, round_number, deadline, status)
VALUES ('your-competition-id', 1, '2026-04-05 16:00:00+02', 'scheduled');

-- 3. Add matches for round 1
-- (You'll need to manually add these based on official fixture list)
INSERT INTO matches (round_id, home_team_id, away_team_id, kickoff, status)
VALUES 
  ('round-id', 'bodoglimt-id', 'viking-id', '2026-04-05 18:00:00+02', 'scheduled'),
  -- ... more matches
```

## Important: Prototype vs Production

### Current (Prototype)
- Uses mock Premier League data for demonstration
- Frontend displays generic team names and matches

### Production (Your Implementation)
- Database will use Eliteserie teams (already in schema)
- Fixture data must be entered manually or imported via API
- Team logos can be added later (optional)

---

**Note to Developer:** The database schema is already configured for Eliteserie 2026. The frontend prototype shows Premier League data for demonstration purposes only. When you connect the real backend, it will automatically use the Norwegian teams from the database.
