-- ============================================
-- ELITESERIE 2026 PREDICTIONS - DATABASE SCHEMA (ORDERED, FINAL)
-- ============================================

-- 1. Competitions/Seasons
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  season TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES users(id) NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, competition_id)
);

-- 4. Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT
);

-- 5. Rounds
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  round_type TEXT CHECK (round_type IN ('regular', 'standalone')) DEFAULT 'regular',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'published', 'final')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, round_number)
);

-- 6. Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id) NOT NULL,
  away_team_id UUID REFERENCES teams(id) NOT NULL,
  kickoff TIMESTAMP WITH TIME ZONE NOT NULL,
  result TEXT CHECK (result IN ('H', 'U', 'B', NULL)),
  status TEXT CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')) DEFAULT 'scheduled',
  include_in_round BOOLEAN DEFAULT TRUE,
  is_match_of_the_week BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL, -- must be provided on insert
  prediction TEXT CHECK (prediction IN ('H', 'U', 'B')) NOT NULL,
  is_banker BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  points_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 8. Leaderboard
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  rounds_played INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  banker_success INTEGER DEFAULT 0,
  banker_fail INTEGER DEFAULT 0,
  rounds_won INTEGER DEFAULT 0,
  current_rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Round Stats
CREATE TABLE round_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE NOT NULL,
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  banker_correct BOOLEAN,
  rank INTEGER,
  UNIQUE(user_id, round_id)
);

-- 10. Indexes and Constraints
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches(round_id) 
WHERE is_match_of_the_week = true;

CREATE UNIQUE INDEX idx_one_banker_per_round_per_user
ON predictions(user_id, round_id)
WHERE is_banker = true;

CREATE INDEX idx_rounds_competition ON rounds(competition_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_matches_round_id ON matches(round_id);
CREATE INDEX idx_matches_kickoff ON matches(kickoff);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(current_rank);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ...rest of schema unchanged (functions, triggers, RLS, seed data, etc.) ...
