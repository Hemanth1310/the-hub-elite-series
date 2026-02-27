import { useEffect, useMemo, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Star } from 'lucide-react';
import { MatchResult } from '@/types';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';
import { getFirstName } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type RoundInfo = {
  id: string;
  number: number;
  roundType: 'regular' | 'standalone';
};

type MatchRow = {
  id: string;
  result: MatchResult | null;
  isMatchOfTheWeek: boolean;
  homeTeam: { name: string; shortName: string };
  awayTeam: { name: string; shortName: string };
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

export default function CompareRoundV1() {
  const { user } = useAuth();
  const [, params] = useRoute('/version1/compare/:status');
  const status = (params?.status as 'locked' | 'final') || 'locked';

  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [competitionTick, setCompetitionTick] = useState(0);

  const isLocked = status === 'locked' || status === 'final';
  const isFinal = status === 'final';

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

  useEffect(() => {
    const fetchCompareData = async () => {
      setLoading(true);

      const { data: activeCompetition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeCompetition) {
        setRound(null);
        setMatches([]);
        setUsers([]);
        setPredictions([]);
        setLoading(false);
        return;
      }

      const roundStatus = isFinal ? 'final' : 'published';
      const { data: roundRow } = await supabase
        .from('rounds')
        .select('id,round_number,round_type')
        .eq('competition_id', activeCompetition.id)
        .eq('status', roundStatus)
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!roundRow) {
        setRound(null);
        setMatches([]);
        setUsers([]);
        setPredictions([]);
        setLoading(false);
        return;
      }

      setRound({ id: roundRow.id, number: roundRow.round_number, roundType: roundRow.round_type });

      const { data: matchRows } = await supabase
        .from('matches')
        .select('id,result,include_in_round,is_match_of_the_week,home_team:home_team_id(name,short_name),away_team:away_team_id(name,short_name)')
        .eq('round_id', roundRow.id)
        .eq('include_in_round', true)
        .order('kickoff', { ascending: true });

      const formattedMatches = (matchRows || []).map((match: any) => {
        const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
        const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
        return {
          id: match.id,
          result: match.result,
          isMatchOfTheWeek: match.is_match_of_the_week,
          homeTeam: {
            name: homeTeam?.name || 'Home',
            shortName: homeTeam?.short_name || '',
          },
          awayTeam: {
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
        .eq('round_id', roundRow.id);

      const formattedPredictions = (predictionRows || []).map((row: any) => ({
        matchId: row.match_id,
        userId: row.user_id,
        prediction: row.prediction as MatchResult,
        isBanker: row.is_banker === true,
      }));

      setPredictions(formattedPredictions);
      setLoading(false);
    };

    fetchCompareData();
  }, [isFinal, competitionTick]);

  useEffect(() => {
    const otherUsers = users.filter((item) => item.id !== user?.id);
    if (!selectedUserId && otherUsers.length > 0) {
      setSelectedUserId(otherUsers[0].id);
    }
  }, [users, user?.id, selectedUserId]);

  const matchesWithResults = matches.map((match) => ({
    ...match,
    result: isFinal ? match.result : null,
  }));

  const isPostponed = round?.roundType === 'standalone';
  const getPointsForMatch = (isCorrect: boolean, isBanker: boolean, isMOTW: boolean) => {
    if (isPostponed) return isCorrect ? 3 : 0;
    if (isBanker && isMOTW) return isCorrect ? 12 : -6;
    if (isBanker) return isCorrect ? 6 : -3;
    if (isMOTW) return isCorrect ? 6 : 0;
    return isCorrect ? 3 : 0;
  };

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

  const selectedUser = users.find((item) => item.id === selectedUserId);
  const myData = user ? predictionMap.get(user.id) : null;
  const otherData = selectedUserId ? predictionMap.get(selectedUserId) : null;

  const otherUsers = users.filter((item) => item.id !== user?.id);

  return (
    <LayoutV1>
      <div className="mb-6">
        <Link href="/active">
          <Button variant="ghost" size="sm" className="mb-4 text-blue-400 hover:text-blue-300">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to This Round
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Compare Predictions</h1>
        <p className="text-slate-400 text-sm">
          {isPostponed ? `Postponed Set ${round?.number ?? '—'}` : `Round ${round?.number ?? '—'}`} - Side by side comparison
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 w-full sm:w-70" />
            </div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
            <Skeleton className="h-5 w-44 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={`compare-row-skel-${idx}`} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>
      )}

      {!loading && !round && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <div className="text-white text-lg font-semibold mb-2">No round available</div>
          <div className="text-slate-400">Publish or finalize a round to compare predictions.</div>
        </Card>
      )}

      {/* Player Selector */}
      {!loading && round && (
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 mb-6">
        <label className="text-slate-400 text-sm mb-2 block">Compare with:</label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full sm:w-70 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select a player" />
          </SelectTrigger>
          <SelectContent>
            {otherUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {getFirstName(user.name, undefined, 'Player')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>
      )}

      {/* Comparison Cards - Mobile */}
      {!loading && round && (
        <div className="sm:hidden space-y-3">
        {matchesWithResults.map((match, idx) => {
          const myPick = myData?.picks[match.id];
          const myBanker = myData?.banker === match.id;
          const theirPick = otherData?.picks[match.id];
          const theirBanker = otherData?.banker === match.id;
          const myCorrect = isFinal && match.result && myPick === match.result;
          const theirCorrect = isFinal && match.result && theirPick === match.result;
          const myPoints = isFinal && match.result ? getPointsForMatch(!!myCorrect, !!myBanker, match.isMatchOfTheWeek) : null;
          const theirPoints = isFinal && match.result ? getPointsForMatch(!!theirCorrect, !!theirBanker, match.isMatchOfTheWeek) : null;

          return (
            <Card key={match.id} className="bg-slate-900 border-slate-800 p-3">
              <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 mb-4 ${!isPostponed && match.isMatchOfTheWeek ? 'ring-2 ring-yellow-500/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    {!isPostponed && match.isMatchOfTheWeek && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mr-2 px-1.5 py-0.5">
                        <Star className="w-3 h-3 fill-current" />
                      </Badge>
                    )}
                    <span className="text-white text-sm font-medium">{match.homeTeam.shortName}</span>
                    <span className="text-slate-600 text-xs">vs</span>
                    <span className="text-white text-sm font-medium">{match.awayTeam.shortName}</span>
                  </div>
                  {isFinal && match.result && (
                    <div className="text-center">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold text-xs">
                        Result: {match.result}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  {/* My Pick */}
                  <div>
                    <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                      <span>You</span>
                      {!isPostponed && myBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                    </div>
                    <Badge
                      className={`w-full justify-center font-bold ${
                        isFinal && myCorrect
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : isFinal && match.result
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {myPick || '—'}
                    </Badge>
                    {myPoints !== null && (
                      <div className={`text-xs font-semibold mt-1 ${myPoints > 0 ? 'text-green-400' : myPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {myPoints > 0 ? `+${myPoints}` : myPoints}
                      </div>
                    )}
                  </div>

                  {/* Their Pick */}
                  <div>
                    <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                      <span>{getFirstName(selectedUser?.name, undefined, 'Player')}</span>
                      {!isPostponed && theirBanker && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                    </div>
                    <Badge
                      className={`w-full justify-center font-bold ${
                        isFinal && theirCorrect
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : isFinal && match.result
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {theirPick || '—'}
                    </Badge>
                    {theirPoints !== null && (
                      <div className={`text-xs font-semibold mt-1 ${theirPoints > 0 ? 'text-green-400' : theirPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {theirPoints > 0 ? `+${theirPoints}` : theirPoints}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      )}

      {/* Comparison Table - Desktop */}
      {!loading && round && (
        <Card className="hidden sm:block bg-slate-900 border-slate-800 p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold min-w-45">Match</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <span>You</span>
                    <span className="text-xs text-blue-400">({getFirstName(user?.name, user?.email, 'You')})</span>
                  </div>
                </TableHead>
                {isFinal && (
                  <TableHead className="text-slate-400 font-semibold text-center w-20">Result</TableHead>
                )}
                <TableHead className="text-slate-400 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <span>{getFirstName(selectedUser?.name, undefined, 'Player')}</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchesWithResults.map((match, idx) => {
                const myPick = myData?.picks[match.id];
                const myBanker = myData?.banker === match.id;
                const theirPick = otherData?.picks[match.id];
                const theirBanker = otherData?.banker === match.id;
                const myCorrect = isFinal && match.result && myPick === match.result;
                const theirCorrect = isFinal && match.result && theirPick === match.result;
                const myPoints = isFinal && match.result ? getPointsForMatch(!!myCorrect, !!myBanker, match.isMatchOfTheWeek) : null;
                const theirPoints = isFinal && match.result ? getPointsForMatch(!!theirCorrect, !!theirBanker, match.isMatchOfTheWeek) : null;

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
                        <span className="text-white text-sm">{match.homeTeam.name}</span>
                        <span className="text-slate-600 text-xs">vs</span>
                        <span className="text-white text-sm">{match.awayTeam.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {!isPostponed && myBanker && <Star className="w-3 h-3 text-blue-400 fill-current shrink-0" />}
                        <span
                          className={`font-semibold text-base ${
                            isFinal && myCorrect
                              ? 'text-green-400'
                              : isFinal && match.result
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {myPick || '—'}
                        </span>
                        {myPoints !== null && (
                          <span className={`text-xs font-semibold ${myPoints > 0 ? 'text-green-400' : myPoints < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                            {myPoints > 0 ? `+${myPoints}` : myPoints}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {isFinal && match.result && (
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold">
                          {match.result}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {!isPostponed && theirBanker && <Star className="w-3 h-3 text-blue-400 fill-current shrink-0" />}
                        <span
                          className={`font-semibold text-base ${
                            isFinal && theirCorrect
                              ? 'text-green-400'
                              : isFinal && match.result
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
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
            </TableBody>
          </Table>
        </div>
      </Card>
      )}
    </LayoutV1>
  );
}
