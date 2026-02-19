export type MatchResult = 'H' | 'U' | 'B' | null;
export type MatchStatus = 'scheduled' | 'postponed' | 'final';
export type RoundStatus = 'open' | 'locked' | 'active' | 'completed' | 'scored';

export interface Team {
  id: string;
  name: string;
  shortName: string;
}

export interface Match {
  id: string;
  roundId: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoff: Date;
  result?: MatchResult;
  status: MatchStatus;
  includeInRound: boolean;
  isMatchOfTheWeek?: boolean;
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  prediction: MatchResult;
  isBanker: boolean;
  points?: number;
}

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface Round {
  id: string;
  competitionId: string;
  number: number;
  roundType: 'regular' | 'standalone';
  deadline: Date;
  status: RoundStatus;
  createdAt: Date;
}

export interface Competition {
  id: string;
  name: string;
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalPoints: number;
  matchesPlayed: number;
  avgPerRound: number;
  totalCorrect: number;
  awayCorrect: number;
  bankerCorrect: number;
  bankerWrong: number;
  bankerNet: number;
  roundWins: number;
  rank: number;
}

export interface RoundDetail {
  round: Round;
  matches: Match[];
  predictions: Prediction[];
  winner: string;
  averageScore: number;
}
