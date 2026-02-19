import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, Star, HelpCircle, Users2 } from 'lucide-react';
import { Link } from 'wouter';
import { matches, currentRound, currentUserPredictions } from '@/mockData';
import { MatchResult } from '@/types';
import LayoutV1 from './Layout';
import { formatTimeRemainingCompact } from '@/lib/timeUtils';
import { toast } from 'sonner';

export default function ThisRoundV1() {
  const [roundStatus, setRoundStatus] = useState<'open' | 'locked' | 'final'>('open');
  const [roundType, setRoundType] = useState<'round' | 'standalone'>('round');
  const [isSaved, setIsSaved] = useState(false);
  
  const [predictions, setPredictions] = useState<Record<string, MatchResult>>(
    currentUserPredictions.reduce((acc, p) => ({ ...acc, [p.matchId]: p.prediction }), {})
  );
  const [bankerMatchId, setBankerMatchId] = useState<string | null>(
    currentUserPredictions.find(p => p.isBanker)?.matchId || null
  );
  const [showHowToPredict, setShowHowToPredict] = useState(false);

  const timeRemaining = formatTimeRemainingCompact(currentRound.deadline);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const handlePredictionChange = (matchId: string, result: MatchResult) => {
    setPredictions(prev => ({ ...prev, [matchId]: result }));
    setIsSaved(false); // Mark as unsaved when changed
  };

  const handleBankerToggle = (matchId: string) => {
    if (roundType === 'standalone') return;
    setBankerMatchId(prev => prev === matchId ? null : matchId);
    setIsSaved(false); // Mark as unsaved when changed
  };

  const canEdit = roundStatus === 'open';
  const showResults = roundStatus === 'final';
  
  // For standalone, show only first match; for rounds, show all
  const displayMatches = roundType === 'standalone' 
    ? matches.filter(m => m.includeInRound).slice(0, 1)
    : matches.filter(m => m.includeInRound);

  return (
    <LayoutV1>
      {/* Round Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Round {currentRound.number}</h1>
            <Badge className={roundStatus === 'open' ? 'bg-green-500/20 text-green-400 border-green-500/30' : roundStatus === 'locked' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
              {roundStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{roundStatus === 'open' ? `${timeRemaining} remaining` : `Deadline: ${formatDate(currentRound.deadline)}`}</span>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowHowToPredict(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <HelpCircle className="w-4 h-4 mr-2" />
          How to Predict
        </Button>
      </div>

      {/* DEMO Controls */}
      <Card className="bg-yellow-500/10 border-yellow-500/30 p-4 mb-6">
        <div className="flex flex-col gap-3">
          <div className="text-yellow-400 font-semibold text-sm">🎭 PROTOTYPE TESTING CONTROLS</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setRoundStatus('open')} className={roundStatus === 'open' ? 'bg-green-600' : 'bg-slate-800 border-slate-700 text-slate-300'}>Open</Button>
            <Button size="sm" onClick={() => setRoundStatus('locked')} className={roundStatus === 'locked' ? 'bg-orange-600' : 'bg-slate-800 border-slate-700 text-slate-300'}>Locked</Button>
            <Button size="sm" onClick={() => setRoundStatus('final')} className={roundStatus === 'final' ? 'bg-blue-600' : 'bg-slate-800 border-slate-700 text-slate-300'}>Final</Button>
            <div className="h-6 w-px bg-slate-700" />
            <Button size="sm" onClick={() => setRoundType('round')} className={roundType === 'round' ? 'bg-purple-600' : 'bg-slate-800 border-slate-700 text-slate-300'}>Round</Button>
            <Button size="sm" onClick={() => setRoundType('standalone')} className={roundType === 'standalone' ? 'bg-purple-600' : 'bg-slate-800 border-slate-700 text-slate-300'}>Standalone</Button>
          </div>
        </div>
      </Card>

      {/* My Predictions */}
      <Card className="bg-slate-900 border-slate-800 mb-6">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Predictions</h2>
          {!canEdit && (
            <Link href={`/version1/compare/${currentRound.id}`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Users2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Saved Status Indicator */}
        {canEdit && isSaved && displayMatches.every(m => predictions[m.id]) && (
          <div className="px-4 pt-4">
            <Card className="bg-green-500/10 border-green-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-green-400 font-semibold mb-1">Predictions Saved & Ready!</div>
                  <div className="text-green-300/80 text-sm">
                    All {displayMatches.length} prediction{displayMatches.length !== 1 ? 's' : ''} complete and saved. You can still edit until {roundType === 'standalone' ? 'the match locks' : 'the round locks'}.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Final Results Banner */}
        {showResults && (
          <div className="px-4 pt-4">
            <Card className="bg-blue-500/10 border-blue-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-blue-400 font-semibold mb-1">Final Results Are In!</div>
                  <div className="text-blue-300/80 text-sm">
                    All matches complete. See your results below.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="divide-y divide-slate-800">
          {displayMatches.map(match => {
            const userPrediction = predictions[match.id];
            const isBanker = bankerMatchId === match.id;
            const isMOTW = match.isMatchOfTheWeek;
            
            // Mock results for demo (in real app, comes from match.result)
            const matchResult = showResults ? match.result : null;
            const isCorrect = matchResult && userPrediction === matchResult;
            
            // Scoring logic:
            // Regular: 3 or 0
            // Banker only: 6 or -3
            // MOTW only: 6 or 0
            // Banker + MOTW: 12 or -6
            let points = null;
            if (showResults) {
              if (isBanker && isMOTW) {
                // Both banker and MOTW
                points = isCorrect ? 12 : -6;
              } else if (isBanker) {
                // Banker only
                points = isCorrect ? 6 : -3;
              } else if (isMOTW) {
                // MOTW only
                points = isCorrect ? 6 : 0;
              } else {
                // Regular match
                points = isCorrect ? 3 : 0;
              }
            }

            return (
              <div key={match.id} className={`p-4 hover:bg-slate-800/50 ${isBanker ? 'bg-yellow-500/5 border-l-4 border-yellow-500' : ''}`}>
                {/* Match Name and Date */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-white text-sm font-medium">{match.homeTeam.name} vs {match.awayTeam.name}</div>
                  {roundType !== 'standalone' && match.isMatchOfTheWeek && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold px-2 py-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      MOTW
                    </Badge>
                  )}
                </div>
                <div className="text-slate-500 text-xs mb-3">{formatDate(match.kickoff)}</div>

                {/* Prediction Buttons and Results */}
                <div className="flex flex-col gap-3">
                  {/* Buttons Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => canEdit && handlePredictionChange(match.id, 'H')} disabled={!canEdit} className={userPrediction === 'H' ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[40px]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white min-w-[40px]'}>H</Button>
                      <Button size="sm" onClick={() => canEdit && handlePredictionChange(match.id, 'U')} disabled={!canEdit} className={userPrediction === 'U' ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[40px]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white min-w-[40px]'}>U</Button>
                      <Button size="sm" onClick={() => canEdit && handlePredictionChange(match.id, 'B')} disabled={!canEdit} className={userPrediction === 'B' ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[40px]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white min-w-[40px]'}>B</Button>
                    </div>

                    {roundType === 'round' && (
                      <Button size="sm" variant="ghost" onClick={() => canEdit && userPrediction && handleBankerToggle(match.id)} disabled={!canEdit || !userPrediction} className={isBanker ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'}>
                        <Star className={`w-5 h-5 ${isBanker ? 'fill-yellow-400' : ''}`} />
                      </Button>
                    )}
                  </div>

                  {/* Results Row - Mobile Friendly */}
                  {showResults && (
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Result:</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold min-w-[40px] justify-center">
                          {matchResult}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Points:</span>
                        <div className={`font-bold text-lg ${points! > 0 ? 'text-green-400' : points! < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {points! > 0 ? `+${points}` : points}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canEdit && (
          <div className="p-4 border-t border-slate-800 flex justify-between items-center">
            <div className="text-sm text-slate-400">
              {!displayMatches.every(m => predictions[m.id]) ? (
                <span>Complete all predictions to save</span>
              ) : isSaved ? (
                <span className="text-green-400">✓ All predictions saved</span>
              ) : (
                <span className="text-orange-400">⚠ Unsaved changes</span>
              )}
            </div>
            <Button 
              onClick={() => {
                // In real app, this would save to database
                // Status stays OPEN so user can continue editing
                toast.success('Predictions saved! You can continue editing until the round is locked.');
                setIsSaved(true); // Mark as saved
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Predictions
            </Button>
          </div>
        )}
      </Card>

      {/* How to Predict Dialog */}
      <AlertDialog open={showHowToPredict} onOpenChange={setShowHowToPredict}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              How to Predict
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 text-slate-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Making Your Predictions</h3>
              <p className="text-sm mb-2">For each match, pick the outcome you think will happen:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li><span className="font-semibold text-blue-400">H</span> = Home team wins</li>
                <li><span className="font-semibold text-blue-400">U</span> = Draw (tie)</li>
                <li><span className="font-semibold text-blue-400">B</span> = Away team wins</li>
              </ul>
            </div>
            {roundType === 'round' && (
              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  Banker Pick (Rounds Only)
                </h3>
                <p className="text-sm mb-2">Select ONE match as your <span className="text-blue-400 font-semibold">banker pick</span> – the one you're most confident about.</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>✓ Correct banker = <span className="text-green-400 font-semibold">6 points</span> (double!)</li>
                  <li>✗ Wrong banker = <span className="text-red-400 font-semibold">-3 points</span> (penalty)</li>
                </ul>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowHowToPredict(false)} className="bg-blue-600 hover:bg-blue-700 text-white">Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutV1>
  );
}
