/*
  # Add rounds won tracking to ranking system

  This migration adds the ability to track how many rounds each player has won
  in each league, providing additional competitive metrics.
  
  1. New Column
    - Add `rounds_won` to user_stats table
  
  2. New Functions
    - `calculate_rounds_won()` - Calculate rounds won for all players
    - `update_rounds_won_for_league()` - Update rounds won for specific league
  
  3. Updated Triggers
    - Automatically update rounds won when bet points change
*/

-- Add rounds_won column to user_stats table
ALTER TABLE user_stats 
ADD COLUMN IF NOT EXISTS rounds_won INTEGER DEFAULT 0;

-- Function to calculate rounds won for a specific league
CREATE OR REPLACE FUNCTION calculate_rounds_won_for_league(league_id_param UUID)
RETURNS void AS $$
DECLARE
    round_record RECORD;
    winner_record RECORD;
BEGIN
    -- Reset rounds_won for this league
    UPDATE user_stats 
    SET rounds_won = 0 
    WHERE league_id = league_id_param;
    
    -- For each round that has finished matches
    FOR round_record IN 
        SELECT DISTINCT m.round
        FROM matches m
        INNER JOIN bets b ON m.id = b.match_id
        WHERE b.league_id = league_id_param 
        AND m.status = 'finished'
        AND b.points IS NOT NULL
        ORDER BY m.round
    LOOP
        -- Find the winner(s) of this round
        -- In case of ties, all tied players get credit for winning the round
        FOR winner_record IN
            SELECT b.user_id
            FROM bets b
            INNER JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param 
            AND m.round = round_record.round
            AND m.status = 'finished'
            AND b.points IS NOT NULL
            GROUP BY b.user_id
            HAVING SUM(b.points) = (
                -- Get the maximum points for this round
                SELECT MAX(round_points.total_points)
                FROM (
                    SELECT SUM(b2.points) as total_points
                    FROM bets b2
                    INNER JOIN matches m2 ON b2.match_id = m2.id
                    WHERE b2.league_id = league_id_param 
                    AND m2.round = round_record.round
                    AND m2.status = 'finished'
                    AND b2.points IS NOT NULL
                    GROUP BY b2.user_id
                ) round_points
            )
        LOOP
            -- Increment rounds_won for the winner(s)
            UPDATE user_stats 
            SET rounds_won = rounds_won + 1
            WHERE user_id = winner_record.user_id 
            AND league_id = league_id_param;
            
            -- If user_stats doesn't exist, create it
            INSERT INTO user_stats (user_id, league_id, rounds_won)
            VALUES (winner_record.user_id, league_id_param, 1)
            ON CONFLICT (user_id, league_id) 
            DO UPDATE SET rounds_won = user_stats.rounds_won + 1;
        END LOOP;
        
        RAISE NOTICE 'Calculated round % winner(s) for league %', round_record.round, league_id_param;
    END LOOP;
    
    RAISE NOTICE 'Rounds won calculation completed for league %', league_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rounds won for all leagues
CREATE OR REPLACE FUNCTION calculate_all_rounds_won()
RETURNS void AS $$
DECLARE
    league_record RECORD;
BEGIN
    -- For each league that has bets
    FOR league_record IN 
        SELECT DISTINCT league_id FROM bets
    LOOP
        PERFORM calculate_rounds_won_for_league(league_record.league_id);
    END LOOP;
    
    RAISE NOTICE 'Rounds won calculation completed for all leagues';
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to update user stats including rounds won
CREATE OR REPLACE FUNCTION update_user_stats_with_rounds()
RETURNS TRIGGER AS $$
BEGIN
    -- Update basic stats first
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
    
    -- Then update rounds won for the entire league
    PERFORM calculate_rounds_won_for_league(NEW.league_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the enhanced function
DROP TRIGGER IF EXISTS trigger_update_user_stats ON bets;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_with_rounds();

-- Function to get round winners for display purposes
CREATE OR REPLACE FUNCTION get_round_winners(league_id_param UUID, round_param INTEGER)
RETURNS TABLE(
    user_id UUID,
    user_name VARCHAR,
    round_points INTEGER,
    is_winner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH round_scores AS (
        SELECT 
            b.user_id,
            u.name as user_name,
            SUM(b.points) as round_points
        FROM bets b
        INNER JOIN matches m ON b.match_id = m.id
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.league_id = league_id_param 
        AND m.round = round_param
        AND m.status = 'finished'
        AND b.points IS NOT NULL
        GROUP BY b.user_id, u.name
    ),
    max_points AS (
        SELECT MAX(round_points) as max_round_points
        FROM round_scores
    )
    SELECT 
        rs.user_id,
        rs.user_name,
        rs.round_points::INTEGER,
        (rs.round_points = mp.max_round_points) as is_winner
    FROM round_scores rs
    CROSS JOIN max_points mp
    ORDER BY rs.round_points DESC, rs.user_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Execute initial calculation for existing data
SELECT calculate_all_rounds_won();

-- Add index for better performance on rounds_won queries
CREATE INDEX IF NOT EXISTS idx_user_stats_rounds_won ON user_stats(league_id, rounds_won DESC);