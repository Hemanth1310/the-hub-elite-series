import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, TrendingDown, CheckCircle, XCircle, Target, Award, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import LayoutV1 from './Layout';
import { formatTimeRemainingCompact } from '@/lib/timeUtils';

export default function DashboardV1() {

  const { user: currentUser } = useAuth();
  const [roundStatus, setRoundStatus] = useState<'open' | 'locked' | 'active' | 'completed' | 'final'>('open');
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [lastRoundStats, setLastRoundStats] = useState<any>(null);
  const [seasonStats, setSeasonStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      // Get current round
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .order('number', { ascending: false })
        .limit(1)
        .single();
      setCurrentRound(roundData);
      // Get user stats (position, points, position change)
      if (currentUser) {
        // Get leaderboard for current round
        const { data: leaderboard } = await supabase
          .rpc('get_leaderboard', { round_number: roundData?.number });
        if (leaderboard && Array.isArray(leaderboard)) {
          const userIndex = leaderboard.findIndex((u: any) => u.user_id === currentUser.id);
          if (userIndex !== -1) {
            setUserStats({
              position: userIndex + 1,
              points: leaderboard[userIndex].points,
              positionChange: leaderboard[userIndex].position_change,
            });
          }
        }
        // Last round stats
        const { data: lastRound } = await supabase
          .from('rounds')
          .select('*')
          .order('number', { ascending: false })
          .range(1, 1)
          .single();
        if (lastRound) {
          const { data: lastPred } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('round_id', lastRound.id)
            .single();
          setLastRoundStats({
            points: lastPred?.points ?? 0,
            positionChange: lastPred?.position_change ?? 0,
            bankerSuccess: lastPred?.banker_success ?? false,
          });
        }
        // Season stats
        const { data: season } = await supabase
          .rpc('get_user_season_stats', { user_id: currentUser.id });
        setSeasonStats(season);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, [currentUser]);

  const timeRemaining = currentRound ? formatTimeRemainingCompact(currentRound.deadline) : '--';


  // TODO: Replace with real logic for predictionsComplete
  const predictionsComplete = false;
  const getActionButton = () => {
    if (roundStatus === 'open') {
      if (predictionsComplete) {
        return {
          text: 'View Your Picks',
          href: '/version1/active',
          variant: 'outline' as const,
        };
      }
      return {
        text: 'Make Your Predictions',
        href: '/version1/active',
        variant: 'default' as const,
      };
    }
    if (roundStatus === 'locked') {
      return {
        text: 'View Your Picks',
        href: '/version1/active',
        variant: 'outline' as const,
      };
    }
    return {
      text: 'See Results',
      href: '/version1/active',
      variant: 'default' as const,
    };
  };
  const actionButton = getActionButton();

  return (
    <LayoutV1>
      {/* DEMO: Status Selector */}
      <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <div className="text-yellow-400 font-semibold text-sm mb-1">🎭 DEMO MODE</div>
            <div className="text-slate-300 text-sm">Select a round status to see how the "Current Round" card changes:</div>
          </div>
          <Select value={roundStatus} onValueChange={(value: any) => setRoundStatus(value)}>
            <SelectTrigger className="w-50 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="open" className="text-white focus:bg-slate-700 focus:text-white">
                Open (Before deadline)
              </SelectItem>
              <SelectItem value="active" className="text-white focus:bg-slate-700 focus:text-white">
                Active (In progress)
              </SelectItem>
              <SelectItem value="completed" className="text-white focus:bg-slate-700 focus:text-white">
                Completed (Finished)
              </SelectItem>
              <SelectItem value="final" className="text-white focus:bg-slate-700 focus:text-white">
                Final (Results published)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Top Row - Current Round & Position */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Current Round Status - NOW FIRST */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-slate-400 text-xs mb-1">Current Round</div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Round {currentRound?.number ?? '--'}</h2>
                <Badge
                  className={
                    roundStatus === 'open'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : roundStatus === 'locked'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      : roundStatus === 'active'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : roundStatus === 'completed'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }
                >
                  {roundStatus === 'active' ? 'IN PROGRESS' : roundStatus === 'completed' ? 'COMPLETED' : roundStatus.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            {roundStatus === 'open' && (
              <div>
                <div className="text-slate-400 text-xs mb-1">Time Remaining</div>
                <div className="flex items-center gap-2 text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-2xl font-mono font-bold">{timeRemaining}</span>
                </div>
              </div>
            )}
            
            {roundStatus === 'locked' && (
              <div className="text-orange-400 text-base font-semibold">Locked - results pending</div>
            )}
            
            {roundStatus === 'active' && (
              <div>
                <div className="text-blue-400 text-base font-semibold">Games underway</div>
                <div className="text-slate-400 text-sm mt-1">Results pending</div>
              </div>
            )}
            
            {roundStatus === 'completed' && (
              <div>
                <div className="text-purple-400 text-base font-semibold">All games finished</div>
                <div className="text-slate-400 text-sm mt-1">Final results pending</div>
              </div>
            )}
            
            {roundStatus === 'final' && (
              <div className="text-green-400 text-base font-semibold">Round Complete</div>
            )}
            
            {/* Small link to Active Now */}
            {roundStatus === 'open' && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → Go to Active Now to predict
                </a>
              </Link>
            )}
            
            {(roundStatus === 'locked' || roundStatus === 'active' || roundStatus === 'completed') && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → View your picks
                </a>
              </Link>
            )}
            
            {roundStatus === 'final' && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → See results
                </a>
              </Link>
            )}
          </div>
        </Card>

        {/* Your Position - NOW SECOND, SAME STYLING */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex flex-col">
            <div className="text-slate-400 text-xs mb-1">Your Current Position</div>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-white">#{userStats?.position ?? '--'}</div>
              {userStats && Number(userStats.positionChange) !== 0 && (
                <div className={`flex items-center gap-1 ${userStats.positionChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {userStats.positionChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-lg font-semibold">{Math.abs(userStats.positionChange)}</span>
                </div>
              )}
            </div>
            <div className="text-white text-xl font-semibold">
              {userStats?.points ?? '--'} points
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Last Round Performance */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Last Round Performance</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-slate-400 text-xs mb-1">Points Scored</div>
              <div className="text-2xl font-bold text-white">{lastRoundStats?.points ?? '--'}</div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                <div className="text-slate-400 text-xs mb-1">Position Change</div>
                <div className={`flex items-center gap-1 ${lastRoundStats?.positionChange > 0 ? 'text-green-400' : lastRoundStats?.positionChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {lastRoundStats?.positionChange > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-base font-semibold">+{lastRoundStats.positionChange}</span>
                    </>
                  ) : lastRoundStats?.positionChange < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      <span className="text-base font-semibold">{lastRoundStats.positionChange}</span>
                    </>
                  ) : (
                    <span className="text-base font-semibold">—</span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 text-xs mb-1">Banker Result</div>
                <div className="flex items-center gap-1">
                  {lastRoundStats?.bankerSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-base font-semibold text-green-400">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-base font-semibold text-red-400">Failed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Season Stats */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Season Stats</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-slate-400 text-xs mb-1">Total Points</div>
              <div className="text-2xl font-bold text-white">{seasonStats?.total_points ?? '--'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div>
                <div className="text-slate-400 text-xs mb-1">Prediction Accuracy</div>
                <div className="text-xl font-bold text-blue-400">{seasonStats?.prediction_accuracy ?? '--'}%</div>
              </div>
              
              <div>
                <div className="text-slate-400 text-xs mb-1">Banker Success</div>
                <div className="text-xl font-bold text-blue-400">{seasonStats?.banker_success_rate ?? '--'}%</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </LayoutV1>
  );
}
