-- AnalfaBet Database Schema
-- Sistema de apostas para o Campeonato Brasileiro

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(10) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League members table
CREATE TABLE IF NOT EXISTS league_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_id INTEGER UNIQUE NOT NULL,
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    round INTEGER NOT NULL,
    season VARCHAR(10) DEFAULT '2024',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    points INTEGER,
    is_exact BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id, league_id)
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    exact_scores INTEGER DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    correct_results INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_league_members_league_id ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user_id ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_league_id ON bets(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
CREATE INDEX IF NOT EXISTS idx_user_stats_league_id ON user_stats(league_id);

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user stats
    INSERT INTO user_stats (user_id, league_id, total_points, exact_scores, total_bets, correct_results)
    SELECT 
        NEW.user_id,
        NEW.league_id,
        COALESCE(SUM(b.points), 0) as total_points,
        COUNT(CASE WHEN b.is_exact = true THEN 1 END) as exact_scores,
        COUNT(*) as total_bets,
        COUNT(CASE WHEN b.points > 0 THEN 1 END) as correct_results
    FROM bets b
    WHERE b.user_id = NEW.user_id AND b.league_id = NEW.league_id
    GROUP BY b.user_id, b.league_id
    ON CONFLICT (user_id, league_id)
    DO UPDATE SET
        total_points = EXCLUDED.total_points,
        exact_scores = EXCLUDED.exact_scores,
        total_bets = EXCLUDED.total_bets,
        correct_results = EXCLUDED.correct_results,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats when bets are inserted or updated
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Function to calculate bet points
CREATE OR REPLACE FUNCTION calculate_bet_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate points for finished matches
    IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        UPDATE bets SET
            points = CASE
                WHEN home_score = NEW.home_score AND away_score = NEW.away_score THEN 3
                WHEN (home_score > away_score AND NEW.home_score > NEW.away_score) OR
                     (home_score < away_score AND NEW.home_score < NEW.away_score) OR
                     (home_score = away_score AND NEW.home_score = NEW.away_score) THEN 1
                ELSE 0
            END,
            is_exact = (home_score = NEW.home_score AND away_score = NEW.away_score)
        WHERE match_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate points when match results are updated
CREATE TRIGGER trigger_calculate_bet_points
    AFTER UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bet_points();

-- Sample data for testing (Brazilian teams)
INSERT INTO matches (api_id, home_team, away_team, match_date, round, season, status) VALUES
(1001, 'Flamengo', 'Palmeiras', '2024-04-15 16:00:00-03', 1, '2024', 'scheduled'),
(1002, 'São Paulo', 'Corinthians', '2024-04-15 18:30:00-03', 1, '2024', 'scheduled'),
(1003, 'Santos', 'Grêmio', '2024-04-16 20:00:00-03', 1, '2024', 'scheduled'),
(1004, 'Atlético-MG', 'Cruzeiro', '2024-04-17 19:00:00-03', 1, '2024', 'scheduled'),
(1005, 'Botafogo', 'Vasco', '2024-04-17 21:30:00-03', 1, '2024', 'scheduled'),
(1006, 'Internacional', 'Fluminense', '2024-04-18 16:00:00-03', 1, '2024', 'scheduled'),
(1007, 'Bahia', 'Fortaleza', '2024-04-18 18:30:00-03', 1, '2024', 'scheduled'),
(1008, 'Athletico-PR', 'Bragantino', '2024-04-19 20:00:00-03', 1, '2024', 'scheduled'),
(1009, 'Goiás', 'Coritiba', '2024-04-19 21:30:00-03', 1, '2024', 'scheduled'),
(1010, 'Cuiabá', 'América-MG', '2024-04-20 16:00:00-03', 1, '2024', 'scheduled')
ON CONFLICT (api_id) DO NOTHING;