import { Competition, User, Round, Match, Prediction, LeaderboardEntry, Team } from './types';

// Teams
const teams: Team[] = [
  { id: 't1', name: 'Manchester City', shortName: 'MCI' },
  { id: 't2', name: 'Arsenal', shortName: 'ARS' },
  { id: 't3', name: 'Liverpool', shortName: 'LIV' },
  { id: 't4', name: 'Aston Villa', shortName: 'AVL' },
  { id: 't5', name: 'Tottenham', shortName: 'TOT' },
  { id: 't6', name: 'Chelsea', shortName: 'CHE' },
  { id: 't7', name: 'Newcastle', shortName: 'NEW' },
  { id: 't8', name: 'Manchester United', shortName: 'MUN' },
  { id: 't9', name: 'West Ham', shortName: 'WHU' },
  { id: 't10', name: 'Brighton', shortName: 'BHA' },
  { id: 't11', name: 'Wolves', shortName: 'WOL' },
  { id: 't12', name: 'Fulham', shortName: 'FUL' },
  { id: 't13', name: 'Brentford', shortName: 'BRE' },
  { id: 't14', name: 'Crystal Palace', shortName: 'CRY' },
  { id: 't15', name: 'Everton', shortName: 'EVE' },
  { id: 't16', name: 'Nottingham Forest', shortName: 'NFO' },
];

// Competitions
export const competitions: Competition[] = [
  { id: 'c1', name: 'Premier League 2024/25', isActive: true },
  { id: 'c2', name: 'Champions League 2024/25', isActive: false },
];

// Users
export const users: User[] = [
  { id: 'u1', name: 'James', isAdmin: true },
  { id: 'u2', name: 'Sarah', isAdmin: false },
  { id: 'u3', name: 'Mike', isAdmin: false },
  { id: 'u4', name: 'Emma', isAdmin: false },
  { id: 'u5', name: 'David', isAdmin: false },
  { id: 'u6', name: 'Lisa', isAdmin: false },
  { id: 'u7', name: 'Tom', isAdmin: false },
  { id: 'u8', name: 'Alex', isAdmin: false },
];

export const currentUser = {
  id: 'u1',
  name: 'James',
  email: 'james@example.com',
  isAdmin: true, // Set to true for admin access
};

// Rounds
export const rounds: Round[] = [
  {
    id: 'r1',
    competitionId: 'c1',
    number: 15,
    roundType: 'regular',
    deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
    status: 'scored',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'r2',
    competitionId: 'c1',
    number: 16,
    roundType: 'regular',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
    status: 'open',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  // DEMO: Round 17 - Active (matches in progress)
  {
    id: 'r3',
    competitionId: 'c1',
    number: 17,
    roundType: 'regular',
    deadline: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  // DEMO: Round 18 - Completed (finished but not final)
  {
    id: 'r4',
    competitionId: 'c1',
    number: 18,
    roundType: 'regular',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'completed',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
];

export const currentRound = rounds[1];

// Matches for current round
export const matches: Match[] = [
  {
    id: 'm1',
    roundId: 'r2',
    homeTeam: teams[0],
    awayTeam: teams[1],
    kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'H', // Demo result - CORRECT! User predicted H
  },
  {
    id: 'm2',
    roundId: 'r2',
    homeTeam: teams[2],
    awayTeam: teams[3],
    kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'B', // Demo result - CORRECT BANKER! User predicted B (+6)
  },
  {
    id: 'm3',
    roundId: 'r2',
    homeTeam: teams[4],
    awayTeam: teams[5],
    kickoff: new Date(Date.now() + 4 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: true,
    result: 'U', // Demo result - CORRECT! User predicted U
  },
  {
    id: 'm4',
    roundId: 'r2',
    homeTeam: teams[6],
    awayTeam: teams[7],
    kickoff: new Date(Date.now() + 4 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'B', // Demo result - Wrong (user predicted H)
  },
  {
    id: 'm5',
    roundId: 'r2',
    homeTeam: teams[8],
    awayTeam: teams[9],
    kickoff: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'H', // Demo result - Wrong (user predicted B)
  },
  {
    id: 'm6',
    roundId: 'r2',
    homeTeam: teams[10],
    awayTeam: teams[11],
    kickoff: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'H', // Demo result - CORRECT! User predicted H
  },
  {
    id: 'm7',
    roundId: 'r2',
    homeTeam: teams[12],
    awayTeam: teams[13],
    kickoff: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'U', // Demo result - CORRECT! User predicted U
  },
  {
    id: 'm8',
    roundId: 'r2',
    homeTeam: teams[14],
    awayTeam: teams[15],
    kickoff: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'scheduled',
    includeInRound: true,
    isMatchOfTheWeek: false,
    result: 'H', // Demo result - Wrong (user predicted B)
  },
  // Standalone match (postponed)
  {
    id: 'm9',
    roundId: 'r2',
    homeTeam: teams[0],
    awayTeam: teams[5],
    kickoff: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'postponed',
    includeInRound: false,
    isMatchOfTheWeek: false,
  },
];

// Current user's predictions (mocked)
export const currentUserPredictions: Prediction[] = [
  { id: 'p1', matchId: 'm1', userId: 'u1', prediction: 'H', isBanker: false },
  { id: 'p2', matchId: 'm2', userId: 'u1', prediction: 'B', isBanker: true },
  { id: 'p3', matchId: 'm3', userId: 'u1', prediction: 'U', isBanker: false },
  { id: 'p4', matchId: 'm4', userId: 'u1', prediction: 'H', isBanker: false },
  { id: 'p5', matchId: 'm5', userId: 'u1', prediction: 'B', isBanker: false },
  { id: 'p6', matchId: 'm6', userId: 'u1', prediction: 'H', isBanker: false },
  { id: 'p7', matchId: 'm7', userId: 'u1', prediction: 'U', isBanker: false },
  { id: 'p8', matchId: 'm8', userId: 'u1', prediction: 'B', isBanker: false },
];

// Leaderboard data
export const leaderboard: LeaderboardEntry[] = [
  {
    userId: 'u2',
    userName: 'Sarah',
    totalPoints: 156,
    matchesPlayed: 15,
    avgPerRound: 10.4,
    totalCorrect: 45,
    awayCorrect: 12,
    bankerCorrect: 9,
    bankerWrong: 6,
    bankerNet: 3,
    roundWins: 8,
    rank: 1,
  },
  {
    userId: 'u1',
    userName: 'James',
    totalPoints: 147,
    matchesPlayed: 15,
    avgPerRound: 9.8,
    totalCorrect: 42,
    awayCorrect: 10,
    bankerCorrect: 8,
    bankerWrong: 7,
    bankerNet: 1,
    roundWins: 4,
    rank: 2,
  },
  {
    userId: 'u3',
    userName: 'Mike',
    totalPoints: 138,
    matchesPlayed: 15,
    avgPerRound: 9.2,
    totalCorrect: 40,
    awayCorrect: 8,
    bankerCorrect: 7,
    bankerWrong: 8,
    bankerNet: -1,
    roundWins: 2,
    rank: 3,
  },
  {
    userId: 'u4',
    userName: 'Emma',
    totalPoints: 132,
    matchesPlayed: 15,
    avgPerRound: 8.8,
    totalCorrect: 38,
    awayCorrect: 9,
    bankerCorrect: 6,
    bankerWrong: 9,
    bankerNet: -3,
    roundWins: 1,
    rank: 4,
  },
  {
    userId: 'u5',
    userName: 'David',
    totalPoints: 129,
    matchesPlayed: 15,
    avgPerRound: 8.6,
    totalCorrect: 37,
    awayCorrect: 7,
    bankerCorrect: 7,
    bankerWrong: 8,
    bankerNet: -1,
    roundWins: 0,
    rank: 5,
  },
  {
    userId: 'u6',
    userName: 'Lisa',
    totalPoints: 120,
    matchesPlayed: 15,
    avgPerRound: 8.0,
    totalCorrect: 35,
    awayCorrect: 6,
    bankerCorrect: 5,
    bankerWrong: 10,
    bankerNet: -5,
    roundWins: 0,
    rank: 6,
  },
  {
    userId: 'u7',
    userName: 'Tom',
    totalPoints: 114,
    matchesPlayed: 15,
    avgPerRound: 7.6,
    totalCorrect: 33,
    awayCorrect: 5,
    bankerCorrect: 4,
    bankerWrong: 11,
    bankerNet: -7,
    roundWins: 0,
    rank: 7,
  },
  {
    userId: 'u8',
    userName: 'Alex',
    totalPoints: 108,
    matchesPlayed: 15,
    avgPerRound: 7.2,
    totalCorrect: 31,
    awayCorrect: 4,
    bankerCorrect: 3,
    bankerWrong: 12,
    bankerNet: -9,
    roundWins: 0,
    rank: 8,
  },
];

// Past rounds with results
export const pastRounds = [
  {
    roundNumber: 15,
    date: 'Jan 18, 2025',
    winner: 'Sarah',
    averageScore: 9.2,
    roundId: 'r1',
  },
  {
    roundNumber: 14,
    date: 'Jan 11, 2025',
    winner: 'James',
    averageScore: 8.8,
    roundId: 'r0',
  },
  {
    roundNumber: 13,
    date: 'Jan 4, 2025',
    winner: 'Mike',
    averageScore: 10.1,
    roundId: 'r-1',
  },
];

// Best rounds (Hall of Fame)
export const bestRounds = [
  { rank: 1, userName: 'Sarah', roundNumber: 8, points: 21, correct: 7, banker: '✓' },
  { rank: 2, userName: 'James', roundNumber: 12, points: 18, correct: 6, banker: '✓' },
  { rank: 3, userName: 'Mike', roundNumber: 5, points: 18, correct: 6, banker: '✓' },
  { rank: 4, userName: 'Emma', roundNumber: 9, points: 15, correct: 5, banker: '✓' },
  { rank: 5, userName: 'Sarah', roundNumber: 14, points: 15, correct: 5, banker: '✓' },
  { rank: 6, userName: 'David', roundNumber: 3, points: 15, correct: 5, banker: '✓' },
  { rank: 7, userName: 'James', roundNumber: 11, points: 15, correct: 5, banker: '✓' },
  { rank: 8, userName: 'Lisa', roundNumber: 7, points: 12, correct: 4, banker: '✓' },
  { rank: 9, userName: 'Mike', roundNumber: 13, points: 12, correct: 4, banker: '✓' },
  { rank: 10, userName: 'Tom', roundNumber: 2, points: 12, correct: 4, banker: '✓' },
  { rank: 11, userName: 'Alex', roundNumber: 1, points: 10, correct: 3, banker: '✓' },
];

// Worst rounds (Hall of Shame)
export const worstRounds = [
  { rank: 1, userName: 'Tom', roundNumber: 11, points: -3, correct: 0, banker: '✗' },
  { rank: 2, userName: 'Lisa', roundNumber: 4, points: 0, correct: 0, banker: '✗' },
  { rank: 3, userName: 'Emma', roundNumber: 6, points: 0, correct: 0, banker: '✗' },
  { rank: 4, userName: 'David', roundNumber: 9, points: 0, correct: 0, banker: '✗' },
  { rank: 5, userName: 'Mike', roundNumber: 2, points: 3, correct: 1, banker: '✗' },
  { rank: 6, userName: 'Tom', roundNumber: 7, points: 3, correct: 1, banker: '✗' },
  { rank: 7, userName: 'Lisa', roundNumber: 12, points: 3, correct: 1, banker: '✗' },
  { rank: 8, userName: 'James', roundNumber: 5, points: 3, correct: 1, banker: '✗' },
  { rank: 9, userName: 'Sarah', roundNumber: 3, points: 6, correct: 2, banker: '✗' },
  { rank: 10, userName: 'Emma', roundNumber: 10, points: 6, correct: 2, banker: '✗' },
  { rank: 11, userName: 'Alex', roundNumber: 1, points: 6, correct: 2, banker: '✗' },
];

// Detailed round data for Round 15
export const round15Details = {
  matches: [
    { id: 'm1', home: teams[0], away: teams[1], result: 'H' as const, isMatchOfTheWeek: false },
    { id: 'm2', home: teams[2], away: teams[3], result: 'B' as const, isMatchOfTheWeek: false },
    { id: 'm3', home: teams[4], away: teams[5], result: 'U' as const, isMatchOfTheWeek: true },
    { id: 'm4', home: teams[6], away: teams[7], result: 'H' as const, isMatchOfTheWeek: false },
    { id: 'm5', home: teams[8], away: teams[9], result: 'B' as const, isMatchOfTheWeek: false },
    { id: 'm6', home: teams[10], away: teams[11], result: 'H' as const, isMatchOfTheWeek: false },
    { id: 'm7', home: teams[12], away: teams[13], result: 'U' as const, isMatchOfTheWeek: false },
    { id: 'm8', home: teams[14], away: teams[15], result: 'B' as const, isMatchOfTheWeek: false },
  ],
  predictions: [
    { userId: 'u1', picks: ['H', 'B', 'U', 'H', 'B', 'H', 'H', 'B'], banker: 0, points: 15 },
    { userId: 'u2', picks: ['H', 'B', 'U', 'H', 'H', 'H', 'U', 'B'], banker: 1, points: 21 },
    { userId: 'u3', picks: ['H', 'H', 'U', 'H', 'B', 'B', 'U', 'H'], banker: 2, points: 12 },
    { userId: 'u4', picks: ['B', 'B', 'H', 'H', 'B', 'H', 'U', 'B'], banker: 4, points: 12 },
    { userId: 'u5', picks: ['H', 'H', 'U', 'B', 'B', 'H', 'H', 'U'], banker: 2, points: 9 },
    { userId: 'u6', picks: ['H', 'B', 'H', 'H', 'H', 'U', 'U', 'B'], banker: 5, points: 6 },
    { userId: 'u7', picks: ['B', 'H', 'U', 'B', 'H', 'H', 'B', 'H'], banker: 3, points: 3 },
    { userId: 'u8', picks: ['H', 'B', 'U', 'H', 'H', 'H', 'U', 'B'], banker: 1, points: 21 },
  ],
};
