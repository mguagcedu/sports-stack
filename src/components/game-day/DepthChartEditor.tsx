import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createNotification, createBulkNotifications } from '@/hooks/useNotifications';
import { Users, Star, ChevronUp, ChevronDown, Save, Send, Loader2 } from 'lucide-react';

interface DepthChartEditorProps {
  teamId: string;
  sportCode?: string;
}

interface DepthEntry {
  position: string;
  depth_order: number;
  team_member_id: string;
  member_name: string;
  jersey_number: string;
  is_starter: boolean;
}

export function DepthChartEditor({ teamId, sportCode }: DepthChartEditorProps) {
  const queryClient = useQueryClient();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch team members with positions
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members-depth', teamId],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, jersey_number, position, depth_order, is_starter, role')
        .eq('team_id', teamId)
        .eq('role', 'athlete')
        .order('depth_order', { ascending: true });
      if (error) throw error;
      
      const memberIds = (data || []).map(m => m.user_id).filter(Boolean) as string[];
      if (memberIds.length === 0) return data || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', memberIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return (data || []).map(m => ({
        ...m,
        profiles: m.user_id ? profileMap.get(m.user_id) : null,
      }));
    },
  });

  // Fetch positions for sport
  const { data: sportPositions = [] } = useQuery({
    queryKey: ['sport-positions', sportCode],
    queryFn: async (): Promise<any[]> => {
      if (!sportCode) return [];
      const result = await (supabase as any)
        .from('sport_positions')
        .select('id, position_name, display_order')
        .eq('sport_code', sportCode.toLowerCase())
        .order('display_order');
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!sportCode,
  });

  // Group members by position
  const membersByPosition = teamMembers.reduce((acc: Record<string, any[]>, member: any) => {
    const pos = member.position || 'Unassigned';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(member);
    return acc;
  }, {});

  // Get unique positions
  const positions = sportPositions.length > 0 
    ? sportPositions.map((p: any) => p.position_name)
    : Object.keys(membersByPosition);

  // Update depth order mutation
  const updateDepthMutation = useMutation({
    mutationFn: async ({ memberId, depthOrder, isStarter }: { memberId: string; depthOrder: number; isStarter?: boolean }) => {
      const updateData: any = { depth_order: depthOrder };
      if (isStarter !== undefined) {
        updateData.is_starter = isStarter;
      }
      
      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members-depth', teamId] });
      setHasChanges(true);
    },
  });

  // Save and publish depth chart
  const publishRosterMutation = useMutation({
    mutationFn: async () => {
      // Get all starters
      const starters = teamMembers.filter((m: any) => m.is_starter && m.user_id);
      
      // Notify new starters
      if (starters.length > 0) {
        const starterUserIds = starters.map((s: any) => s.user_id);
        await createBulkNotifications(starterUserIds, {
          title: '🌟 Starting Lineup!',
          message: `Congratulations! You've been selected as a starter for the upcoming game.`,
          type: 'success',
          category: 'game_day',
          reference_type: 'depth_chart',
        });
      }
      
      // Notify all team athletes about published roster
      const allAthletes = teamMembers.filter((m: any) => m.user_id);
      if (allAthletes.length > 0) {
        const athleteUserIds = allAthletes.map((a: any) => a.user_id);
        await createBulkNotifications(athleteUserIds, {
          title: '📋 Roster Published',
          message: `The game day roster has been published. Check your position!`,
          type: 'info',
          category: 'game_day',
          reference_type: 'depth_chart',
        });
      }
    },
    onSuccess: () => {
      toast.success('Roster published! Team has been notified.');
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to publish roster');
    },
  });

  const moveUp = (member: any, positionMembers: any[]) => {
    const idx = positionMembers.findIndex(m => m.id === member.id);
    if (idx <= 0) return;
    
    const prevMember = positionMembers[idx - 1];
    updateDepthMutation.mutate({ memberId: member.id, depthOrder: member.depth_order - 1 });
    updateDepthMutation.mutate({ memberId: prevMember.id, depthOrder: prevMember.depth_order + 1 });
  };

  const moveDown = (member: any, positionMembers: any[]) => {
    const idx = positionMembers.findIndex(m => m.id === member.id);
    if (idx >= positionMembers.length - 1) return;
    
    const nextMember = positionMembers[idx + 1];
    updateDepthMutation.mutate({ memberId: member.id, depthOrder: member.depth_order + 1 });
    updateDepthMutation.mutate({ memberId: nextMember.id, depthOrder: nextMember.depth_order - 1 });
  };

  const toggleStarter = (member: any) => {
    updateDepthMutation.mutate({ 
      memberId: member.id, 
      depthOrder: member.depth_order,
      isStarter: !member.is_starter 
    });
  };

  if (loadingMembers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Depth Chart Editor
          </h2>
          <p className="text-sm text-muted-foreground">
            Arrange players by position and set starters
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={() => publishRosterMutation.mutate()}
            disabled={publishRosterMutation.isPending}
          >
            {publishRosterMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Roster
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {positions.map((position) => {
          const positionMembers = (membersByPosition[position] || []).sort(
            (a: any, b: any) => (a.depth_order || 99) - (b.depth_order || 99)
          );
          
          return (
            <Card key={position}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{position}</CardTitle>
                <CardDescription className="text-xs">
                  {positionMembers.length} player{positionMembers.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                {positionMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No players assigned
                  </p>
                ) : (
                  <div className="space-y-2">
                    {positionMembers.map((member: any, idx: number) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          member.is_starter ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveUp(member, positionMembers)}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveDown(member, positionMembers)}
                              disabled={idx === positionMembers.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs px-1">
                                #{member.jersey_number || '-'}
                              </Badge>
                              <span className="text-sm font-medium">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Depth: {idx + 1}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant={member.is_starter ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleStarter(member)}
                          className="h-7"
                        >
                          <Star className={`h-3 w-3 mr-1 ${member.is_starter ? 'fill-current' : ''}`} />
                          {member.is_starter ? 'Starter' : 'Set'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {positions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No players on roster yet</p>
            <p className="text-sm">Add players to the team to manage the depth chart</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
