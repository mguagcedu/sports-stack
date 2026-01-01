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
  Target,
  Medal,
  IdCard,
  Star,
  Package,
  FileText,
  Ticket,
  ExternalLink,
  Award,
  Crown,
  Sparkles,
  Shield,
  Flame,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AccessRequestCard } from '@/components/access/AccessRequestCard';
import { SportsCard } from '@/components/sports-cards';

// Icon map for badge icons
const getBadgeIcon = (iconName: string | null): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    crown: <Crown className="h-4 w-4" />,
    star: <Star className="h-4 w-4" />,
    trophy: <Trophy className="h-4 w-4" />,
    sparkles: <Sparkles className="h-4 w-4" />,
    shield: <Shield className="h-4 w-4" />,
    flame: <Flame className="h-4 w-4" />,
    'trending-up': <TrendingUp className="h-4 w-4" />,
    medal: <Medal className="h-4 w-4" />,
  };
  return iconMap[iconName || ''] || <Award className="h-4 w-4" />;
};

export default function AthleteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch athlete's profile
  const { data: profile } = useQuery({
    queryKey: ['athlete-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

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
            id, name, level, gender, sport_key, school_id,
            sports(name, icon),
            seasons(name),
            organizations(name),
            schools(id, district_id, finalforms_enabled, finalforms_portal_url, gofan_enabled, gofan_school_url)
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'athlete');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch athlete data for the first team
  const firstTeam = myTeams?.[0];
  const { data: athleteData } = useQuery({
    queryKey: ['athlete-data', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Build card data for preview
  const myCardData = firstTeam && profile ? {
    id: firstTeam.id,
    firstName: profile.first_name || 'Player',
    lastName: profile.last_name || '',
    photoUrl: profile.card_photo_url || profile.photo_url || profile.avatar_url || null,
    teamName: firstTeam.teams?.name || 'Team',
    sportKey: firstTeam.teams?.sport_key || '',
    sportName: firstTeam.teams?.sports?.name || 'Sport',
    seasonLabel: '2025-26',
    jerseyNumber: firstTeam.jersey_number ? parseInt(firstTeam.jersey_number) : undefined,
    positions: firstTeam.position ? [{ id: '1', position_key: firstTeam.position, display_name: firstTeam.position, is_primary: true }] : [],
    lineGroups: [],
    gradYear: athleteData?.grad_year || null,
    height: athleteData?.height || null,
    weight: athleteData?.weight || null,
    role: 'player' as const,
    badges: firstTeam.is_captain ? [{ key: 'captain', label: 'Captain' }] : [],
    backgroundStyle: 'classic' as const,
  } : null;

  // Check for GoFan/FinalForms integrations
  const schoolSettings = firstTeam?.teams?.schools;
  const hasFinalForms = schoolSettings?.finalforms_enabled && schoolSettings?.finalforms_portal_url;
  const hasGoFan = schoolSettings?.gofan_enabled && schoolSettings?.gofan_school_url;

  // Fetch athlete's ratings
  const { data: ratings } = useQuery({
    queryKey: ['athlete-ratings', user?.id],
    queryFn: async () => {
      if (!user || !myTeams) return [];
      const memberIds = myTeams.map(t => t.id);
      if (memberIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('player_ratings')
        .select('*')
        .in('team_member_id', memberIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myTeams && myTeams.length > 0
  });

  // Fetch achievements
  const { data: achievements } = useQuery({
    queryKey: ['athlete-achievements', user?.id],
    queryFn: async () => {
      if (!user || !myTeams) return [];
      const memberIds = myTeams.map(t => t.id);
      if (memberIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('player_achievements')
        .select('*')
        .in('team_member_id', memberIds)
        .eq('is_public', true)
        .order('achievement_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!myTeams && myTeams.length > 0
  });

  // Fetch player badges (awards)
  const { data: playerBadges } = useQuery({
    queryKey: ['athlete-badges', user?.id],
    queryFn: async () => {
      if (!user || !myTeams) return [];
      const memberIds = myTeams.map(t => t.id);
      if (memberIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('player_badges')
        .select(`
          *,
          badge_definitions(display_name, icon, category, description)
        `)
        .in('team_member_id', memberIds)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!myTeams && myTeams.length > 0
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

  // Get latest overall rating
  const latestRating = ratings?.[0];

  return (
    <DashboardLayout title="Athlete Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hey{profile?.first_name ? `, ${profile.first_name}` : ''}! 💪
            </h1>
            <p className="text-muted-foreground">
              Ready to crush it today? Here's your athletic overview.
            </p>
          </div>
          <Button onClick={() => navigate('/sports-cards')} variant="outline">
            <IdCard className="h-4 w-4 mr-2" />
            View My Card
          </Button>
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
                  <Star className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{latestRating?.overall_rating || '-'}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
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
                  <p className="text-2xl font-bold">{achievements?.length || 0}</p>
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

        {/* Sports Cards Quick Access */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" />
              Your Sports Card
            </CardTitle>
            <CardDescription>View and share your personalized trading card</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Card Preview */}
              {myCardData && (
                <div 
                  className="cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => navigate('/sports-cards')}
                >
                  <SportsCard data={myCardData} size="small" showDetails={false} />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <p className="text-muted-foreground">
                  {myTeams?.length || 0} card{myTeams?.length !== 1 ? 's' : ''} available
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate('/sports-cards')}>
                    <IdCard className="h-4 w-4 mr-2" />
                    View All Cards
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/settings')}>
                    Edit Card Photo
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance & Ticketing */}
        {(hasFinalForms || hasGoFan) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Forms & Tickets
              </CardTitle>
              <CardDescription>Quick access to eligibility and ticketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {hasFinalForms && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    asChild
                  >
                    <a 
                      href={schoolSettings.finalforms_portal_url!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <div className="flex items-center gap-2 text-primary">
                        <FileText className="h-5 w-5" />
                        <span className="font-semibold">Forms & Eligibility</span>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </div>
                      <span className="text-sm text-muted-foreground font-normal">
                        Complete required forms on FinalForms
                      </span>
                    </a>
                  </Button>
                )}

                {hasGoFan && (
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col items-start gap-2"
                    asChild
                  >
                    <a 
                      href={schoolSettings.gofan_school_url!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <div className="flex items-center gap-2 text-primary">
                        <Ticket className="h-5 w-5" />
                        <span className="font-semibold">Buy Tickets</span>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </div>
                      <span className="text-sm text-muted-foreground font-normal">
                        Purchase game tickets on GoFan
                      </span>
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements & Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-yellow-500" />
              Achievements & Awards
            </CardTitle>
            <CardDescription>Your badges, achievements, and awards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Badges Section */}
            {playerBadges && playerBadges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Awarded Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {playerBadges.map((badge: any) => (
                    <Badge 
                      key={badge.id} 
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1.5"
                    >
                      {getBadgeIcon(badge.badge_definitions?.icon)}
                      <span>{badge.badge_definitions?.display_name}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements Section */}
            {achievements && achievements.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Achievements
                </h4>
                <div className="space-y-3">
                  {achievements.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.title}</span>
                          <Badge variant="outline" className="text-xs">{a.achievement_type}</Badge>
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{a.achievement_date}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : !playerBadges?.length && (
              <div className="text-center py-8 text-muted-foreground">
                <Medal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No achievements or badges yet!</p>
                <p className="text-sm">Keep working hard and they'll come.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Access Request */}
        <AccessRequestCard
          title="Equipment Room Access"
          description="Request access to check out and manage team equipment"
          requiredRole="equipment_manager"
          pageKey="/equipment"
          icon={<Package className="h-5 w-5 text-muted-foreground" />}
        />
      </div>
    </DashboardLayout>
  );
}
