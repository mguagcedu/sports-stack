import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Settings, DollarSign, Clock, Users, Gift, UserX, Trash2, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface VolunteerSettingsManagerProps {
  open: boolean;
  onClose: () => void;
}

export function VolunteerSettingsManager({ open, onClose }: VolunteerSettingsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [formData, setFormData] = useState({
    deposit_amount: '',
    tracking_type: 'events',
    required_volunteer_hours: '',
    required_events: '',
    hours_per_event: '2',
    refund_policy: 'full',
    deposit_refund_method: 'original_payment',
    cross_team_rule: 'any',
    is_active: true,
    reward_enabled: false,
    reward_threshold_events: '',
    reward_threshold_hours: '',
  });

  // Exclusion form state
  const [exclusionForm, setExclusionForm] = useState({ user_id: '', reason: '' });
  
  // Reward template form state
  const [rewardForm, setRewardForm] = useState({
    reward_type: 'free_admission',
    reward_name: '',
    monetary_value: '',
    description: '',
    events_required: '',
    hours_required: '',
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
  const { data: settings } = useQuery({
    queryKey: ['volunteer-settings', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return null;
      const { data, error } = await supabase
        .from('team_volunteer_settings')
        .select('*')
        .eq('team_id', selectedTeamId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Fetch exclusions
  const { data: exclusions } = useQuery({
    queryKey: ['volunteer-exclusions', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const { data, error } = await supabase
        .from('volunteer_exclusions')
        .select('*, profiles:user_id(first_name, last_name, email)')
        .eq('team_id', selectedTeamId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Fetch reward templates
  const { data: rewardTemplates } = useQuery({
    queryKey: ['reward-templates', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const { data, error } = await supabase
        .from('volunteer_reward_templates')
        .select('*')
        .eq('team_id', selectedTeamId)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTeamId,
  });

  // Fetch users for exclusion dropdown
  const { data: users } = useQuery({
    queryKey: ['users-for-exclusion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('last_name');
      if (error) throw error;
      return data;
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        deposit_amount: settings.deposit_amount?.toString() || '',
        tracking_type: settings.tracking_type || 'events',
        required_volunteer_hours: settings.required_volunteer_hours?.toString() || '',
        required_events: settings.required_events?.toString() || '',
        hours_per_event: settings.hours_per_event?.toString() || '2',
        refund_policy: settings.refund_policy || 'full',
        deposit_refund_method: settings.deposit_refund_method || 'original_payment',
        cross_team_rule: settings.cross_team_rule || 'any',
        is_active: settings.is_active ?? true,
        reward_enabled: settings.reward_enabled ?? false,
        reward_threshold_events: settings.reward_threshold_events?.toString() || '',
        reward_threshold_hours: settings.reward_threshold_hours?.toString() || '',
      });
    } else {
      setFormData({
        deposit_amount: '',
        tracking_type: 'events',
        required_volunteer_hours: '',
        required_events: '',
        hours_per_event: '2',
        refund_policy: 'full',
        deposit_refund_method: 'original_payment',
        cross_team_rule: 'any',
        is_active: true,
        reward_enabled: false,
        reward_threshold_events: '',
        reward_threshold_hours: '',
      });
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        team_id: selectedTeamId,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        tracking_type: formData.tracking_type,
        required_volunteer_hours: formData.required_volunteer_hours ? parseInt(formData.required_volunteer_hours) : 0,
        required_events: formData.required_events ? parseInt(formData.required_events) : 0,
        hours_per_event: parseFloat(formData.hours_per_event) || 2,
        refund_policy: formData.refund_policy,
        deposit_refund_method: formData.deposit_refund_method,
        cross_team_rule: formData.cross_team_rule,
        is_active: formData.is_active,
        reward_enabled: formData.reward_enabled,
        reward_threshold_events: formData.reward_threshold_events ? parseInt(formData.reward_threshold_events) : 0,
        reward_threshold_hours: formData.reward_threshold_hours ? parseFloat(formData.reward_threshold_hours) : 0,
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

  // Add exclusion mutation
  const addExclusionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('volunteer_exclusions')
        .insert({
          user_id: exclusionForm.user_id,
          team_id: selectedTeamId,
          reason: exclusionForm.reason,
          excluded_by_user_id: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-exclusions', selectedTeamId] });
      setExclusionForm({ user_id: '', reason: '' });
      toast({ title: 'Exclusion added' });
    },
    onError: (error) => {
      toast({ title: 'Error adding exclusion', description: error.message, variant: 'destructive' });
    },
  });

  // Delete exclusion mutation
  const deleteExclusionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('volunteer_exclusions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-exclusions', selectedTeamId] });
      toast({ title: 'Exclusion removed' });
    },
  });

  // Add reward template mutation
  const addRewardMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('volunteer_reward_templates')
        .insert({
          team_id: selectedTeamId,
          reward_type: rewardForm.reward_type,
          reward_name: rewardForm.reward_name,
          monetary_value: rewardForm.monetary_value ? parseFloat(rewardForm.monetary_value) : 0,
          description: rewardForm.description,
          events_required: rewardForm.events_required ? parseInt(rewardForm.events_required) : 0,
          hours_required: rewardForm.hours_required ? parseFloat(rewardForm.hours_required) : 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-templates', selectedTeamId] });
      setRewardForm({
        reward_type: 'free_admission',
        reward_name: '',
        monetary_value: '',
        description: '',
        events_required: '',
        hours_required: '',
      });
      toast({ title: 'Reward template added' });
    },
    onError: (error) => {
      toast({ title: 'Error adding reward', description: error.message, variant: 'destructive' });
    },
  });

  // Delete reward template mutation
  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('volunteer_reward_templates')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-templates', selectedTeamId] });
      toast({ title: 'Reward template removed' });
    },
  });

  const getRewardTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      free_admission: 'bg-green-500/10 text-green-600',
      event_pass: 'bg-blue-500/10 text-blue-600',
      swag: 'bg-purple-500/10 text-purple-600',
      credit: 'bg-orange-500/10 text-orange-600',
    };
    return <Badge className={colors[type] || 'bg-muted'}>{type.replace('_', ' ')}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                {/* Tracking Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Volunteer Tracking
                    </CardTitle>
                    <CardDescription>
                      Choose whether to track by hours or by events completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tracking Type</Label>
                      <Select
                        value={formData.tracking_type}
                        onValueChange={(value) => setFormData({ ...formData, tracking_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="events">Track by Events</SelectItem>
                          <SelectItem value="hours">Track by Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {formData.tracking_type === 'events' 
                          ? 'Volunteers complete a set number of events regardless of duration'
                          : 'Volunteers accumulate hours across multiple events'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {formData.tracking_type === 'hours' ? (
                        <>
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
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label>Required Events</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={formData.required_events}
                            onChange={(e) => setFormData({ ...formData, required_events: e.target.value })}
                          />
                        </div>
                      )}
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
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Enable Volunteering</p>
                        <p className="text-sm text-muted-foreground">Turn on/off volunteer requirements</p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deposit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Volunteer Deposit
                    </CardTitle>
                    <CardDescription>
                      Set a refundable deposit that families pay and get back after completing requirements
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
                            <SelectItem value="prorated">Prorated based on completion</SelectItem>
                            <SelectItem value="none">No refund (donation)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Refund Method</Label>
                      <Select
                        value={formData.deposit_refund_method}
                        onValueChange={(value) => setFormData({ ...formData, deposit_refund_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original_payment">Return to original payment method</SelectItem>
                          <SelectItem value="cash">Cash refund</SelectItem>
                          <SelectItem value="credit">Account credit</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        How the deposit will be returned when requirements are met
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Volunteer Rewards
                    </CardTitle>
                    <CardDescription>
                      Reward volunteers who exceed minimum requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Enable Rewards</p>
                        <p className="text-sm text-muted-foreground">Award rewards for extra volunteering</p>
                      </div>
                      <Switch
                        checked={formData.reward_enabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, reward_enabled: checked })}
                      />
                    </div>

                    {formData.reward_enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Extra Events for Reward</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.reward_threshold_events}
                              onChange={(e) => setFormData({ ...formData, reward_threshold_events: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Extra Hours for Reward</Label>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="0"
                              value={formData.reward_threshold_hours}
                              onChange={(e) => setFormData({ ...formData, reward_threshold_hours: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium mb-3">Reward Templates</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <Label>Reward Type</Label>
                              <Select
                                value={rewardForm.reward_type}
                                onValueChange={(value) => setRewardForm({ ...rewardForm, reward_type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free_admission">Free Admission</SelectItem>
                                  <SelectItem value="event_pass">Event Pass</SelectItem>
                                  <SelectItem value="swag">Swag/Merchandise</SelectItem>
                                  <SelectItem value="credit">Account Credit</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Reward Name</Label>
                              <Input
                                placeholder="e.g., Free Game Pass"
                                value={rewardForm.reward_name}
                                onChange={(e) => setRewardForm({ ...rewardForm, reward_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Monetary Value ($)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={rewardForm.monetary_value}
                                onChange={(e) => setRewardForm({ ...rewardForm, monetary_value: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Events Required</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={rewardForm.events_required}
                                onChange={(e) => setRewardForm({ ...rewardForm, events_required: e.target.value })}
                              />
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addRewardMutation.mutate()}
                            disabled={!rewardForm.reward_name || addRewardMutation.isPending}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Reward Template
                          </Button>

                          {rewardTemplates && rewardTemplates.length > 0 && (
                            <Table className="mt-4">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Reward</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Requirement</TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rewardTemplates.map((reward) => (
                                  <TableRow key={reward.id}>
                                    <TableCell className="font-medium">{reward.reward_name}</TableCell>
                                    <TableCell>{getRewardTypeBadge(reward.reward_type)}</TableCell>
                                    <TableCell>${Number(reward.monetary_value).toFixed(2)}</TableCell>
                                    <TableCell>{reward.events_required} events</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteRewardMutation.mutate(reward.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exclusions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserX className="h-5 w-5" />
                      Volunteer Exclusions
                    </CardTitle>
                    <CardDescription>
                      Exclude certain users from volunteering requirements (e.g., coaches)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select
                          value={exclusionForm.user_id}
                          onValueChange={(value) => setExclusionForm({ ...exclusionForm, user_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users?.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.first_name} {u.last_name} ({u.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason</Label>
                        <Input
                          placeholder="e.g., Head Coach, Athletic Director"
                          value={exclusionForm.reason}
                          onChange={(e) => setExclusionForm({ ...exclusionForm, reason: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addExclusionMutation.mutate()}
                      disabled={!exclusionForm.user_id || !exclusionForm.reason || addExclusionMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Exclusion
                    </Button>

                    {exclusions && exclusions.length > 0 && (
                      <Table className="mt-4">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exclusions.map((exc: any) => (
                            <TableRow key={exc.id}>
                              <TableCell className="font-medium">
                                {exc.profiles?.first_name} {exc.profiles?.last_name}
                              </TableCell>
                              <TableCell>{exc.profiles?.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{exc.reason}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteExclusionMutation.mutate(exc.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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