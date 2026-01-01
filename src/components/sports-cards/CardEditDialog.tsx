import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SportsCard } from './SportsCard';
import { SportsCardData, CardBackgroundStyle } from './types';
import { User, Star, Palette, Settings, Loader2 } from 'lucide-react';

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

  // Update local state when card changes
  if (card) {
    if (jerseyNumber !== (card.jerseyNumber?.toString() || '') && jerseyNumber === '') {
      setJerseyNumber(card.jerseyNumber?.toString() || '');
    }
    if (position !== (card.positions?.[0]?.position_key || '') && position === '') {
      setPosition(card.positions?.[0]?.position_key || '');
    }
  }

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

  const previewCard: SportsCardData | null = card ? {
    ...card,
    jerseyNumber: jerseyNumber ? parseInt(jerseyNumber) : undefined,
    positions: position ? [{ id: '1', position_key: position, display_name: position, is_primary: true }] : [],
    backgroundStyle,
    ratingOverall: rating,
    showRating: true,
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details" className="gap-1">
                  <Settings className="h-3 w-3" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="rating" className="gap-1">
                  <Star className="h-3 w-3" />
                  Rating
                </TabsTrigger>
                <TabsTrigger value="style" className="gap-1">
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

                <div className="pt-2">
                  <h4 className="text-sm font-medium mb-2">Current Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {card.badges.length > 0 ? (
                      card.badges.map((badge) => (
                        <Badge key={badge.key} variant="secondary">
                          {badge.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No badges</span>
                    )}
                  </div>
                </div>
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
