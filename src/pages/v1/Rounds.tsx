import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Calendar, ChevronLeft, Star, Users } from 'lucide-react';
import { pastRounds, round15Details, users, currentUser } from '@/mockData';
import { Link } from 'wouter';
import LayoutV1 from './Layout';

export default function RoundsV1() {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  if (selectedRound) {
    const roundData = round15Details; // In production, fetch based on selectedRound
    const roundInfo = pastRounds.find(r => r.roundNumber === selectedRound);
    const myPrediction = roundData.predictions.find(p => p.userId === currentUser.id);
    
    // Calculate my rank
    const sortedPredictions = [...roundData.predictions].sort((a, b) => b.points - a.points);
    const myRank = sortedPredictions.findIndex(p => p.userId === currentUser.id) + 1;

    return (
      <LayoutV1>
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 text-blue-400 hover:text-blue-300"
            onClick={() => setSelectedRound(null)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Rounds
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Round {selectedRound}</h1>
              <Badge className="bg-slate-700 text-slate-300">FINAL</Badge>
            </div>
            <Link href={`/version1/rounds/${selectedRound}/compare`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Compare with Others</span>
                <span className="sm:hidden">Compare</span>
              </Button>
            </Link>
          </div>
          <p className="text-slate-400 text-sm">{roundInfo?.date}</p>
        </div>

        {/* My Performance - At Top */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 sm:mb-6">My Performance</h2>
          
          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {roundData.matches.map((match, idx) => {
              const myPick = myPrediction?.picks[idx];
              const isConviction = myPrediction?.conviction === idx;
              const isCorrect = myPick === match.result;
              
              return (
                <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 space-y-2 ${match.isMatchOfTheWeek ? 'ring-2 ring-yellow-500/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {match.isMatchOfTheWeek && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mr-2 px-1.5 py-0.5">
                          <Star className="w-3 h-3 fill-current" />
                        </Badge>
                      )}
                      <span className="text-white text-sm font-medium">
                        <span className="sm:hidden">{match.home.shortName}</span>
                        <span className="hidden sm:inline">{match.home.name}</span>
                      </span>
                      <span className="text-slate-600 text-xs">vs</span>
                      <span className="text-white text-sm font-medium">
                        <span className="sm:hidden">{match.away.shortName}</span>
                        <span className="hidden sm:inline">{match.away.name}</span>
                      </span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold text-xs">
                      {match.result}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">My Pick:</span>
                    <div className="flex items-center gap-2">
                      {isConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                      <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {myPick}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bg-slate-800 rounded-lg p-4 flex items-center justify-between">
              <span className="font-bold text-white">My Round Points</span>
              <span className="font-bold text-lg text-blue-400">{myPrediction?.points}</span>
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold min-w-[200px]">Match</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center w-16">Result</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center w-20">My Pick</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-center w-20">Conviction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roundData.matches.map((match, idx) => {
                  const myPick = myPrediction?.picks[idx];
                  const isConviction = myPrediction?.conviction === idx;
                  const isCorrect = myPick === match.result;
                  
                  return (
                    <TableRow key={match.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        {match.isMatchOfTheWeek && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold mb-2 w-fit px-2 py-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            MOTW
                          </Badge>
                        )}
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">
                            <span className="sm:hidden">{match.home.shortName}</span>
                            <span className="hidden sm:inline">{match.home.name}</span>
                          </span>
                          <span className="text-slate-600 text-xs">vs</span>
                          <span className="text-white text-sm">
                            <span className="sm:hidden">{match.away.shortName}</span>
                            <span className="hidden sm:inline">{match.away.name}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold">
                          {match.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {myPick}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-slate-800 bg-slate-800/50">
                  <TableCell className="font-bold text-white" colSpan={3}>My Round Points</TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-lg text-blue-400">
                      {myPrediction?.points}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Round Summary - Now Below */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-slate-400 text-sm">Round Winner</span>
            </div>
            <div className="text-2xl font-bold text-white">{roundInfo?.winner}</div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="text-slate-400 text-sm mb-2">My Round Rank</div>
            <div className="text-2xl font-bold text-blue-400">#{myRank}</div>
            <div className="text-sm text-slate-500 mt-1">of {roundData.predictions.length} players</div>
          </Card>
          <Card className="bg-slate-900 border-slate-800 p-6">
            <div className="text-slate-400 text-sm mb-2">Average Score</div>
            <div className="text-2xl font-bold text-white">{roundInfo?.averageScore}</div>
          </Card>
        </div>
      </LayoutV1>
    );
  }

  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Round History</h1>
        <p className="text-slate-400 text-sm">View past rounds and results</p>
      </div>

      <div className="grid gap-4">
        {pastRounds.map(round => (
          <Card
            key={round.roundId}
            className="bg-slate-900 border-slate-800 p-4 sm:p-6 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => setSelectedRound(round.roundNumber)}
          >
            <div className="flex flex-col gap-4">
              {/* Top section - Round info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-lg">{round.roundNumber}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold mb-1">Round {round.roundNumber}</div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {round.date}
                  </div>
                </div>
              </div>

              {/* Bottom section - Stats */}
              <div className="flex items-center justify-between gap-4 pl-0 sm:pl-14">
                <div className="flex-1">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">Winner</div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{round.winner}</span>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">Average</div>
                  <div className="text-white font-bold">{round.averageScore.toFixed(1)}</div>
                </div>
                <div className="flex-1 flex justify-end">
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                    View Details
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </LayoutV1>
  );
}
