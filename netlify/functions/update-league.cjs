const { verifyToken } = require('./lib/auth-server.cjs');
const { dbHelpers } = require('./lib/database-server.cjs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token } = event.headers;
  const decoded = verifyToken(token);

  if (!decoded) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const userId = decoded.id;
  const { leagueId, name, description } = JSON.parse(event.body);

  if (!leagueId || !name) {
    return { statusCode: 400, body: 'League ID and name are required' };
  }

  try {
    // Security check: verify that the user owns the league
    const league = await dbHelpers.getLeagueById(leagueId);
    if (!league) {
      return { statusCode: 404, body: 'League not found' };
    }

    if (league.created_by !== userId) {
      return { statusCode: 403, body: 'Forbidden: You do not own this league' };
    }

    // Proceed with the update
    const updatedLeague = await dbHelpers.updateLeagueDetails(leagueId, name, description);

    if (!updatedLeague) {
      return { statusCode: 500, body: 'Failed to update league' };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedLeague),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
