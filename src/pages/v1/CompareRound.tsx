import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Star } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MatchResult } from '@/types';
import LayoutV1 from './Layout';

export default function CompareRoundV1() {
  const [, params] = useRoute('/version1/compare/:status');
  const status = (params?.status as 'locked' | 'final') || 'locked';
  

  const { user: currentUser } = useAuth();
  // If not authenticated, show a message or redirect
  if (!currentUser) {
    return (
      <LayoutV1>
        <div className="p-8 text-center text-slate-400">You must be logged in to compare predictions.</div>
      </LayoutV1>
    );
  }
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState<any | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const isLocked = status === 'locked' || status === 'final';
  const isFinal = status === 'final';

  // Fetch users, round, matches, predictions
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      // Users
      const { data: userData } = await supabase.from('users').select('*');
      setUsers(userData || []);
      // Current round (latest open/active/final round)
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['locked', 'final', 'scored'])
        .order('deadline', { ascending: false })
        .limit(1)
        .single();
      setCurrentRound(roundData);
      if (!roundData) {
        setMatches([]);
        setPredictions([]);
        setLoading(false);
        return;
      }
      // Matches
      const { data: matchData } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .eq('round_id', roundData.id)
        .order('kickoff', { ascending: true });
      setMatches(matchData || []);
      // Predictions
      const { data: predictionData } = await supabase
        .from('predictions')
        .select('*')
        .eq('round_id', roundData.id);
      setPredictions(predictionData || []);
      // Set default selected user
      if (userData && currentUser) {
        const others = userData.filter((u: any) => u.id !== currentUser.id);
        setSelectedUserId(others[0]?.id || '');
      }
      setLoading(false);
    };
    fetchAll();
  }, [currentUser]);

  // Build predictions for comparison
  const regularMatches = matches.filter((m: any) => m.include_in_round);
  const myPredictions = predictions.find((p: any) => p.user_id === currentUser?.id);
  const selectedUserPredictions = predictions.find((p: any) => p.user_id === selectedUserId);
  const selectedUser = users.find((u: any) => u.id === selectedUserId);
  const otherUsers = users.filter((u: any) => u.id !== currentUser?.id);
  // For final, use match.result; otherwise null
  const matchesWithResults = regularMatches.map((match: any) => ({
    ...match,
    result: isFinal ? match.result : null,
  }));

  return (
    <LayoutV1>
      <div className="mb-6">
        <Link href="/version1">
          <Button variant="ghost" size="sm" className="mb-4 text-blue-400 hover:text-blue-300">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to This Round
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Compare Predictions</h1>
        <p className="text-slate-400 text-sm">Round {currentRound?.number} - Side by side comparison</p>
      </div>

      {/* Player Selector */}
      <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 mb-6">
        <label className="text-slate-400 text-sm mb-2 block">Compare with:</label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-full sm:w-[280px] bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select a player" />
          </SelectTrigger>
          <SelectContent>
            {otherUsers.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Comparison Cards - Mobile */}
      <div className="sm:hidden space-y-3">
        {matchesWithResults.map((match: any, idx: number) => {
          const myPick = myPredictions?.picks ? myPredictions.picks[idx] : null;
          const myConviction = myPredictions?.conviction === idx;
          const theirPick = selectedUserPredictions?.picks ? selectedUserPredictions.picks[idx] : null;
          const theirConviction = selectedUserPredictions?.conviction === idx;
          const myCorrect = isFinal && match.result && myPick === match.result;
          const theirCorrect = isFinal && match.result && theirPick === match.result;
          return (
            <Card key={match.id} className="bg-slate-900 border-slate-800 p-3">
              <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 mb-4 ${match.is_match_of_the_week ? 'ring-2 ring-yellow-500/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    {match.is_match_of_the_week && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mr-2 px-1.5 py-0.5">
                        <Star className="w-3 h-3 fill-current" />
                      </Badge>
                    )}
                    <span className="text-white text-sm font-medium">{match.home_team?.short_name}</span>
                    <span className="text-slate-600 text-xs">vs</span>
                    <span className="text-white text-sm font-medium">{match.away_team?.short_name}</span>
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
                      {myConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
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
                      {myPick}
                    </Badge>
                  </div>

                  {/* Their Pick */}
                  <div>
                    <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                      <span>{selectedUser?.name}</span>
                      {theirConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
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
                      {theirPick}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table - Desktop */}
      <Card className="hidden sm:block bg-slate-900 border-slate-800 p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold min-w-[180px]">Match</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <span>You</span>
                    <span className="text-xs text-blue-400">({currentUser.name})</span>
                  </div>
                </TableHead>
                {isFinal && (
                  <TableHead className="text-slate-400 font-semibold text-center w-20">Result</TableHead>
                )}
                <TableHead className="text-slate-400 font-semibold text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <span>{selectedUser?.name}</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchesWithResults.map((match: any, idx: number) => {
                const myPick = myPredictions?.picks ? myPredictions.picks[idx] : null;
                const myConviction = myPredictions?.conviction === idx;
                const theirPick = selectedUserPredictions?.picks ? selectedUserPredictions.picks[idx] : null;
                const theirConviction = selectedUserPredictions?.conviction === idx;
                const myCorrect = isFinal && match.result && myPick === match.result;
                const theirCorrect = isFinal && match.result && theirPick === match.result;
                return (
                  <TableRow key={match.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>
                      {match.is_match_of_the_week && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mb-2 w-fit px-2 py-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          MOTW
                        </Badge>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm">{match.home_team?.name}</span>
                        <span className="text-slate-600 text-xs">vs</span>
                        <span className="text-white text-sm">{match.away_team?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {myConviction && <Star className="w-3 h-3 text-blue-400 fill-current flex-shrink-0" />}
                        <span
                          className={`font-semibold text-base ${
                            isFinal && myCorrect
                              ? 'text-green-400'
                              : isFinal && match.result
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {myPick}
                        </span>
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
                        {theirConviction && <Star className="w-3 h-3 text-blue-400 fill-current flex-shrink-0" />}
                        <span
                          className={`font-semibold text-base ${
                            isFinal && theirCorrect
                              ? 'text-green-400'
                              : isFinal && match.result
                              ? 'text-red-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {theirPick}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </LayoutV1>
  );
}
