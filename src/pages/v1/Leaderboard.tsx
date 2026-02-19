import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { leaderboard, currentUser } from '@/mockData';
import LayoutV1 from './Layout';

export default function LeaderboardV1() {
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
                <TableHead className="text-slate-400 font-semibold min-w-[120px]">Player</TableHead>
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
                const isCurrentUser = entry.userId === currentUser.id;
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Average Score</div>
          <div className="text-2xl font-bold text-white">
            {(leaderboard.reduce((sum, e) => sum + e.avgPerRound, 0) / leaderboard.length).toFixed(1)}
          </div>
          <div className="text-slate-400 text-sm">per round</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Round Wins</div>
          <div className="text-2xl font-bold text-white">{leaderboard[0].userName}</div>
          <div className="text-green-400 font-medium">8 wins</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-1">Most Banker Failures</div>
          <div className="text-2xl font-bold text-white">
            {leaderboard.reduce((max, e) => e.bankerWrong > (leaderboard.find(m => m.userName === max)?.bankerWrong || 0) ? e.userName : max, leaderboard[0].userName)}
          </div>
          <div className="text-red-400 font-medium">
            {Math.max(...leaderboard.map(e => e.bankerWrong))} failures
          </div>
        </div>
      </div>
    </LayoutV1>
  );
}
