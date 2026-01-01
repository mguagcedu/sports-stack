import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  DollarSign,
  MapPin,
  QrCode,
  UserCheck,
  Settings
} from 'lucide-react';
import { VolunteerPositionManager } from '@/components/volunteering/VolunteerPositionManager';
import { VolunteerCheckIn } from '@/components/volunteering/VolunteerCheckIn';
import { VolunteerSettingsManager } from '@/components/volunteering/VolunteerSettingsManager';

export default function Volunteering() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPositionManagerOpen, setIsPositionManagerOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Fetch user's volunteer signups
  const { data: mySignups } = useQuery({
    queryKey: ['my-volunteer-signups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('volunteer_signups')
        .select(`
          *,
          volunteer_positions(
            position_name,
            position_type,
            start_time,
            end_time,
            location,
            hours_credit,
            events(name, start_time)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch available volunteer positions
  const { data: availablePositions } = useQuery({
    queryKey: ['available-volunteer-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_positions')
        .select(`
          *,
          events(name, start_time, venue_name)
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's deposit status
  const { data: deposits } = useQuery({
    queryKey: ['my-volunteer-deposits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('volunteer_fee_deposits')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (positionId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('volunteer_signups')
        .insert({
          position_id: positionId,
          user_id: user.id,
          status: 'signed_up',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['available-volunteer-positions'] });
      toast({ title: 'Signed up successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error signing up', description: error.message, variant: 'destructive' });
    },
  });

  // Cancel signup mutation
  const cancelMutation = useMutation({
    mutationFn: async (signupId: string) => {
      const { error } = await supabase
        .from('volunteer_signups')
        .update({ status: 'cancelled' })
        .eq('id', signupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['available-volunteer-positions'] });
      toast({ title: 'Signup cancelled' });
    },
    onError: (error) => {
      toast({ title: 'Error cancelling', description: error.message, variant: 'destructive' });
    },
  });

  // Calculate volunteer stats
  const completedHours = mySignups
    ?.filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.hours_credited || 0), 0) || 0;

  const totalRequiredHours = deposits?.reduce((sum, d) => sum + (d.required_hours || 0), 0) || 0;
  const depositTotal = deposits?.filter(d => d.status === 'held').reduce((sum, d) => sum + Number(d.amount), 0) || 0;

  const upcomingShifts = mySignups?.filter(s => 
    ['signed_up', 'confirmed'].includes(s.status) && 
    s.volunteer_positions?.start_time && 
    new Date(s.volunteer_positions.start_time) > new Date()
  ).length || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      signed_up: 'outline',
      confirmed: 'secondary',
      checked_in: 'default',
      completed: 'default',
      cancelled: 'destructive',
      no_show: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPositionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      chains: 'bg-blue-500/10 text-blue-500',
      down_sign: 'bg-purple-500/10 text-purple-500',
      video: 'bg-green-500/10 text-green-500',
      announcer: 'bg-orange-500/10 text-orange-500',
      concessions: 'bg-pink-500/10 text-pink-500',
      ticketing: 'bg-cyan-500/10 text-cyan-500',
      gates: 'bg-yellow-500/10 text-yellow-500',
      parking: 'bg-indigo-500/10 text-indigo-500',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-muted'}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <DashboardLayout title="Volunteering">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Volunteering</h1>
            <p className="text-muted-foreground">Sign up for volunteer shifts and track your hours</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={() => setIsPositionManagerOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Manage Positions
            </Button>
            <Button onClick={() => setIsCheckInOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" />
              Check In/Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold">{completedHours}</p>
                  <p className="text-sm text-muted-foreground">Hours Completed</p>
                  {totalRequiredHours > 0 && (
                    <Progress 
                      value={(completedHours / totalRequiredHours) * 100} 
                      className="mt-2 h-2" 
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingShifts}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Shifts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRequiredHours > 0 ? totalRequiredHours : '-'}</p>
                  <p className="text-sm text-muted-foreground">Hours Required</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${depositTotal.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Deposit Held</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available" className="gap-2">
              <Calendar className="h-4 w-4" />
              Available Opportunities
            </TabsTrigger>
            <TabsTrigger value="my-shifts" className="gap-2">
              <UserCheck className="h-4 w-4" />
              My Shifts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Available Volunteer Positions</CardTitle>
                <CardDescription>Sign up for upcoming events</CardDescription>
              </CardHeader>
              <CardContent>
                {availablePositions?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No volunteer opportunities available right now</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Spots</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availablePositions?.map((position) => {
                        const alreadySignedUp = mySignups?.some(s => 
                          s.position_id === position.id && 
                          !['cancelled', 'no_show'].includes(s.status)
                        );
                        const spotsLeft = position.required_count - (position.filled_count || 0);

                        return (
                          <TableRow key={position.id}>
                            <TableCell className="font-medium">
                              {position.events?.name || 'Event'}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div>{position.position_name}</div>
                                {getPositionTypeBadge(position.position_type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {position.start_time ? (
                                <div className="space-y-1">
                                  <div>{new Date(position.start_time).toLocaleDateString()}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(position.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {position.location || position.events?.venue_name || 'TBD'}
                              </div>
                            </TableCell>
                            <TableCell>{position.hours_credit || 2}</TableCell>
                            <TableCell>
                              <Badge variant={spotsLeft > 0 ? 'secondary' : 'destructive'}>
                                {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {alreadySignedUp ? (
                                <Badge variant="default">Signed Up</Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={spotsLeft <= 0 || signupMutation.isPending}
                                  onClick={() => signupMutation.mutate(position.id)}
                                >
                                  Sign Up
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-shifts">
            <Card>
              <CardHeader>
                <CardTitle>My Volunteer Shifts</CardTitle>
                <CardDescription>Your upcoming and completed volunteer work</CardDescription>
              </CardHeader>
              <CardContent>
                {mySignups?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>You haven't signed up for any shifts yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mySignups?.map((signup) => (
                        <TableRow key={signup.id}>
                          <TableCell className="font-medium">
                            {signup.volunteer_positions?.events?.name || 'Event'}
                          </TableCell>
                          <TableCell>{signup.volunteer_positions?.position_name}</TableCell>
                          <TableCell>
                            {signup.volunteer_positions?.start_time ? 
                              new Date(signup.volunteer_positions.start_time).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(signup.status)}</TableCell>
                          <TableCell>
                            {signup.hours_credited || signup.volunteer_positions?.hours_credit || '-'}
                          </TableCell>
                          <TableCell>
                            {['signed_up', 'confirmed'].includes(signup.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelMutation.mutate(signup.id)}
                                disabled={cancelMutation.isPending}
                              >
                                Cancel
                              </Button>
                            )}
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

        {/* Dialogs */}
        <VolunteerPositionManager
          open={isPositionManagerOpen}
          onClose={() => setIsPositionManagerOpen(false)}
        />

        <VolunteerCheckIn
          open={isCheckInOpen}
          onClose={() => setIsCheckInOpen(false)}
        />

        <VolunteerSettingsManager
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
