import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Plus,
  CheckCircle,
  Loader2,
  Clock,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';

interface DisciplineManagerProps {
  teamId: string;
  sportCode?: string;
}

const DISCIPLINE_TYPES = [
  { value: 'missed_practice', label: 'Missed Practice', severity: 'minor' },
  { value: 'late_arrival', label: 'Late Arrival', severity: 'minor' },
  { value: 'academic', label: 'Academic Issues', severity: 'moderate' },
  { value: 'behavior', label: 'Behavioral Issues', severity: 'moderate' },
  { value: 'bullying', label: 'Bullying', severity: 'severe' },
  { value: 'other', label: 'Other', severity: 'minor' },
];

const CONSEQUENCE_TYPES = [
  { value: 'warning', label: 'Warning Only' },
  { value: 'partial_bench', label: 'Partial Bench' },
  { value: 'full_bench', label: 'Full Game Bench' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'dismissal', label: 'Team Dismissal' },
];

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-500',
  moderate: 'bg-orange-500',
  severe: 'bg-red-500',
  critical: 'bg-red-700',
};

export function DisciplineManager({ teamId, sportCode }: DisciplineManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [disciplineType, setDisciplineType] = useState('');
  const [severity, setSeverity] = useState('minor');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [consequenceType, setConsequenceType] = useState('');
  const [benchDuration, setBenchDuration] = useState('');
  const [gamesSuspended, setGamesSuspended] = useState(0);
  const [notifyTeam, setNotifyTeam] = useState(false);
  const [notifyPlayer, setNotifyPlayer] = useState(true);
  const [notifyParents, setNotifyParents] = useState(false);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-discipline', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, jersey_number, position, role, profiles(first_name, last_name)')
        .eq('team_id', teamId)
        .eq('role', 'athlete');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bench rules for sport
  const { data: benchRules = [] } = useQuery({
    queryKey: ['bench-rules', sportCode],
    queryFn: async () => {
      if (!sportCode) return [];
      const { data, error } = await supabase
        .from('sport_bench_rules')
        .select('*')
        .eq('sport_code', sportCode.toLowerCase())
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!sportCode,
  });

  // Fetch disciplines
  const { data: disciplines = [], isLoading } = useQuery({
    queryKey: ['team-disciplines', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_disciplines')
        .select(`
          *,
          team_members(
            id, jersey_number, position,
            profiles(first_name, last_name)
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Add discipline mutation
  const addDisciplineMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('player_disciplines')
        .insert({
          team_member_id: selectedMemberId,
          team_id: teamId,
          discipline_type: disciplineType,
          severity,
          description,
          incident_date: incidentDate,
          consequence_type: consequenceType,
          bench_duration: benchDuration || null,
          games_suspended: gamesSuspended,
          notify_team: notifyTeam,
          notify_player: notifyPlayer,
          notify_parents: notifyParents,
          issued_by_user_id: user?.id,
        });
      if (error) throw error;

      // Create notifications
      const notifications = [];
      
      // Get the team member's user_id
      const member = teamMembers.find(m => m.id === selectedMemberId);
      
      if (notifyPlayer && member?.user_id) {
        notifications.push({
          team_id: teamId,
          recipient_user_id: member.user_id,
          notification_type: 'discipline',
          title: 'Discipline Notice',
          message: `You have received a ${severity} discipline notice for ${disciplineType.replace('_', ' ')}`,
          priority: severity === 'severe' || severity === 'critical' ? 'high' : 'normal',
        });
      }

      if (notifyTeam && severity !== 'minor') {
        notifications.push({
          team_id: teamId,
          notification_type: 'discipline',
          title: 'Team Discipline Notice',
          message: `A team discipline action has been taken`,
          priority: 'normal',
        });
      }

      if (notifications.length > 0) {
        await supabase.from('team_notifications').insert(notifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-disciplines'] });
      toast.success('Discipline recorded');
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record discipline');
    },
  });

  // Mark as served mutation
  const markServedMutation = useMutation({
    mutationFn: async (disciplineId: string) => {
      const { error } = await supabase
        .from('player_disciplines')
        .update({ 
          status: 'served',
          served_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', disciplineId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-disciplines'] });
      toast.success('Marked as served');
    },
  });

  const resetForm = () => {
    setSelectedMemberId('');
    setDisciplineType('');
    setSeverity('minor');
    setDescription('');
    setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
    setConsequenceType('');
    setBenchDuration('');
    setGamesSuspended(0);
    setNotifyTeam(false);
    setNotifyPlayer(true);
    setNotifyParents(false);
  };

  // Update severity based on discipline type
  const handleDisciplineTypeChange = (value: string) => {
    setDisciplineType(value);
    const typeConfig = DISCIPLINE_TYPES.find(t => t.value === value);
    if (typeConfig) {
      setSeverity(typeConfig.severity);
      // Auto-set notify team for severe issues
      if (typeConfig.severity === 'severe') {
        setNotifyPlayer(true);
        setNotifyParents(true);
      }
    }
  };

  const activeDisciplines = disciplines.filter(d => d.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            Discipline Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeDisciplines.length} active discipline actions
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Incident
        </Button>
      </div>

      {/* Discipline List */}
      <Card>
        <CardHeader>
          <CardTitle>Discipline Records</CardTitle>
          <CardDescription>Track and manage player discipline</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : disciplines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No discipline records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disciplines.map((discipline: any) => (
                <div 
                  key={discipline.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded ${SEVERITY_COLORS[discipline.severity] || 'bg-gray-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {discipline.team_members?.profiles?.first_name} {discipline.team_members?.profiles?.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          #{discipline.team_members?.jersey_number || '-'}
                        </Badge>
                        <Badge 
                          variant={discipline.status === 'served' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {discipline.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {DISCIPLINE_TYPES.find(t => t.value === discipline.discipline_type)?.label || discipline.discipline_type}
                        {discipline.consequence_type && ` - ${CONSEQUENCE_TYPES.find(c => c.value === discipline.consequence_type)?.label}`}
                      </p>
                      {discipline.bench_duration && (
                        <p className="text-xs text-muted-foreground">
                          Bench: {benchRules.find(r => r.bench_duration_key === discipline.bench_duration)?.display_name || discipline.bench_duration}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{format(new Date(discipline.incident_date), 'MMM d, yyyy')}</p>
                    </div>
                    {discipline.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markServedMutation.mutate(discipline.id)}
                        disabled={markServedMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Served
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Discipline Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Discipline Incident</DialogTitle>
            <DialogDescription>
              Document a player discipline issue and set consequences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      #{member.jersey_number || '-'} {member.profiles?.first_name} {member.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Incident Type</Label>
                <Select value={disciplineType} onValueChange={handleDisciplineTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Incident Date</Label>
              <Input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Consequence</Label>
              <Select value={consequenceType} onValueChange={setConsequenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select consequence" />
                </SelectTrigger>
                <SelectContent>
                  {CONSEQUENCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(consequenceType === 'partial_bench' || consequenceType === 'full_bench') && benchRules.length > 0 && (
              <div className="space-y-2">
                <Label>Bench Duration</Label>
                <Select value={benchDuration} onValueChange={setBenchDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {benchRules.map((rule: any) => (
                      <SelectItem key={rule.bench_duration_key} value={rule.bench_duration_key}>
                        {rule.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {consequenceType === 'suspension' && (
              <div className="space-y-2">
                <Label>Games Suspended</Label>
                <Input
                  type="number"
                  value={gamesSuspended}
                  onChange={(e) => setGamesSuspended(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-medium">Notifications</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyPlayer"
                    checked={notifyPlayer}
                    onCheckedChange={(checked) => setNotifyPlayer(checked === true)}
                  />
                  <Label htmlFor="notifyPlayer" className="cursor-pointer text-sm font-normal">
                    Notify Player
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyParents"
                    checked={notifyParents}
                    onCheckedChange={(checked) => setNotifyParents(checked === true)}
                  />
                  <Label htmlFor="notifyParents" className="cursor-pointer text-sm font-normal">
                    Notify Parents
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyTeam"
                    checked={notifyTeam}
                    onCheckedChange={(checked) => setNotifyTeam(checked === true)}
                  />
                  <Label htmlFor="notifyTeam" className="cursor-pointer text-sm font-normal">
                    Notify Team (for severe issues only)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addDisciplineMutation.mutate()}
              disabled={!selectedMemberId || !disciplineType || !description || addDisciplineMutation.isPending}
            >
              {addDisciplineMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}