import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { bestRounds, worstRounds } from '@/mockData';
import LayoutV1 from './Layout';

export default function StatsV1() {
  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Statistics</h1>
        <p className="text-slate-400 text-sm">Top performances and records</p>
      </div>

      <div className="grid gap-6 sm:gap-8">
        {/* Hall of Fame */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Hall of Fame</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Top 10 best round performances</p>
            </div>
          </div>

          {/* Mobile View */}
          <div className="sm:hidden space-y-3">
            {bestRounds.map(entry => (
              <div
                key={`best-${entry.rank}`}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {entry.rank === 1 && <Award className="w-4 h-4 text-yellow-400" />}
                    <span className={`font-bold text-sm ${entry.rank <= 3 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      #{entry.rank}
                    </span>
                    <span className="text-white font-semibold">{entry.userName}</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold">
                    {entry.points}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Round {entry.roundNumber}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{entry.correct} correct</span>
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-slate-400 font-semibold text-left pb-3 w-16">Rank</th>
                  <th className="text-slate-400 font-semibold text-left pb-3">Player</th>
                  <th className="text-slate-400 font-semibold text-left pb-3">Round</th>
                  <th className="text-slate-400 font-semibold text-right pb-3">Points</th>
                  <th className="text-slate-400 font-semibold text-right pb-3">Correct</th>
                  <th className="text-slate-400 font-semibold text-center pb-3">Conv</th>
                </tr>
              </thead>
              <tbody>
                {bestRounds.map(entry => (
                  <tr key={`best-${entry.rank}`} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Award className="w-4 h-4 text-yellow-400" />}
                        <span className={`font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-slate-400'}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="text-white font-medium py-3">{entry.userName}</td>
                    <td className="text-slate-300 py-3">Round {entry.roundNumber}</td>
                    <td className="text-right font-bold text-green-400 py-3">{entry.points}</td>
                    <td className="text-right text-slate-300 py-3">{entry.correct}</td>
                    <td className="text-center py-3">
                      <span className="text-green-400 text-xl">✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Hall of Shame */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Hall of Shame</h2>
              <p className="text-slate-400 text-xs sm:text-sm">Top 10 worst round performances</p>
            </div>
          </div>

          {/* Mobile View */}
          <div className="sm:hidden space-y-3">
            {worstRounds.map(entry => (
              <div
                key={`worst-${entry.rank}`}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-400">#{entry.rank}</span>
                    <span className="text-white font-semibold">{entry.userName}</span>
                  </div>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold">
                    {entry.points}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Round {entry.roundNumber}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{entry.correct} correct</span>
                    <span className="text-red-400 text-lg">✗</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-slate-400 font-semibold text-left pb-3 w-16">Rank</th>
                  <th className="text-slate-400 font-semibold text-left pb-3">Player</th>
                  <th className="text-slate-400 font-semibold text-left pb-3">Round</th>
                  <th className="text-slate-400 font-semibold text-right pb-3">Points</th>
                  <th className="text-slate-400 font-semibold text-right pb-3">Correct</th>
                  <th className="text-slate-400 font-semibold text-center pb-3">Conv</th>
                </tr>
              </thead>
              <tbody>
                {worstRounds.map(entry => (
                  <tr key={`worst-${entry.rank}`} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3">
                      <span className="font-bold text-slate-400">#{entry.rank}</span>
                    </td>
                    <td className="text-white font-medium py-3">{entry.userName}</td>
                    <td className="text-slate-300 py-3">Round {entry.roundNumber}</td>
                    <td className="text-right font-bold text-red-400 py-3">{entry.points}</td>
                    <td className="text-right text-slate-300 py-3">{entry.correct}</td>
                    <td className="text-center py-3">
                      <span className="text-red-400 text-xl">✗</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </LayoutV1>
  );
}
