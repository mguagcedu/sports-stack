import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DepthChartEditor } from './DepthChartEditor';
import { Calendar, Users, Star, AlertTriangle, HeartPulse } from 'lucide-react';
import { format } from 'date-fns';

interface GameDayRosterManagerProps {
  teamId: string;
  sportCode?: string;
}

export function GameDayRosterManager({ teamId, sportCode }: GameDayRosterManagerProps) {
  const [activeTab, setActiveTab] = useState('depth-chart');

  // Fetch roster summary
  const { data: rosterSummary } = useQuery({
    queryKey: ['roster-summary', teamId],
    queryFn: async (): Promise<{ totalPlayers: number; starters: number; injured: number; disciplined: number; available: number }> => {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('id, is_starter, role')
        .eq('team_id', teamId)
        .eq('role', 'athlete');
      if (error) throw error;
      
      const { data: injuries } = await supabase
        .from('player_injuries')
        .select('id')
        .eq('team_id', teamId)
        .not('status', 'in', '("cleared","recovered")');
      
      const { data: disciplines } = await supabase
        .from('player_disciplines')
        .select('id')
        .eq('team_id', teamId)
        .eq('status', 'active');
      
      const starters = (members || []).filter((m: any) => m.is_starter).length;
      
      return {
        totalPlayers: members?.length || 0,
        starters,
        injured: injuries?.length || 0,
        disciplined: disciplines?.length || 0,
        available: (members?.length || 0) - (injuries?.length || 0) - (disciplines?.length || 0),
      };
    },
  });

  // Fetch upcoming game
  const { data: upcomingGame } = useQuery({
    queryKey: ['upcoming-game', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('event_type', 'game')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Game Day Header */}
      {upcomingGame && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Next Game
                </CardTitle>
                <CardDescription>
                  {format(new Date(upcomingGame.start_time), "EEEE, MMMM d 'at' h:mm a")}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {upcomingGame.name}
              </Badge>
            </div>
          </CardHeader>
          {upcomingGame.venue_name && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                📍 {upcomingGame.venue_name}
              </p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Roster Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Roster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rosterSummary?.totalPlayers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Starters Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rosterSummary?.starters || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-red-500" />
              Injured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{rosterSummary?.injured || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rosterSummary?.available || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="depth-chart">Depth Chart</TabsTrigger>
          <TabsTrigger value="starters">Starting Lineup</TabsTrigger>
        </TabsList>

        <TabsContent value="depth-chart" className="mt-4">
          <DepthChartEditor teamId={teamId} sportCode={sportCode} />
        </TabsContent>

        <TabsContent value="starters" className="mt-4">
          <StartersDisplay teamId={teamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-component for starters display
function StartersDisplay({ teamId }: { teamId: string }) {
  const { data: starters = [], isLoading } = useQuery({
    queryKey: ['starters', teamId],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, jersey_number, position')
        .eq('team_id', teamId)
        .eq('is_starter', true)
        .eq('role', 'athlete')
        .order('position');
      if (error) throw error;
      
      const userIds = (data || []).map(m => m.user_id).filter(Boolean) as string[];
      if (userIds.length === 0) return data || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return (data || []).map(m => ({
        ...m,
        profiles: m.user_id ? profileMap.get(m.user_id) : null
      }));
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (starters.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No starters selected yet</p>
          <p className="text-sm">Use the Depth Chart tab to set your starting lineup</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {starters.map((starter: any) => (
        <Card key={starter.id} className="bg-primary/5 border-primary/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold">
                {starter.jersey_number || '?'}
              </div>
              <div>
                <p className="font-medium">
                  {starter.profiles?.first_name} {starter.profiles?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{starter.position || 'Position TBD'}</p>
              </div>
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 ml-auto" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
