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

    const bets = await dbHelpers.getLeagueBetsWithMatches(leagueId, targetRound === 'all' ? null : targetRound);
    return {
      statusCode: 200,
      body: JSON.stringify({ bets, determinedRound: targetRound }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch league bets' }),
    };
  }
};
