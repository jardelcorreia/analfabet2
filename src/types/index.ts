export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  code: string;
  created_by: string;
  created_at: string;
  is_public: boolean;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  joined_at: string;
  user: User;
}

export interface Match {
  id: string;
  api_id: number;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished';
  round: number;
  season: string;
}

export interface Bet {
  id: string;
  user_id: string;
  match_id: string;
  league_id: string;
  home_score: number;
  away_score: number;
  points?: number;
  is_exact?: boolean;
  created_at: string;
  match: Match;
  user: User;
}

export interface RoundResult {
  round: number;
  type: 'win' | 'tie';
}

export interface UserStats {
  user_id: string;
  league_id: string;
  total_points: number;
  exact_scores: number;
  total_bets: number;
  correct_results: number;
  rounds_won: number;
  round_results: RoundResult[];
  rounds_tied: number;
  rank: number;
  user: User;
}

export interface ApiMatch {
  id: number;
  homeTeam: {
    name: string;
    shortName: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  utcDate: string;
  status: string;
  matchday: number;
}

export interface ApiResponse {
  matches: ApiMatch[];
}

export interface SportsDbResponse {
  events: SportsDbEvent[];
}

export interface SportsDbEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string;
  intRound: string;
  strStatus: string;
  idLeague: string;
}

export interface StandingsResponse {
  table: SportsDbTable[];
}

export interface SportsDbTable {
  idStanding: string;
  intRank: string;
  idTeam: string;
  strTeam: string;
  strTeamBadge: string;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  strForm: string;
  strDescription: string;
  intPlayed: string;
  intWin: string;
  intLoss: string;
  intDraw: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
  strPromotion: string;
  intGoalsFor_Home: string;
  intGoalsAgainst_Home: string;
  intWin_Home: string;
  intDraw_Home: string;
  intLoss_Home: string;
  intTotal_Home: string;
  intGoalsFor_Away: string;
  intGoalsAgainst_Away: string;
  intWin_Away: string;
  intDraw_Away: string;
  intLoss_Away: string;
  intTotal_Away: string;
  dateUpdated: string;
}
