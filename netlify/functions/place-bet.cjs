// Netlify Function: /.netlify/functions/place-bet
// Handles bet placement with server-side deadline validation

const { dbHelpers } = require('./lib/database-server.cjs');
const { verifyToken } = require('./lib/auth-server.cjs');

exports.handler = async function(event, context) {
  console.log('[place-bet] Function started');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // Verify authentication
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid or expired token' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { matchId, leagueId, homeScore, awayScore, betId } = requestBody;

  // Validate required fields
  if (!matchId || !leagueId || homeScore === undefined || awayScore === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Missing required fields: matchId, leagueId, homeScore, awayScore' 
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // Validate score values
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || 
      homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid scores. Must be integers between 0 and 20' 
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Check betting deadline using database function
    console.log('[place-bet] Checking betting deadline for match:', matchId);
    const deadlineCheck = await dbHelpers.checkBettingDeadline(matchId);
    
    if (!deadlineCheck.can_bet) {
      console.log('[place-bet] Betting deadline exceeded:', deadlineCheck.reason);
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Betting deadline exceeded',
          reason: deadlineCheck.reason,
          matchDate: deadlineCheck.match_date,
          currentTime: deadlineCheck.current_time
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Verify league membership
    const membership = await dbHelpers.checkLeagueMembership(leagueId, user.id);
    if (!membership) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You are not a member of this league' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    let result;
    
    if (betId) {
      // Update existing bet
      console.log('[place-bet] Updating existing bet:', betId);
      result = await dbHelpers.updateBet(betId, homeScore, awayScore);
      
      if (!result) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Bet not found or cannot be updated' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }
    } else {
      // Create new bet
      console.log('[place-bet] Creating new bet for user:', user.id);
      result = await dbHelpers.createBet(user.id, matchId, leagueId, homeScore, awayScore);
    }

    console.log('[place-bet] Bet operation successful:', result.id);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: betId ? 'Bet updated successfully' : 'Bet placed successfully',
        bet: result
      }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('[place-bet] Error:', error);
    
    // Handle specific database errors
    if (error.message && error.message.includes('BETTING_DEADLINE_EXCEEDED')) {
      const reason = error.message.split('BETTING_DEADLINE_EXCEEDED: ')[1] || 'Betting deadline has passed';
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Betting deadline exceeded',
          reason: reason
        }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'You have already placed a bet on this match' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An internal server error occurred while processing your bet',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};