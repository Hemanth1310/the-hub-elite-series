import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import LayoutV1 from './Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminV1() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [postponedSets, setPostponedSets] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'rounds' | 'postponed' | 'members'>('rounds');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [competitionName, setCompetitionName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [competitionTick, setCompetitionTick] = useState(0);

  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  useEffect(() => {
    const handleCompetitionChange = () => setCompetitionTick((prev) => prev + 1);
    window.addEventListener('competition-changed', handleCompetitionChange);
    return () => window.removeEventListener('competition-changed', handleCompetitionChange);
  }, []);

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
  }, [competitionTick]);

  useEffect(() => {
    const fetchRounds = async () => {
      if (!selectedCompetition) {
        setRounds([]);
        setPostponedSets([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: roundRows } = await supabase
        .from('rounds')
        .select('id,round_number,deadline,status,round_type')
        .eq('competition_id', selectedCompetition)
        .order('round_number', { ascending: true });

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
            roundType: round.round_type,
          };
        })
      );

      setRounds(roundsWithStats.filter((round) => round.roundType !== 'standalone'));
      setPostponedSets(roundsWithStats.filter((round) => round.roundType === 'standalone'));
      setLoading(false);
    };

    fetchRounds();
  }, [selectedCompetition, competitionTick]);

  useEffect(() => {
    if (!selectedCompetition || viewMode !== 'members') return;

    const fetchMembers = async () => {
      setMembersLoading(true);

      const { data: inviteRows } = await supabase
        .from('invitations')
        .select('id, email, status, created_at, invited_by')
        .eq('competition_id', selectedCompetition)
        .order('created_at', { ascending: true });

      const emails = (inviteRows || []).map((r) => r.email);
      let userRows: any[] = [];
      if (emails.length) {
        const { data } = await supabase.from('users').select('id, name, email').in('email', emails);
        userRows = data || [];
      }

      const userMap = Object.fromEntries(userRows.map((u) => [u.email, u]));

      setMembers(
        (inviteRows || []).map((inv) => ({
          ...inv,
          user: userMap[inv.email] || null,
        }))
      );

      const { data: allUserRows } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name', { ascending: true });
      setAllUsers(allUserRows || []);

      setMembersLoading(false);
    };

    fetchMembers();
  }, [selectedCompetition, viewMode, competitionTick]);

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedCompetition || !user) return;
    setAddMemberLoading(true);

    const targetUser = allUsers.find((u) => u.id === selectedUserId);
    if (!targetUser) {
      toast.error('User not found');
      setAddMemberLoading(false);
      return;
    }

    const token = crypto.randomUUID().replace(/-/g, '');

    const { error } = await supabase.from('invitations').upsert(
      {
        email: targetUser.email,
        competition_id: selectedCompetition,
        invited_by: user.id,
        token,
        status: 'accepted',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'email,competition_id' }
    );

    if (error) {
      toast.error('Failed to add member');
    } else {
      toast.success(`${targetUser.name} added to competition`);
      setIsAddMemberOpen(false);
      setSelectedUserId('');
      setCompetitionTick((t) => t + 1);
    }
    setAddMemberLoading(false);
  };

  const handleRemoveMember = async (invitationId: string, email: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', invitationId);
    if (error) {
      toast.error('Failed to remove member');
    } else {
      toast.success(`${email} removed from competition`);
      setCompetitionTick((t) => t + 1);
    }
  };

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
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-3xl">
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
              Postponed Sets
            </h3>
            <p className="text-slate-400 text-sm">Mini-rounds for rescheduled matches</p>
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${viewMode === 'postponed' ? 'bg-blue-500' : 'bg-transparent'}`} />
          </div>
        </button>

        <button
          onClick={() => setViewMode('members')}
          className={`
            relative p-6 rounded-lg border-2 transition-all duration-200
            ${viewMode === 'members'
              ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
            }
          `}
        >
          <div className="text-left">
            <h3 className={`text-lg font-bold mb-1 ${viewMode === 'members' ? 'text-blue-400' : 'text-white'}`}>
              Members
            </h3>
            <p className="text-slate-400 text-sm">Manage competition access</p>
            <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${viewMode === 'members' ? 'bg-blue-500' : 'bg-transparent'}`} />
          </div>
        </button>
      </div>

      {/* Rounds Table */}
      {viewMode === 'rounds' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Rounds</h2>
            <Link href="/admin/round/new">
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
                    <Link href={`/admin/round/${round.number}`}>
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

      {/* Postponed Sets Table */}
      {viewMode === 'postponed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Postponed Sets</h2>
            <Link href="/admin/postponed/new">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Postponed Set
              </Button>
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold">Set</TableHead>
                <TableHead className="text-slate-400 font-semibold">First Match Date</TableHead>
                <TableHead className="text-slate-400 font-semibold text-center">Games</TableHead>
                <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postponedSets.map((set) => (
                <TableRow key={set.number} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">Round {set.number} (Postponed Set)</TableCell>
                  <TableCell className="text-slate-300">{set.firstMatchDate}</TableCell>
                  <TableCell className="text-center text-slate-300">{set.gamesCount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(set.status)}>
                      {set.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/postponed/${set.number}`}>
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

      {/* Members Table */}
      {viewMode === 'members' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Members</h2>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          {membersLoading ? (
            <div className="p-6 text-slate-400 text-sm">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-slate-400 text-sm">No members yet. Add users to give them access to this competition.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold">Name</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Email</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                  <TableHead className="text-slate-400 font-semibold">Added</TableHead>
                  <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white font-medium">
                      {member.user?.name || '—'}
                    </TableCell>
                    <TableCell className="text-slate-300">{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          member.status === 'accepted'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs'
                            : member.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs'
                        }
                      >
                        {member.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleRemoveMember(member.id, member.email)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={(open) => {
        setIsAddMemberOpen(open);
        if (!open) setSelectedUserId('');
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-slate-300 mb-2 block">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {allUsers
                  .filter((u) => !members.some((m) => m.email === u.email))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-white focus:bg-slate-700 focus:text-white">
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || addMemberLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addMemberLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
