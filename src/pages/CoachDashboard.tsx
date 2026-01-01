import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentSeason, getCurrentSchoolYear, getSeasonYearLabel, SEASON_LABELS, SportSeasonType } from '@/lib/seasonUtils';
import { AddPlayerDialog } from '@/components/coach/AddPlayerDialog';
import { AttendanceTracker } from '@/components/coach/AttendanceTracker';
import { PlayerRatingDialog } from '@/components/coach/PlayerRatingDialog';
import { 
  Users, 
  Calendar, 
  Trophy, 
  ClipboardList, 
  Plus, 
  UserPlus,
  Mail,
  Phone,
  Loader2,
  Activity,
  Info,
  Star,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { InjuryManager, DisciplineManager } from '@/components/roster';

interface Sport {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
  gender: string | null;
}

interface Team {
  id: string;
  name: string;
  level: string | null;
  gender: string | null;
  max_roster_size: number | null;
  is_active: boolean;
  season: SportSeasonType | null;
  school_year: number | null;
  season_year_label: string | null;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  
  // Smart defaults based on current date
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const currentSchoolYear = useMemo(() => getCurrentSchoolYear(), []);
  
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<SportSeasonType | 'all'>(currentSeason);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<number>(currentSchoolYear);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [ratingPlayer, setRatingPlayer] = useState<{ id: string; name: string } | null>(null);

  // Fetch sports
  const { data: sports, isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Sport[];
    }
  });

  // Available school years (previous 2, current, next 2)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let i = 2; i > 0; i--) years.push(currentSchoolYear - i);
    years.push(currentSchoolYear);
    for (let i = 1; i <= 2; i++) years.push(currentSchoolYear + i);
    return years;
  }, [currentSchoolYear]);

  // Fetch teams - don't filter by season/year if they're not set on teams yet
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['coach-teams', selectedSportId, selectedSeason, selectedSchoolYear],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (selectedSportId) {
        query = query.eq('sport_id', selectedSportId);
      }
      // Only filter by season/year if not "all" - teams may not have these set yet
      if (selectedSeason !== 'all') {
        query = query.or(`season.eq.${selectedSeason},season.is.null`);
      }
      // Don't filter by school_year if teams don't have it set
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Team[];
    },
  });

  // Auto-select first team when list changes
  useEffect(() => {
    if (teams?.length && !teams.find(t => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);

  // Fetch actual roster data from team_members table
  const { data: rosterData = [], isLoading: rosterLoading } = useQuery({
    queryKey: ['team-roster', selectedTeamId],
    enabled: !!selectedTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, role, jersey_number, position, is_captain, eligibility_status')
        .eq('team_id', selectedTeamId!);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for roster members
  const rosterUserIds = rosterData.map(m => m.user_id);
  const { data: rosterProfiles = [] } = useQuery({
    queryKey: ['roster-profiles', rosterUserIds],
    enabled: rosterUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', rosterUserIds);
      if (error) throw error;
      return data || [];
    },
  });

  // Build roster with profile data
  const roster = useMemo(() => {
    return rosterData
      .filter(m => m.role === 'athlete')
      .map(m => {
        const profile = rosterProfiles.find(p => p.id === m.user_id);
        return {
          id: m.id,
          name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown' : 'Unknown',
          number: m.jersey_number ? parseInt(m.jersey_number) : null,
          position: m.position || '-',
          grade: '-',
          status: m.eligibility_status || 'unknown',
        };
      });
  }, [rosterData, rosterProfiles]);

  // Mock schedule data
  const mockSchedule = [
    { id: '1', opponent: 'Lincoln High', date: '2025-01-15', time: '7:00 PM', location: 'Home', type: 'Game' },
    { id: '2', opponent: 'Washington Prep', date: '2025-01-18', time: '6:30 PM', location: 'Away', type: 'Game' },
    { id: '3', opponent: 'Practice', date: '2025-01-20', time: '3:30 PM', location: 'Gym', type: 'Practice' },
  ];

  return (
    <DashboardLayout title="Coach Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Header with Selectors */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Coach Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your teams, rosters, and schedules
            </p>
          </div>
        </div>

        {/* Season/Year Filter Bar with Helper Text */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Showing teams for the current season based on today's date. You can filter by different seasons or years.
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sport</label>
                <Select 
                  value={selectedSportId || "all"} 
                  onValueChange={(value) => {
                    setSelectedSportId(value === "all" ? "" : value);
                    setSelectedTeamId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {sports?.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name} {sport.gender && `(${sport.gender})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Season</label>
                <Select 
                  value={selectedSeason} 
                  onValueChange={(value) => {
                    setSelectedSeason(value as SportSeasonType | 'all');
                    setSelectedTeamId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    {(['fall', 'winter', 'spring', 'summer', 'year_round'] as SportSeasonType[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          {SEASON_LABELS[s]}
                          {s === currentSeason && <Badge variant="default" className="text-xs h-5">Current</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">School Year</label>
                <Select 
                  value={selectedSchoolYear.toString()} 
                  onValueChange={(value) => {
                    setSelectedSchoolYear(parseInt(value));
                    setSelectedTeamId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        <span className="flex items-center gap-2">
                          {getSeasonYearLabel(year)}
                          {year === currentSchoolYear && <Badge variant="default" className="text-xs h-5">Current</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select 
                  value={selectedTeamId || "none"} 
                  onValueChange={(value) => setSelectedTeamId(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a team</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} {team.level && `(${team.level})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedTeam ? roster.length : '-'}</p>
                  <p className="text-sm text-muted-foreground">Roster Size</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedTeam ? roster.filter(r => r.status === 'cleared' || r.status === 'unknown').length : '-'}</p>
                  <p className="text-sm text-muted-foreground">Active Players</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedTeam ? mockSchedule.filter(s => s.type === 'Game').length : '-'}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Games</p>
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
                  <p className="text-sm text-muted-foreground">Win/Loss</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        {selectedTeam ? (
          <Tabs defaultValue="roster" className="space-y-4">
            <TabsList>
              <TabsTrigger value="roster" className="gap-2">
                <Users className="h-4 w-4" />
                Roster
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="injuries" className="gap-2">
                <Heart className="h-4 w-4" />
                Injuries
              </TabsTrigger>
              <TabsTrigger value="discipline" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Discipline
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roster">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Roster</CardTitle>
                    <CardDescription>{selectedTeam.name}</CardDescription>
                  </div>
                  <Button onClick={() => setAddPlayerOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Player
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>#</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roster.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No players on this roster yet. Add players to get started.
                          </TableCell>
                        </TableRow>
                      ) : roster.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{player.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{player.number}</TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell>{player.grade}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={player.status === 'cleared' ? 'default' : player.status === 'not_cleared' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {player.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setRatingPlayer({ id: player.id, name: player.name })}
                                title="Rate Player"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Phone className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Schedule</CardTitle>
                    <CardDescription>Upcoming games and practices</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Opponent/Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSchedule.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <Badge variant={event.type === 'Game' ? 'default' : 'secondary'}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{event.opponent}</TableCell>
                          <TableCell>{event.date}</TableCell>
                          <TableCell>{event.time}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.location}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceTracker 
                teamId={selectedTeamId} 
                teamName={selectedTeam.name}
              />
            </TabsContent>

            <TabsContent value="injuries">
              <InjuryManager teamId={selectedTeamId} />
            </TabsContent>

            <TabsContent value="discipline">
              <DisciplineManager teamId={selectedTeamId} sportCode="general" />
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Trophy className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Team</h3>
                <p className="text-sm">
                  Choose a sport, season, and team above to view your roster and schedule
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        {selectedTeam && (
          <AddPlayerDialog
            open={addPlayerOpen}
            onOpenChange={setAddPlayerOpen}
            teamId={selectedTeamId}
            teamName={selectedTeam.name}
          />
        )}
        
        {ratingPlayer && (
          <PlayerRatingDialog
            open={!!ratingPlayer}
            onOpenChange={(open) => !open && setRatingPlayer(null)}
            teamMemberId={ratingPlayer.id}
            playerName={ratingPlayer.name}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
