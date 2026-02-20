-- Reset + import Eliteserien 2026 schedule for competition 3a2ecd45-6948-4288-9788-55f63ca4d47b
-- Keeps users; resets rounds/matches/predictions/round_stats for this competition.

BEGIN;

-- Create temp schedule table
CREATE TEMP TABLE temp_schedule (
  round_number INTEGER NOT NULL,
  kickoff TIMESTAMPTZ NOT NULL,
  home TEXT NOT NULL,
  away TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO temp_schedule (round_number, kickoff, home, away) VALUES
  (1,  '2026-03-14 16:00:00+01', 'Hamarkameratene', 'Viking FK'),
  (1,  '2026-03-14 18:00:00+01', 'Molde FK', 'Rosenborg BK'),
  (1,  '2026-03-15 14:30:00+01', 'Kristiansund BK', 'SK Brann'),
  (1,  '2026-03-15 17:00:00+01', 'Aalesund FK', 'Lillestrøm SK'),
  (1,  '2026-03-15 17:00:00+01', 'Vålerenga', 'Sandefjord Fotball'),
  (1,  '2026-03-15 17:00:00+01', 'Sarpsborg 08', 'Bodø/Glimt'),
  (1,  '2026-03-15 17:00:00+01', 'KFUM', 'IK Start'),
  (1,  '2026-03-15 19:15:00+01', 'Tromsø IL', 'Fredrikstad FK'),

  (2,  '2026-03-21 16:00:00+01', 'IK Start', 'Aalesund FK'),
  (2,  '2026-03-21 18:00:00+01', 'Viking FK', 'Molde FK'),
  (2,  '2026-03-22 14:30:00+01', 'Rosenborg BK', 'Vålerenga'),
  (2,  '2026-03-22 17:00:00+01', 'SK Brann', 'Tromsø IL'),
  (2,  '2026-03-22 17:00:00+01', 'Sandefjord Fotball', 'Sarpsborg 08'),
  (2,  '2026-03-22 17:00:00+01', 'Fredrikstad FK', 'KFUM'),
  (2,  '2026-03-22 17:00:00+01', 'Lillestrøm SK', 'Kristiansund BK'),
  (2,  '2026-03-22 19:15:00+01', 'Bodø/Glimt', 'Hamarkameratene'),

  (3,  '2026-04-06 14:30:00+02', 'Vålerenga', 'Viking FK'),
  (3,  '2026-04-06 17:00:00+02', 'Hamarkameratene', 'SK Brann'),
  (3,  '2026-04-06 17:00:00+02', 'Molde FK', 'Lillestrøm SK'),
  (3,  '2026-04-06 17:00:00+02', 'Sarpsborg 08', 'IK Start'),
  (3,  '2026-04-06 17:00:00+02', 'Kristiansund BK', 'Bodø/Glimt'),
  (3,  '2026-04-06 19:15:00+02', 'Tromsø IL', 'Rosenborg BK'),
  (3,  '2026-04-07 19:00:00+02', 'Aalesund FK', 'Fredrikstad FK'),
  (3,  '2026-04-07 19:00:00+02', 'KFUM', 'Sandefjord Fotball'),

  (4,  '2026-04-11 14:00:00+02', 'Lillestrøm SK', 'IK Start'),
  (4,  '2026-04-11 16:00:00+02', 'Tromsø IL', 'Kristiansund BK'),
  (4,  '2026-04-11 18:00:00+02', 'Viking FK', 'Bodø/Glimt'),
  (4,  '2026-04-12 14:30:00+02', 'Rosenborg BK', 'Sarpsborg 08'),
  (4,  '2026-04-12 17:00:00+02', 'Molde FK', 'Hamarkameratene'),
  (4,  '2026-04-12 17:00:00+02', 'Fredrikstad FK', 'Vålerenga'),
  (4,  '2026-04-12 17:00:00+02', 'Aalesund FK', 'KFUM'),
  (4,  '2026-04-12 19:15:00+02', 'SK Brann', 'Sandefjord Fotball'),

  (5,  '2026-04-18 14:00:00+02', 'Bodø/Glimt', 'Aalesund FK'),
  (5,  '2026-04-18 16:00:00+02', 'Sandefjord Fotball', 'Rosenborg BK'),
  (5,  '2026-04-18 18:00:00+02', 'Viking FK', 'SK Brann'),
  (5,  '2026-04-19 14:30:00+02', 'Vålerenga', 'Lillestrøm SK'),
  (5,  '2026-04-19 17:00:00+02', 'Hamarkameratene', 'KFUM'),
  (5,  '2026-04-19 17:00:00+02', 'Sarpsborg 08', 'Tromsø IL'),
  (5,  '2026-04-19 17:00:00+02', 'Kristiansund BK', 'Fredrikstad FK'),
  (5,  '2026-04-19 19:15:00+02', 'IK Start', 'Molde FK'),

  (6,  '2026-04-25 16:00:00+02', 'Fredrikstad FK', 'Viking FK'),
  (6,  '2026-04-25 18:00:00+02', 'Rosenborg BK', 'SK Brann'),
  (6,  '2026-04-26 14:30:00+02', 'Molde FK', 'Vålerenga'),
  (6,  '2026-04-26 17:00:00+02', 'KFUM', 'Sarpsborg 08'),
  (6,  '2026-04-26 17:00:00+02', 'Tromsø IL', 'Sandefjord Fotball'),
  (6,  '2026-04-26 17:00:00+02', 'Aalesund FK', 'Kristiansund BK'),
  (6,  '2026-04-26 17:00:00+02', 'Hamarkameratene', 'IK Start'),
  (6,  '2026-04-26 19:15:00+02', 'Lillestrøm SK', 'Bodø/Glimt'),

  (7,  '2026-05-01 18:00:00+02', 'Viking FK', 'Rosenborg BK'),
  (7,  '2026-05-02 18:00:00+02', 'SK Brann', 'Fredrikstad FK'),
  (7,  '2026-05-03 14:30:00+02', 'Lillestrøm SK', 'Sarpsborg 08'),
  (7,  '2026-05-03 17:00:00+02', 'Kristiansund BK', 'Hamarkameratene'),
  (7,  '2026-05-03 17:00:00+02', 'Sandefjord Fotball', 'Aalesund FK'),
  (7,  '2026-05-03 17:00:00+02', 'IK Start', 'Tromsø IL'),
  (7,  '2026-05-03 19:15:00+02', 'Vålerenga', 'KFUM'),
  (7,  '2026-05-04 19:00:00+02', 'Bodø/Glimt', 'Molde FK'),

  (8,  '2026-05-08 19:00:00+02', 'Hamarkameratene', 'Vålerenga'),
  (8,  '2026-05-09 14:00:00+02', 'Sarpsborg 08', 'Fredrikstad FK'),
  (8,  '2026-05-10 14:30:00+02', 'Rosenborg BK', 'Lillestrøm SK'),
  (8,  '2026-05-10 17:00:00+02', 'KFUM', 'Viking FK'),
  (8,  '2026-05-10 17:00:00+02', 'IK Start', 'Bodø/Glimt'),
  (8,  '2026-05-10 17:00:00+02', 'Tromsø IL', 'Molde FK'),
  (8,  '2026-05-10 17:00:00+02', 'Sandefjord Fotball', 'Kristiansund BK'),
  (8,  '2026-05-10 19:15:00+02', 'Aalesund FK', 'SK Brann'),

  (9,  '2026-05-16 14:00:00+02', 'SK Brann', 'KFUM'),
  (9,  '2026-05-16 16:00:00+02', 'Viking FK', 'IK Start'),
  (9,  '2026-05-16 16:00:00+02', 'Rosenborg BK', 'Aalesund FK'),
  (9,  '2026-05-16 16:00:00+02', 'Lillestrøm SK', 'Sandefjord Fotball'),
  (9,  '2026-05-16 16:00:00+02', 'Fredrikstad FK', 'Hamarkameratene'),
  (9,  '2026-05-16 16:00:00+02', 'Molde FK', 'Kristiansund BK'),
  (9,  '2026-05-16 18:00:00+02', 'Bodø/Glimt', 'Tromsø IL'),
  (9,  '2026-05-16 20:00:00+02', 'Vålerenga', 'Sarpsborg 08'),

  (10, '2026-05-25 17:00:00+02', 'Hamarkameratene', 'Lillestrøm SK'),
  (10, '2026-05-25 17:00:00+02', 'Sandefjord Fotball', 'Fredrikstad FK'),
  (10, '2026-05-25 17:00:00+02', 'KFUM', 'Rosenborg BK'),
  (10, '2026-05-25 17:00:00+02', 'Kristiansund BK', 'Viking FK'),
  (10, '2026-05-25 17:00:00+02', 'IK Start', 'Vålerenga'),
  (10, '2026-05-25 17:00:00+02', 'Bodø/Glimt', 'SK Brann'),
  (10, '2026-05-25 17:00:00+02', 'Sarpsborg 08', 'Molde FK'),
  (10, '2026-05-25 17:00:00+02', 'Tromsø IL', 'Aalesund FK'),

  (11, '2026-05-29 19:00:00+02', 'Vålerenga', 'Kristiansund BK'),
  (11, '2026-05-29 19:00:00+02', 'Fredrikstad FK', 'IK Start'),
  (11, '2026-05-29 19:00:00+02', 'KFUM', 'Tromsø IL'),
  (11, '2026-05-29 19:00:00+02', 'Lillestrøm SK', 'Viking FK'),
  (11, '2026-05-29 19:00:00+02', 'Rosenborg BK', 'Bodø/Glimt'),
  (11, '2026-05-29 19:00:00+02', 'SK Brann', 'Sarpsborg 08'),
  (11, '2026-05-29 19:00:00+02', 'Aalesund FK', 'Hamarkameratene'),
  (11, '2026-05-29 19:00:00+02', 'Molde FK', 'Sandefjord Fotball'),

  (12, '2026-07-05 17:00:00+02', 'Kristiansund BK', 'KFUM'),
  (12, '2026-07-05 17:00:00+02', 'Bodø/Glimt', 'Vålerenga'),
  (12, '2026-07-05 17:00:00+02', 'Sarpsborg 08', 'Aalesund FK'),
  (12, '2026-07-05 17:00:00+02', 'IK Start', 'Sandefjord Fotball'),
  (12, '2026-07-05 17:00:00+02', 'Lillestrøm SK', 'SK Brann'),
  (12, '2026-07-05 17:00:00+02', 'Viking FK', 'Tromsø IL'),
  (12, '2026-07-05 17:00:00+02', 'Hamarkameratene', 'Rosenborg BK'),
  (12, '2026-07-05 17:00:00+02', 'Molde FK', 'Fredrikstad FK'),

  (13, '2026-07-12 17:00:00+02', 'Sarpsborg 08', 'Viking FK'),
  (13, '2026-07-12 17:00:00+02', 'Sandefjord Fotball', 'Hamarkameratene'),
  (13, '2026-07-12 17:00:00+02', 'Fredrikstad FK', 'Lillestrøm SK'),
  (13, '2026-07-12 17:00:00+02', 'Aalesund FK', 'Molde FK'),
  (13, '2026-07-12 17:00:00+02', 'SK Brann', 'IK Start'),
  (13, '2026-07-12 17:00:00+02', 'Rosenborg BK', 'Kristiansund BK'),
  (13, '2026-07-12 17:00:00+02', 'KFUM', 'Bodø/Glimt'),
  (13, '2026-07-12 17:00:00+02', 'Tromsø IL', 'Vålerenga'),

  (14, '2026-07-18 16:00:00+02', 'Lillestrøm SK', 'KFUM'),
  (14, '2026-07-18 16:00:00+02', 'Viking FK', 'Sandefjord Fotball'),
  (14, '2026-07-18 16:00:00+02', 'Molde FK', 'SK Brann'),
  (14, '2026-07-18 16:00:00+02', 'Bodø/Glimt', 'Fredrikstad FK'),
  (14, '2026-07-18 16:00:00+02', 'Kristiansund BK', 'Sarpsborg 08'),
  (14, '2026-07-18 16:00:00+02', 'Vålerenga', 'Aalesund FK'),
  (14, '2026-07-18 16:00:00+02', 'Hamarkameratene', 'Tromsø IL'),
  (14, '2026-07-18 16:00:00+02', 'IK Start', 'Rosenborg BK'),

  (15, '2026-04-15 19:00:00+02', 'Tromsø IL', 'Lillestrøm SK'),
  (15, '2026-07-26 17:00:00+02', 'Kristiansund BK', 'IK Start'),
  (15, '2026-07-26 17:00:00+02', 'Aalesund FK', 'Viking FK'),
  (15, '2026-07-26 17:00:00+02', 'KFUM', 'Molde FK'),
  (15, '2026-07-26 17:00:00+02', 'Sarpsborg 08', 'Hamarkameratene'),
  (15, '2026-07-26 17:00:00+02', 'SK Brann', 'Vålerenga'),
  (15, '2026-07-26 17:00:00+02', 'Sandefjord Fotball', 'Bodø/Glimt'),
  (15, '2026-07-26 17:00:00+02', 'Rosenborg BK', 'Fredrikstad FK'),

  (16, '2026-08-02 17:00:00+02', 'Vålerenga', 'Hamarkameratene'),
  (16, '2026-08-02 17:00:00+02', 'Fredrikstad FK', 'Sandefjord Fotball'),
  (16, '2026-08-02 17:00:00+02', 'IK Start', 'Viking FK'),
  (16, '2026-08-02 17:00:00+02', 'Bodø/Glimt', 'Lillestrøm SK'),
  (16, '2026-08-02 17:00:00+02', 'SK Brann', 'Rosenborg BK'),
  (16, '2026-08-02 17:00:00+02', 'KFUM', 'Kristiansund BK'),
  (16, '2026-08-02 17:00:00+02', 'Aalesund FK', 'Tromsø IL'),
  (16, '2026-08-02 17:00:00+02', 'Molde FK', 'Sarpsborg 08'),

  (17, '2026-04-29 19:00:00+02', 'Tromsø IL', 'SK Brann'),
  (17, '2026-08-09 17:00:00+02', 'IK Start', 'Fredrikstad FK'),
  (17, '2026-08-09 17:00:00+02', 'Hamarkameratene', 'Aalesund FK'),
  (17, '2026-08-09 17:00:00+02', 'Lillestrøm SK', 'Rosenborg BK'),
  (17, '2026-08-09 17:00:00+02', 'Sandefjord Fotball', 'KFUM'),
  (17, '2026-08-09 17:00:00+02', 'Kristiansund BK', 'Molde FK'),
  (17, '2026-08-09 17:00:00+02', 'Viking FK', 'Sarpsborg 08'),
  (17, '2026-08-09 17:00:00+02', 'Vålerenga', 'Bodø/Glimt'),

  (18, '2026-04-30 19:00:00+02', 'Bodø/Glimt', 'IK Start'),
  (18, '2026-08-16 17:00:00+02', 'Molde FK', 'Tromsø IL'),
  (18, '2026-08-16 17:00:00+02', 'Aalesund FK', 'Vålerenga'),
  (18, '2026-08-16 17:00:00+02', 'KFUM', 'Lillestrøm SK'),
  (18, '2026-08-16 17:00:00+02', 'SK Brann', 'Hamarkameratene'),
  (18, '2026-08-16 17:00:00+02', 'Rosenborg BK', 'Viking FK'),
  (18, '2026-08-16 17:00:00+02', 'Sarpsborg 08', 'Sandefjord Fotball'),
  (18, '2026-08-16 17:00:00+02', 'Fredrikstad FK', 'Kristiansund BK'),

  (19, '2026-08-30 17:00:00+02', 'Lillestrøm SK', 'Fredrikstad FK'),
  (19, '2026-08-30 17:00:00+02', 'Tromsø IL', 'Sarpsborg 08'),
  (19, '2026-08-30 17:00:00+02', 'Hamarkameratene', 'Kristiansund BK'),
  (19, '2026-08-30 17:00:00+02', 'Sandefjord Fotball', 'SK Brann'),
  (19, '2026-08-30 17:00:00+02', 'IK Start', 'KFUM'),
  (19, '2026-08-30 17:00:00+02', 'Viking FK', 'Aalesund FK'),
  (19, '2026-08-30 17:00:00+02', 'Bodø/Glimt', 'Rosenborg BK'),
  (19, '2026-08-30 17:00:00+02', 'Vålerenga', 'Molde FK'),

  (20, '2026-09-06 17:00:00+02', 'SK Brann', 'Lillestrøm SK'),
  (20, '2026-09-06 17:00:00+02', 'Kristiansund BK', 'Tromsø IL'),
  (20, '2026-09-06 17:00:00+02', 'Sarpsborg 08', 'Vålerenga'),
  (20, '2026-09-06 17:00:00+02', 'Molde FK', 'KFUM'),
  (20, '2026-09-06 17:00:00+02', 'Rosenborg BK', 'Hamarkameratene'),
  (20, '2026-09-06 17:00:00+02', 'Aalesund FK', 'IK Start'),
  (20, '2026-09-06 17:00:00+02', 'Fredrikstad FK', 'Bodø/Glimt'),
  (20, '2026-09-06 17:00:00+02', 'Sandefjord Fotball', 'Viking FK'),

  (21, '2026-09-13 17:00:00+02', 'Viking FK', 'Kristiansund BK'),
  (21, '2026-09-13 17:00:00+02', 'IK Start', 'SK Brann'),
  (21, '2026-09-13 17:00:00+02', 'Fredrikstad FK', 'Sarpsborg 08'),
  (21, '2026-09-13 17:00:00+02', 'Hamarkameratene', 'Molde FK'),
  (21, '2026-09-13 17:00:00+02', 'KFUM', 'Aalesund FK'),
  (21, '2026-09-13 17:00:00+02', 'Bodø/Glimt', 'Sandefjord Fotball'),
  (21, '2026-09-13 17:00:00+02', 'Lillestrøm SK', 'Vålerenga'),
  (21, '2026-09-13 17:00:00+02', 'Rosenborg BK', 'Tromsø IL'),

  (22, '2026-09-20 17:00:00+02', 'Sandefjord Fotball', 'IK Start'),
  (22, '2026-09-20 17:00:00+02', 'Kristiansund BK', 'Rosenborg BK'),
  (22, '2026-09-20 17:00:00+02', 'Sarpsborg 08', 'KFUM'),
  (22, '2026-09-20 17:00:00+02', 'Viking FK', 'Lillestrøm SK'),
  (22, '2026-09-20 17:00:00+02', 'Molde FK', 'Aalesund FK'),
  (22, '2026-09-20 17:00:00+02', 'Tromsø IL', 'Hamarkameratene'),
  (22, '2026-09-20 17:00:00+02', 'Vålerenga', 'Fredrikstad FK'),
  (22, '2026-09-20 17:00:00+02', 'SK Brann', 'Bodø/Glimt'),

  (23, '2026-10-11 17:00:00+02', 'SK Brann', 'Viking FK'),
  (23, '2026-10-11 17:00:00+02', 'IK Start', 'Hamarkameratene'),
  (23, '2026-10-11 17:00:00+02', 'Fredrikstad FK', 'Tromsø IL'),
  (23, '2026-10-11 17:00:00+02', 'Rosenborg BK', 'Sandefjord Fotball'),
  (23, '2026-10-11 17:00:00+02', 'KFUM', 'Vålerenga'),
  (23, '2026-10-11 17:00:00+02', 'Lillestrøm SK', 'Molde FK'),
  (23, '2026-10-11 17:00:00+02', 'Bodø/Glimt', 'Kristiansund BK'),
  (23, '2026-10-11 17:00:00+02', 'Aalesund FK', 'Sarpsborg 08'),

  (24, '2026-10-18 17:00:00+02', 'Sandefjord Fotball', 'Lillestrøm SK'),
  (24, '2026-10-18 17:00:00+02', 'Kristiansund BK', 'Aalesund FK'),
  (24, '2026-10-18 17:00:00+02', 'Molde FK', 'IK Start'),
  (24, '2026-10-18 17:00:00+02', 'Sarpsborg 08', 'Rosenborg BK'),
  (24, '2026-10-18 17:00:00+02', 'Tromsø IL', 'KFUM'),
  (24, '2026-10-18 17:00:00+02', 'Viking FK', 'Fredrikstad FK'),
  (24, '2026-10-18 17:00:00+02', 'Vålerenga', 'SK Brann'),
  (24, '2026-10-18 17:00:00+02', 'Hamarkameratene', 'Bodø/Glimt'),

  (25, '2026-10-25 17:00:00+01', 'Sarpsborg 08', 'Kristiansund BK'),
  (25, '2026-10-25 17:00:00+01', 'Vålerenga', 'Tromsø IL'),
  (25, '2026-10-25 17:00:00+01', 'Bodø/Glimt', 'Viking FK'),
  (25, '2026-10-25 17:00:00+01', 'Fredrikstad FK', 'Rosenborg BK'),
  (25, '2026-10-25 17:00:00+01', 'KFUM', 'Hamarkameratene'),
  (25, '2026-10-25 17:00:00+01', 'IK Start', 'Lillestrøm SK'),
  (25, '2026-10-25 17:00:00+01', 'Aalesund FK', 'Sandefjord Fotball'),
  (25, '2026-10-25 17:00:00+01', 'SK Brann', 'Molde FK'),

  (26, '2026-11-01 17:00:00+01', 'Viking FK', 'KFUM'),
  (26, '2026-11-01 17:00:00+01', 'Kristiansund BK', 'Vålerenga'),
  (26, '2026-11-01 17:00:00+01', 'Tromsø IL', 'Bodø/Glimt'),
  (26, '2026-11-01 17:00:00+01', 'Hamarkameratene', 'Sarpsborg 08'),
  (26, '2026-11-01 17:00:00+01', 'Sandefjord Fotball', 'Molde FK'),
  (26, '2026-11-01 17:00:00+01', 'Lillestrøm SK', 'Aalesund FK'),
  (26, '2026-11-01 17:00:00+01', 'Fredrikstad FK', 'SK Brann'),
  (26, '2026-11-01 17:00:00+01', 'Rosenborg BK', 'IK Start'),

  (27, '2026-11-08 17:00:00+01', 'Molde FK', 'Bodø/Glimt'),
  (27, '2026-11-08 17:00:00+01', 'Aalesund FK', 'Rosenborg BK'),
  (27, '2026-11-08 17:00:00+01', 'Hamarkameratene', 'Fredrikstad FK'),
  (27, '2026-11-08 17:00:00+01', 'KFUM', 'SK Brann'),
  (27, '2026-11-08 17:00:00+01', 'Vålerenga', 'IK Start'),
  (27, '2026-11-08 17:00:00+01', 'Kristiansund BK', 'Sandefjord Fotball'),
  (27, '2026-11-08 17:00:00+01', 'Tromsø IL', 'Viking FK'),
  (27, '2026-11-08 17:00:00+01', 'Sarpsborg 08', 'Lillestrøm SK'),

  (28, '2026-11-22 17:00:00+01', 'Viking FK', 'Vålerenga'),
  (28, '2026-11-22 17:00:00+01', 'Bodø/Glimt', 'KFUM'),
  (28, '2026-11-22 17:00:00+01', 'Fredrikstad FK', 'Aalesund FK'),
  (28, '2026-11-22 17:00:00+01', 'Sandefjord Fotball', 'Tromsø IL'),
  (28, '2026-11-22 17:00:00+01', 'IK Start', 'Sarpsborg 08'),
  (28, '2026-11-22 17:00:00+01', 'SK Brann', 'Kristiansund BK'),
  (28, '2026-11-22 17:00:00+01', 'Lillestrøm SK', 'Hamarkameratene'),
  (28, '2026-11-22 17:00:00+01', 'Rosenborg BK', 'Molde FK'),

  (29, '2026-11-29 17:00:00+01', 'Kristiansund BK', 'Lillestrøm SK'),
  (29, '2026-11-29 17:00:00+01', 'Tromsø IL', 'IK Start'),
  (29, '2026-11-29 17:00:00+01', 'Vålerenga', 'Rosenborg BK'),
  (29, '2026-11-29 17:00:00+01', 'Sarpsborg 08', 'SK Brann'),
  (29, '2026-11-29 17:00:00+01', 'Aalesund FK', 'Bodø/Glimt'),
  (29, '2026-11-29 17:00:00+01', 'Hamarkameratene', 'Sandefjord Fotball'),
  (29, '2026-11-29 17:00:00+01', 'KFUM', 'Fredrikstad FK'),
  (29, '2026-11-29 17:00:00+01', 'Molde FK', 'Viking FK'),

  (30, '2026-12-06 17:00:00+01', 'Lillestrøm SK', 'Tromsø IL'),
  (30, '2026-12-06 17:00:00+01', 'IK Start', 'Kristiansund BK'),
  (30, '2026-12-06 17:00:00+01', 'Viking FK', 'Hamarkameratene'),
  (30, '2026-12-06 17:00:00+01', 'Fredrikstad FK', 'Molde FK'),
  (30, '2026-12-06 17:00:00+01', 'Bodø/Glimt', 'Sarpsborg 08'),
  (30, '2026-12-06 17:00:00+01', 'Sandefjord Fotball', 'Vålerenga'),
  (30, '2026-12-06 17:00:00+01', 'Rosenborg BK', 'KFUM'),
  (30, '2026-12-06 17:00:00+01', 'SK Brann', 'Aalesund FK');

-- Validate teams exist
DO $$
DECLARE
  missing TEXT;
BEGIN
  SELECT string_agg(names.name, ', ') INTO missing
  FROM (
    SELECT DISTINCT s.home AS name FROM temp_schedule s
    UNION
    SELECT DISTINCT s.away AS name FROM temp_schedule s
  ) names
  LEFT JOIN teams t ON t.name = names.name
  WHERE t.id IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing teams in teams table: %', missing;
  END IF;
END $$;

-- Reset competition data (keep users)
DELETE FROM predictions
WHERE match_id IN (
  SELECT m.id
  FROM matches m
  JOIN rounds r ON r.id = m.round_id
  WHERE r.competition_id = '3a2ecd45-6948-4288-9788-55f63ca4d47b'
);

DELETE FROM round_stats
WHERE round_id IN (
  SELECT id FROM rounds WHERE competition_id = '3a2ecd45-6948-4288-9788-55f63ca4d47b'
);

DELETE FROM matches
WHERE round_id IN (
  SELECT id FROM rounds WHERE competition_id = '3a2ecd45-6948-4288-9788-55f63ca4d47b'
);

DELETE FROM rounds
WHERE competition_id = '3a2ecd45-6948-4288-9788-55f63ca4d47b';

-- Insert rounds with deadline = first kickoff - 5 minutes
INSERT INTO rounds (competition_id, round_number, round_type, deadline, status)
SELECT
  '3a2ecd45-6948-4288-9788-55f63ca4d47b'::uuid,
  round_number,
  'regular',
  MIN(kickoff) - INTERVAL '5 minutes',
  'scheduled'
FROM temp_schedule
GROUP BY round_number
ORDER BY round_number;

-- Insert matches
INSERT INTO matches (round_id, home_team_id, away_team_id, kickoff, status, include_in_round, is_match_of_the_week)
SELECT
  r.id,
  home.id,
  away.id,
  s.kickoff,
  'scheduled',
  TRUE,
  FALSE
FROM temp_schedule s
JOIN rounds r
  ON r.competition_id = '3a2ecd45-6948-4288-9788-55f63ca4d47b'
 AND r.round_number = s.round_number
JOIN teams home ON home.name = s.home
JOIN teams away ON away.name = s.away
ORDER BY s.round_number, s.kickoff;

COMMIT;
