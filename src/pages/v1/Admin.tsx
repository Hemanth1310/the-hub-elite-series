import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';

export default function AdminV1() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [postponedGames, setPostponedGames] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'rounds' | 'postponed'>('rounds');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [competitionName, setCompetitionName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      const { data } = await supabase
        .from('competitions')
        .select('id,name,is_active')
        .order('created_at', { ascending: true });

      const list = data || [];
      setCompetitions(list);
      const active = list.find((comp) => comp.is_active) || list[0];
      if (active) {
        setSelectedCompetition(active.id);
      }
    };

    fetchCompetitions();
  }, []);

  useEffect(() => {
    const fetchRounds = async () => {
      if (!selectedCompetition) {
        setRounds([]);
        setPostponedGames([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: roundRows } = await supabase
        .from('rounds')
        .select('id,round_number,deadline,status')
        .eq('competition_id', selectedCompetition)
        .order('round_number', { ascending: false });

      const roundsWithStats = await Promise.all(
        (roundRows || []).map(async (round) => {
          const { data: firstMatch } = await supabase
            .from('matches')
            .select('kickoff')
            .eq('round_id', round.id)
            .order('kickoff', { ascending: true })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('matches')
            .select('id', { count: 'exact', head: true })
            .eq('round_id', round.id);

          return {
            id: round.id,
            number: round.round_number,
            firstMatchDate: firstMatch?.kickoff ? new Date(firstMatch.kickoff).toLocaleDateString() : '—',
            gamesCount: count || 0,
            status: round.status === 'published' ? 'active' : round.status,
          };
        })
      );

      setRounds(roundsWithStats);

      const { data: postponedRows } = await supabase
        .from('matches')
        .select('id,kickoff,status,home_team:home_team_id(short_name),away_team:away_team_id(short_name),round:round_id(round_number)')
        .eq('status', 'postponed')
        .order('kickoff', { ascending: false });

      const postponedList = (postponedRows || []).map((match) => {
        const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
        const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
        const round = Array.isArray(match.round) ? match.round[0] : match.round;

        return {
          id: match.id,
          originalRound: round?.round_number || '—',
          matchDate: match.kickoff ? new Date(match.kickoff).toLocaleDateString() : '—',
          homeTeam: homeTeam?.short_name || '—',
          awayTeam: awayTeam?.short_name || '—',
          status: match.status || 'scheduled',
        };
      });

      setPostponedGames(postponedList);
      setLoading(false);
    };

    fetchRounds();
  }, [selectedCompetition]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'active':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'final':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <LayoutV1>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-slate-400">Manage rounds and matches</p>
      </div>

      {/* Competition Selector - Less Prominent */}
      <div className="mb-8 flex items-center gap-2 max-w-md">
        <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {competitions.map(comp => (
              <SelectItem key={comp.id} value={comp.id} className="text-white focus:bg-slate-700 focus:text-white">
                {comp.name} {comp.isActive && '(Active)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          className="border-slate-700 hover:bg-slate-800"
          onClick={() => {
            setIsDialogOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Cards - Like Archive Tabs */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl">
        <button
          onClick={() => setViewMode('rounds')}
          className={`
            relative p-6 rounded-lg border-2 transition-all duration-200
            ${viewMode === 'rounds'
              ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }
          `}
        >
          <div className="text-left">
            <h3 className={`text-lg font-bold mb-1 ${viewMode === 'rounds' ? 'text-blue-400' : 'text-white'}`}>
              Rounds
            </h3>
            <p className="text-slate-400 text-sm">Regular competition rounds</p>
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${viewMode === 'rounds' ? 'bg-blue-500' : 'bg-transparent'}`} />
          </div>
        </button>

        <button
          onClick={() => setViewMode('postponed')}
          className={`
            relative p-6 rounded-lg border-2 transition-all duration-200
            ${viewMode === 'postponed'
              ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }
          `}
        >
          <div className="text-left">
            <h3 className={`text-lg font-bold mb-1 ${viewMode === 'postponed' ? 'text-blue-400' : 'text-white'}`}>
              Postponed Games
            </h3>
            <p className="text-slate-400 text-sm">Standalone rescheduled matches</p>
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${viewMode === 'postponed' ? 'bg-blue-500' : 'bg-transparent'}`} />
          </div>
        </button>
      </div>

      {/* Rounds Table */}
      {viewMode === 'rounds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Rounds</h2>
            <Link href="/version1/admin/round/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Round
              </Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold">Round</TableHead>
                <TableHead className="text-slate-400 font-semibold">First Match Date</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center">Games</TableHead>
                <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rounds.map(round => (
                <TableRow key={round.number} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">Round {round.number}</TableCell>
                  <TableCell className="text-slate-300">{round.firstMatchDate}</TableCell>
                  <TableCell className="text-center text-slate-300">{round.gamesCount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(round.status)}>
                      {round.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/version1/admin/round/${round.number}`}>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Postponed Games Table */}
      {viewMode === 'postponed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Postponed Games</h2>
            <Link href="/version1/admin/postponed/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Postponed Game
              </Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold">Original Round</TableHead>
                <TableHead className="text-slate-400 font-semibold">Match Date</TableHead>
                <TableHead className="text-slate-400 font-semibold">Teams</TableHead>
                <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postponedGames.map(game => (
                <TableRow key={game.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-slate-300">Round {game.originalRound}</TableCell>
                  <TableCell className="text-slate-300">{game.matchDate}</TableCell>
                  <TableCell className="font-medium text-white">
                    {game.homeTeam} - {game.awayTeam}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(game.status)}>
                      {game.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/version1/admin/postponed/${game.id}`}>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setCompetitionName('');
          setIsActive(false);
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Competition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Competition Name</Label>
              <Input
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="e.g., Premier League 2024/25"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="active" className="text-slate-300 cursor-pointer">
                Set as active competition
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!competitionName.trim()) {
                  toast.error('Please enter a competition name');
                  return;
                }

                const slug = competitionName
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '');

                const season = new Date().getFullYear().toString();

                const { data: created, error } = await supabase
                  .from('competitions')
                  .insert({
                    name: competitionName.trim(),
                    slug,
                    season,
                    is_active: isActive,
                  })
                  .select('id,name,is_active')
                  .single();

                if (error || !created) {
                  toast.error('Failed to create competition');
                  return;
                }

                if (isActive) {
                  await supabase
                    .from('competitions')
                    .update({ is_active: false })
                    .neq('id', created.id);
                }

                toast.success(`Competition "${competitionName}" created!`);
                setIsDialogOpen(false);
                setCompetitionName('');
                setIsActive(false);
                setCompetitions((prev) => [...prev, created]);
                setSelectedCompetition(created.id);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Competition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutV1>
  );
}
