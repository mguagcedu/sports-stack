import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Bell,
  FileText,
  Clock,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch family accounts (children)
  const { data: children } = useQuery({
    queryKey: ['family-children', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('family_accounts')
        .select(`
          id,
          relationship,
          child_id
        `)
        .eq('parent_id', user.id);
      
      if (error) throw error;
      
      // Fetch child profiles
      if (data && data.length > 0) {
        const childIds = data.map(f => f.child_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', childIds);
        
        return data.map(f => ({
          ...f,
          profile: profiles?.find(p => p.id === f.child_id)
        }));
      }
      return data;
    },
    enabled: !!user
  });

  // Fetch pending registrations
  const { data: pendingRegistrations } = useQuery({
    queryKey: ['parent-pending-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          teams(name, sports(name))
        `)
        .eq('parent_user_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch upcoming events
  const { data: upcomingEvents } = useQuery({
    queryKey: ['parent-upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time')
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <DashboardLayout title="Parent Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Stay updated on your children's activities and upcoming events.
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
                  <p className="text-2xl font-bold">{children?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Children</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRegistrations?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
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
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Bell className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Children */}
          <Card>
            <CardHeader>
              <CardTitle>My Children</CardTitle>
              <CardDescription>Manage your children's activities and registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {children && children.length > 0 ? (
                <div className="space-y-3">
                  {children.map((child: any) => (
                    <div 
                      key={child.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {child.profile?.first_name?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {child.profile?.first_name} {child.profile?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {child.relationship || 'Child'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No children linked to your account yet.</p>
                  <Button variant="outline" className="mt-4">
                    Link a Child
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Games, practices, and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="p-2 rounded bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), 'MMM d, h:mm a')}
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

        {/* Pending Actions */}
        {pendingRegistrations && pendingRegistrations.length > 0 && (
          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Pending Registrations
              </CardTitle>
              <CardDescription>Registrations awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRegistrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                    <div>
                      <p className="font-medium">{reg.teams?.name}</p>
                      <p className="text-sm text-muted-foreground">{reg.teams?.sports?.name}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate('/registrations')}>
              <FileText className="mr-2 h-4 w-4" />
              View Registrations
            </Button>
            <Button variant="outline" onClick={() => navigate('/events')}>
              <Calendar className="mr-2 h-4 w-4" />
              View Events
            </Button>
            <Button variant="outline" onClick={() => navigate('/payments')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment History
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
