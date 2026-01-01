import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Calendar, 
  Users,
  Clock,
  MapPin,
  Activity,
  Target,
  Medal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AthleteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch athlete's teams
  const { data: myTeams } = useQuery({
    queryKey: ['athlete-teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          teams(
            id, name, level, gender,
            sports(name, icon),
            seasons(name),
            organizations(name)
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'athlete');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch upcoming events for athlete's teams
  const { data: upcomingEvents } = useQuery({
    queryKey: ['athlete-events', myTeams],
    queryFn: async () => {
      if (!myTeams || myTeams.length === 0) return [];
      
      const teamIds = myTeams.map(t => t.team_id);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!myTeams && myTeams.length > 0
  });

  return (
    <DashboardLayout title="Athlete Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hey{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 💪
          </h1>
          <p className="text-muted-foreground">
            Ready to crush it today? Here's your athletic overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myTeams?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">My Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingEvents?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Activity className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Games Played</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                My Teams
              </CardTitle>
              <CardDescription>Teams you're currently playing for</CardDescription>
            </CardHeader>
            <CardContent>
              {myTeams && myTeams.length > 0 ? (
                <div className="space-y-3">
                  {myTeams.map((membership: any) => (
                    <div 
                      key={membership.id} 
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/teams/${membership.team_id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{membership.teams?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {membership.teams?.sports?.name} • {membership.teams?.level}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {membership.jersey_number && (
                          <Badge variant="outline" className="text-lg font-bold">
                            #{membership.jersey_number}
                          </Badge>
                        )}
                        {membership.position && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {membership.position}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You're not on any teams yet.</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/join')}>
                    Join a Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Upcoming Schedule
              </CardTitle>
              <CardDescription>Your next games and practices</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="p-2 rounded bg-green-500/10">
                        <Calendar className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), 'EEE, MMM d • h:mm a')}
                        </div>
                        {event.venue_name && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.venue_name}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {event.event_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-yellow-500" />
              Achievements & Stats
            </CardTitle>
            <CardDescription>Track your progress and accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Achievements tracking coming soon!</p>
              <p className="text-sm">Your stats and accomplishments will appear here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
