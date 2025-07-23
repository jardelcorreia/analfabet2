const { dbHelpers } = require('./lib/database-server.cjs');
const { determineDefaultRound } = require('./lib/round-helpers.cjs');

exports.handler = async function(event, context) {
  const { leagueId, round } = event.queryStringParameters;

  if (!leagueId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'leagueId is required' }),
    };
  }

  try {
    let targetRound;
    if (round === 'all') {
      targetRound = 'all';
    } else if (round) {
      targetRound = parseInt(round, 10);
    } else {
      const allMatches = await dbHelpers.getMatches();
      targetRound = determineDefaultRound(allMatches);
    }

    const ranking = await dbHelpers.getLeagueRanking(leagueId, targetRound === 'all' ? null : targetRound);
    
    // If viewing all rounds, ensure rounds_won is calculated
    if (targetRound === 'all') {
      // Trigger rounds won calculation for this league if needed
      try {
        await dbHelpers.calculateDetailedRoundsWon(leagueId);
      } catch (error) {
        console.warn('Could not update rounds won:', error.message);
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ ranking, determinedRound: targetRound }),
    };
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch ranking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
    };
  }
};
