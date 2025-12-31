import { useState } from 'react';
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
  Activity
} from 'lucide-react';

interface Sport {
  id: string;
  name: string;
  code: string | null;
  icon: string | null;
  gender: string | null;
}

interface Season {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  academic_year: string | null;
}

interface Team {
  id: string;
  name: string;
  level: string | null;
  gender: string | null;
  max_roster_size: number | null;
  is_active: boolean;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

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

  // Fetch seasons
  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as Season[];
    }
  });

  // Fetch teams based on selected sport and season
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', selectedSportId, selectedSeasonId],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (selectedSportId) {
        query = query.eq('sport_id', selectedSportId);
      }
      if (selectedSeasonId) {
        query = query.eq('season_id', selectedSeasonId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Team[];
    },
    enabled: !!selectedSportId || !!selectedSeasonId
  });

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);

  // Mock roster data - in production this would come from a roster table
  const mockRoster = [
    { id: '1', name: 'John Smith', number: 12, position: 'Guard', grade: '11', status: 'active' },
    { id: '2', name: 'Mike Johnson', number: 23, position: 'Forward', grade: '12', status: 'active' },
    { id: '3', name: 'Chris Davis', number: 5, position: 'Center', grade: '10', status: 'active' },
    { id: '4', name: 'James Wilson', number: 15, position: 'Guard', grade: '11', status: 'injured' },
    { id: '5', name: 'Robert Brown', number: 33, position: 'Forward', grade: '12', status: 'active' },
  ];

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

        {/* Sport, Season, Team Selectors */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sport</label>
                <Select 
                  value={selectedSportId || "none"} 
                  onValueChange={(value) => {
                    setSelectedSportId(value === "none" ? "" : value);
                    setSelectedTeamId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a sport</SelectItem>
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
                  value={selectedSeasonId || "none"} 
                  onValueChange={(value) => {
                    setSelectedSeasonId(value === "none" ? "" : value);
                    setSelectedTeamId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a season</SelectItem>
                    {seasons?.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name} {season.is_active && '(Active)'}
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
                  disabled={!selectedSportId && !selectedSeasonId}
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
                  <p className="text-2xl font-bold">{selectedTeam ? mockRoster.length : '-'}</p>
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
                  <p className="text-2xl font-bold">{selectedTeam ? mockRoster.filter(r => r.status === 'active').length : '-'}</p>
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
            </TabsList>

            <TabsContent value="roster">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Roster</CardTitle>
                    <CardDescription>{selectedTeam.name}</CardDescription>
                  </div>
                  <Button>
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
                      {mockRoster.map((player) => (
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
                              variant={player.status === 'active' ? 'default' : 'destructive'}
                              className="capitalize"
                            >
                              {player.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
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
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Tracking</CardTitle>
                  <CardDescription>Track practice and game attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <div className="text-center">
                      <ClipboardList className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Attendance tracking coming soon</p>
                      <p className="text-sm">Select a date to take attendance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
      </div>
    </DashboardLayout>
  );
}
