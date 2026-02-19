-- ============================================
-- ELITESERIE 2026 PREDICTIONS - DATABASE SCHEMA (COMPLETE, ORDERED, ERROR-FREE)
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

-- ============================================
-- 10. CONSTRAINTS & INDEXES
-- ============================================

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

-- ============================================
-- 11. SCORING CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_prediction_points(
  p_prediction TEXT,
  p_result TEXT,
  p_is_banker BOOLEAN,
  p_is_match_of_week BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
  -- No result yet
  IF p_result IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate points based on scoring rules
  IF p_prediction = p_result THEN
    -- Correct prediction
    IF p_is_match_of_week THEN
      IF p_is_banker THEN
        RETURN 12; -- MOTW + Banker correct
      ELSE
        RETURN 6;  -- MOTW correct
      END IF;
    ELSE
      IF p_is_banker THEN
        RETURN 6;  -- Regular + Banker correct
      ELSE
        RETURN 3;  -- Regular correct
      END IF;
    END IF;
  ELSE
    -- Wrong prediction
    IF p_is_banker THEN
      IF p_is_match_of_week THEN
        RETURN -6; -- MOTW + Banker wrong
      ELSE
        RETURN -3; -- Regular + Banker wrong
      END IF;
    ELSE
      RETURN 0;    -- Regular wrong (no penalty)
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 12. AUTO-UPDATE POINTS TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_prediction_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all predictions for this match
  UPDATE predictions p
  SET 
    points_earned = calculate_prediction_points(
      p.prediction,
      NEW.result,
      p.is_banker,
      NEW.is_match_of_the_week
    ),
    updated_at = NOW()
  WHERE p.match_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prediction_points
AFTER UPDATE OF result ON matches
FOR EACH ROW
WHEN (OLD.result IS DISTINCT FROM NEW.result)
EXECUTE FUNCTION update_prediction_points();

-- ============================================
-- 13. ROUND STATS CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION update_round_stats(p_round_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete existing stats for this round
  DELETE FROM round_stats WHERE round_id = p_round_id;
  
  -- Calculate and insert new stats
  INSERT INTO round_stats (user_id, round_id, total_points, correct_predictions, banker_correct, rank)
  SELECT 
    p.user_id,
    m.round_id,
    COALESCE(SUM(p.points_earned), 0) as total_points,
    COUNT(CASE WHEN p.points_earned > 0 THEN 1 END) as correct_predictions,
    BOOL_OR(CASE WHEN p.is_banker AND p.points_earned > 0 THEN true ELSE false END) as banker_correct,
    RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC) as rank
  FROM predictions p
  JOIN matches m ON p.match_id = m.id
  WHERE m.round_id = p_round_id
    AND m.include_in_round = true
  GROUP BY p.user_id, m.round_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. LEADERBOARD CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS VOID AS $$
BEGIN
  -- Clear current leaderboard
  TRUNCATE leaderboard;
  
  -- Recalculate from round_stats
  INSERT INTO leaderboard (user_id, total_points, rounds_played, correct_predictions, banker_success, banker_fail, rounds_won, current_rank)
  SELECT 
    rs.user_id,
    SUM(rs.total_points) as total_points,
    COUNT(rs.round_id) as rounds_played,
    SUM(rs.correct_predictions) as correct_predictions,
    SUM(CASE WHEN rs.banker_correct = true THEN 1 ELSE 0 END) as banker_success,
    SUM(CASE WHEN rs.banker_correct = false THEN 1 ELSE 0 END) as banker_fail,
    COUNT(CASE WHEN rs.rank = 1 THEN 1 END) as rounds_won,
    RANK() OVER (ORDER BY SUM(rs.total_points) DESC) as current_rank
  FROM round_stats rs
  GROUP BY rs.user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 15. ENFORCE SINGLE PUBLISHED ROUND (OPTIONAL)
-- ============================================

/*
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
*/

-- ============================================
-- 16. TRIGGER FOR ROUND FINALIZATION
-- ============================================

CREATE OR REPLACE FUNCTION trigger_finalize_round()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'final' AND OLD.status != 'final' THEN
    PERFORM update_round_stats(NEW.id);
    PERFORM update_leaderboard();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_round_final
AFTER UPDATE OF status ON rounds
FOR EACH ROW
EXECUTE FUNCTION trigger_finalize_round();

-- ============================================
-- 17. AUTH USERS → PUBLIC USERS SYNC
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'isAdmin')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================
-- 18. ROW LEVEL SECURITY (OPTIONAL FOR MVP)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_read" ON users 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_predictions_read" ON predictions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_leaderboard_read" ON leaderboard 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_own_predictions" ON predictions 
FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 19. SEED DATA - ELITESERIE TEAMS
-- ============================================

INSERT INTO teams (name, short_name) VALUES
('Bodø/Glimt', 'B/G'),
('Viking FK', 'VIK'),
('Tromsø IL', 'TIL'),
('Rosenborg BK', 'RBK'),
('Molde FK', 'MOL'),
('SK Brann', 'BRA'),
('Sarpsborg 08', 'S08'),
('Vålerenga', 'VIF'),
('Fredrikstad FK', 'FFK'),
('Lillestrøm SK', 'LSK'),
('Sandefjord Fotball', 'SAN'),
('Kristiansund BK', 'KBK'),
('Hamarkameratene', 'HAM'),
('Aalesund FK', 'AAFK'),
('KFUM', 'KFUM'),
('IK Start', 'IKS');

-- ============================================
-- 20. CREATE INITIAL COMPETITION
-- ============================================

INSERT INTO competitions (name, slug, season, is_active)
VALUES ('Eliteserie 2026', 'eliteserie-2026', '2026', true);
