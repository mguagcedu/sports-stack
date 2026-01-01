import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, Clock, Users } from 'lucide-react';

interface VolunteerSettingsManagerProps {
  open: boolean;
  onClose: () => void;
}

export function VolunteerSettingsManager({ open, onClose }: VolunteerSettingsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    deposit_amount: '',
    required_volunteer_hours: '',
    hours_per_event: '2',
    refund_policy: 'full',
    cross_team_rule: 'any',
    is_active: true,
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams-for-volunteer-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, level')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch settings for selected team
  const { data: settings, isLoading } = useQuery({
    queryKey: ['volunteer-settings', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      const { data, error } = await supabase
        .from('team_volunteer_settings')
        .select('*')
        .eq('team_id', selectedTeamId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Update form when settings load
  useState(() => {
    if (settings) {
      setFormData({
        deposit_amount: settings.deposit_amount?.toString() || '',
        required_volunteer_hours: settings.required_volunteer_hours?.toString() || '',
        hours_per_event: settings.hours_per_event?.toString() || '2',
        refund_policy: settings.refund_policy || 'full',
        cross_team_rule: settings.cross_team_rule || 'any',
        is_active: settings.is_active ?? true,
      });
    }
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        team_id: selectedTeamId,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        required_volunteer_hours: formData.required_volunteer_hours ? parseInt(formData.required_volunteer_hours) : 0,
        hours_per_event: parseFloat(formData.hours_per_event) || 2,
        refund_policy: formData.refund_policy,
        cross_team_rule: formData.cross_team_rule,
        is_active: formData.is_active,
      };

      if (settings) {
        const { error } = await supabase
          .from('team_volunteer_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_volunteer_settings')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-settings', selectedTeamId] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Volunteer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Selector */}
          <div className="space-y-2">
            <Label>Select Team</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team to configure" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} {team.level && `(${team.level})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeamId && (
            <>
              {/* Deposit Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Volunteer Deposit
                  </CardTitle>
                  <CardDescription>
                    Set a refundable deposit that families pay and get back after completing volunteer hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Deposit Amount ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Refund Policy</Label>
                      <Select
                        value={formData.refund_policy}
                        onValueChange={(value) => setFormData({ ...formData, refund_policy: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full refund on completion</SelectItem>
                          <SelectItem value="prorated">Prorated based on hours</SelectItem>
                          <SelectItem value="none">No refund (donation)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hours Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Volunteer Hours
                  </CardTitle>
                  <CardDescription>
                    Configure how many hours families need to volunteer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Required Hours (Total)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.required_volunteer_hours}
                        onChange={(e) => setFormData({ ...formData, required_volunteer_hours: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hours per Event (Default)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formData.hours_per_event}
                        onChange={(e) => setFormData({ ...formData, hours_per_event: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cross-Team Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cross-Team Volunteering
                  </CardTitle>
                  <CardDescription>
                    Configure which games families can volunteer for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cross-Team Rule</Label>
                    <Select
                      value={formData.cross_team_rule}
                      onValueChange={(value) => setFormData({ ...formData, cross_team_rule: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any team's games</SelectItem>
                        <SelectItem value="same_sport">Same sport only</SelectItem>
                        <SelectItem value="different_level">Different level (Freshman→JV/Varsity)</SelectItem>
                        <SelectItem value="own_team">Own team's games only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {formData.cross_team_rule === 'different_level' && 
                        'Freshman parents volunteer at JV/Varsity games, JV parents at Freshman/Varsity, etc.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Enable Volunteering</p>
                      <p className="text-sm text-muted-foreground">Turn on/off volunteer requirements for this team</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!selectedTeamId || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
