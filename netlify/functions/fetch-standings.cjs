const { sportsDB_API } = require('./lib/api-server.cjs');

exports.handler = async function(event, context) {
  console.log('[fetch-standings] Function started');

  try {
    const standings = await sportsDB_API.getBrasileiroStandings();

    console.log(`[fetch-standings] Returning ${standings.length} teams in standings.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ standings }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('[fetch-standings] Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch standings',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
