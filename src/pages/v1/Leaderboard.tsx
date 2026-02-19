import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import LayoutV1 from './Layout';

export default function LeaderboardV1() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      // Use a Supabase RPC or view for leaderboard, or aggregate from predictions/users
      const { data } = await supabase.rpc('get_leaderboard');
      setLeaderboard(data || []);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  // Stats summary calculations
  const avgScore = leaderboard.length > 0 ? (leaderboard.reduce((sum, e) => sum + (e.avg_per_round || 0), 0) / leaderboard.length).toFixed(1) : '--';
  const mostWins = leaderboard.reduce((max, e) => e.round_wins > (max?.round_wins || 0) ? e : max, leaderboard[0] || {});
  const mostBankerFails = leaderboard.reduce((max, e) => e.banker_wrong > (max?.banker_wrong || 0) ? e : max, leaderboard[0] || {});

  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-slate-400 text-sm">Season standings and statistics</p>
      </div>

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
              {leaderboard.map((entry: any) => {
                const isCurrentUser = currentUser && (entry.user_id === currentUser.id);
                const isLeader = entry.rank === 1;
                const isTopThree = entry.rank <= 3;

                return (
                  <TableRow
                    key={entry.user_id}
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
                        <span className="font-medium text-white">{entry.user_name}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-white">{entry.total_points}</TableCell>
                    <TableCell className="text-right text-slate-300 hidden sm:table-cell">{entry.matches_played}</TableCell>
                    <TableCell className="text-right text-slate-300">{Number(entry.avg_per_round).toFixed(1)}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {entry.round_wins > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                          <span className="font-semibold text-yellow-400">{entry.round_wins}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-300 hidden md:table-cell">{entry.total_correct}</TableCell>
                    <TableCell className="text-right text-green-400 hidden lg:table-cell">{entry.banker_correct}</TableCell>
                    <TableCell className="text-right text-red-400 hidden lg:table-cell">{entry.banker_wrong}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Average Score</div>
          <div className="text-2xl font-bold text-white">{avgScore}</div>
          <div className="text-slate-400 text-sm">per round</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Round Wins</div>
          <div className="text-2xl font-bold text-white">{mostWins?.user_name ?? '--'}</div>
          <div className="text-green-400 font-medium">{mostWins?.round_wins ?? '--'} wins</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Banker Failures</div>
          <div className="text-2xl font-bold text-white">{mostBankerFails?.user_name ?? '--'}</div>
          <div className="text-red-400 font-medium">{mostBankerFails?.banker_wrong ?? '--'} failures</div>
        </div>
      </div>
    </LayoutV1>
  );
}
