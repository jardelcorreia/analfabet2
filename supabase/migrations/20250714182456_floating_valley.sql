/*
  # Fix user stats and bet points calculation

  This migration addresses the issue where user_stats is empty and bet points are NULL.
  
  1. Updates existing matches to 'finished' status with sample scores
  2. Manually triggers the bet points calculation for existing bets
  3. Ensures user_stats are properly populated
  4. Adds a function to manually recalculate all stats when needed
*/

-- First, let's update some sample matches to 'finished' status with scores
-- This will trigger the bet points calculation for any existing bets
UPDATE matches SET 
    status = 'finished',
    home_score = 2,
    away_score = 1
WHERE api_id = 1001; -- Flamengo vs Palmeiras

UPDATE matches SET 
    status = 'finished',
    home_score = 1,
    away_score = 1
WHERE api_id = 1002; -- São Paulo vs Corinthians

UPDATE matches SET 
    status = 'finished',
    home_score = 0,
    away_score = 3
WHERE api_id = 1003; -- Santos vs Grêmio

UPDATE matches SET 
    status = 'finished',
    home_score = 2,
    away_score = 0
WHERE api_id = 1004; -- Atlético-MG vs Cruzeiro

-- Create a function to manually recalculate all bet points and user stats
CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
DECLARE
    match_record RECORD;
    bet_record RECORD;
BEGIN
    -- First, recalculate points for all bets on finished matches
    FOR match_record IN 
        SELECT id, home_score, away_score 
        FROM matches 
        WHERE status = 'finished' AND home_score IS NOT NULL AND away_score IS NOT NULL
    LOOP
        UPDATE bets SET
            points = CASE
                -- Exact score: 3 points
                WHEN bets.home_score = match_record.home_score AND bets.away_score = match_record.away_score THEN 3
                -- Correct outcome (win/loss/draw): 1 point
                WHEN (bets.home_score > bets.away_score AND match_record.home_score > match_record.away_score) OR
                     (bets.home_score < bets.away_score AND match_record.home_score < match_record.away_score) OR
                     (bets.home_score = bets.away_score AND match_record.home_score = match_record.away_score) THEN 1
                -- Incorrect outcome: 0 points
                ELSE 0
            END,
            is_exact = (bets.home_score = match_record.home_score AND bets.away_score = match_record.away_score),
            updated_at = NOW()
        WHERE bets.match_id = match_record.id;
    END LOOP;

    -- Then, recalculate user stats for all users in all leagues
    FOR bet_record IN 
        SELECT DISTINCT user_id, league_id FROM bets
    LOOP
        INSERT INTO user_stats (user_id, league_id, total_points, exact_scores, total_bets, correct_results)
        SELECT 
            bet_record.user_id,
            bet_record.league_id,
            COALESCE(SUM(b.points), 0) as total_points,
            COUNT(CASE WHEN b.is_exact = true THEN 1 END) as exact_scores,
            COUNT(*) as total_bets,
            COUNT(CASE WHEN b.points > 0 THEN 1 END) as correct_results
        FROM bets b
        WHERE b.user_id = bet_record.user_id AND b.league_id = bet_record.league_id
        GROUP BY b.user_id, b.league_id
        ON CONFLICT (user_id, league_id)
        DO UPDATE SET
            total_points = EXCLUDED.total_points,
            exact_scores = EXCLUDED.exact_scores,
            total_bets = EXCLUDED.total_bets,
            correct_results = EXCLUDED.correct_results,
            updated_at = NOW();
    END LOOP;

    RAISE NOTICE 'All stats recalculated successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation function
SELECT recalculate_all_stats();

-- Add some more finished matches for better testing
UPDATE matches SET 
    status = 'finished',
    home_score = 1,
    away_score = 2
WHERE api_id = 1005; -- Botafogo vs Vasco

-- Create a function to add sample bets for testing (optional, can be used manually)
CREATE OR REPLACE FUNCTION add_sample_bets(p_user_id UUID, p_league_id UUID)
RETURNS void AS $$
BEGIN
    -- Add sample bets for the user
    INSERT INTO bets (user_id, match_id, league_id, home_score, away_score) 
    SELECT 
        p_user_id,
        m.id,
        p_league_id,
        FLOOR(RANDOM() * 4)::INTEGER, -- Random score 0-3
        FLOOR(RANDOM() * 4)::INTEGER  -- Random score 0-3
    FROM matches m
    WHERE m.api_id IN (1001, 1002, 1003, 1004, 1005)
    ON CONFLICT (user_id, match_id, league_id) DO NOTHING;
    
    RAISE NOTICE 'Sample bets added for user % in league %', p_user_id, p_league_id;
END;
$$ LANGUAGE plpgsql;

-- Improve the original trigger function to handle edge cases better
CREATE OR REPLACE FUNCTION calculate_bet_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate points when match becomes finished OR when scores are updated on finished matches
    IF NEW.status = 'finished' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
        -- Only update if this is a new finish (status changed) OR if scores changed on already finished match
        IF (OLD.status IS NULL OR OLD.status <> 'finished') OR 
           (OLD.home_score IS DISTINCT FROM NEW.home_score) OR 
           (OLD.away_score IS DISTINCT FROM NEW.away_score) THEN
            
            UPDATE bets SET
                points = CASE
                    -- Exact score: 3 points
                    WHEN bets.home_score = NEW.home_score AND bets.away_score = NEW.away_score THEN 3
                    -- Correct outcome (win/loss/draw): 1 point
                    WHEN (bets.home_score > bets.away_score AND NEW.home_score > NEW.away_score) OR
                         (bets.home_score < bets.away_score AND NEW.home_score < NEW.away_score) OR
                         (bets.home_score = bets.away_score AND NEW.home_score = NEW.away_score) THEN 1
                    -- Incorrect outcome: 0 points
                    ELSE 0
                END,
                is_exact = (bets.home_score = NEW.home_score AND bets.away_score = NEW.away_score),
                updated_at = NOW()
            WHERE bets.match_id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the improved function
DROP TRIGGER IF EXISTS trigger_calculate_bet_points ON matches;
CREATE TRIGGER trigger_calculate_bet_points
    AFTER UPDATE OF status, home_score, away_score ON matches
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bet_points();