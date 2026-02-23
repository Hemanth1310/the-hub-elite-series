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
  const [competitionTick, setCompetitionTick] = useState(0);

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const { data: activeCompetition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeCompetition) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('round_stats')
        .select('user_id,total_points,correct_predictions,banker_correct,rank, round:round_id(competition_id), user:user_id(name)')
        .eq('round.competition_id', activeCompetition.id);

      const aggregated = new Map<string, LeaderboardEntry>();

      (data || []).forEach((row: any) => {
        const userData = Array.isArray(row.user) ? row.user[0] : row.user;
        const entry = aggregated.get(row.user_id) || {
          userId: row.user_id,
          userName: userData?.name || 'Player',
          rank: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          avgPerRound: 0,
          roundWins: 0,
          totalCorrect: 0,
          bankerCorrect: 0,
          bankerWrong: 0,
        };

        entry.totalPoints += row.total_points || 0;
        entry.totalCorrect += row.correct_predictions || 0;
        entry.matchesPlayed += 1;
        if (row.rank === 1) {
          entry.roundWins += 1;
        }
        if (row.banker_correct === true) {
          entry.bankerCorrect += 1;
        } else if (row.banker_correct === false) {
          entry.bankerWrong += 1;
        }

        aggregated.set(row.user_id, entry);
      });

      const mapped = Array.from(aggregated.values())
        .map((entry) => ({
          ...entry,
          avgPerRound: entry.matchesPlayed > 0 ? entry.totalPoints / entry.matchesPlayed : 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(mapped);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [competitionTick]);

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
                      <div className="text-xs text-slate-500 sm:hidden">Wins: {entry.roundWins}</div>
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
