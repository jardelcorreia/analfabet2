-- This migration updates the ranking logic to handle ties and adds a new field to the user_stats table to store the number of ties.

-- Update the calculate_detailed_rounds_won_for_league function to handle ties.
CREATE OR REPLACE FUNCTION calculate_detailed_rounds_won_for_league(league_id_param UUID)
RETURNS void AS $$
DECLARE
    round_record RECORD;
    winner_record RECORD;
    max_points INTEGER;
    max_exact_scores INTEGER;
BEGIN
    -- Clear existing round winners for this league
    DELETE FROM round_winners WHERE league_id = league_id_param;

    -- Reset rounds_won and rounds_tied counter for this league
    UPDATE user_stats
    SET rounds_won = 0, rounds_tied = 0
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

        -- Get the maximum number of exact scores for players with the maximum points
        SELECT MAX(round_points.exact_scores) INTO max_exact_scores
        FROM (
            SELECT COUNT(CASE WHEN b2.is_exact THEN 1 END) as exact_scores
            FROM bets b2
            INNER JOIN matches m2 ON b2.match_id = m2.id
            WHERE b2.league_id = league_id_param
            AND m2.round = round_record.round
            AND m2.status = 'finished'
            AND b2.points IS NOT NULL
            GROUP BY b2.user_id
            HAVING SUM(b2.points) = max_points
        ) round_points;

        -- Find all players who achieved the maximum points and the maximum number of exact scores (potential winners)
        WITH round_winners_candidates AS (
            SELECT
                b.user_id,
                SUM(b.points) as total_points
            FROM bets b
            INNER JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param
            AND m.round = round_record.round
            AND m.status = 'finished'
            AND b.points IS NOT NULL
            GROUP BY b.user_id
            HAVING SUM(b.points) = max_points AND COUNT(CASE WHEN b.is_exact THEN 1 END) = max_exact_scores
        )
        SELECT
            ARRAY_AGG(user_id) as winner_ids,
            COUNT(user_id) as winner_count,
            MAX(total_points) as points
        INTO winner_record
        FROM round_winners_candidates;

        -- If we have winners, process them
        IF winner_record.winner_count > 0 THEN
            -- If there is a single winner, it's a win
            IF winner_record.winner_count = 1 THEN
                -- Insert into round_winners table
                INSERT INTO round_winners (user_id, league_id, round_number, points_in_round)
                VALUES (winner_record.winner_ids[1], league_id_param, round_record.round, winner_record.points)
                ON CONFLICT (user_id, league_id, round_number) DO NOTHING;

                -- If user_stats doesn't exist, create it, otherwise update it
                INSERT INTO user_stats (user_id, league_id, rounds_won)
                VALUES (winner_record.winner_ids[1], league_id_param, 1)
                ON CONFLICT (user_id, league_id) DO UPDATE SET rounds_won = user_stats.rounds_won + 1;

            -- If there are multiple winners, it's a tie
            ELSE
                -- Loop through all tied winners
                FOR i IN 1..winner_record.winner_count LOOP
                    -- Insert into round_winners table
                    INSERT INTO round_winners (user_id, league_id, round_number, points_in_round)
                    VALUES (winner_record.winner_ids[i], league_id_param, round_record.round, winner_record.points)
                    ON CONFLICT (user_id, league_id, round_number) DO NOTHING;

                    -- If user_stats doesn't exist, create it, otherwise update it
                    INSERT INTO user_stats (user_id, league_id, rounds_tied)
                    VALUES (winner_record.winner_ids[i], league_id_param, 1)
                    ON CONFLICT (user_id, league_id) DO UPDATE SET rounds_tied = user_stats.rounds_tied + 1;
                END LOOP;
            END IF;
        END IF;

        RAISE NOTICE 'Calculated round % winners for league % (max points: %, max exact scores: %)',
            round_record.round, league_id_param, max_points, max_exact_scores;
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
    was_tie BOOLEAN,
    rounds_tied INTEGER
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
        (rd.winners_count > 1) as was_tie,
        us.rounds_tied
    FROM round_data rd
    LEFT JOIN user_stats us ON us.user_id = player_id AND us.league_id = league_id_param
    ORDER BY rd.round_number;
END;
$$ LANGUAGE plpgsql;
