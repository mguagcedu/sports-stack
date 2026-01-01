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
import { createNotification } from '@/hooks/useNotifications';
import { 
  ThumbsUp, 
  Plus,
  Loader2,
  Star,
  Trophy,
  Target,
  Flame,
  Heart,
  Sparkles,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

interface PraiseManagerProps {
  teamId: string;
}

const PRAISE_TYPES = [
  { value: 'great_practice', label: 'Great Practice', icon: 'flame', category: 'effort' },
  { value: 'game_mvp', label: 'Game MVP', icon: 'trophy', category: 'performance' },
  { value: 'most_improved', label: 'Most Improved', icon: 'trending-up', category: 'growth' },
  { value: 'leadership', label: 'Leadership', icon: 'star', category: 'character' },
  { value: 'teamwork', label: 'Great Teamwork', icon: 'heart', category: 'character' },
  { value: 'hustle', label: 'Hustle Award', icon: 'zap', category: 'effort' },
  { value: 'sportsmanship', label: 'Sportsmanship', icon: 'sparkles', category: 'character' },
  { value: 'academic', label: 'Academic Excellence', icon: 'book', category: 'academic' },
  { value: 'clutch', label: 'Clutch Performance', icon: 'target', category: 'performance' },
  { value: 'other', label: 'Custom Praise', icon: 'thumbs-up', category: 'other' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  flame: <Flame className="h-4 w-4 text-orange-500" />,
  trophy: <Trophy className="h-4 w-4 text-yellow-500" />,
  star: <Star className="h-4 w-4 text-yellow-500" />,
  heart: <Heart className="h-4 w-4 text-pink-500" />,
  zap: <Zap className="h-4 w-4 text-blue-500" />,
  sparkles: <Sparkles className="h-4 w-4 text-purple-500" />,
  target: <Target className="h-4 w-4 text-green-500" />,
  'thumbs-up': <ThumbsUp className="h-4 w-4 text-primary" />,
  'trending-up': <Flame className="h-4 w-4 text-green-500" />,
  book: <Star className="h-4 w-4 text-blue-500" />,
};

export function PraiseManager({ teamId }: PraiseManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [praiseType, setPraiseType] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members-for-praise', teamId],
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

  // Fetch praises
  const { data: praises = [], isLoading } = useQuery({
    queryKey: ['team-praises', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_praises')
        .select(`
          *,
          team_members(
            id, jersey_number, position,
            profiles(first_name, last_name)
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Add praise mutation
  const addPraiseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('player_praises')
        .insert({
          team_member_id: selectedMemberId,
          team_id: teamId,
          praise_type: praiseType,
          notes,
          is_public: isPublic,
          given_by_user_id: user?.id,
        });
      if (error) throw error;

      // Get the team member's user_id
      const member = teamMembers.find((m: any) => m.id === selectedMemberId) as any;
      
      // Send notification to player
      if (member?.user_id) {
        const praiseConfig = PRAISE_TYPES.find(p => p.value === praiseType);
        await createNotification({
          user_id: member.user_id,
          title: '🌟 You received praise!',
          message: `Your coach recognized you for: ${praiseConfig?.label || 'Great work'}${notes ? ` - "${notes}"` : ''}`,
          type: 'success',
          category: 'recognition',
          reference_type: 'praise',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-praises'] });
      toast.success('Praise sent!');
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send praise');
    },
  });

  const resetForm = () => {
    setSelectedMemberId('');
    setPraiseType('');
    setNotes('');
    setIsPublic(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            Player Recognition
          </h2>
          <p className="text-sm text-muted-foreground">
            Recognize and motivate your players with praise
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Give Praise
        </Button>
      </div>

      {/* Recent Praises */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Recognition</CardTitle>
          <CardDescription>Praise and recognition given to players</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : praises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No praise given yet</p>
              <p className="text-sm">Start recognizing your players' great work!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {praises.map((praise: any) => {
                const praiseConfig = PRAISE_TYPES.find(p => p.value === praise.praise_type);
                return (
                  <div 
                    key={praise.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-gradient-to-r from-green-500/5 to-transparent"
                  >
                    <div className="p-2 rounded-full bg-green-500/10">
                      {ICON_MAP[praiseConfig?.icon || 'thumbs-up']}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {praise.team_members?.profiles?.first_name} {praise.team_members?.profiles?.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          #{praise.team_members?.jersey_number || '-'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {praiseConfig?.label || praise.praise_type}
                      </p>
                      {praise.notes && (
                        <p className="text-sm text-muted-foreground mt-1">"{praise.notes}"</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {format(new Date(praise.created_at), 'MMM d')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Praise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Give Praise</DialogTitle>
            <DialogDescription>
              Recognize a player for their great work
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
              <Label>Recognition Type</Label>
              <Select value={praiseType} onValueChange={setPraiseType}>
                <SelectTrigger>
                  <SelectValue placeholder="What are you recognizing?" />
                </SelectTrigger>
                <SelectContent>
                  {PRAISE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {ICON_MAP[type.icon]}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a personal message..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isPublic" className="cursor-pointer text-sm font-normal">
                Show on team feed
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addPraiseMutation.mutate()}
              disabled={!selectedMemberId || !praiseType || addPraiseMutation.isPending}
            >
              {addPraiseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Praise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
