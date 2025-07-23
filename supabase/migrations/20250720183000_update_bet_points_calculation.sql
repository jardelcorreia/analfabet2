-- Update the calculate_bet_points function to calculate points for live matches

CREATE OR REPLACE FUNCTION calculate_bet_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate points for finished or live matches
    IF (NEW.status = 'finished' OR NEW.status = 'live') AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL THEN
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
