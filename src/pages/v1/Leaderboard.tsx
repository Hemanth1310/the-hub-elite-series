import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type LeaderboardEntry = {
  userId: string;
  userName: string;
  rank: number;
  totalPoints: number;
  matchesPlayed: number;
  avgPerRound: number;
  roundWins: number;
  totalCorrect: number;
  bankerCorrect: number;
  bankerWrong: number;
};

export default function LeaderboardV1() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('leaderboard')
        .select('user_id,total_points,rounds_played,correct_predictions,banker_success,banker_fail,rounds_won,current_rank, user:user_id(name)')
        .order('current_rank', { ascending: true });

      const mapped = (data || []).map((entry: any) => {
        const userData = Array.isArray(entry.user) ? entry.user[0] : entry.user;
        const roundsPlayed = entry.rounds_played || 0;
        const totalPoints = entry.total_points || 0;

        return {
          userId: entry.user_id,
          userName: userData?.name || 'Player',
          rank: entry.current_rank || 0,
          totalPoints,
          matchesPlayed: roundsPlayed,
          avgPerRound: roundsPlayed > 0 ? totalPoints / roundsPlayed : 0,
          roundWins: entry.rounds_won || 0,
          totalCorrect: entry.correct_predictions || 0,
          bankerCorrect: entry.banker_success || 0,
          bankerWrong: entry.banker_fail || 0,
        };
      });

      setLeaderboard(mapped);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const averageScore = leaderboard.length
    ? leaderboard.reduce((sum, e) => sum + e.avgPerRound, 0) / leaderboard.length
    : 0;

  const mostRoundWins = leaderboard.reduce<LeaderboardEntry | null>((max, entry) => {
    if (!max) return entry;
    return entry.roundWins > max.roundWins ? entry : max;
  }, null);

  const mostBankerFailures = leaderboard.reduce<LeaderboardEntry | null>((max, entry) => {
    if (!max) return entry;
    return entry.bankerWrong > max.bankerWrong ? entry : max;
  }, null);

  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-400 text-sm">Season standings and statistics</p>
      </div>

      {loading && (
        <div className="min-h-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400">Loading leaderboard...</p>
          </div>
        </div>
      )}

      {!loading && leaderboard.length === 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <div className="text-white text-lg font-semibold mb-2">No leaderboard data</div>
          <div className="text-slate-400">Results will appear once rounds are finalized.</div>
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold w-16">Rank</TableHead>
                <TableHead className="text-slate-400 font-semibold min-w-30">Player</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Pts</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right hidden sm:table-cell">MP</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Avg</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right hidden md:table-cell">Wins</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right hidden md:table-cell">Correct</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right hidden lg:table-cell">Bnk ✓</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right hidden lg:table-cell">Bnk ✗</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map(entry => {
                const isCurrentUser = entry.userId === user?.id;
                const isLeader = entry.rank === 1;
                const isTopThree = entry.rank <= 3;

                return (
                  <TableRow
                    key={entry.userId}
                    className={`border-slate-800 ${
                      isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isLeader && <Trophy className="w-4 h-4 text-yellow-400" />}
                        <span className={`font-bold ${isTopThree ? 'text-blue-400' : 'text-slate-400'}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{entry.userName}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">{entry.totalPoints}</TableCell>
                    <TableCell className="text-right text-slate-300 hidden sm:table-cell">{entry.matchesPlayed}</TableCell>
                    <TableCell className="text-right text-slate-300">{entry.avgPerRound.toFixed(1)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.roundWins > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                          <span className="font-semibold text-yellow-400">{entry.roundWins}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 hidden md:table-cell">{entry.totalCorrect}</TableCell>
                    <TableCell className="text-right text-green-400 hidden lg:table-cell">{entry.bankerCorrect}</TableCell>
                    <TableCell className="text-right text-red-400 hidden lg:table-cell">{entry.bankerWrong}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      {/* Stats Summary */}
      {!loading && leaderboard.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Average Score</div>
          <div className="text-2xl font-bold text-white">
            {averageScore.toFixed(1)}
          </div>
          <div className="text-slate-400 text-sm">per round</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Round Wins</div>
          <div className="text-2xl font-bold text-white">{mostRoundWins?.userName || '—'}</div>
          <div className="text-green-400 font-medium">{mostRoundWins?.roundWins ?? 0} wins</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Banker Failures</div>
          <div className="text-2xl font-bold text-white">
            {mostBankerFailures?.userName || '—'}
          </div>
          <div className="text-red-400 font-medium">
            {mostBankerFailures?.bankerWrong ?? 0} failures
          </div>
        </div>
      </div>
      )}
    </LayoutV1>
  );
}
