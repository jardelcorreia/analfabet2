/*
  # Add detailed rounds won tracking

  This migration adds the ability to track which specific rounds each player has won
  in each league, providing detailed competitive metrics.

  1. New Table
    - `round_winners` - Track specific rounds won by each player

  2. New Functions
    - `calculate_detailed_rounds_won()` - Calculate specific rounds won for all players
    - `get_player_rounds_won()` - Get list of rounds won by a specific player

  3. Updated Functions
    - Enhanced rounds won calculation with detailed tracking
*/

-- Create table to track specific rounds won by each player
CREATE TABLE IF NOT EXISTS round_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    points_in_round INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id, round_number)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_round_winners_user_league ON round_winners(user_id, league_id);
CREATE INDEX IF NOT EXISTS idx_round_winners_league_round ON round_winners(league_id, round_number);

-- Function to calculate detailed rounds won for a specific league
CREATE OR REPLACE FUNCTION calculate_detailed_rounds_won_for_league(league_id_param UUID)
RETURNS void AS $$
DECLARE
    round_record RECORD;
    winner_record RECORD;
    max_points INTEGER;
BEGIN
    -- Clear existing round winners for this league
    DELETE FROM round_winners WHERE league_id = league_id_param;

    -- Reset rounds_won counter for this league
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
        -- Get the maximum points for this round
        SELECT MAX(round_points.total_points) INTO max_points
        FROM (
            SELECT SUM(b2.points) as total_points
            FROM bets b2
            INNER JOIN matches m2 ON b2.match_id = m2.id
            WHERE b2.league_id = league_id_param
            AND m2.round = round_record.round
            AND m2.status = 'finished'
            AND b2.points IS NOT NULL
            GROUP BY b2.user_id
        ) round_points;

        -- Find all players who achieved the maximum points (winners)
        FOR winner_record IN
            SELECT b.user_id, SUM(b.points) as total_points
            FROM bets b
            INNER JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param
            AND m.round = round_record.round
            AND m.status = 'finished'
            AND b.points IS NOT NULL
            GROUP BY b.user_id
            HAVING SUM(b.points) = max_points
        LOOP
            -- Insert round winner record
            INSERT INTO round_winners (user_id, league_id, round_number, points_in_round)
            VALUES (winner_record.user_id, league_id_param, round_record.round, winner_record.total_points)
            ON CONFLICT (user_id, league_id, round_number) DO NOTHING;

            -- Increment rounds_won counter
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

        RAISE NOTICE 'Calculated round % winners for league % (max points: %)',
            round_record.round, league_id_param, max_points;
    END LOOP;

    RAISE NOTICE 'Detailed rounds won calculation completed for league %', league_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get rounds won by a specific player in a league
CREATE OR REPLACE FUNCTION get_player_rounds_won(player_id UUID, league_id_param UUID)
RETURNS TABLE(
    round_number INTEGER,
    points_in_round INTEGER,
    total_players_in_round INTEGER,
    was_tie BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH round_data AS (
        SELECT
            rw.round_number,
            rw.points_in_round,
            COUNT(*) OVER (PARTITION BY rw.round_number) as winners_count,
            (SELECT COUNT(DISTINCT b.user_id)
             FROM bets b
             INNER JOIN matches m ON b.match_id = m.id
             WHERE b.league_id = league_id_param
             AND m.round = rw.round_number
             AND m.status = 'finished'
             AND b.points IS NOT NULL) as total_players
        FROM round_winners rw
        WHERE rw.user_id = player_id
        AND rw.league_id = league_id_param
    )
    SELECT
        rd.round_number,
        rd.points_in_round,
        rd.total_players::INTEGER,
        (rd.winners_count > 1) as was_tie
    FROM round_data rd
    ORDER BY rd.round_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get all rounds won data for a league (for ranking display)
CREATE OR REPLACE FUNCTION get_league_rounds_won_summary(league_id_param UUID)
RETURNS TABLE(
    user_id UUID,
    user_name VARCHAR,
    rounds_won_list INTEGER[],
    total_rounds_won INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id as user_id,
        u.name as user_name,
        COALESCE(ARRAY_AGG(rw.round_number ORDER BY rw.round_number), ARRAY[]::INTEGER[]) as rounds_won_list,
        COUNT(rw.round_number)::INTEGER as total_rounds_won
    FROM users u
    INNER JOIN league_members lm ON u.id = lm.user_id
    LEFT JOIN round_winners rw ON u.id = rw.user_id AND rw.league_id = league_id_param
    WHERE lm.league_id = league_id_param
    GROUP BY u.id, u.name
    ORDER BY total_rounds_won DESC, u.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to update user stats with detailed rounds tracking
CREATE OR REPLACE FUNCTION update_user_stats_with_detailed_rounds()
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

    -- Then update detailed rounds won for the entire league
    PERFORM calculate_detailed_rounds_won_for_league(NEW.league_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the enhanced function
DROP TRIGGER IF EXISTS trigger_update_user_stats ON bets;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_with_detailed_rounds();

-- Function to get round winners for a specific round (for detailed view)
CREATE OR REPLACE FUNCTION get_round_winners_detailed(league_id_param UUID, round_param INTEGER)
RETURNS TABLE(
    user_id UUID,
    user_name VARCHAR,
    points_in_round INTEGER,
    is_winner BOOLEAN,
    total_players INTEGER
) AS $$
DECLARE
    max_points INTEGER;
    player_count INTEGER;
BEGIN
    -- Get max points and total players for this round
    SELECT
        MAX(round_points.total_points),
        COUNT(DISTINCT round_points.user_id)
    INTO max_points, player_count
    FROM (
        SELECT
            b.user_id,
            SUM(b.points) as total_points
        FROM bets b
        INNER JOIN matches m ON b.match_id = m.id
        WHERE b.league_id = league_id_param
        AND m.round = round_param
        AND m.status = 'finished'
        AND b.points IS NOT NULL
        GROUP BY b.user_id
    ) round_points;

    RETURN QUERY
    SELECT
        b.user_id,
        u.name as user_name,
        SUM(b.points)::INTEGER as points_in_round,
        (SUM(b.points) = max_points) as is_winner,
        player_count::INTEGER as total_players
    FROM bets b
    INNER JOIN matches m ON b.match_id = m.id
    INNER JOIN users u ON b.user_id = u.id
    WHERE b.league_id = league_id_param
    AND m.round = round_param
    AND m.status = 'finished'
    AND b.points IS NOT NULL
    GROUP BY b.user_id, u.name
    ORDER BY points_in_round DESC, u.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Execute initial calculation for existing data
DO $$
DECLARE
    league_record RECORD;
BEGIN
    -- Calculate detailed rounds won for all existing leagues
    FOR league_record IN
        SELECT DISTINCT league_id FROM bets
    LOOP
        PERFORM calculate_detailed_rounds_won_for_league(league_record.league_id);
    END LOOP;

    RAISE NOTICE 'Initial detailed rounds won calculation completed for all leagues';
END $$;