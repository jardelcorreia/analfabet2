const axios = require('axios');
const { dbHelpers } = require('./lib/database-server.cjs');

const API_KEY = process.env.SPORTSDB_API_KEY; // Replace with your actual API key
const API_URL = 'https://www.thesportsdb.com/api/v1/json/{API_KEY}/eventsround.php?id=4351&r={round}&s=2025'; // 4351 is the ID for Brasileirão Série A 2025

const getStatus = (apiStatus) => {
  if (!apiStatus) return 'unknown';

  const lowerCaseStatus = apiStatus.toLowerCase();
  console.log(`[getStatus] API status: ${lowerCaseStatus}`);

  // Match finished/completed games
  if (lowerCaseStatus.includes('finished') ||
      lowerCaseStatus.includes('match finished') ||
      lowerCaseStatus.includes('ft') ||
      lowerCaseStatus.includes('full time') ||
      lowerCaseStatus.includes('final') ||
      lowerCaseStatus.includes('complete') ||
      lowerCaseStatus.includes('aet') || // After Extra Time
      lowerCaseStatus.includes('pen.')) { // Penalties
    return 'finished';
  }

  // Match live/ongoing games
  if (lowerCaseStatus.includes('live') ||
      lowerCaseStatus.includes('1h') ||
      lowerCaseStatus.includes('2h') ||
      lowerCaseStatus.includes('ht') ||
      lowerCaseStatus.includes('half time') ||
      lowerCaseStatus.includes('et') ||
      lowerCaseStatus.includes('extra time') ||
      lowerCaseStatus.includes('pen') ||
      lowerCaseStatus.includes('penalties') ||
      lowerCaseStatus.includes('in play')) {
    return 'live';
  }

  // Match postponed/cancelled games
  if (lowerCaseStatus.includes('postponed') ||
      lowerCaseStatus.includes('cancelled') ||
      lowerCaseStatus.includes('canceled') ||
      lowerCaseStatus.includes('suspended') ||
      lowerCaseStatus.includes('delayed') ||
      lowerCaseStatus.includes('abandoned')) {
    return 'postponed';
  }

  // Match not started
  if (lowerCaseStatus.includes('not started') ||
      lowerCaseStatus.includes('scheduled') ||
      lowerCaseStatus.includes('tba')) {
    return 'scheduled';
  }

  // Default to scheduled for upcoming games
  return 'scheduled';
};

exports.handler = async function(event, context) {
  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key is missing' }),
    };
  }

  const { round: singleRound } = event.queryStringParameters || {};

  try {
    const roundsToFetch = singleRound ? [singleRound] : Array.from({ length: 38 }, (_, i) => i + 1);

    for (const round of roundsToFetch) {
      const url = API_URL.replace('{API_KEY}', API_KEY).replace('{round}', round) + `&_=${new Date().getTime()}`;
      const response = await axios.get(url);

      const matches = response.data.events;

      if (matches) {
        for (const match of matches) {
          const matchData = {
            api_id: match.idEvent,
            home_team: match.strHomeTeam,
            away_team: match.strAwayTeam,
            match_date: new Date(`${match.dateEvent}T${match.strTime}`).toISOString(),
            status: getStatus(match.strStatus),
            round: round,
            season: match.intSeason,
            home_score: match.intHomeScore,
            away_score: match.intAwayScore,
          };

          await dbHelpers.upsertMatch(matchData);
        }
      }
      if (roundsToFetch.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Matches populated successfully' }),
    };
  } catch (error) {
    console.error('Error populating matches:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to populate matches' }),
    };
  }
};
