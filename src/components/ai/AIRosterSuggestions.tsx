import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sparkles, 
  Check, 
  X, 
  RefreshCw, 
  User, 
  Target,
  TrendingUp,
  Loader2,
  Wand2
} from 'lucide-react';

interface AIRosterSuggestionsProps {
  teamId: string;
  sportCode?: string;
}

interface Suggestion {
  id: string;
  team_member_id: string;
  suggestion_type: string;
  suggested_position_id: string | null;
  suggested_line_group: string | null;
  confidence_score: number | null;
  reasoning: string | null;
  status: string;
  created_at: string;
  team_member?: {
    id: string;
    user_id: string;
    jersey_number: string | null;
    position: string | null;
    profile?: {
      first_name: string | null;
      last_name: string | null;
    };
  };
  position?: {
    display_name: string;
    position_key: string;
  };
}

export function AIRosterSuggestions({ teamId, sportCode }: AIRosterSuggestionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Fetch existing suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['ai-roster-suggestions', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_roster_suggestions')
        .select(`
          *,
          team_member:team_members(
            id, user_id, jersey_number, position
          ),
          position:sport_positions(display_name, position_key)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles for team members
      if (data && data.length > 0) {
        const userIds = data.map(s => s.team_member?.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        return data.map(s => ({
          ...s,
          team_member: s.team_member ? {
            ...s.team_member,
            profile: profileMap.get(s.team_member.user_id)
          } : undefined
        })) as Suggestion[];
      }
      
      return data as Suggestion[];
    },
    enabled: !!teamId,
  });

  // Accept suggestion mutation
  const acceptMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const suggestion = suggestions?.find(s => s.id === suggestionId);
      if (!suggestion) throw new Error('Suggestion not found');

      // Update the team member with the suggested position
      if (suggestion.suggested_position_id) {
        // Update athlete_positions if needed
        await supabase
          .from('athlete_positions')
          .upsert({
            team_membership_id: suggestion.team_member_id,
            position_id: suggestion.suggested_position_id,
            is_primary: true,
          });
      }

      // Mark suggestion as accepted
      const { error } = await supabase
        .from('ai_roster_suggestions')
        .update({ 
          status: 'accepted',
          reviewed_by_user_id: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', suggestionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-roster-suggestions', teamId] });
      queryClient.invalidateQueries({ queryKey: ['team-roster', teamId] });
      toast({ title: 'Suggestion applied' });
    },
    onError: (error) => {
      toast({ title: 'Error applying suggestion', description: error.message, variant: 'destructive' });
    },
  });

  // Dismiss suggestion mutation
  const dismissMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('ai_roster_suggestions')
        .update({ 
          status: 'dismissed',
          reviewed_by_user_id: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', suggestionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-roster-suggestions', teamId] });
      toast({ title: 'Suggestion dismissed' });
    },
  });

  // Generate new suggestions
  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-role-assistant', {
        body: {
          action: 'generate_roster_suggestions',
          teamId,
          sportCode,
        },
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ai-roster-suggestions', teamId] });
      toast({ title: 'AI suggestions generated', description: `${data.suggestions?.length || 0} new suggestions` });
      setShowDialog(false);
    } catch (error: any) {
      toast({ 
        title: 'Error generating suggestions', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pendingSuggestions = suggestions?.filter(s => s.status === 'pending') || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI suggestions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">AI Roster Assistant</CardTitle>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Generate Suggestions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Generate AI Roster Suggestions
                </DialogTitle>
                <DialogDescription>
                  AI will analyze player data, positions, and team composition to suggest optimal assignments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    The AI will consider player stats, experience, physical attributes, and team balance to make recommendations.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={generateSuggestions} 
                  className="w-full gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing roster...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Smart suggestions for positions and lineups
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingSuggestions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending suggestions</p>
            <p className="text-xs">Generate new suggestions to optimize your roster</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSuggestions.slice(0, 5).map((suggestion) => (
              <div 
                key={suggestion.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {suggestion.team_member?.profile?.first_name} {suggestion.team_member?.profile?.last_name}
                      {suggestion.team_member?.jersey_number && (
                        <span className="text-muted-foreground ml-1">
                          #{suggestion.team_member.jersey_number}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {suggestion.suggestion_type === 'position' && 'Suggested position: '}
                      {suggestion.suggestion_type === 'line_group' && 'Suggested line: '}
                      <span className="font-medium text-foreground">
                        {suggestion.position?.display_name || suggestion.suggested_line_group}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {suggestion.confidence_score && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(suggestion.confidence_score * 100)}% confident
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => acceptMutation.mutate(suggestion.id)}
                    disabled={acceptMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => dismissMutation.mutate(suggestion.id)}
                    disabled={dismissMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingSuggestions.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                +{pendingSuggestions.length - 5} more suggestions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
