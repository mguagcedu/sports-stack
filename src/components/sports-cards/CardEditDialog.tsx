import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { SportsCard } from './SportsCard';
import { SportsCardData, CardBackgroundStyle } from './types';
import { User, Star, Palette, Settings, Loader2, Award, Users } from 'lucide-react';

interface CardEditDialogProps {
  card: SportsCardData | null;
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BACKGROUND_STYLES: { value: CardBackgroundStyle; label: string }[] = [
  { value: 'classic', label: 'Classic' },
  { value: 'neon', label: 'Neon' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'matte', label: 'Matte' },
  { value: 'heritage', label: 'Heritage' },
];

export function CardEditDialog({ card, memberId, open, onOpenChange }: CardEditDialogProps) {
  const queryClient = useQueryClient();
  
  const [jerseyNumber, setJerseyNumber] = useState<string>(card?.jerseyNumber?.toString() || '');
  const [position, setPosition] = useState<string>(card?.positions?.[0]?.position_key || '');
  const [backgroundStyle, setBackgroundStyle] = useState<CardBackgroundStyle>(card?.backgroundStyle || 'classic');
  const [rating, setRating] = useState<number>(card?.ratingOverall || 75);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(card?.badges.map(b => b.key) || []);
  const [selectedLineGroups, setSelectedLineGroups] = useState<string[]>(card?.lineGroups.map(l => l.id) || []);

  // Fetch available badges
  const { data: availableBadges } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('is_assignable', true)
        .order('display_name');
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch available line groups for the team
  const { data: availableLineGroups } = useQuery({
    queryKey: ['team-line-groups', memberId],
    queryFn: async (): Promise<{ id: string; line_key: string; display_name: string }[]> => {
      if (!memberId) return [];
      // Get team_id from team_members
      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('id', memberId)
        .single();
      
      if (!memberData) return [];
      
      const { data, error } = await supabase
        .from('line_groups')
        .select('id, line_key, display_name')
        .eq('team_id', memberData.team_id)
        .order('display_name');
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!memberId
  });

  // Update local state when card changes
  useEffect(() => {
    if (card) {
      setJerseyNumber(card.jerseyNumber?.toString() || '');
      setPosition(card.positions?.[0]?.position_key || '');
      setBackgroundStyle(card.backgroundStyle || 'classic');
      setRating(card.ratingOverall || 75);
      setSelectedBadges(card.badges.map(b => b.key) || []);
      setSelectedLineGroups(card.lineGroups.map(l => l.id) || []);
    }
  }, [card]);

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error('No member selected');
      
      const { error } = await supabase
        .from('team_members')
        .update({
          jersey_number: jerseyNumber || null,
          position: position || null,
        })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Card updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update card');
    },
  });

  const saveRatingMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error('No member selected');
      
      // Check if rating exists
      const { data: existing } = await supabase
        .from('player_ratings')
        .select('id')
        .eq('team_member_id', memberId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('player_ratings')
          .update({ overall_rating: rating })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('player_ratings')
          .insert({
            team_member_id: memberId,
            overall_rating: rating,
            rated_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-ratings'] });
      toast.success('Rating saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save rating');
    },
  });

  const saveBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error('No member selected');
      
      // Delete existing badges
      await supabase
        .from('player_badges')
        .delete()
        .eq('team_member_id', memberId);
      
      // Insert new badges - need to get badge_definition_id from badge_key
      if (selectedBadges.length > 0 && availableBadges) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const badgeInserts = selectedBadges.map(badgeKey => {
          const badgeDef = availableBadges.find(b => b.badge_key === badgeKey);
          return {
            team_member_id: memberId,
            badge_definition_id: badgeDef?.id || '',
            awarded_by_user_id: userId,
          };
        }).filter(b => b.badge_definition_id);
        
        if (badgeInserts.length > 0) {
          const { error } = await supabase
            .from('player_badges')
            .insert(badgeInserts);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-badges'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Badges saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save badges');
    },
  });

  const saveLineGroupsMutation = useMutation({
    mutationFn: async () => {
      if (!memberId) throw new Error('No member selected');
      
      // Delete existing line group assignments - use the correct column name
      await supabase
        .from('member_line_groups')
        .delete()
        .eq('team_membership_id', memberId);
      
      // Insert new line group assignments with correct column name
      if (selectedLineGroups.length > 0) {
        const lgInserts = selectedLineGroups.map((lgId, idx) => ({
          team_membership_id: memberId,
          line_group_id: lgId,
          is_primary: idx === 0,
        }));
        const { error } = await supabase
          .from('member_line_groups')
          .insert(lgInserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-line-groups'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Line groups saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save line groups');
    },
  });

  const toggleBadge = (badgeKey: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeKey) 
        ? prev.filter(k => k !== badgeKey)
        : [...prev, badgeKey]
    );
  };

  const toggleLineGroup = (lgId: string) => {
    setSelectedLineGroups(prev => 
      prev.includes(lgId) 
        ? prev.filter(k => k !== lgId)
        : [...prev, lgId]
    );
  };

  const previewCard: SportsCardData | null = card ? {
    ...card,
    jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
    positions: position ? [{ id: '1', position_key: position, display_name: position, is_primary: true }] : [],
    backgroundStyle,
    ratingOverall: rating,
    showRating: true,
    badges: selectedBadges.map(key => {
      const badge = availableBadges?.find(b => b.badge_key === key);
      return { key, label: badge?.display_name || key, icon: badge?.icon };
    }),
    lineGroups: selectedLineGroups.map((id, idx) => {
      const lg = availableLineGroups?.find(l => l.id === id);
      return { id, line_key: lg?.line_key || '', display_name: lg?.display_name || '', is_primary: idx === 0 };
    }),
  } : null;

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Card: {card.firstName} {card.lastName}
          </DialogTitle>
          <DialogDescription>
            Customize the player's sports card details and appearance
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">Card Preview</p>
            {previewCard && <SportsCard data={previewCard} size="medium" showDetails />}
          </div>

          {/* Edit Form */}
          <div>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details" className="gap-1 text-xs">
                  <Settings className="h-3 w-3" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="badges" className="gap-1 text-xs">
                  <Award className="h-3 w-3" />
                  Badges
                </TabsTrigger>
                <TabsTrigger value="lines" className="gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  Lines
                </TabsTrigger>
                <TabsTrigger value="rating" className="gap-1 text-xs">
                  <Star className="h-3 w-3" />
                  Rating
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  Style
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jerseyNumber">Jersey Number</Label>
                  <Input
                    id="jerseyNumber"
                    type="number"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="Enter jersey number"
                    min={0}
                    max={99}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g., QB, WR, PG, C"
                  />
                </div>

              </TabsContent>

              <TabsContent value="badges" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Badges</Label>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    {availableBadges && availableBadges.length > 0 ? (
                      <div className="space-y-2">
                        {availableBadges.map((badge) => (
                          <div 
                            key={badge.id} 
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => toggleBadge(badge.badge_key)}
                          >
                            <Checkbox 
                              checked={selectedBadges.includes(badge.badge_key)} 
                              onCheckedChange={() => toggleBadge(badge.badge_key)}
                            />
                            <div className="flex-1">
                              <span className="font-medium text-sm">{badge.display_name}</span>
                              {badge.description && (
                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No badges available</p>
                    )}
                  </ScrollArea>
                </div>
                <Button 
                  onClick={() => saveBadgesMutation.mutate()}
                  disabled={saveBadgesMutation.isPending}
                  className="w-full"
                >
                  {saveBadgesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Badges
                </Button>
              </TabsContent>

              <TabsContent value="lines" className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign to Line Groups</Label>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    {availableLineGroups && availableLineGroups.length > 0 ? (
                      <div className="space-y-2">
                        {availableLineGroups.map((lg) => (
                          <div 
                            key={lg.id} 
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => toggleLineGroup(lg.id)}
                          >
                            <Checkbox 
                              checked={selectedLineGroups.includes(lg.id)} 
                              onCheckedChange={() => toggleLineGroup(lg.id)}
                            />
                            <div className="flex-1">
                              <span className="font-medium text-sm">{lg.display_name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{lg.line_key}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No line groups created for this team yet. 
                        Create them in the roster management section.
                      </p>
                    )}
                  </ScrollArea>
                </div>
                <Button 
                  onClick={() => saveLineGroupsMutation.mutate()}
                  disabled={saveLineGroupsMutation.isPending}
                  className="w-full"
                >
                  {saveLineGroupsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Line Groups
                </Button>
              </TabsContent>

              <TabsContent value="rating" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Overall Rating</Label>
                    <span className="text-2xl font-bold text-primary">{rating}</span>
                  </div>
                  <Slider
                    value={[rating]}
                    onValueChange={(value) => setRating(value[0])}
                    min={40}
                    max={99}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Drag the slider to set the player's overall rating (40-99)
                  </p>
                  <Button 
                    onClick={() => saveRatingMutation.mutate()}
                    disabled={saveRatingMutation.isPending}
                    className="w-full"
                  >
                    {saveRatingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Rating
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Style</Label>
                  <Select value={backgroundStyle} onValueChange={(v) => setBackgroundStyle(v as CardBackgroundStyle)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Card style customization coming soon for premium features
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => updateMemberMutation.mutate()}
            disabled={updateMemberMutation.isPending}
          >
            {updateMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
