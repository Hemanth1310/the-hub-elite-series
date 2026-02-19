import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, Plus, Trash2, Save, Lock, Unlock, Star, MoveRight, Mail } from 'lucide-react';
import { Link, useRoute, useLocation } from 'wouter';
import { toast } from 'sonner';
import LayoutV1 from './Layout';
import { notifyAllPlayers, isEmailServiceConfigured } from '@/lib/emailService';
import { supabase } from '@/lib/supabase';

/**
 * Admin Round Management
 * 
 * Status Flow: Scheduled → Active → Completed → Final
 * 
 * - Scheduled: Admin creates/edits round
 * - Active: Published, players can predict
 * - Completed: AUTOMATIC after 130 min from last kickoff (all games finished)
 * - Final: Admin clicks "Set Final" (can skip from Active directly to Final)
 * 
 * Note: Admin can set Final at any time from Active status (before Completed)
 */

export default function AdminRoundV1() {
  const [, params] = useRoute('/version1/admin/round/:roundNumber');
  const [, postponedParams] = useRoute('/version1/admin/postponed/:id');
  const [, setLocation] = useLocation();
  
  // Determine if this is a postponed game or regular round
  const isPostponed = !!postponedParams;
  const roundNumber = params?.roundNumber || postponedParams?.id || 'new';
  const isNew = roundNumber === 'new';
  
  const [status, setStatus] = useState<'scheduled' | 'active' | 'final'>(isNew ? 'scheduled' : 'scheduled');
  const [deadline, setDeadline] = useState('');
  const [roundNumberInput, setRoundNumberInput] = useState(isNew ? '' : roundNumber);
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; matchId: string | null }>({ open: false, matchId: null });
  const [postponeDialog, setPostponeDialog] = useState<{ open: boolean; matchId: string | null }>({ open: false, matchId: null });
  const [publishWarning, setPublishWarning] = useState(false);
  const [setFinalError, setSetFinalError] = useState('');
  
  const [matches, setMatches] = useState<any[]>([]);
  const [postponedMatches, setPostponedMatches] = useState<any[]>([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [matchOfTheWeek, setMatchOfTheWeek] = useState<string | null>(null);

  const toInputDateTime = (value: string) => {
    const date = new Date(value);
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    const fetchAdminRoundData = async () => {
      setLoading(true);

      const { data: competition } = await supabase
        .from('competitions')
        .select('id')
        .eq('is_active', true)
        .single();

      setCompetitionId(competition?.id || null);

      const { data: teams } = await supabase
        .from('teams')
        .select('id,name,short_name')
        .order('name', { ascending: true });

      setAllTeams(teams || []);

      if (isNew && !deadline) {
        setDeadline(toInputDateTime(new Date().toISOString()));
      }

      if (isNew && !isPostponed && competition?.id && !roundNumberInput) {
        const { data: latestRound } = await supabase
          .from('rounds')
          .select('round_number')
          .eq('competition_id', competition.id)
          .order('round_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextNumber = latestRound?.round_number ? latestRound.round_number + 1 : 1;
        setRoundNumberInput(nextNumber.toString());
      }

      if (isPostponed) {
        if (!isNew) {
          const { data: match } = await supabase
            .from('matches')
            .select('id,home_team_id,away_team_id,kickoff,include_in_round,result,is_match_of_the_week,status,home_team:home_team_id(name,short_name),away_team:away_team_id(name,short_name)')
            .eq('id', roundNumber)
            .single();

          if (match) {
            const homeTeamData = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
            const awayTeamData = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
            setMatches([
              {
                id: match.id,
                homeTeamId: match.home_team_id,
                awayTeamId: match.away_team_id,
                homeTeam: homeTeamData?.name || '',
                homeShort: homeTeamData?.short_name || '',
                awayTeam: awayTeamData?.name || '',
                awayShort: awayTeamData?.short_name || '',
                kickoff: toInputDateTime(match.kickoff),
                includeInRound: match.include_in_round,
                result: match.result,
                isMatchOfTheWeek: match.is_match_of_the_week,
              },
            ]);
            setMatchOfTheWeek(match.is_match_of_the_week ? match.id : null);
            setDeadline(toInputDateTime(match.kickoff));
            setStatus(match.status === 'finished' ? 'final' : match.status === 'live' ? 'active' : 'scheduled');
          }
        }

        setLoading(false);
        return;
      }

      if (!isNew && competition?.id) {
        const { data: round } = await supabase
          .from('rounds')
          .select('id,deadline,status,round_number')
          .eq('competition_id', competition.id)
          .eq('round_number', roundNumber)
          .single();

        if (round) {
          setRoundId(round.id);
          setRoundNumberInput(round.round_number.toString());
          setDeadline(toInputDateTime(round.deadline));
          setStatus(round.status === 'published' ? 'active' : round.status);

          const { data: roundMatches } = await supabase
            .from('matches')
            .select('id,home_team_id,away_team_id,kickoff,include_in_round,result,is_match_of_the_week,home_team:home_team_id(name,short_name),away_team:away_team_id(name,short_name)')
            .eq('round_id', round.id)
            .order('kickoff', { ascending: true });

          const mapped = (roundMatches || []).map((match) => {
            const homeTeamData = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
            const awayTeamData = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
            return {
              id: match.id,
              homeTeamId: match.home_team_id,
              awayTeamId: match.away_team_id,
              homeTeam: homeTeamData?.name || '',
              homeShort: homeTeamData?.short_name || '',
              awayTeam: awayTeamData?.name || '',
              awayShort: awayTeamData?.short_name || '',
              kickoff: toInputDateTime(match.kickoff),
              includeInRound: match.include_in_round,
              result: match.result,
              isMatchOfTheWeek: match.is_match_of_the_week,
            };
          });

          setMatches(mapped);
          const motw = mapped.find((match) => match.isMatchOfTheWeek);
          setMatchOfTheWeek(motw?.id || null);
        }
      }

      setLoading(false);
    };

    fetchAdminRoundData();
  }, [isPostponed, isNew, roundNumber]);

  const handlePostponeMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'postponed',
          include_in_round: false,
          round_id: null,
        })
        .eq('id', matchId);

      if (error) {
        toast.error('Failed to postpone match');
        return;
      }

      setPostponedMatches([...postponedMatches, { ...match, originalRound: roundNumber, includeInRound: false }]);
      setMatches(matches.filter(m => m.id !== matchId));
      setPostponeDialog({ open: false, matchId: null });
      toast.success(`Match moved to postponed games (from Round ${roundNumber})`);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (error) {
      toast.error('Failed to delete match');
      return;
    }
    setMatches(matches.filter(m => m.id !== matchId));
    setDeleteDialog({ open: false, matchId: null });
    toast.success('Match deleted');
  };

  const handleAddMatch = async () => {
    if (!newHomeTeam || !newAwayTeam) {
      toast.error('Please select both teams');
      return;
    }
    if (!isPostponed && !roundId) {
      toast.error('Please save the round first');
      return;
    }

    const home = allTeams.find(t => t.id === newHomeTeam);
    const away = allTeams.find(t => t.id === newAwayTeam);
    if (home && away) {
      const { data: inserted, error } = await supabase
        .from('matches')
        .insert({
          home_team_id: home.id,
          away_team_id: away.id,
          kickoff: new Date(deadline).toISOString(),
          include_in_round: true,
          round_id: isPostponed ? null : roundId,
          status: isPostponed ? 'postponed' : 'scheduled',
          is_match_of_the_week: false,
        })
        .select('id,home_team_id,away_team_id,kickoff,include_in_round,result,is_match_of_the_week')
        .single();

      if (error || !inserted) {
        toast.error('Failed to add match');
        return;
      }

      const newMatch = {
        id: inserted.id,
        homeTeamId: inserted.home_team_id,
        awayTeamId: inserted.away_team_id,
        homeTeam: home.name,
        homeShort: home.short_name,
        awayTeam: away.name,
        awayShort: away.short_name,
        kickoff: toInputDateTime(inserted.kickoff),
        includeInRound: inserted.include_in_round,
        result: inserted.result,
        isMatchOfTheWeek: inserted.is_match_of_the_week,
      };

      setMatches([...matches, newMatch]);
      setNewHomeTeam('');
      setNewAwayTeam('');
      setShowAddMatch(false);
      toast.success('Match added');
    }
  };

  const handleMatchUpdate = (matchId: string, field: string, value: any) => {
    setMatches(matches.map(m => m.id === matchId ? { ...m, [field]: value } : m));
  };

  const handlePublish = async () => {
    if (isNew && !isPostponed && !roundNumberInput.trim()) {
      toast.error('Please enter a round number');
      return;
    }

    if (!roundId && !isPostponed) {
      if (!competitionId) {
        toast.error('No active competition found');
        return;
      }

      const { data: created, error } = await supabase
        .from('rounds')
        .insert({
          competition_id: competitionId,
          round_number: parseInt(roundNumberInput, 10),
          round_type: 'regular',
          deadline: new Date(deadline).toISOString(),
          status: 'published',
        })
        .select('id')
        .single();

      if (error || !created) {
        toast.error('Failed to publish round');
        return;
      }

      setRoundId(created.id);
    } else if (roundId) {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'published' })
        .eq('id', roundId);

      if (error) {
        toast.error('Failed to publish round');
        return;
      }
    }

    setStatus('active');
    toast.success('Round published and active for players');
    
    // Send email notifications to all players
    if (isEmailServiceConfigured()) {
      const mockPlayers = [
        { email: 'player1@example.com', name: 'Player 1' },
        { email: 'player2@example.com', name: 'Player 2' },
        { email: 'player3@example.com', name: 'Player 3' },
        { email: 'player4@example.com', name: 'Player 4' },
        { email: 'player5@example.com', name: 'Player 5' },
        { email: 'player6@example.com', name: 'Player 6' },
        { email: 'player7@example.com', name: 'Player 7' },
        { email: 'player8@example.com', name: 'Player 8' },
      ];
      
      // In production, fetch real players from database
      notifyAllPlayers(
        mockPlayers,
        'active',
        {
          roundNumber: parseInt(roundNumber) || 0,
          roundType: isPostponed ? 'postponed' : 'regular',
          deadline: deadline,
          appUrl: `${window.location.origin}/version1/active`,
        }
      ).then(({ success, failed }) => {
        if (success > 0) {
          toast.success(`📧 Notifications sent to ${success} player(s)`);
        }
        if (failed > 0) {
          toast.error(`Failed to notify ${failed} player(s)`);
        }
      });
    } else {
      toast.info('Email notifications not configured. Set up EmailJS to enable notifications.');
    }
    
    setLocation('/version1/admin');
  };

  const handleUnpublish = async () => {
    if (roundId) {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'scheduled' })
        .eq('id', roundId);

      if (error) {
        toast.error('Failed to unpublish round');
        return;
      }
    }
    setStatus('scheduled');
    toast.success('Round unpublished');
  };

  const handleSetFinal = async () => {
    // Check if all matches have results
    const matchesWithResults = matches.filter(m => m.includeInRound && m.result);
    const totalMatches = matches.filter(m => m.includeInRound).length;
    
    if (matchesWithResults.length < totalMatches) {
      setSetFinalError(`Cannot set final: ${totalMatches - matchesWithResults.length} match(es) still missing results`);
      toast.error('All matches must have results before setting final');
      return;
    }
    
    if (roundId) {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'final' })
        .eq('id', roundId);

      if (error) {
        toast.error('Failed to set round final');
        return;
      }
    }

    setStatus('final');
    setSetFinalError('');
    toast.success('Round set to final, results published');
    
    // Send email notifications to all players
    if (isEmailServiceConfigured()) {
      const mockPlayers = [
        { email: 'player1@example.com', name: 'Player 1' },
        { email: 'player2@example.com', name: 'Player 2' },
        { email: 'player3@example.com', name: 'Player 3' },
        { email: 'player4@example.com', name: 'Player 4' },
        { email: 'player5@example.com', name: 'Player 5' },
        { email: 'player6@example.com', name: 'Player 6' },
        { email: 'player7@example.com', name: 'Player 7' },
        { email: 'player8@example.com', name: 'Player 8' },
      ];
      
      // In production, fetch real players from database
      notifyAllPlayers(
        mockPlayers,
        'final',
        {
          roundNumber: parseInt(roundNumber) || 0,
          roundType: isPostponed ? 'postponed' : 'regular',
          appUrl: `${window.location.origin}/version1/rounds`,
        }
      ).then(({ success, failed }) => {
        if (success > 0) {
          toast.success(`📧 Results sent to ${success} player(s)`);
        }
        if (failed > 0) {
          toast.error(`Failed to notify ${failed} player(s)`);
        }
      });
    }
  };

  const handleSave = async () => {
    if (isNew && !isPostponed && !roundNumberInput.trim()) {
      toast.error('Please enter a round number');
      return;
    }
    if (!isPostponed) {
      if (!competitionId) {
        toast.error('No active competition found');
        return;
      }

      let currentRoundId = roundId;
      if (!currentRoundId) {
        const { data: created, error } = await supabase
          .from('rounds')
          .insert({
            competition_id: competitionId,
            round_number: parseInt(roundNumberInput, 10),
            round_type: 'regular',
            deadline: new Date(deadline).toISOString(),
            status: 'scheduled',
          })
          .select('id')
          .single();

        if (error || !created) {
          toast.error('Failed to save round');
          return;
        }

        currentRoundId = created.id;
        setRoundId(created.id);
      } else {
        const { error } = await supabase
          .from('rounds')
          .update({ deadline: new Date(deadline).toISOString() })
          .eq('id', currentRoundId);

        if (error) {
          toast.error('Failed to update round');
          return;
        }
      }

      await Promise.all(
        matches.map((match) =>
          supabase
            .from('matches')
            .update({
              kickoff: new Date(match.kickoff).toISOString(),
              include_in_round: match.includeInRound,
              result: match.result,
              is_match_of_the_week: matchOfTheWeek === match.id,
            })
            .eq('id', match.id)
        )
      );
    } else {
      await Promise.all(
        matches.map((match) =>
          supabase
            .from('matches')
            .update({
              kickoff: new Date(match.kickoff).toISOString(),
              result: match.result,
            })
            .eq('id', match.id)
        )
      );
    }

    toast.success('Changes saved');
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
        <Link href="/version1/admin">
          <Button variant="ghost" className="mb-4 text-blue-400 hover:text-blue-300">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isPostponed 
                ? (isNew ? 'Create New Postponed Game' : `Postponed Game ${roundNumber}`)
                : (isNew ? 'Create New Round' : `Round ${roundNumber}`)
              }
            </h1>
            <p className="text-slate-400">Manage matches and settings</p>
          </div>
          <Badge className={getStatusColor(status)}>
            {status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {!isPostponed && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Round Details</h2>
          <div className="max-w-md">
            <Label className="text-slate-300 mb-2 block">Round Number</Label>
            <Input
              type="number"
              min={1}
              value={roundNumberInput}
              onChange={(e) => setRoundNumberInput(e.target.value)}
              disabled={!isNew && status !== 'scheduled'}
              placeholder="e.g., 1"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
      )}

      {/* Deadline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Deadline {!isPostponed && '(Default: 5 min before first game)'}
        </h2>
        <Input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={status !== 'scheduled'}
          className="bg-slate-800 border-slate-700 text-white max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {isPostponed && (
          <p className="text-slate-500 text-sm mt-2">Applies to this postponed game</p>
        )}
      </div>

      {/* Matches */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isPostponed ? `Match${matches.filter(m => m.includeInRound).length > 1 ? 'es' : ''} (${matches.filter(m => m.includeInRound).length})` : `Matches (${matches.filter(m => m.includeInRound).length})`}
          </h2>
          {status === 'scheduled' && (
            <Button size="sm" onClick={() => setShowAddMatch(!showAddMatch)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Match
            </Button>
          )}
        </div>

        {/* Info message for Active/Final status */}
        {(status === 'active' || status === 'final') && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-blue-400 text-sm">
              {status === 'active' 
                ? isPostponed
                  ? '📝 Game is Active - Only results can be edited. To change dates/times or add/remove matches, click "Unpublish" first.'
                  : '📝 Round is Active - Only results can be edited. To change MOTW or add/remove matches, click "Unpublish" first.'
                : '🔒 Round is Final - To make changes, click "Edit Round" first.'
              }
            </p>
          </div>
        )}

        {/* Add Match Form */}
        {showAddMatch && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Home Team</Label>
                <Select value={newHomeTeam} onValueChange={setNewHomeTeam}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {allTeams.map(team => (
                      <SelectItem key={team.id} value={team.id} className="text-white focus:bg-slate-700 focus:text-white">
                        {team.name} ({team.short_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Away Team</Label>
                <Select value={newAwayTeam} onValueChange={setNewAwayTeam}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {allTeams.map(team => (
                      <SelectItem key={team.id} value={team.id} className="text-white focus:bg-slate-700 focus:text-white">
                        {team.name} ({team.short_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddMatch} className="bg-blue-600 hover:bg-blue-700">
                Add Match
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddMatch(false)} className="border-slate-700">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Matches List */}
        <div className="space-y-3">
          {matches.filter(m => m.includeInRound).map((match) => (
            <div key={match.id} className={`bg-slate-800 rounded-lg p-4 ${matchOfTheWeek === match.id ? 'ring-2 ring-yellow-500/50 border border-yellow-500/30' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {matchOfTheWeek === match.id && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 flex items-center gap-1 text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        MATCH OF THE WEEK
                      </Badge>
                    )}
                    <div className="text-white font-medium">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                  </div>
                  {status !== 'scheduled' && (
                    <div className="text-slate-400 text-sm">{new Date(match.kickoff).toLocaleString()}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status === 'scheduled' && !isPostponed && (
                    <Button
                      size="sm"
                      variant={matchOfTheWeek === match.id ? 'default' : 'outline'}
                      onClick={() => {
                        setMatchOfTheWeek(matchOfTheWeek === match.id ? null : match.id);
                        toast.success(matchOfTheWeek === match.id ? 'Match of the Week removed' : 'Match of the Week set');
                      }}
                      className={matchOfTheWeek === match.id 
                        ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-500' 
                        : 'border-slate-700 text-slate-400 hover:text-yellow-400 hover:border-yellow-500/50'
                      }
                    >
                      <Star className={`w-4 h-4 mr-1 ${matchOfTheWeek === match.id ? 'fill-current' : ''}`} />
                      MOTW
                    </Button>
                  )}
                  {status === 'scheduled' && (
                    <>
                      {!isPostponed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPostponeDialog({ open: true, matchId: match.id })}
                          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        >
                          <MoveRight className="w-4 h-4 mr-1" />
                          Postpone
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteDialog({ open: true, matchId: match.id })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Match Date</label>
                  <Input
                    type="date"
                    value={match.kickoff?.split('T')[0] || ''}
                    onChange={(e) => handleMatchUpdate(match.id, 'kickoff', `${e.target.value}T${match.kickoff?.split('T')[1] || '15:00'}`)}
                    disabled={status !== 'scheduled'}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Kickoff Time</label>
                  <Input
                    type="time"
                    value={match.kickoff?.split('T')[1] || ''}
                    onChange={(e) => handleMatchUpdate(match.id, 'kickoff', `${match.kickoff?.split('T')[0] || '2025-02-01'}T${e.target.value}`)}
                    disabled={status !== 'scheduled'}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {(status === 'active' || status === 'final') && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-slate-400 text-xs mb-1 block">Result</Label>
                    <Select 
                      defaultValue={match.result || 'none'} 
                      disabled={status === 'final'}
                      onValueChange={(value) => {
                        setMatches(matches.map(m => m.id === match.id ? { ...m, result: value === 'none' ? null : value } : m));
                      }}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 h-9 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="none" className="text-white focus:bg-slate-700 focus:text-white">Not set</SelectItem>
                        <SelectItem value="H" className="text-white focus:bg-slate-700 focus:text-white">Home Win (H)</SelectItem>
                        <SelectItem value="U" className="text-white focus:bg-slate-700 focus:text-white">Draw (U)</SelectItem>
                        <SelectItem value="B" className="text-white focus:bg-slate-700 focus:text-white">Away Win (B)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Postponed Games Section */}
      {postponedMatches.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Postponed Games ({postponedMatches.length})</h2>
          <div className="space-y-3">
            {postponedMatches.map((match) => (
              <div key={match.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="text-slate-400 text-sm">From Round {match.originalRound}</div>
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    POSTPONED
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message for Set Final */}
      {setFinalError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{setFinalError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'final' ? (
          <Button onClick={() => { setStatus('active'); toast.info('Round unlocked for editing'); }} className="bg-blue-600 hover:bg-blue-700">
            <Unlock className="w-4 h-4 mr-2" />
            Edit Round
          </Button>
        ) : (
          <>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            
            {status === 'scheduled' && (
              <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
                <Lock className="w-4 h-4 mr-2" />
                Publish Round
              </Button>
            )}
            
            {status === 'active' && (
              <>
                <Button onClick={handleUnpublish} variant="outline" className="border-slate-700">
                  <Unlock className="w-4 h-4 mr-2" />
                  Unpublish
                </Button>
                <Button 
                  onClick={handleSetFinal} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={matches.filter(m => m.includeInRound && m.result).length < matches.filter(m => m.includeInRound).length}
                >
                  Set Final
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, matchId: null })}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this match? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.matchId && handleDeleteMatch(deleteDialog.matchId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Postpone Confirmation Dialog */}
      <AlertDialog open={postponeDialog.open} onOpenChange={(open) => setPostponeDialog({ open, matchId: null })}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Postpone Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to postpone this match? It will be moved to the Postponed Games section and can be published separately later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postponeDialog.matchId && handlePostponeMatch(postponeDialog.matchId)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Postpone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Warning Dialog */}
      <AlertDialog open={publishWarning} onOpenChange={setPublishWarning}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Another Round is Already Active</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Only one round can be active at a time. Please change the current active round (Round 16) to "Scheduled" before publishing this round.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              OK
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutV1>
  );
}
