import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Calendar, ChevronLeft, Star, Users } from 'lucide-react';
import { Link } from 'wouter';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type RoundSummary = {
  id: string;
  roundNumber: number;
  date: string;
  winner: string;
  averageScore: number;
  totalPlayers: number;
  roundType: 'regular' | 'standalone';
};

type MatchDetail = {
  id: string;
  result: string | null;
  isMatchOfTheWeek: boolean;
  home: { name: string; shortName: string };
  away: { name: string; shortName: string };
};

type PredictionRow = {
  matchId: string;
  userId: string;
  prediction: string;
  isBanker: boolean;
  userName: string;
};

export default function RoundsV1() {
  const { user } = useAuth();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number | null>(null);
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundLoading, setRoundLoading] = useState(false);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [roundStats, setRoundStats] = useState<{
    winner: string;
    averageScore: number;
    myRank: number | null;
    myPoints: number | null;
    totalPlayers: number;
  } | null>(null);
  const [competitionTick, setCompetitionTick] = useState(0);

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      setLoading(true);

      const { data: activeCompetition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeCompetition) {
        setRounds([]);
        setLoading(false);
        return;
      }

      const nowIso = new Date().toISOString();

      const { data: roundRows } = await supabase
        .from('rounds')
        .select('id,round_number,deadline,round_type,status')
        .eq('competition_id', activeCompetition.id)
        .in('status', ['final', 'published'])
        .lte('deadline', nowIso)
        .order('deadline', { ascending: false });

      if (!roundRows || roundRows.length === 0) {
        setRounds([]);
        setLoading(false);
        return;
      }

      const roundIds = roundRows.map((round) => round.id);

      const { data: statRows } = await supabase
        .from('round_stats')
        .select('round_id,total_points,rank,user:user_id(name)')
        .in('round_id', roundIds);

      const statsByRound = new Map<string, { total: number; count: number; winner: string }>();

      (statRows || []).forEach((stat: any) => {
        const roundId = stat.round_id;
        const existing = statsByRound.get(roundId) || { total: 0, count: 0, winner: '—' };
        const userData = Array.isArray(stat.user) ? stat.user[0] : stat.user;
        const winnerName = stat.rank === 1 && userData?.name ? userData.name : existing.winner;

        statsByRound.set(roundId, {
          total: existing.total + (stat.total_points || 0),
          count: existing.count + 1,
          winner: winnerName,
        });
      });

      const summaries = roundRows.map((round) => {
        const stats = statsByRound.get(round.id);
        const averageScore = stats && stats.count > 0 ? stats.total / stats.count : 0;
        return {
          id: round.id,
          roundNumber: round.round_number,
          date: new Date(round.deadline).toLocaleDateString(),
          winner: stats?.winner || '—',
          averageScore,
          totalPlayers: stats?.count || 0,
          roundType: round.round_type,
        };
      });

      setRounds(summaries);
      setLoading(false);
    };

    fetchRounds();
  }, [competitionTick]);

  useEffect(() => {
    const fetchRoundDetails = async () => {
      if (!selectedRoundId) {
        setMatches([]);
        setPredictions([]);
        setRoundStats(null);
        return;
      }

      setRoundLoading(true);

      const { data: matchRows } = await supabase
        .from('matches')
        .select('id,result,is_match_of_the_week,home_team:home_team_id(name,short_name),away_team:away_team_id(name,short_name)')
        .eq('round_id', selectedRoundId)
        .order('kickoff', { ascending: true });

      const formattedMatches = (matchRows || []).map((match: any) => {
        const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
        const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
        return {
          id: match.id,
          result: match.result,
          isMatchOfTheWeek: match.is_match_of_the_week,
          home: {
            name: homeTeam?.name || 'Home',
            shortName: homeTeam?.short_name || '',
          },
          away: {
            name: awayTeam?.name || 'Away',
            shortName: awayTeam?.short_name || '',
          },
        };
      });

      setMatches(formattedMatches);

      const { data: predictionRows } = await supabase
        .from('predictions')
        .select('match_id,user_id,prediction,is_banker,user:user_id(name)')
        .eq('round_id', selectedRoundId);

      const formattedPredictions = (predictionRows || []).map((row: any) => {
        const userData = Array.isArray(row.user) ? row.user[0] : row.user;
        return {
          matchId: row.match_id,
          userId: row.user_id,
          prediction: row.prediction,
          isBanker: row.is_banker === true,
          userName: userData?.name || 'Player',
        };
      });

      setPredictions(formattedPredictions);

      const { data: statsRows } = await supabase
        .from('round_stats')
        .select('round_id,total_points,rank,user_id,user:user_id(name)')
        .eq('round_id', selectedRoundId);

      const totalPlayers = statsRows?.length || 0;
      const averageScore = totalPlayers
        ? (statsRows || []).reduce((sum: number, row: any) => sum + (row.total_points || 0), 0) / totalPlayers
        : 0;
      const winnerRow = (statsRows || []).find((row: any) => row.rank === 1);
      const winnerUser = Array.isArray(winnerRow?.user) ? winnerRow?.user[0] : winnerRow?.user;
      const myStat = (statsRows || []).find((row: any) => row.user_id === user?.id);

      setRoundStats({
        winner: winnerUser?.name || '—',
        averageScore,
        myRank: myStat?.rank || null,
        myPoints: myStat?.total_points ?? null,
        totalPlayers,
      });

      setRoundLoading(false);
    };

    fetchRoundDetails();
  }, [selectedRoundId, user?.id]);

  if (selectedRoundId && selectedRoundNumber) {
    const roundInfo = rounds.find(r => r.roundNumber === selectedRoundNumber);
    const isPostponed = roundInfo?.roundType === 'standalone';
    const myPredictions = predictions.filter(p => p.userId === user?.id);
    const myPredictionMap = myPredictions.reduce<Record<string, string>>(
      (acc, row) => ({ ...acc, [row.matchId]: row.prediction }),
      {}
    );
    const bankerMatchId = myPredictions.find((row) => row.isBanker)?.matchId || null;
    const myRank = roundStats?.myRank || null;
    const getPointsForMatch = (isCorrect: boolean, isBanker: boolean, isMOTW: boolean) => {
      if (isPostponed) return isCorrect ? 3 : 0;
      if (isBanker && isMOTW) return isCorrect ? 12 : -6;
      if (isBanker) return isCorrect ? 6 : -3;
      if (isMOTW) return isCorrect ? 6 : 0;
      return isCorrect ? 3 : 0;
    };

    return (
      <LayoutV1>
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 text-blue-400 hover:text-blue-300"
            onClick={() => {
              setSelectedRoundId(null);
              setSelectedRoundNumber(null);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Rounds
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {isPostponed ? `Postponed Set ${selectedRoundNumber}` : `Round ${selectedRoundNumber}`}
              </h1>
              <Badge className="bg-slate-700 text-slate-300">FINAL</Badge>
            </div>
            <Link href={`/version1/rounds/${selectedRoundNumber}/compare`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Compare with Others</span>
                <span className="sm:hidden">Compare</span>
              </Button>
            </Link>
          </div>
          <p className="text-slate-400 text-sm">{roundInfo?.date}</p>
        </div>

        {roundLoading && (
          <div className="min-h-50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-400">Loading round...</p>
            </div>
          </div>
        )}

        {/* My Performance - At Top */}
        {!roundLoading && (
          <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 sm:mb-6">My Performance</h2>
          
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {matches.map((match) => {
              const myPick = myPredictionMap[match.id];
              const isBanker = bankerMatchId === match.id;
              const isCorrect = myPick === match.result;
              const points = match.result ? getPointsForMatch(isCorrect, isBanker, match.isMatchOfTheWeek) : null;
              
              return (
                <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 space-y-2 ${!isPostponed && match.isMatchOfTheWeek ? 'ring-2 ring-yellow-500/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {!isPostponed && match.isMatchOfTheWeek && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mr-2 px-1.5 py-0.5">
                          <Star className="w-3 h-3 fill-current" />
                        </Badge>
                      )}
                      <span className="text-white text-sm font-medium">
                        <span className="sm:hidden">{match.home.shortName}</span>
                        <span className="hidden sm:inline">{match.home.name}</span>
                      </span>
                      <span className="text-slate-600 text-xs">vs</span>
                      <span className="text-white text-sm font-medium">
                        <span className="sm:hidden">{match.away.shortName}</span>
                        <span className="hidden sm:inline">{match.away.name}</span>
                      </span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold text-xs">
                      {match.result}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">My Pick:</span>
                    <div className="flex items-center gap-2">
                      {!isPostponed && isBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                      <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {myPick || '—'}
                      </span>
                      {points !== null && (
                        <span className={`text-xs font-semibold ${points > 0 ? 'text-green-400' : points < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {points > 0 ? `+${points}` : points}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
              <span className="font-bold text-white">My Round Points</span>
              <span className="font-bold text-lg text-blue-400">{roundStats?.myPoints ?? '—'}</span>
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold min-w-50">Match</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center w-16">Result</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center w-20">My Pick</TableHead>
                  {!isPostponed && (
                    <TableHead className="text-slate-400 font-semibold text-center w-20">Banker</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const myPick = myPredictionMap[match.id];
                  const isBanker = bankerMatchId === match.id;
                  const isCorrect = myPick === match.result;
                  const points = match.result ? getPointsForMatch(isCorrect, isBanker, match.isMatchOfTheWeek) : null;
                  
                  return (
                    <TableRow key={match.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        {!isPostponed && match.isMatchOfTheWeek && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mb-2 w-fit px-2 py-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            MOTW
                          </Badge>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">
                            <span className="sm:hidden">{match.home.shortName}</span>
                            <span className="hidden sm:inline">{match.home.name}</span>
                          </span>
                          <span className="text-slate-600 text-xs">vs</span>
                          <span className="text-white text-sm">
                            <span className="sm:hidden">{match.away.shortName}</span>
                            <span className="hidden sm:inline">{match.away.name}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold">
                          {match.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {myPick || '—'}
                          </span>
                          {points !== null && (
                            <span className={`text-xs font-semibold ${points > 0 ? 'text-green-400' : points < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                              {points > 0 ? `+${points}` : points}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {!isPostponed && (
                        <TableCell>
                          <div className="flex items-center justify-center min-h-6">
                            {isBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                <TableRow className="border-slate-800 bg-slate-800/50">
                  <TableCell className="font-bold text-white" colSpan={isPostponed ? 2 : 3}>My Round Points</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg text-blue-400">
                      {roundStats?.myPoints ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
        )}

        {/* Round Summary - Now Below */}
        {!roundLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-slate-400 text-sm">Round Winner</span>
            </div>
            <div className="text-2xl font-bold text-white">{roundStats?.winner || '—'}</div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="text-slate-400 text-sm mb-2">My Round Rank</div>
            <div className="text-2xl font-bold text-blue-400">{myRank ? `#${myRank}` : '—'}</div>
            <div className="text-sm text-slate-500 mt-1">of {roundStats?.totalPlayers ?? 0} players</div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="text-slate-400 text-sm mb-2">Average Score</div>
            <div className="text-2xl font-bold text-white">{(roundStats?.averageScore ?? 0).toFixed(1)}</div>
          </Card>
        </div>
        )}
      </LayoutV1>
    );
  }

  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Round History</h1>
        <p className="text-slate-400 text-sm">View past rounds and results</p>
      </div>

      {loading && (
        <div className="min-h-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400">Loading rounds...</p>
          </div>
        </div>
      )}

      {!loading && rounds.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-white text-lg font-semibold mb-2">No rounds yet</div>
          <div className="text-slate-400">Finalize a round to see it here.</div>
        </div>
      )}

      {!loading && rounds.length > 0 && (
        <div className="grid gap-4">
        {rounds.map(round => (
          <Card
            key={round.id}
            className="bg-slate-900 border-slate-800 p-4 sm:p-6 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedRoundId(round.id);
              setSelectedRoundNumber(round.roundNumber);
            }}
          >
            <div className="flex flex-col gap-4">
              {/* Top section - Round info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-blue-400 font-bold text-lg">{round.roundNumber}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">
                    {round.roundType === 'standalone' ? `Postponed Set ${round.roundNumber}` : `Round ${round.roundNumber}`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {round.date}
                  </div>
                </div>
              </div>

              {/* Bottom section - Stats */}
              <div className="flex items-center justify-between gap-4 pl-0 sm:pl-14">
                <div className="flex-1">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">Winner</div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{round.winner}</span>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">Average</div>
                  <div className="text-white font-bold">{round.averageScore.toFixed(1)}</div>
                </div>
                <div className="flex-1 flex justify-end">
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                    View Details
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </LayoutV1>
  );
}
