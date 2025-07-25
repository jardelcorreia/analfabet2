const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('VITE_DATABASE_URL environment variable is required');
}

const sql = neon(DATABASE_URL);

const query = async (text, params) => {
  try {
    const result = await sql.query(text, params || []);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper functions for common database operations
const dbHelpers = {
  // Users - Auth Functions
  async getUser(id) {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0];
  },

  async getUserById(id) {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result[0];
  },

  async getUserByEmail(email) {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result[0];
  },

  async getUserByName(name) {
    const result = await sql`SELECT * FROM users WHERE name = ${name}`;
    return result[0];
  },

  async getUserByConfirmationToken(token) {
    const result = await sql`SELECT * FROM users WHERE confirmation_token = ${token}`;
    return result[0];
  },

  async createUser(email, passwordHash, name, confirmationToken) {
    const result = await sql`
      INSERT INTO users (email, password_hash, name, confirmation_token)
      VALUES (${email}, ${passwordHash}, ${name}, ${confirmationToken})
      RETURNING *
    `;
    return result[0];
  },

  async updateUser(id, updates) {
    try {
      const fields = Object.keys(updates).map(key => {
        if (key === 'password') {
          return sql`password_hash = ${updates[key]}`;
        }
        return sql`${sql(key)} = ${updates[key]}`;
      });

      if (fields.length === 0) return null;

      const query = sql`
        UPDATE users
        SET ${sql.join(fields, sql`, `)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING id, email, name, created_at, avatar, email_confirmed
      `;

      const result = await query;
      console.log('Update user result:', result);
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id) {
    const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;
    return result[0];
  },

  // Check availability functions
  async isEmailAvailable(email) {
    const result = await sql`SELECT id FROM users WHERE email = ${email}`;
    return result.length === 0;
  },

  async isUsernameAvailable(name) {
    const result = await sql`SELECT id FROM users WHERE name = ${name}`;
    return result.length === 0;
  },

  async isUsernameAvailableForUser(name, userId) {
    const result = await sql`SELECT id FROM users WHERE name = ${name} AND id != ${userId}`;
    return result.length === 0;
  },

  async isEmailAvailableForUser(email, userId) {
    const result = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${userId}`;
    return result.length === 0;
  },

  // Leagues
  async getUserLeagues(userId) {
    const result = await sql`
      SELECT l.* FROM leagues l
      INNER JOIN league_members lm ON l.id = lm.league_id
      WHERE lm.user_id = ${userId}
      ORDER BY l.created_at DESC
    `;
    return result;
  },

  async createLeague(name, description, code, createdBy, isPublic) {
    const result = await sql`
      INSERT INTO leagues (name, description, code, created_by, is_public)
      VALUES (${name}, ${description}, ${code}, ${createdBy}, ${isPublic})
      RETURNING *
    `;
    return result[0];
  },

  async addLeagueMember(leagueId, userId) {
    const result = await sql`
      INSERT INTO league_members (league_id, user_id)
      VALUES (${leagueId}, ${userId})
      RETURNING *
    `;
    return result[0];
  },

  async getLeagueByCode(code) {
    const result = await sql`SELECT * FROM leagues WHERE code = ${code}`;
    return result[0];
  },

  async checkLeagueMembership(leagueId, userId) {
    const result = await sql`
      SELECT id FROM league_members WHERE league_id = ${leagueId} AND user_id = ${userId}
    `;
    return result[0];
  },

  async getLeagueById(id) {
    const result = await sql`SELECT * FROM leagues WHERE id = ${id}`;
    return result[0];
  },

  async updateLeague(id, updates) {
    const fields = Object.keys(updates).map(key => sql`${sql(key)} = ${updates[key]}`);

    if (fields.length === 0) return null;

    const query = sql`
      UPDATE leagues
      SET ${sql.join(fields, sql`, `)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    const result = await query;
    return result[0];
  },

  async deleteLeague(id) {
    const result = await sql`DELETE FROM leagues WHERE id = ${id} RETURNING *`;
    return result[0];
  },

  async removeLeagueMember(leagueId, userId) {
    const result = await sql`
      DELETE FROM league_members WHERE league_id = ${leagueId} AND user_id = ${userId} RETURNING *
    `;
    return result[0];
  },

  // Matches
  async getMatches(round) {
    if (round) {
      return await sql`SELECT * FROM matches WHERE round = ${round} ORDER BY match_date ASC`;
    }
    return await sql`SELECT * FROM matches ORDER BY match_date ASC`;
  },

  async getMatchById(id) {
    const result = await sql`SELECT * FROM matches WHERE id = ${id}`;
    return result[0];
  },

  async getMatchByApiId(apiId) {
    const result = await sql`SELECT * FROM matches WHERE api_id = ${apiId}`;
    return result[0];
  },

  async createMatch(matchData) {
    const { api_id, home_team, away_team, match_date, round, season } = matchData;
    const result = await sql`
      INSERT INTO matches (api_id, home_team, away_team, match_date, round, season)
      VALUES (${api_id}, ${home_team}, ${away_team}, ${match_date}, ${round}, ${season})
      RETURNING *
    `;
    return result[0];
  },

  async upsertMatch(matchData) {
    const { api_id, home_team, away_team, match_date, status, round, season, home_score, away_score } = matchData;

    const result = await sql`
      INSERT INTO matches (api_id, home_team, away_team, match_date, status, round, season, home_score, away_score)
      VALUES (${api_id}, ${home_team}, ${away_team}, ${match_date}, ${status}, ${round}, ${season}, ${home_score}, ${away_score})
      ON CONFLICT (api_id)
      DO UPDATE SET
        home_team = EXCLUDED.home_team,
        away_team = EXCLUDED.away_team,
        match_date = EXCLUDED.match_date,
        status = EXCLUDED.status,
        round = EXCLUDED.round,
        season = EXCLUDED.season,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  },

  async updateMatch(id, updates) {
    const fields = Object.keys(updates).map(key => sql`${sql(key)} = ${updates[key]}`);

    if (fields.length === 0) return null;

    const query = sql`
      UPDATE matches
      SET ${sql.join(fields, sql`, `)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    const result = await query;
    return result[0];
  },

  // Bets
  async getUserBets(userId, leagueId, round) {
    let query = sql`
      SELECT * FROM bets WHERE user_id = ${userId} AND league_id = ${leagueId}
    `;

    if (round) {
      query = sql`
        SELECT b.* FROM bets b
        INNER JOIN matches m ON b.match_id = m.id
        WHERE b.user_id = ${userId} AND b.league_id = ${leagueId} AND m.round = ${round}
      `;
    }

    return await query;
  },

  async getBetById(id) {
    const result = await sql`SELECT * FROM bets WHERE id = ${id}`;
    return result[0];
  },

  async getUserBetsWithMatches(userId, leagueId, round) {
    let query = sql`
      SELECT
        b.*,
        m.id as match_id,
        m.api_id as match_api_id,
        m.home_team as match_home_team,
        m.away_team as match_away_team,
        m.home_score as match_home_score,
        m.away_score as match_away_score,
        m.match_date as match_date,
        m.status as match_status,
        m.round as match_round,
        m.season as match_season,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM bets b
      INNER JOIN matches m ON b.match_id = m.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ${userId} AND b.league_id = ${leagueId}
    `;

    if (round) {
      query = sql`
        ${query} AND m.round = ${round}
      `;
    }

    query = sql`
      ${query} ORDER BY m.match_date DESC
    `;

    const result = await query;

    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      match_id: row.match_id,
      league_id: row.league_id,
      home_score: row.home_score,
      away_score: row.away_score,
      points: row.points,
      is_exact: row.is_exact,
      created_at: row.created_at,
      match: {
        id: row.match_id,
        api_id: row.match_api_id,
        home_team: row.match_home_team,
        away_team: row.match_away_team,
        home_score: row.match_home_score,
        away_score: row.match_away_score,
        match_date: row.match_date,
        status: row.match_status,
        round: row.match_round,
        season: row.match_season
      },
      users: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      }
    }));
  },

  async getLeagueBetsWithMatches(leagueId, round) {
    let query = sql`
      SELECT
        b.*,
        m.id as match_id,
        m.api_id as match_api_id,
        m.home_team as match_home_team,
        m.away_team as match_away_team,
        m.home_score as match_home_score,
        m.away_score as match_away_score,
        m.match_date as match_date,
        m.status as match_status,
        m.round as match_round,
        m.season as match_season,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM bets b
      INNER JOIN matches m ON b.match_id = m.id
      INNER JOIN users u ON b.user_id = u.id
      WHERE b.league_id = ${leagueId}
    `;

    if (round) {
      query = sql`
        ${query} AND m.round = ${round}
      `;
    }

    query = sql`
      ${query} ORDER BY u.name ASC, m.match_date DESC
    `;

    const result = await query;

    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      match_id: row.match_id,
      league_id: row.league_id,
      home_score: row.home_score,
      away_score: row.away_score,
      points: row.points,
      is_exact: row.is_exact,
      created_at: row.created_at,
      match: {
        id: row.match_id,
        api_id: row.match_api_id,
        home_team: row.match_home_team,
        away_team: row.match_away_team,
        home_score: row.match_home_score,
        away_score: row.match_away_score,
        match_date: row.match_date,
        status: row.match_status,
        round: row.match_round,
        season: row.match_season
      },
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      }
    }));
  },

  async createBet(userId, matchId, leagueId, homeScore, awayScore) {
    const result = await sql`
      INSERT INTO bets (user_id, match_id, league_id, home_score, away_score)
      VALUES (${userId}, ${matchId}, ${leagueId}, ${homeScore}, ${awayScore})
      RETURNING *
    `;
    return result[0];
  },

  async updateBet(betId, homeScore, awayScore) {
    const result = await sql`
      UPDATE bets SET home_score = ${homeScore}, away_score = ${awayScore}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${betId}
      RETURNING *
    `;
    return result[0];
  },

  async deleteBet(id) {
    const result = await sql`DELETE FROM bets WHERE id = ${id} RETURNING *`;
    return result[0];
  },

  async getUserBetForMatch(userId, matchId, leagueId) {
    const result = await sql`
      SELECT * FROM bets WHERE user_id = ${userId} AND match_id = ${matchId} AND league_id = ${leagueId}
    `;
    return result[0];
  },

  // Rankings
  async getLeagueRanking(leagueId, round) {
    // Helper function to fetch rounds won data
    const getRoundsWonData = async () => {
      const roundsWonData = await sql`
        SELECT
          rw.user_id,
          ARRAY_AGG(rw.round_number ORDER BY rw.round_number) as rounds_won_list
        FROM round_winners rw
        WHERE rw.league_id = ${leagueId}
        GROUP BY rw.user_id
      `;
      const roundsWonMap = new Map();
      roundsWonData.forEach(row => {
        roundsWonMap.set(row.user_id, row.rounds_won_list || []);
      });
      return roundsWonMap;
    };

    // Always calculate ranking on the fly if a specific round is requested
    if (round) {
      const result = await sql`
        SELECT
          b.user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar,
          COALESCE(SUM(b.points), 0) as total_points,
          COALESCE(COUNT(CASE WHEN b.is_exact THEN 1 END), 0) as exact_scores,
          COALESCE(COUNT(b.id), 0) as total_bets,
          COALESCE(COUNT(CASE WHEN b.points > 0 THEN 1 END), 0) as correct_results
        FROM bets b
        INNER JOIN users u ON b.user_id = u.id
        INNER JOIN matches m ON b.match_id = m.id
        WHERE b.league_id = ${leagueId} AND m.round = ${round}
        GROUP BY b.user_id, u.name, u.email, u.avatar
        ORDER BY total_points DESC, exact_scores DESC
      `;
      let rank = 1;
      let last_total_points = -1;
      let last_exact_scores = -1;
      return result.map((row, index) => {
        if (row.total_points !== last_total_points || row.exact_scores !== last_exact_scores) {
          rank = index + 1;
        }
        last_total_points = row.total_points;
        last_exact_scores = row.exact_scores;
        return {
          ...row,
          league_id: leagueId,
          rounds_won: 0,
          rounds_won_list: [],
          rank: rank,
          user: {
            id: row.user_id,
            name: row.user_name,
            email: row.user_email,
            avatar: row.user_avatar,
          }
        }
      });
    }

    // For 'all' rounds, we will also calculate on the fly to get live results
    const liveRankingResult = await sql`
        SELECT
          b.user_id,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar,
          COALESCE(SUM(b.points), 0) as total_points,
          COALESCE(COUNT(CASE WHEN b.is_exact THEN 1 END), 0) as exact_scores,
          COALESCE(COUNT(b.id), 0) as total_bets,
          COALESCE(COUNT(CASE WHEN b.points > 0 THEN 1 END), 0) as correct_results
        FROM bets b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.league_id = ${leagueId}
        GROUP BY b.user_id, u.name, u.email, u.avatar
        ORDER BY total_points DESC NULLS LAST, exact_scores DESC
      `;

    const roundsWonMap = await getRoundsWonData();

    let rank = 1;
    let last_total_points = -1;
    let last_exact_scores = -1;
    return liveRankingResult.map((row, index) => {
      const roundsWonList = roundsWonMap.get(row.user_id) || [];
      if (row.total_points !== last_total_points || row.exact_scores !== last_exact_scores) {
        rank = index + 1;
      }
      last_total_points = row.total_points;
      last_exact_scores = row.exact_scores;
      return {
        user_id: row.user_id,
        league_id: leagueId,
        total_points: row.total_points,
        exact_scores: row.exact_scores,
        total_bets: row.total_bets,
        correct_results: row.correct_results,
        rounds_won: roundsWonList.length,
        rounds_won_list: roundsWonList,
        rounds_tied: row.rounds_tied,
        rank: rank,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          avatar: row.user_avatar
        }
      };
    });
  },

  // Get detailed rounds won for a specific player
  async getPlayerRoundsWon(playerId, leagueId) {
    return await sql`
      SELECT * FROM get_player_rounds_won(${playerId}, ${leagueId})
    `;
  },

  // Get round winners for a specific round
  async getRoundWinners(leagueId, round) {
    return await sql`
      SELECT * FROM get_round_winners_detailed(${leagueId}, ${round})
    `;
  },

  // Calculate detailed rounds won for a league
  async calculateDetailedRoundsWon(leagueId) {
    await sql`SELECT calculate_detailed_rounds_won_for_league(${leagueId})`;
  },
  async getUserStats(userId, leagueId) {
    const result = await sql`
      SELECT * FROM user_stats WHERE user_id = ${userId} AND league_id = ${leagueId}
    `;
    return result[0];
  },

  async updateUserStats(userId, leagueId, stats) {
    const { total_points, exact_scores, total_bets, correct_results } = stats;
    const result = await sql`
      INSERT INTO user_stats (user_id, league_id, total_points, exact_scores, total_bets, correct_results)
      VALUES (${userId}, ${leagueId}, ${total_points}, ${exact_scores}, ${total_bets}, ${correct_results})
      ON CONFLICT (user_id, league_id)
      DO UPDATE SET
        total_points = ${total_points},
        exact_scores = ${exact_scores},
        total_bets = ${total_bets},
        correct_results = ${correct_results},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  },

  // League Members
  async getLeagueMembers(leagueId) {
    return await sql`
      SELECT u.id, u.name, u.email, u.avatar, lm.joined_at
      FROM users u
      INNER JOIN league_members lm ON u.id = lm.user_id
      WHERE lm.league_id = ${leagueId}
      ORDER BY u.name ASC
    `;
  },

  async getLeagueMembersWithStats(leagueId) {
    return await sql`
      SELECT
        u.id, u.name, u.email, u.avatar,
        us.total_points, us.exact_scores, us.total_bets, us.correct_results,
        lm.joined_at
      FROM users u
      INNER JOIN league_members lm ON u.id = lm.user_id
      LEFT JOIN user_stats us ON u.id = us.user_id AND us.league_id = ${leagueId}
      WHERE lm.league_id = ${leagueId}
      ORDER BY us.total_points DESC NULLS LAST, u.name ASC
    `;
  },

  // Utility functions
  async checkUserExists(id) {
    const result = await sql`SELECT id FROM users WHERE id = ${id}`;
    return result.length > 0;
  },

  async checkLeagueExists(id) {
    const result = await sql`SELECT id FROM leagues WHERE id = ${id}`;
    return result.length > 0;
  },

  async checkMatchExists(id) {
    const result = await sql`SELECT id FROM matches WHERE id = ${id}`;
    return result.length > 0;
  },

  async checkBettingDeadline(matchId) {
    const result = await sql`
      SELECT
        match_date,
        status,
        match_date > NOW() + INTERVAL '5 minutes' as can_bet
      FROM matches
      WHERE id = ${matchId}
    `;
    if (result.length === 0) {
      return { can_bet: false, reason: 'Match not found' };
    }
    const match = result[0];
    if (match.status !== 'scheduled') {
      return { can_bet: false, reason: `Match status is ${match.status}` };
    }
    return { can_bet: match.can_bet, reason: match.can_bet ? 'OK' : 'Deadline passed' };
  },

  // Search functions
  async searchUsers(query, limit = 10) {
    const searchQuery = `%${query}%`;
    return await sql`
      SELECT id, name, email, avatar
      FROM users
      WHERE name ILIKE ${searchQuery} OR email ILIKE ${searchQuery}
      ORDER BY name ASC
      LIMIT ${limit}
    `;
  },

  async searchLeagues(query, limit = 10) {
    const searchQuery = `%${query}%`;
    return await sql`
      SELECT id, name, description, code, is_public, created_at
      FROM leagues
      WHERE name ILIKE ${searchQuery} OR description ILIKE ${searchQuery}
      ORDER BY name ASC
      LIMIT ${limit}
    `;
  }
};

module.exports = { query, dbHelpers };
