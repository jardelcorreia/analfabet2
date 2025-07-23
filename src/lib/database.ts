import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('VITE_DATABASE_URL environment variable is required');
}

const sql = neon(DATABASE_URL);

export const query = async (text: string, params?: any[]) => {
  try {
    const result = await sql.query(text, params || []);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper functions for common database operations
export const dbHelpers = {
  // Users
  async getUser(id: string) {
    const result = await sql.query('SELECT * FROM users WHERE id = $1', [id]);
    return result[0];
  },

  async getUserByEmail(email: string) {
    const result = await sql.query('SELECT * FROM users WHERE email = $1', [email]);
    return result[0];
  },

  async createUser(email: string, passwordHash: string, name: string) {
    const result = await sql.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, name]
    );
    return result[0];
  },

  // Leagues
  async getUserLeagues(userId: string) {
    const result = await sql.query(`
      SELECT l.* FROM leagues l
      INNER JOIN league_members lm ON l.id = lm.league_id
      WHERE lm.user_id = $1
      ORDER BY l.created_at DESC
    `, [userId]);
    return result;
  },

  async createLeague(name: string, description: string | undefined, code: string, createdBy: string, isPublic: boolean) {
    const result = await sql.query(
      'INSERT INTO leagues (name, description, code, created_by, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, code, createdBy, isPublic]
    );
    return result[0];
  },

  async addLeagueMember(leagueId: string, userId: string) {
    const result = await sql.query(
      'INSERT INTO league_members (league_id, user_id) VALUES ($1, $2) RETURNING *',
      [leagueId, userId]
    );
    return result[0];
  },

  async getLeagueByCode(code: string) {
    const result = await sql.query('SELECT * FROM leagues WHERE code = $1', [code]);
    return result[0];
  },

  async checkLeagueMembership(leagueId: string, userId: string) {
    const result = await sql.query(
      'SELECT id FROM league_members WHERE league_id = $1 AND user_id = $2',
      [leagueId, userId]
    );
    return result[0];
  },

  // Matches
  async getMatches(round?: number) {
    let queryText = 'SELECT * FROM matches ORDER BY match_date ASC';
    let params: any[] = [];
    
    if (round) {
      queryText = 'SELECT * FROM matches WHERE round = $1 ORDER BY match_date ASC';
      params = [round];
    }
    
    const result = await sql.query(queryText, params);
    return result;
  },

  // Bets
  async getUserBets(userId: string, leagueId: string) {
    const result = await sql.query(
      'SELECT * FROM bets WHERE user_id = $1 AND league_id = $2',
      [userId, leagueId]
    );
    return result;
  },

  async getUserBetsWithMatches(userId: string, leagueId: string) {
    const result = await sql.query(`
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
      WHERE b.user_id = $1 AND b.league_id = $2
      ORDER BY b.created_at DESC
    `, [userId, leagueId]);
    
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
      matches: {
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

  async createBet(userId: string, matchId: string, leagueId: string, homeScore: number, awayScore: number) {
    const result = await sql.query(
      'INSERT INTO bets (user_id, match_id, league_id, home_score, away_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, matchId, leagueId, homeScore, awayScore]
    );
    return result[0];
  },

  async updateBet(betId: string, homeScore: number, awayScore: number) {
    const result = await sql.query(
      'UPDATE bets SET home_score = $1, away_score = $2 WHERE id = $3 RETURNING *',
      [homeScore, awayScore, betId]
    );
    return result[0];
  },

  // Rankings
  async getLeagueRanking(leagueId: string) {
    const result = await sql.query(`
      SELECT 
        us.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar as user_avatar
      FROM user_stats us
      INNER JOIN users u ON us.user_id = u.id
      WHERE us.league_id = $1
      ORDER BY us.total_points DESC, us.exact_scores DESC
    `, [leagueId]);
    
    return result.map(row => ({
      user_id: row.user_id,
      league_id: row.league_id,
      total_points: row.total_points,
      exact_scores: row.exact_scores,
      total_bets: row.total_bets,
      correct_results: row.correct_results,
      users: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        avatar: row.user_avatar
      }
    }));
  },

  // League Members
  async getLeagueMembers(leagueId: string) {
    // Fetches users who are members of a specific league
    const queryText = `
      SELECT u.id, u.name, u.email, u.avatar
      FROM users u
      INNER JOIN league_members lm ON u.id = lm.user_id
      WHERE lm.league_id = $1
      ORDER BY u.name ASC;
    `;
    const result = await sql.query(queryText, [leagueId]);
    return result; // Returns an array of user objects (or partial user objects)
  }
};