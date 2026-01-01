import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SanctioningBodySelector } from '@/components/governance/SanctioningBodySelector';
import { Shield, Plus, X, Star, ExternalLink } from 'lucide-react';

interface SchoolSanctioningBodiesProps {
  schoolId: string;
  stateCode: string | null;
  primaryGoverningBodyId: string | null;
}

export function SchoolSanctioningBodies({ 
  schoolId, 
  stateCode, 
  primaryGoverningBodyId 
}: SchoolSanctioningBodiesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingBody, setIsAddingBody] = useState(false);
  const [selectedBodyId, setSelectedBodyId] = useState('');

  // Fetch school's governing bodies
  const { data: schoolBodies, isLoading } = useQuery({
    queryKey: ['school-governing-bodies', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('school_governing_bodies')
        .select(`
          id,
          is_primary,
          governing_body_id,
          governing_bodies (
            id,
            name,
            short_name,
            type,
            state_code,
            website_url
          )
        `)
        .eq('school_id', schoolId);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all available governing bodies
  const { data: allBodies } = useQuery({
    queryKey: ['governing-bodies-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governing_bodies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Add governing body mutation
  const addBodyMutation = useMutation({
    mutationFn: async (governingBodyId: string) => {
      const isPrimary = schoolBodies?.length === 0;
      const { error } = await supabase
        .from('school_governing_bodies')
        .insert({
          school_id: schoolId,
          governing_body_id: governingBodyId,
          is_primary: isPrimary,
        });
      if (error) throw error;

      // Update school's primary_governing_body_id if this is the first/primary
      if (isPrimary) {
        await supabase
          .from('schools')
          .update({ primary_governing_body_id: governingBodyId })
          .eq('id', schoolId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-governing-bodies', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['school-detail', schoolId] });
      setIsAddingBody(false);
      setSelectedBodyId('');
      toast({ title: 'Sanctioning body added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding sanctioning body', description: error.message, variant: 'destructive' });
    },
  });

  // Remove governing body mutation
  const removeBodyMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const body = schoolBodies?.find(b => b.id === linkId);
      const { error } = await supabase
        .from('school_governing_bodies')
        .delete()
        .eq('id', linkId);
      if (error) throw error;

      // If removing primary, clear school's primary_governing_body_id
      if (body?.is_primary) {
        await supabase
          .from('schools')
          .update({ primary_governing_body_id: null })
          .eq('id', schoolId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-governing-bodies', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['school-detail', schoolId] });
      toast({ title: 'Sanctioning body removed' });
    },
    onError: (error) => {
      toast({ title: 'Error removing sanctioning body', description: error.message, variant: 'destructive' });
    },
  });

  // Set as primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const body = schoolBodies?.find(b => b.id === linkId);
      if (!body) throw new Error('Body not found');

      // Unset all as primary
      await supabase
        .from('school_governing_bodies')
        .update({ is_primary: false })
        .eq('school_id', schoolId);

      // Set selected as primary
      await supabase
        .from('school_governing_bodies')
        .update({ is_primary: true })
        .eq('id', linkId);

      // Update school's primary_governing_body_id
      await supabase
        .from('schools')
        .update({ primary_governing_body_id: body.governing_body_id })
        .eq('id', schoolId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-governing-bodies', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['school-detail', schoolId] });
      toast({ title: 'Primary sanctioning body updated' });
    },
    onError: (error) => {
      toast({ title: 'Error updating primary', description: error.message, variant: 'destructive' });
    },
  });

  const existingBodyIds = schoolBodies?.map(b => b.governing_body_id) || [];

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      state_primary: 'State Primary',
      state_private: 'State Private',
      city_public: 'City Public',
      independent_schools: 'Independent',
      prep_conference: 'Prep Conference',
      charter: 'Charter',
      national: 'National',
      multi_state: 'Multi-State',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sanctioning Bodies
        </CardTitle>
        <CardDescription>
          Athletic associations that govern this school's sports programs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : schoolBodies?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No sanctioning bodies assigned</p>
            <p className="text-sm">Add the primary athletic association for this school</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schoolBodies?.map((link) => (
              <div 
                key={link.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {link.is_primary && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {link.governing_bodies?.name}
                      {link.governing_bodies?.short_name && (
                        <span className="text-muted-foreground ml-1">
                          ({link.governing_bodies.short_name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(link.governing_bodies?.type || '')}
                      </Badge>
                      {link.governing_bodies?.state_code && (
                        <Badge variant="outline" className="text-xs">
                          {link.governing_bodies.state_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {link.governing_bodies?.website_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={link.governing_bodies.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!link.is_primary && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setPrimaryMutation.mutate(link.id)}
                      disabled={setPrimaryMutation.isPending}
                    >
                      Set Primary
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeBodyMutation.mutate(link.id)}
                    disabled={removeBodyMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddingBody ? (
          <div className="flex items-end gap-2 pt-2">
          <div className="flex-1">
              <SanctioningBodySelector
                value={selectedBodyId}
                onSelect={(body) => setSelectedBodyId(body?.id || '')}
                stateCode={stateCode || undefined}
              />
            </div>
            <Button 
              onClick={() => addBodyMutation.mutate(selectedBodyId)}
              disabled={!selectedBodyId || addBodyMutation.isPending}
            >
              Add
            </Button>
            <Button variant="outline" onClick={() => {
              setIsAddingBody(false);
              setSelectedBodyId('');
            }}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsAddingBody(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sanctioning Body
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
