import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, CheckCircle, XCircle, Target, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import LayoutV1 from './Layout';
import { useEffect, useState } from 'react';
import { formatTimeRemainingCompact } from '@/lib/timeUtils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardV1() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roundStatus, setRoundStatus] = useState<'open' | 'locked' | 'active' | 'completed' | 'final'>('open');
  const [predictionsComplete, setPredictionsComplete] = useState(false);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [positionChange, setPositionChange] = useState(0);
  const [lastRoundPoints, setLastRoundPoints] = useState<number | null>(null);
  const [lastRoundPositionChange, setLastRoundPositionChange] = useState<number | null>(null);
  const [lastRoundBankerSuccess, setLastRoundBankerSuccess] = useState<boolean | null>(null);
  const [competitionTick, setCompetitionTick] = useState(0);

  const [totalPoints, setTotalPoints] = useState(0);
  const [predictionAccuracy, setPredictionAccuracy] = useState(0);
  const [bankerSuccessRate, setBankerSuccessRate] = useState(0);

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: activeCompetition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (!activeCompetition) {
        setLoading(false);
        return;
      }

      const nowIso = new Date().toISOString();

      const { data: roundRow } = await supabase
        .from('rounds')
        .select('id,round_number,deadline,status')
        .eq('competition_id', activeCompetition.id)
        .eq('status', 'published')
        .order('deadline', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: finalRound } = await supabase
        .from('rounds')
        .select('id,round_number,deadline,status')
        .eq('competition_id', activeCompetition.id)
        .eq('status', 'final')
        .lte('deadline', nowIso)
        .order('deadline', { ascending: false })
        .limit(1)
        .maybeSingle();

      let activeRound = roundRow;

      if (roundRow) {
        const publishedDeadline = new Date(roundRow.deadline).getTime();
        const finalDeadline = finalRound ? new Date(finalRound.deadline).getTime() : null;

        if (publishedDeadline <= Date.now() && finalRound && finalDeadline !== null && finalDeadline >= publishedDeadline) {
          activeRound = finalRound;
        }
      } else if (finalRound) {
        activeRound = finalRound;
      }

      if (activeRound) {
        setCurrentRoundNumber(activeRound.round_number);
        const deadline = new Date(activeRound.deadline);
        if (activeRound.status === 'final') {
          setRoundStatus('final');
          setTimeRemaining('');
          setPredictionsComplete(false);
        } else {
          const isLocked = deadline.getTime() < Date.now();
          setRoundStatus(isLocked ? 'locked' : 'open');
          setTimeRemaining(formatTimeRemainingCompact(deadline));

          const { count: matchCount } = await supabase
            .from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('round_id', activeRound.id)
            .eq('include_in_round', true);

          const { count: predictionCount } = await supabase
            .from('predictions')
            .select('id', { count: 'exact', head: true })
            .eq('round_id', activeRound.id)
            .eq('user_id', user.id);

          if (matchCount && predictionCount) {
            setPredictionsComplete(predictionCount >= matchCount);
          } else {
            setPredictionsComplete(false);
          }
        }
      } else {
        setCurrentRoundNumber(null);
        setRoundStatus('open');
        setPredictionsComplete(false);
      }

      const { data: leaderboardRow } = await supabase
        .from('leaderboard')
        .select('total_points,current_rank,correct_predictions,banker_success,banker_fail,rounds_played')
        .eq('user_id', user.id)
        .maybeSingle();

      if (leaderboardRow) {
        setUserPosition(leaderboardRow.current_rank || null);
        setUserPoints(leaderboardRow.total_points || 0);
        setTotalPoints(leaderboardRow.total_points || 0);
        const bankerTotal = (leaderboardRow.banker_success || 0) + (leaderboardRow.banker_fail || 0);
        setBankerSuccessRate(bankerTotal > 0 ? Math.round(((leaderboardRow.banker_success || 0) / bankerTotal) * 100) : 0);
      }

      const { data: predictionRows } = await supabase
        .from('predictions')
        .select('prediction,match:match_id(result,include_in_round,round:round_id(competition_id))')
        .eq('user_id', user.id);

      const unwrapRow = <T,>(value: T | T[] | null | undefined) =>
        Array.isArray(value) ? value[0] : value;

      const relevantPredictions = (predictionRows || []).filter((row: any) => {
        const match = unwrapRow(row.match);
        const round = unwrapRow(match?.round);
        return (
          round?.competition_id === activeCompetition.id &&
          match?.include_in_round === true &&
          match?.result
        );
      });

      const correctCount = relevantPredictions.filter((row: any) => {
        const match = unwrapRow(row.match);
        return row.prediction === match?.result;
      }).length;

      const totalCount = relevantPredictions.length;
      setPredictionAccuracy(totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);

      const { data: lastRound } = await supabase
        .from('rounds')
        .select('id')
        .eq('competition_id', activeCompetition.id)
        .eq('status', 'final')
        .lte('deadline', nowIso)
        .order('deadline', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastRound?.id) {
        const { data: statRow } = await supabase
          .from('round_stats')
          .select('total_points,rank')
          .eq('round_id', lastRound.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setLastRoundPoints(statRow?.total_points ?? null);
        setLastRoundPositionChange(statRow?.rank ?? null);

        const { data: bankerRow } = await supabase
          .from('predictions')
          .select('prediction,match:match_id(result,include_in_round)')
          .eq('round_id', lastRound.id)
          .eq('user_id', user.id)
          .eq('is_banker', true)
          .maybeSingle();

        const match = unwrapRow(bankerRow?.match);
        if (!bankerRow || !match?.result || match?.include_in_round !== true) {
          setLastRoundBankerSuccess(null);
        } else {
          setLastRoundBankerSuccess(bankerRow.prediction === match.result);
        }
      } else {
        setLastRoundBankerSuccess(null);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [user, competitionTick]);

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
      {loading && (
        <div className="min-h-50 flex items-center justify-center mb-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      )}

      {/* Top Row - Current Round & Position */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Current Round Status - NOW FIRST */}
        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex flex-col gap-2">
            <div>
              <div className="text-slate-400 text-xs mb-1">Current Round</div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Round {currentRoundNumber ?? '—'}</h2>
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
            
            {/* Small link to Round */}
            {roundStatus === 'open' && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → Go to Round to predict
                </a>
              </Link>
            )}
            
            {(roundStatus === 'locked' || roundStatus === 'active' || roundStatus === 'completed') && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → View your round
                </a>
              </Link>
            )}
            
            {roundStatus === 'final' && (
              <Link href="/version1/active">
                <a className="text-blue-400 hover:text-blue-300 text-sm inline-block">
                  → See round results
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
              <div className="text-3xl font-bold text-white">{userPosition ? `#${userPosition}` : '—'}</div>
              {positionChange !== 0 && (
                <div className={`flex items-center gap-1 ${positionChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {positionChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-lg font-semibold">{Math.abs(positionChange)}</span>
                </div>
              )}
            </div>
            <div className="text-white text-xl font-semibold">
              {totalPoints} points
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
              <div className="text-2xl font-bold text-white">{lastRoundPoints ?? '—'}</div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                <div className="text-slate-400 text-xs mb-1">Position Change</div>
                <div className={`flex items-center gap-1 ${lastRoundPositionChange === null ? 'text-slate-400' : lastRoundPositionChange > 0 ? 'text-green-400' : lastRoundPositionChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {lastRoundPositionChange === null ? (
                    <span className="text-base font-semibold">—</span>
                  ) : lastRoundPositionChange > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-base font-semibold">+{lastRoundPositionChange}</span>
                    </>
                  ) : lastRoundPositionChange < 0 ? (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      <span className="text-base font-semibold">{lastRoundPositionChange}</span>
                    </>
                  ) : (
                    <span className="text-base font-semibold">—</span>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-slate-400 text-xs mb-1">Banker Result</div>
                <div className="flex items-center gap-1">
                  {lastRoundBankerSuccess === null ? (
                    <span className="text-base font-semibold text-slate-400">—</span>
                  ) : lastRoundBankerSuccess ? (
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
              <div className="text-2xl font-bold text-white">{totalPoints}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div>
                <div className="text-slate-400 text-xs mb-1">Prediction Accuracy</div>
                <div className="text-xl font-bold text-blue-400">{predictionAccuracy}%</div>
              </div>
              
              <div>
                <div className="text-slate-400 text-xs mb-1">Banker Success</div>
                <div className="text-xl font-bold text-blue-400">{bankerSuccessRate}%</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </LayoutV1>
  );
}
