-- This migration fixes a deadlock issue by decoupling the user_stats update from the
-- round_winners calculation. It also enhances the round winner calculation to include
-- "mathematic" winners for ongoing rounds, correctly handling in-progress matches.

-- Step 1: Update the trigger function to only update user_stats, removing the
-- expensive round winner calculation to prevent deadlocks.
CREATE OR REPLACE FUNCTION update_user_stats_from_bet()
RETURNS TRIGGER AS $$
BEGIN
    -- Update basic stats for the user who placed the bet.
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

-- Update the trigger to use the new, more focused function.
DROP TRIGGER IF EXISTS trigger_update_user_stats ON bets;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_from_bet();


-- Step 2: Create a function to check if a round is mathematically defined.
CREATE OR REPLACE FUNCTION is_round_mathematically_defined(p_league_id UUID, p_round_number INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_finished_matches_count INTEGER;
    v_total_matches_count INTEGER;
    v_mathematic_winner_exists BOOLEAN;
BEGIN
    -- Count finished matches in the round
    SELECT COUNT(*)
    INTO v_finished_matches_count
    FROM matches
    WHERE round = p_round_number AND status = 'finished';

    -- Count total matches in the round
    SELECT COUNT(*)
    INTO v_total_matches_count
    FROM matches
    WHERE round = p_round_number;

    -- If all matches are finished, the round is defined.
    IF v_finished_matches_count = v_total_matches_count THEN
        RETURN TRUE;
    END IF;

    -- Check if a winner has already been recorded for this round.
    SELECT EXISTS (
        SELECT 1
        FROM round_winners
        WHERE league_id = p_league_id AND round_number = p_round_number
    )
    INTO v_mathematic_winner_exists;

    RETURN v_mathematic_winner_exists;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update the main calculation function to find mathematic winners robustly.
-- This function will now be called from the API, not from a trigger.
CREATE OR REPLACE FUNCTION calculate_detailed_rounds_won_for_league(league_id_param UUID)
RETURNS void AS $$
DECLARE
    round_record RECORD;
    winner_record RECORD;
    max_points INTEGER;
    -- Variables for mathematic winner calculation
    ongoing_round_record RECORD;
    remaining_matches_count INTEGER;
    max_potential_points_gain INTEGER;
    leader_locked_in_score INTEGER;
    leader_user_id UUID;
    is_unbeatable BOOLEAN;
    competitor_locked_in_score INTEGER;

BEGIN
    -- Clear existing round winners for this league to recalculate everything.
    DELETE FROM round_winners WHERE league_id = league_id_param;

    -- Part 1: Calculate winners for ONGOING rounds (mathematic winners)
    FOR ongoing_round_record IN
        SELECT DISTINCT m.round
        FROM matches m
        WHERE EXISTS (
            SELECT 1 FROM matches m2
            WHERE m2.round = m.round AND m2.status != 'finished'
        )
        AND EXISTS (
            SELECT 1 FROM bets b WHERE b.league_id = league_id_param AND b.match_id IN (SELECT id FROM matches WHERE round = m.round)
        )
        ORDER BY m.round
    LOOP
        -- Calculate remaining matches (scheduled or in-progress) and potential points
        SELECT COUNT(*) INTO remaining_matches_count
        FROM matches
        WHERE round = ongoing_round_record.round AND status != 'finished';

        max_potential_points_gain := remaining_matches_count * 3;

        -- Find the current leader and their "locked-in" score (from finished matches only)
        SELECT b.user_id, COALESCE(SUM(b.points), 0) INTO leader_user_id, leader_locked_in_score
        FROM bets b
        JOIN matches m ON b.match_id = m.id
        WHERE b.league_id = league_id_param
          AND m.round = ongoing_round_record.round
          AND m.status = 'finished'
        GROUP BY b.user_id
        ORDER BY SUM(b.points) DESC
        LIMIT 1;

        IF leader_user_id IS NULL THEN
            CONTINUE;
        END IF;

        is_unbeatable := TRUE;
        FOR winner_record IN
            SELECT b.user_id
            FROM bets b
            JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param
              AND m.round = ongoing_round_record.round
              AND b.user_id != leader_user_id
            GROUP BY b.user_id
        LOOP
            SELECT COALESCE(SUM(b.points), 0) INTO competitor_locked_in_score
            FROM bets b
            JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param
              AND m.round = ongoing_round_record.round
              AND m.status = 'finished'
              AND b.user_id = winner_record.user_id;

            IF leader_locked_in_score < competitor_locked_in_score + max_potential_points_gain THEN
                is_unbeatable := FALSE;
                EXIT;
            END IF;
        END LOOP;

        IF is_unbeatable THEN
            INSERT INTO round_winners (user_id, league_id, round_number, points_in_round)
            VALUES (leader_user_id, league_id_param, ongoing_round_record.round, leader_locked_in_score)
            ON CONFLICT (user_id, league_id, round_number) DO NOTHING;
        END IF;

    END LOOP;

    -- Part 2: Calculate winners for FINISHED rounds
    FOR round_record IN
        SELECT DISTINCT m.round
        FROM matches m
        WHERE m.status = 'finished'
          AND NOT EXISTS (SELECT 1 FROM matches m2 WHERE m2.round = m.round AND m2.status != 'finished')
          AND EXISTS (SELECT 1 FROM bets b WHERE b.league_id = league_id_param AND b.match_id = m.id)
        ORDER BY m.round
    LOOP
        SELECT MAX(round_points.total_points) INTO max_points
        FROM (
            SELECT SUM(b2.points) as total_points
            FROM bets b2
            INNER JOIN matches m2 ON b2.match_id = m2.id
            WHERE b2.league_id = league_id_param
            AND m2.round = round_record.round
            GROUP BY b2.user_id
        ) round_points;

        FOR winner_record IN
            SELECT b.user_id, SUM(b.points) as total_points
            FROM bets b
            INNER JOIN matches m ON b.match_id = m.id
            WHERE b.league_id = league_id_param
            AND m.round = round_record.round
            GROUP BY b.user_id
            HAVING SUM(b.points) = max_points AND max_points > 0
        LOOP
            INSERT INTO round_winners (user_id, league_id, round_number, points_in_round)
            VALUES (winner_record.user_id, league_id_param, round_record.round, winner_record.total_points)
            ON CONFLICT (user_id, league_id, round_number) DO UPDATE
            SET points_in_round = winner_record.total_points;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
