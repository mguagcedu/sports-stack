import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  Award, 
  Plus,
  Trash2,
  Loader2,
  Star,
  Trophy,
  Crown,
  Sparkles,
  GraduationCap,
  Shield,
  Flame,
  TrendingUp,
  Target,
  Users,
  Zap,
  Book,
  ShieldCheck
} from 'lucide-react';

interface BadgeManagerProps {
  teamId: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  crown: <Crown className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  trophy: <Trophy className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  'graduation-cap': <GraduationCap className="h-4 w-4" />,
  book: <Book className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  'shield-check': <ShieldCheck className="h-4 w-4" />,
  flame: <Flame className="h-4 w-4" />,
  'trending-up': <TrendingUp className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
};

export function BadgeManager({ teamId }: BadgeManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-badges', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, jersey_number, position, role, profiles(first_name, last_name)')
        .eq('team_id', teamId)
        .eq('role', 'athlete');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch badge definitions
  const { data: badgeDefinitions = [] } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_assignable', true)
        .order('category', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch player badges for this team
  const { data: playerBadges = [], isLoading } = useQuery({
    queryKey: ['player-badges', teamId],
    queryFn: async () => {
      const memberIds = teamMembers.map(m => m.id);
      if (memberIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('player_badges')
        .select(`
          *,
          badge_definitions(*),
          team_members(
            id, jersey_number,
            profiles(first_name, last_name)
          )
        `)
        .in('team_member_id', memberIds)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: teamMembers.length > 0,
  });

  // Add badge mutation
  const addBadgeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('player_badges')
        .insert({
          team_member_id: selectedMemberId,
          badge_definition_id: selectedBadgeId,
          awarded_by_user_id: user?.id,
          notes,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-badges'] });
      toast.success('Badge awarded!');
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('This player already has this badge');
      } else {
        toast.error(error.message || 'Failed to award badge');
      }
    },
  });

  // Remove badge mutation
  const removeBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase
        .from('player_badges')
        .delete()
        .eq('id', badgeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-badges'] });
      toast.success('Badge removed');
    },
  });

  const resetForm = () => {
    setSelectedMemberId('');
    setSelectedBadgeId('');
    setNotes('');
  };

  // Group badges by player
  const badgesByPlayer = playerBadges.reduce((acc: any, badge: any) => {
    const playerId = badge.team_member_id;
    if (!acc[playerId]) {
      acc[playerId] = {
        player: badge.team_members,
        badges: [],
      };
    }
    acc[playerId].badges.push(badge);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Player Badges
          </h2>
          <p className="text-sm text-muted-foreground">
            Award and manage player achievements
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Award Badge
        </Button>
      </div>

      {/* Badges by Player */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : Object.keys(badgesByPlayer).length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No badges awarded yet</p>
              <p className="text-sm">Start recognizing your players' achievements</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(badgesByPlayer).map(([playerId, data]: [string, any]) => (
            <Card key={playerId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="font-bold">
                    #{data.player?.jersey_number || '-'}
                  </Badge>
                  {data.player?.profiles?.first_name} {data.player?.profiles?.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.badges.map((badge: any) => (
                    <div 
                      key={badge.id} 
                      className="group relative"
                    >
                      <Badge 
                        variant="secondary" 
                        className="flex items-center gap-1 pr-6"
                      >
                        {ICON_MAP[badge.badge_definitions?.icon] || <Award className="h-3 w-3" />}
                        {badge.badge_definitions?.display_name}
                        <button
                          onClick={() => removeBadgeMutation.mutate(badge.id)}
                          className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Available Badges Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Badges</CardTitle>
          <CardDescription>Badges you can award to players</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {badgeDefinitions.map((badge: any) => (
              <Badge 
                key={badge.id} 
                variant="outline"
                className="flex items-center gap-1"
              >
                {ICON_MAP[badge.icon] || <Award className="h-3 w-3" />}
                {badge.display_name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Badge Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Badge</DialogTitle>
            <DialogDescription>
              Recognize a player with an achievement badge
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      #{member.jersey_number || '-'} {member.profiles?.first_name} {member.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Badge</Label>
              <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge" />
                </SelectTrigger>
                <SelectContent>
                  {badgeDefinitions.map((badge: any) => (
                    <SelectItem key={badge.id} value={badge.id}>
                      <div className="flex items-center gap-2">
                        {ICON_MAP[badge.icon] || <Award className="h-4 w-4" />}
                        <span>{badge.display_name}</span>
                        <span className="text-muted-foreground text-xs">({badge.category})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why is this player receiving this badge?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addBadgeMutation.mutate()}
              disabled={!selectedMemberId || !selectedBadgeId || addBadgeMutation.isPending}
            >
              {addBadgeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Award Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}