import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Star, Users } from 'lucide-react';
import { useRoute, Link } from 'wouter';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MatchResult } from '@/types';

type MatchRow = {
  id: string;
  result: MatchResult | null;
  isMatchOfTheWeek: boolean;
  home: { name: string; shortName: string };
  away: { name: string; shortName: string };
};

type UserRow = {
  id: string;
  name: string;
};

type PredictionRow = {
  matchId: string;
  userId: string;
  prediction: MatchResult;
  isBanker: boolean;
};

type PointsRow = {
  userId: string;
  points: number;
};

export default function CompareRoundHistoryV1() {
  const { user } = useAuth();
  const [, params] = useRoute('/version1/rounds/:roundNumber/compare');
  const roundNumber = params?.roundNumber || '15';
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [roundType, setRoundType] = useState<'regular' | 'standalone' | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [points, setPoints] = useState<PointsRow[]>([]);
  const [competitionTick, setCompetitionTick] = useState(0);

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

  useEffect(() => {
    const fetchRoundData = async () => {
      setLoading(true);

      const { data: activeCompetition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeCompetition) {
        setRoundId(null);
        setRoundType(null);
        setMatches([]);
        setUsers([]);
        setPredictions([]);
        setPoints([]);
        setLoading(false);
        return;
      }

      const { data: round } = await supabase
        .from('rounds')
        .select('id,round_type')
        .eq('competition_id', activeCompetition.id)
        .eq('round_number', roundNumber)
        .single();

      if (!round) {
        setRoundId(null);
        setRoundType(null);
        setMatches([]);
        setUsers([]);
        setPredictions([]);
        setPoints([]);
        setLoading(false);
        return;
      }

      setRoundId(round.id);
      setRoundType(round.round_type);

      const { data: matchRows } = await supabase
        .from('matches')
        .select('id,result,is_match_of_the_week,home_team:home_team_id(name,short_name),away_team:away_team_id(name,short_name)')
        .eq('round_id', round.id)
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

      const { data: userRows } = await supabase
        .from('users')
        .select('id,name')
        .order('name', { ascending: true });

      setUsers(userRows || []);

      const { data: predictionRows } = await supabase
        .from('predictions')
        .select('match_id,user_id,prediction,is_banker')
        .eq('round_id', round.id);

      const formattedPredictions = (predictionRows || []).map((row: any) => ({
        matchId: row.match_id,
        userId: row.user_id,
        prediction: row.prediction as MatchResult,
        isBanker: row.is_banker === true,
      }));

      setPredictions(formattedPredictions);

      const { data: pointRows } = await supabase
        .from('round_stats')
        .select('user_id,total_points')
        .eq('round_id', round.id);

      setPoints((pointRows || []).map((row: any) => ({
        userId: row.user_id,
        points: row.total_points || 0,
      })));

      setLoading(false);
    };

    fetchRoundData();
  }, [roundNumber, competitionTick]);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      const other = users.find((item) => item.id !== user?.id);
      if (other) {
        setSelectedUserId(other.id);
      }
    }
  }, [users, user?.id, selectedUserId]);

  const predictionMap = useMemo(() => {
    const map = new Map<string, { picks: Record<string, MatchResult>; banker: string | null }>();
    predictions.forEach((row) => {
      if (!map.has(row.userId)) {
        map.set(row.userId, { picks: {}, banker: null });
      }
      const entry = map.get(row.userId);
      if (entry) {
        entry.picks[row.matchId] = row.prediction;
        if (row.isBanker) {
          entry.banker = row.matchId;
        }
      }
    });
    return map;
  }, [predictions]);

  const pointMap = useMemo(() => new Map(points.map((row) => [row.userId, row.points])), [points]);
  const isPostponed = roundType === 'standalone';
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
        <Link href="/version1/rounds">
          <Button
            variant="ghost"
            className="mb-4 text-blue-400 hover:text-blue-300"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7" />
          {isPostponed ? `Compare Postponed Set ${roundNumber}` : `Compare Round ${roundNumber}`}
        </h1>
        <p className="text-slate-400 text-sm mt-2">Select a player to compare predictions</p>
      </div>

      {loading && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-64 shrink-0">
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={`history-mobile-user-skel-${idx}`} className="h-14 w-28 shrink-0 rounded-lg" />
              ))}
            </div>
            <div className="hidden lg:block space-y-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={`history-desktop-user-skel-${idx}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <Skeleton className="h-5 w-48 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={`history-row-skel-${idx}`} className="h-10 w-full" />
                ))}
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !roundId && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-white text-lg font-semibold mb-2">Round not found</div>
          <div className="text-slate-400">Check the round number and try again.</div>
        </div>
      )}

      {!loading && roundId && (
        <div className="flex flex-col lg:flex-row gap-6">
        {/* Player List - Horizontal scroll on mobile, vertical on desktop */}
        <div className="lg:w-64 shrink-0">
          <h3 className="text-slate-400 text-sm font-semibold mb-3 uppercase">All Players</h3>
          
          {/* Mobile: Horizontal scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
            {users.filter(u => u.id !== user?.id).map(user => {
              const userPoints = pointMap.get(user.id) ?? 0;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`shrink-0 px-4 py-3 rounded-lg transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-medium whitespace-nowrap">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                    {userPoints} pts
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Desktop: Vertical list */}
          <div className="hidden lg:block space-y-2">
            {users.filter(u => u.id !== user?.id).map(user => {
              const userPoints = pointMap.get(user.id) ?? 0;
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {userPoints} pts
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table - Right Side */}
        <div className="flex-1 min-w-0">
          {selectedUserId ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">
                You vs {users.find(u => u.id === selectedUserId)?.name}
              </h2>
              
              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-3">
                {matches.map((match) => {
                  const myPred = user ? predictionMap.get(user.id) : null;
                  const theirPred = selectedUserId ? predictionMap.get(selectedUserId) : null;
                  const myPick = myPred?.picks[match.id];
                  const theirPick = theirPred?.picks[match.id];
                  const myBanker = myPred?.banker === match.id;
                  const theirBanker = theirPred?.banker === match.id;
                  const myCorrect = myPick === match.result;
                  const theirCorrect = theirPick === match.result;
                  const myPoints = match.result ? getPointsForMatch(myCorrect, !!myBanker, match.isMatchOfTheWeek) : null;
                  const theirPoints = match.result ? getPointsForMatch(theirCorrect, !!theirBanker, match.isMatchOfTheWeek) : null;
                  
                  return (
                    <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 mb-4 ${!isPostponed && match.isMatchOfTheWeek ? 'ring-2 ring-yellow-500/50' : ''}`}>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">You</div>
                          <div className="flex items-center gap-1">
                            {!isPostponed && myBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                            <span className={`font-semibold ${myCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {myPick || '—'}
                            </span>
                            {myPoints !== null && (
                              <span className={`text-xs font-semibold ${myPoints > 0 ? 'text-green-400' : myPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {myPoints > 0 ? `+${myPoints}` : myPoints}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">{users.find(u => u.id === selectedUserId)?.name}</div>
                          <div className="flex items-center gap-1">
                            {!isPostponed && theirBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                            <span className={`font-semibold ${theirCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {theirPick || '—'}
                            </span>
                            {theirPoints !== null && (
                              <span className={`text-xs font-semibold ${theirPoints > 0 ? 'text-green-400' : theirPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {theirPoints > 0 ? `+${theirPoints}` : theirPoints}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="bg-slate-800 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Your Points</div>
                    <div className="font-bold text-lg text-blue-400">
                      {user ? pointMap.get(user.id) ?? 0 : 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Their Points</div>
                    <div className="font-bold text-lg text-slate-300">
                      {selectedUserId ? pointMap.get(selectedUserId) ?? 0 : 0}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold min-w-50">Match</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-16">Result</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-20">You</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-20">
                        {users.find(u => u.id === selectedUserId)?.name}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => {
                      const myPred = user ? predictionMap.get(user.id) : null;
                      const theirPred = selectedUserId ? predictionMap.get(selectedUserId) : null;
                      const myPick = myPred?.picks[match.id];
                      const theirPick = theirPred?.picks[match.id];
                      const myBanker = myPred?.banker === match.id;
                      const theirBanker = theirPred?.banker === match.id;
                      const myCorrect = myPick === match.result;
                      const theirCorrect = theirPick === match.result;
                      const myPoints = match.result ? getPointsForMatch(myCorrect, !!myBanker, match.isMatchOfTheWeek) : null;
                      const theirPoints = match.result ? getPointsForMatch(theirCorrect, !!theirBanker, match.isMatchOfTheWeek) : null;
                      
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
                              <span className="text-white text-sm">{match.home.name}</span>
                              <span className="text-slate-600 text-xs">vs</span>
                              <span className="text-white text-sm">{match.away.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold text-xs">
                              {match.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isPostponed && myBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                              <span className={`font-semibold ${myCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {myPick || '—'}
                              </span>
                              {myPoints !== null && (
                                <span className={`text-xs font-semibold ${myPoints > 0 ? 'text-green-400' : myPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                  {myPoints > 0 ? `+${myPoints}` : myPoints}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isPostponed && theirBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                              <span className={`font-semibold ${theirCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {theirPick || '—'}
                              </span>
                              {theirPoints !== null && (
                                <span className={`text-xs font-semibold ${theirPoints > 0 ? 'text-green-400' : theirPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                  {theirPoints > 0 ? `+${theirPoints}` : theirPoints}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-slate-800 bg-slate-800/50">
                      <TableCell className="font-bold text-white">Round Points</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-lg text-blue-400">
                          {user ? pointMap.get(user.id) ?? 0 : 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-lg text-slate-300">
                          {selectedUserId ? pointMap.get(selectedUserId) ?? 0 : 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg min-h-100">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Select a player to compare</p>
                <p className="text-sm mt-2">Choose from the list {window.innerWidth >= 1024 ? 'on the left' : 'above'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </LayoutV1>
  );
}
