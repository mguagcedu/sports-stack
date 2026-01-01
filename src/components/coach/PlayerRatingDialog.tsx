import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Star, Trophy, TrendingUp, Users, Target, Brain, Award } from 'lucide-react';

interface PlayerRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMemberId: string;
  playerName: string;
}

interface RatingCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const RATING_CATEGORIES: RatingCategory[] = [
  { key: 'skill_rating', label: 'Skill', icon: <Target className="h-4 w-4" />, description: 'Technical ability and execution' },
  { key: 'effort_rating', label: 'Effort', icon: <TrendingUp className="h-4 w-4" />, description: 'Work ethic and hustle' },
  { key: 'attitude_rating', label: 'Attitude', icon: <Star className="h-4 w-4" />, description: 'Positive mindset and sportsmanship' },
  { key: 'coachability_rating', label: 'Coachability', icon: <Brain className="h-4 w-4" />, description: 'Receptiveness to feedback' },
  { key: 'teamwork_rating', label: 'Teamwork', icon: <Users className="h-4 w-4" />, description: 'Collaboration and communication' },
  { key: 'game_iq_rating', label: 'Game IQ', icon: <Trophy className="h-4 w-4" />, description: 'Decision making and awareness' },
];

const LINE_OPTIONS = [
  { value: 'first', label: '1st Line / Starter' },
  { value: 'second', label: '2nd Line' },
  { value: 'third', label: '3rd Line' },
  { value: 'fourth', label: '4th Line' },
  { value: 'special_teams', label: 'Special Teams' },
  { value: 'practice_squad', label: 'Practice Squad' },
];

export function PlayerRatingDialog({ open, onOpenChange, teamMemberId, playerName }: PlayerRatingDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [ratings, setRatings] = useState<Record<string, number>>({
    overall_rating: 50,
    skill_rating: 50,
    effort_rating: 50,
    attitude_rating: 50,
    coachability_rating: 50,
    teamwork_rating: 50,
    game_iq_rating: 50,
  });
  const [currentLine, setCurrentLine] = useState<string>('');
  const [depthPosition, setDepthPosition] = useState<string>('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [notes, setNotes] = useState('');
  
  // Achievement form
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementType, setAchievementType] = useState('recognition');
  const [achievementDescription, setAchievementDescription] = useState('');

  // Fetch existing rating
  const { data: existingRating, isLoading } = useQuery({
    queryKey: ['player-rating', teamMemberId],
    enabled: open && !!teamMemberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_ratings')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['player-achievements', teamMemberId],
    enabled: open && !!teamMemberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_achievements')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('achievement_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingRating) {
      setRatings({
        overall_rating: existingRating.overall_rating || 50,
        skill_rating: existingRating.skill_rating || 50,
        effort_rating: existingRating.effort_rating || 50,
        attitude_rating: existingRating.attitude_rating || 50,
        coachability_rating: existingRating.coachability_rating || 50,
        teamwork_rating: existingRating.teamwork_rating || 50,
        game_iq_rating: existingRating.game_iq_rating || 50,
      });
      setCurrentLine(existingRating.current_line || '');
      setDepthPosition(existingRating.depth_position?.toString() || '');
      setStrengths(existingRating.strengths || '');
      setImprovements(existingRating.areas_for_improvement || '');
      setNotes(existingRating.coach_notes || '');
    }
  }, [existingRating]);

  // Calculate overall from categories
  useEffect(() => {
    const categories = RATING_CATEGORIES.map(c => ratings[c.key] || 50);
    const avg = Math.round(categories.reduce((a, b) => a + b, 0) / categories.length);
    setRatings(prev => ({ ...prev, overall_rating: avg }));
  }, [ratings.skill_rating, ratings.effort_rating, ratings.attitude_rating, ratings.coachability_rating, ratings.teamwork_rating, ratings.game_iq_rating]);

  const saveRatingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('player_ratings')
        .upsert({
          id: existingRating?.id,
          team_member_id: teamMemberId,
          rated_by_user_id: user?.id,
          ...ratings,
          current_line: currentLine || null,
          depth_position: depthPosition ? parseInt(depthPosition) : null,
          strengths: strengths || null,
          areas_for_improvement: improvements || null,
          coach_notes: notes || null,
          rating_date: new Date().toISOString().split('T')[0],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Player rating saved');
      queryClient.invalidateQueries({ queryKey: ['player-rating', teamMemberId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save rating');
    },
  });

  const addAchievementMutation = useMutation({
    mutationFn: async () => {
      if (!achievementTitle) throw new Error('Title required');
      const { error } = await supabase
        .from('player_achievements')
        .insert({
          team_member_id: teamMemberId,
          awarded_by_user_id: user?.id,
          achievement_type: achievementType,
          title: achievementTitle,
          description: achievementDescription || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Achievement added');
      queryClient.invalidateQueries({ queryKey: ['player-achievements', teamMemberId] });
      setAchievementTitle('');
      setAchievementDescription('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add achievement');
    },
  });

  const getRatingColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-blue-500';
    if (value >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Player Assessment: {playerName}
          </DialogTitle>
          <DialogDescription>
            Rate player performance and add achievements
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="ratings" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="ratings" className="space-y-6">
              {/* Overall Rating Display */}
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
                <p className={`text-5xl font-bold ${getRatingColor(ratings.overall_rating)}`}>
                  {ratings.overall_rating}
                </p>
              </div>

              {/* Category Ratings */}
              <div className="space-y-4">
                {RATING_CATEGORIES.map((category) => (
                  <div key={category.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <Label>{category.label}</Label>
                      </div>
                      <span className={`font-bold ${getRatingColor(ratings[category.key])}`}>
                        {ratings[category.key]}
                      </span>
                    </div>
                    <Slider
                      value={[ratings[category.key]]}
                      onValueChange={(v) => setRatings(prev => ({ ...prev, [category.key]: v[0] }))}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                ))}
              </div>

              {/* Line/Depth Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Line Assignment</Label>
                  <Select value={currentLine} onValueChange={setCurrentLine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select line" />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Depth Position</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 1 = starter"
                    value={depthPosition}
                    onChange={(e) => setDepthPosition(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label>Strengths</Label>
                <Textarea
                  placeholder="What does this player do well?"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Areas for Improvement</Label>
                <Textarea
                  placeholder="What should this player work on?"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Coach Notes (Private)</Label>
                <Textarea
                  placeholder="Internal notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              {/* Add Achievement */}
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Add Achievement
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Achievement title"
                    value={achievementTitle}
                    onChange={(e) => setAchievementTitle(e.target.value)}
                  />
                  <Select value={achievementType} onValueChange={setAchievementType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recognition">Recognition</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="award">Award</SelectItem>
                      <SelectItem value="stat">Stat Record</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Description (optional)"
                  value={achievementDescription}
                  onChange={(e) => setAchievementDescription(e.target.value)}
                  rows={2}
                />
                <Button 
                  size="sm" 
                  onClick={() => addAchievementMutation.mutate()}
                  disabled={!achievementTitle || addAchievementMutation.isPending}
                >
                  {addAchievementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Achievement
                </Button>
              </div>

              {/* Achievement List */}
              <div className="space-y-2">
                {achievements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No achievements yet</p>
                ) : achievements.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Trophy className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.title}</span>
                        <Badge variant="outline" className="text-xs">{a.achievement_type}</Badge>
                      </div>
                      {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{a.achievement_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveRatingMutation.mutate()} disabled={saveRatingMutation.isPending}>
            {saveRatingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
