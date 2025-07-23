/*
  # Server-side betting deadline validation

  This migration adds server-side validation to prevent betting after match deadlines.
  
  1. Database Functions
    - `can_place_bet()` - Validates if betting is allowed for a match
    - `validate_bet_deadline()` - Trigger function to enforce deadlines
  
  2. Triggers
    - Prevents INSERT/UPDATE on bets table after match starts
  
  3. Security
    - Server-side enforcement that cannot be bypassed by client
    - Clear error messages for different deadline scenarios
*/

-- Function to check if betting is allowed for a match
CREATE OR REPLACE FUNCTION can_place_bet(match_id_param UUID)
RETURNS TABLE(
    can_bet BOOLEAN,
    reason TEXT,
    match_date TIMESTAMP WITH TIME ZONE,
    current_time TIMESTAMP WITH TIME ZONE,
    match_status TEXT
) AS $$
DECLARE
    match_record RECORD;
    current_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    current_timestamp := NOW();
    
    -- Get match details
    SELECT m.match_date, m.status, m.home_team, m.away_team
    INTO match_record
    FROM matches m
    WHERE m.id = match_id_param;
    
    -- Check if match exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false::BOOLEAN,
            'Match not found'::TEXT,
            NULL::TIMESTAMP WITH TIME ZONE,
            current_timestamp,
            'unknown'::TEXT;
        RETURN;
    END IF;
    
    -- Check if match has already started or finished
    IF match_record.status IN ('live', 'finished', 'postponed', 'cancelled') THEN
        RETURN QUERY SELECT 
            false::BOOLEAN,
            ('Betting is closed. Match status: ' || match_record.status)::TEXT,
            match_record.match_date,
            current_timestamp,
            match_record.status::TEXT;
        RETURN;
    END IF;
    
    -- Check if match date has passed (with 5-minute buffer before kickoff)
    IF match_record.match_date <= (current_timestamp + INTERVAL '5 minutes') THEN
        RETURN QUERY SELECT 
            false::BOOLEAN,
            'Betting deadline has passed. Match starts in less than 5 minutes or has already started'::TEXT,
            match_record.match_date,
            current_timestamp,
            match_record.status::TEXT;
        RETURN;
    END IF;
    
    -- Betting is allowed
    RETURN QUERY SELECT 
        true::BOOLEAN,
        'Betting is allowed'::TEXT,
        match_record.match_date,
        current_timestamp,
        match_record.status::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate betting deadlines
CREATE OR REPLACE FUNCTION validate_bet_deadline()
RETURNS TRIGGER AS $$
DECLARE
    bet_validation RECORD;
BEGIN
    -- Check if betting is allowed for this match
    SELECT * INTO bet_validation
    FROM can_place_bet(NEW.match_id)
    LIMIT 1;
    
    -- If betting is not allowed, raise an exception
    IF NOT bet_validation.can_bet THEN
        RAISE EXCEPTION 'BETTING_DEADLINE_EXCEEDED: %', bet_validation.reason
            USING HINT = 'Check match status and timing before placing bets';
    END IF;
    
    -- Log successful bet validation (optional, for debugging)
    RAISE NOTICE 'Bet validation passed for match_id: %, user_id: %', NEW.match_id, NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce betting deadlines
DROP TRIGGER IF EXISTS trigger_validate_bet_deadline ON bets;
CREATE TRIGGER trigger_validate_bet_deadline
    BEFORE INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION validate_bet_deadline();

-- Function to get betting status for multiple matches (for UI)
CREATE OR REPLACE FUNCTION get_matches_betting_status(match_ids UUID[])
RETURNS TABLE(
    match_id UUID,
    can_bet BOOLEAN,
    reason TEXT,
    time_until_deadline INTERVAL
) AS $$
DECLARE
    match_id_param UUID;
    validation_result RECORD;
BEGIN
    FOREACH match_id_param IN ARRAY match_ids
    LOOP
        SELECT * INTO validation_result
        FROM can_place_bet(match_id_param)
        LIMIT 1;
        
        RETURN QUERY SELECT 
            match_id_param,
            validation_result.can_bet,
            validation_result.reason,
            CASE 
                WHEN validation_result.match_date IS NOT NULL 
                THEN validation_result.match_date - validation_result.current_time - INTERVAL '5 minutes'
                ELSE NULL
            END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired betting opportunities (optional maintenance)
CREATE OR REPLACE FUNCTION update_expired_match_statuses()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update matches that should no longer accept bets but are still marked as 'scheduled'
    -- This is a maintenance function that can be run periodically
    UPDATE matches 
    SET status = 'live'
    WHERE status = 'scheduled' 
    AND match_date <= (NOW() - INTERVAL '5 minutes');
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % matches from scheduled to live based on match time', updated_count;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Test the betting validation with some examples
DO $$
DECLARE
    test_match_id UUID;
    validation_result RECORD;
BEGIN
    -- Get a test match ID
    SELECT id INTO test_match_id FROM matches LIMIT 1;
    
    IF test_match_id IS NOT NULL THEN
        -- Test the validation function
        SELECT * INTO validation_result FROM can_place_bet(test_match_id) LIMIT 1;
        
        RAISE NOTICE 'Test validation for match %: can_bet=%, reason=%', 
            test_match_id, validation_result.can_bet, validation_result.reason;
    END IF;
END $$;