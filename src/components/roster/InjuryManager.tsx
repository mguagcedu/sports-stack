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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { createNotification, createBulkNotifications } from '@/hooks/useNotifications';
import { 
  HeartPulse, 
  AlertTriangle, 
  Calendar, 
  User, 
  Plus,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface InjuryManagerProps {
  teamId: string;
  teamMemberId?: string;
  onClose?: () => void;
}

const INJURY_TYPES = [
  { value: 'minor', label: 'Minor', color: 'bg-yellow-500' },
  { value: 'moderate', label: 'Moderate', color: 'bg-orange-500' },
  { value: 'severe', label: 'Severe', color: 'bg-red-500' },
  { value: 'season_ending', label: 'Season Ending', color: 'bg-red-700' },
];

const INJURY_STATUSES = [
  { value: 'injured', label: 'Injured' },
  { value: 'day_to_day', label: 'Day-to-Day' },
  { value: 'ir', label: 'Injured Reserve (IR)' },
  { value: 'recovered', label: 'Recovered' },
  { value: 'cleared', label: 'Cleared to Play' },
];

const BODY_PARTS = [
  'Head', 'Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 'Hand', 'Finger',
  'Chest', 'Back', 'Hip', 'Thigh', 'Knee', 'Shin', 'Ankle', 'Foot', 'Toe',
  'Other'
];

export function InjuryManager({ teamId, teamMemberId, onClose }: InjuryManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<any>(null);

  // Form state
  const [injuryType, setInjuryType] = useState('minor');
  const [bodyPart, setBodyPart] = useState('');
  const [description, setDescription] = useState('');
  const [injuryDate, setInjuryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [estimatedReturn, setEstimatedReturn] = useState('');
  const [isOnIR, setIsOnIR] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(teamMemberId || '');

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-injury', teamId],
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

  // Fetch injuries
  const { data: injuries = [], isLoading } = useQuery({
    queryKey: ['team-injuries', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_injuries')
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

  // Add injury mutation
  const addInjuryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('player_injuries')
        .insert({
          team_member_id: selectedMemberId,
          team_id: teamId,
          injury_type: injuryType,
          body_part: bodyPart,
          injury_description: description,
          injury_date: injuryDate,
          estimated_return_date: estimatedReturn || null,
          is_on_ir: isOnIR,
          status: isOnIR ? 'ir' : 'injured',
          reported_by_user_id: user?.id,
        });
      if (error) throw error;

      // Get the injured player's info
      const member = teamMembers.find((m: any) => m.id === selectedMemberId) as any;
      const playerName = member?.profiles ? `${member.profiles.first_name} ${member.profiles.last_name}` : 'A player';
      
      // Notify all coaches on the team
      const { data: coaches } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .in('role', ['head_coach', 'coach', 'assistant_coach'])
        .not('user_id', 'is', null);
      
      if (coaches && coaches.length > 0) {
        const coachUserIds = coaches.map(c => c.user_id).filter(Boolean) as string[];
        await createBulkNotifications(coachUserIds, {
          title: isOnIR ? '🏥 Player Added to IR' : '⚠️ New Injury Reported',
          message: `${playerName} has been ${isOnIR ? 'placed on Injured Reserve' : 'reported injured'} (${bodyPart})`,
          type: injuryType === 'severe' || injuryType === 'season_ending' ? 'error' : 'warning',
          category: 'injury',
          reference_type: 'injury',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-injuries'] });
      toast.success('Injury reported successfully');
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to report injury');
    },
  });

  // Update injury status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ injuryId, status, actualReturnDate }: { injuryId: string; status: string; actualReturnDate?: string }) => {
      const updateData: any = { status };
      if (status === 'cleared' || status === 'recovered') {
        updateData.actual_return_date = actualReturnDate || new Date().toISOString().split('T')[0];
        updateData.cleared_by_user_id = user?.id;
      }
      if (status === 'ir') {
        updateData.is_on_ir = true;
      }

      const { error } = await supabase
        .from('player_injuries')
        .update(updateData)
        .eq('id', injuryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-injuries'] });
      toast.success('Status updated');
      setSelectedInjury(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const resetForm = () => {
    setInjuryType('minor');
    setBodyPart('');
    setDescription('');
    setInjuryDate(format(new Date(), 'yyyy-MM-dd'));
    setEstimatedReturn('');
    setIsOnIR(false);
    setSelectedMemberId(teamMemberId || '');
  };

  const activeInjuries = injuries.filter(i => !['cleared', 'recovered'].includes(i.status));
  const irPlayers = injuries.filter(i => i.is_on_ir && i.status === 'ir');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-red-500" />
            Injury Report
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeInjuries.length} active injuries, {irPlayers.length} on IR
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Injury
        </Button>
      </div>

      {/* IR List */}
      {irPlayers.length > 0 && (
        <Card className="border-red-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Injured Reserve (IR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {irPlayers.map((injury: any) => (
                <div 
                  key={injury.id} 
                  className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg cursor-pointer hover:bg-red-500/20"
                  onClick={() => setSelectedInjury(injury)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-bold">
                      #{injury.team_members?.jersey_number || '-'}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {injury.team_members?.profiles?.first_name} {injury.team_members?.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{injury.body_part}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {injury.estimated_return_date && (
                      <p className="text-sm">
                        Est. return: {format(new Date(injury.estimated_return_date), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Injuries */}
      <Card>
        <CardHeader>
          <CardTitle>All Injuries</CardTitle>
          <CardDescription>Click an injury to update status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : injuries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HeartPulse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No injuries reported</p>
            </div>
          ) : (
            <div className="space-y-2">
              {injuries.map((injury: any) => {
                const typeConfig = INJURY_TYPES.find(t => t.value === injury.injury_type);
                return (
                  <div 
                    key={injury.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInjury(injury)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-full min-h-[40px] rounded ${typeConfig?.color || 'bg-gray-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {injury.team_members?.profiles?.first_name} {injury.team_members?.profiles?.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            #{injury.team_members?.jersey_number || '-'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {injury.body_part} - {injury.injury_description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={injury.status === 'cleared' ? 'default' : 'secondary'}>
                        {INJURY_STATUSES.find(s => s.value === injury.status)?.label || injury.status}
                      </Badge>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{format(new Date(injury.injury_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Injury Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Injury</DialogTitle>
            <DialogDescription>
              Record an injury for a team member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                <Label>Injury Type</Label>
                <Select value={injuryType} onValueChange={setInjuryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INJURY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Body Part</Label>
                <Select value={bodyPart} onValueChange={setBodyPart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_PARTS.map(part => (
                      <SelectItem key={part} value={part}>{part}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the injury..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Injury Date</Label>
                <Input
                  type="date"
                  value={injuryDate}
                  onChange={(e) => setInjuryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Est. Return Date</Label>
                <Input
                  type="date"
                  value={estimatedReturn}
                  onChange={(e) => setEstimatedReturn(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnIR"
                checked={isOnIR}
                onChange={(e) => setIsOnIR(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isOnIR" className="cursor-pointer">
                Place on Injured Reserve (IR)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addInjuryMutation.mutate()}
              disabled={!selectedMemberId || addInjuryMutation.isPending}
            >
              {addInjuryMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Report Injury
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedInjury} onOpenChange={() => setSelectedInjury(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Injury Status</DialogTitle>
            <DialogDescription>
              {selectedInjury?.team_members?.profiles?.first_name} {selectedInjury?.team_members?.profiles?.last_name} - {selectedInjury?.body_part}
            </DialogDescription>
          </DialogHeader>

          {selectedInjury && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Reported: {format(new Date(selectedInjury.injury_date), 'MMMM d, yyyy')}
                  {selectedInjury.estimated_return_date && (
                    <> • Est. Return: {format(new Date(selectedInjury.estimated_return_date), 'MMMM d, yyyy')}</>
                  )}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2">
                {INJURY_STATUSES.map(status => (
                  <Button
                    key={status.value}
                    variant={selectedInjury.status === status.value ? 'default' : 'outline'}
                    onClick={() => updateStatusMutation.mutate({ 
                      injuryId: selectedInjury.id, 
                      status: status.value 
                    })}
                    disabled={updateStatusMutation.isPending}
                    className="justify-start"
                  >
                    {status.value === 'cleared' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                    {status.value === 'day_to_day' && <Clock className="h-4 w-4 mr-2 text-yellow-500" />}
                    {status.value === 'ir' && <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}