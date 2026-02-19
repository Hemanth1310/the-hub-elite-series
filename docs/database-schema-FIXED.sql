-- ============================================
-- ELITESERIE 2026 PREDICTIONS - DATABASE SCHEMA (FIXED)
-- ============================================

-- ...existing code up to predictions table...

-- Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  round_id UUID GENERATED ALWAYS AS ( 
    (SELECT m.round_id FROM matches m WHERE m.id = match_id)
  ) STORED,
  prediction TEXT CHECK (prediction IN ('H', 'U', 'B')) NOT NULL,
  is_banker BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  points_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ...rest of schema unchanged...

-- Only one MOTW per round
CREATE UNIQUE INDEX idx_one_motw_per_round 
ON matches(round_id) 
WHERE is_match_of_the_week = true;

-- Only one banker per round per user (FIXED)
CREATE UNIQUE INDEX idx_one_banker_per_round_per_user
ON predictions(user_id, round_id)
WHERE is_banker = true;

-- ...rest of schema unchanged...

-- (Copy the rest of your schema as-is below this point)

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

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
