import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Star, Users } from 'lucide-react';
import { round15Details, users, currentUser } from '@/mockData';
import { useRoute, Link } from 'wouter';
import LayoutV1 from './Layout';

export default function CompareRoundHistoryV1() {
  const [, params] = useRoute('/version1/rounds/:roundNumber/compare');
  const roundNumber = params?.roundNumber || '15';
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const roundData = round15Details; // In production, fetch based on roundNumber

  return (
    <LayoutV1>
      <div className="mb-8">
        <Link href="/version1/rounds">
          <Button
            variant="ghost"
            className="mb-4 text-blue-400 hover:text-blue-300"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Rounds
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-7 h-7" />
          Compare Round {roundNumber}
        </h1>
        <p className="text-slate-400 text-sm mt-2">Select a player to compare predictions</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Player List - Horizontal scroll on mobile, vertical on desktop */}
        <div className="lg:w-64 flex-shrink-0">
          <h3 className="text-slate-400 text-sm font-semibold mb-3 uppercase">All Players</h3>
          
          {/* Mobile: Horizontal scroll */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2">
            {users.filter(u => u.id !== currentUser.id).map(user => {
              const userPrediction = roundData.predictions.find(p => p.userId === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-medium whitespace-nowrap">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-1 whitespace-nowrap">
                    {userPrediction?.points} pts
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Desktop: Vertical list */}
          <div className="hidden lg:block space-y-2">
            {users.filter(u => u.id !== currentUser.id).map(user => {
              const userPrediction = roundData.predictions.find(p => p.userId === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {userPrediction?.points} pts
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table - Right Side */}
        <div className="flex-1 min-w-0">
          {selectedUserId ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-6">
                You vs {users.find(u => u.id === selectedUserId)?.name}
              </h2>
              
              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-3">
                {roundData.matches.map((match, idx) => {
                  const myPred = roundData.predictions.find(p => p.userId === currentUser.id);
                  const theirPred = roundData.predictions.find(p => p.userId === selectedUserId);
                  const myPick = myPred?.picks[idx];
                  const theirPick = theirPred?.picks[idx];
                  const myConviction = myPred?.conviction === idx;
                  const theirConviction = theirPred?.conviction === idx;
                  const myCorrect = myPick === match.result;
                  const theirCorrect = theirPick === match.result;
                  
                  return (
                    <div key={match.id} className={`bg-slate-800/50 rounded-lg p-4 mb-4 ${match.isMatchOfTheWeek ? 'ring-2 ring-yellow-500/50' : ''}`}>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">You</div>
                          <div className="flex items-center gap-1">
                            {myConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                            <span className={`font-semibold ${myCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {myPick}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs mb-1">{users.find(u => u.id === selectedUserId)?.name}</div>
                          <div className="flex items-center gap-1">
                            {theirConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                            <span className={`font-semibold ${theirCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {theirPick}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="bg-slate-800 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Your Points</div>
                    <div className="font-bold text-lg text-blue-400">
                      {roundData.predictions.find(p => p.userId === currentUser.id)?.points}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Their Points</div>
                    <div className="font-bold text-lg text-slate-300">
                      {roundData.predictions.find(p => p.userId === selectedUserId)?.points}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-semibold min-w-[200px]">Match</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-16">Result</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-20">You</TableHead>
                      <TableHead className="text-slate-400 font-semibold text-center w-20">
                        {users.find(u => u.id === selectedUserId)?.name}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roundData.matches.map((match, idx) => {
                      const myPred = roundData.predictions.find(p => p.userId === currentUser.id);
                      const theirPred = roundData.predictions.find(p => p.userId === selectedUserId);
                      const myPick = myPred?.picks[idx];
                      const theirPick = theirPred?.picks[idx];
                      const myConviction = myPred?.conviction === idx;
                      const theirConviction = theirPred?.conviction === idx;
                      const myCorrect = myPick === match.result;
                      const theirCorrect = theirPick === match.result;
                      
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
                              <span className="text-white text-sm">{match.home.name}</span>
                              <span className="text-slate-600 text-xs">vs</span>
                              <span className="text-white text-sm">{match.away.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold text-xs">
                              {match.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {myConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                              <span className={`font-semibold ${myCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {myPick}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {theirConviction && <Star className="w-3 h-3 text-blue-400 fill-current" />}
                              <span className={`font-semibold ${theirCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {theirPick}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-slate-800 bg-slate-800/50">
                      <TableCell className="font-bold text-white">Round Points</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-lg text-blue-400">
                          {roundData.predictions.find(p => p.userId === currentUser.id)?.points}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-lg text-slate-300">
                          {roundData.predictions.find(p => p.userId === selectedUserId)?.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Select a player to compare</p>
                <p className="text-sm mt-2">Choose from the list {window.innerWidth >= 1024 ? 'on the left' : 'above'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutV1>
  );
}
