import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Globe, 
  Users, 
  Shield,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettingsProps {
  entityType: 'team' | 'athlete' | 'organization' | 'school';
  entityId: string;
  entityName?: string;
}

const PRIVACY_KEYS = {
  team: [
    { key: 'public_roster', label: 'Public Roster', description: 'Allow roster to be viewed publicly', icon: Globe },
    { key: 'show_player_photos', label: 'Show Player Photos', description: 'Display player photos on roster', icon: Eye },
    { key: 'show_jersey_numbers', label: 'Show Jersey Numbers', description: 'Display jersey numbers on cards', icon: Eye },
    { key: 'show_positions', label: 'Show Positions', description: 'Display player positions', icon: Eye },
    { key: 'show_stats', label: 'Show Statistics', description: 'Display player statistics publicly', icon: Eye },
  ],
  athlete: [
    { key: 'public_profile', label: 'Public Profile', description: 'Allow profile to be viewed publicly', icon: Globe },
    { key: 'show_height_weight', label: 'Show Height & Weight', description: 'Display physical measurements', icon: Eye },
    { key: 'show_grade_year', label: 'Show Grade/Year', description: 'Display graduation year', icon: Eye },
    { key: 'show_awards', label: 'Show Awards', description: 'Display badges and achievements', icon: Eye },
    { key: 'allow_parent_view', label: 'Parent Access', description: 'Allow linked parents to view full profile', icon: Users },
  ],
  organization: [
    { key: 'public_teams', label: 'Public Team Listings', description: 'Show teams publicly on organization page', icon: Globe },
    { key: 'public_events', label: 'Public Event Calendar', description: 'Display events publicly', icon: Globe },
    { key: 'allow_public_registration', label: 'Public Registration', description: 'Allow public team registration', icon: Users },
    { key: 'show_coach_contact', label: 'Coach Contact Info', description: 'Display coach contact information', icon: Eye },
  ],
  school: [
    { key: 'public_athletics_page', label: 'Public Athletics Page', description: 'Show athletics information publicly', icon: Globe },
    { key: 'show_schedules', label: 'Public Schedules', description: 'Display game schedules publicly', icon: Eye },
    { key: 'show_rosters', label: 'Public Rosters', description: 'Allow team rosters to be viewed', icon: Eye },
    { key: 'enable_ticket_sales', label: 'Enable Ticket Sales', description: 'Allow online ticket purchases', icon: Globe },
  ],
};

export function PrivacySettings({ entityType, entityId, entityName }: PrivacySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ['privacy-settings', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      if (error) throw error;
      
      // Convert to map
      return data.reduce((acc, setting) => ({
        ...acc,
        [setting.setting_key]: setting.setting_value
      }), {} as Record<string, boolean>);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const upserts = Object.entries(updates).map(([key, value]) => ({
        entity_type: entityType,
        entity_id: entityId,
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('privacy_settings')
        .upsert(upserts, { onConflict: 'entity_type,entity_id,setting_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings', entityType, entityId] });
      setPendingChanges({});
      toast({ title: 'Privacy settings updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating settings', description: error.message, variant: 'destructive' });
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (key: string) => {
    if (key in pendingChanges) return pendingChanges[key];
    return settings?.[key] ?? false;
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const privacyOptions = PRIVACY_KEYS[entityType] || [];

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading privacy settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control data visibility for {entityName || entityType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Privacy settings follow FERPA guidelines. By default, all data is private and must be explicitly made visible.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isEnabled = getCurrentValue(option.key);
            const hasChanged = option.key in pendingChanges;
            
            return (
              <div 
                key={option.key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  hasChanged ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md ${isEnabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    {isEnabled ? (
                      <Icon className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={option.key} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      {hasChanged && (
                        <Badge variant="outline" className="text-xs">Modified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(option.key, checked)}
                />
              </div>
            );
          })}
        </div>

        {hasPendingChanges && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You have unsaved changes
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPendingChanges({})}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateMutation.mutate(pendingChanges)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
