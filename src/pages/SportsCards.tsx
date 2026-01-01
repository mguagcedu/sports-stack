import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { SportsCard, TeamView, PackRevealModal, RevealCard, TeamMemberForLayout, SportsCardData } from '@/components/sports-cards';
import { CardEditDialog } from '@/components/sports-cards/CardEditDialog';
import { Play, Users, CreditCard, Eye, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SportsCards() {
  const { user } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'team'>('cards');
  const [showReveal, setShowReveal] = useState(false);
  const [editingCard, setEditingCard] = useState<{ card: SportsCardData; memberId: string } | null>(null);
  const [viewingMyCard, setViewingMyCard] = useState(false);

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams-for-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, sport_key, organization_id, organizations(name)')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch current user's team membership to find "my card"
  const { data: myMembership } = useQuery({
    queryKey: ['my-team-membership', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, team_id, jersey_number, position, role, is_captain, teams(id, name, sport_key)')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's profile for my card
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch team members (using team_members table which has actual data)
  const { data: teamMembersData = [] } = useQuery({
    queryKey: ['team-members', selectedTeamId],
    enabled: !!selectedTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, jersey_number, position, is_captain')
        .eq('team_id', selectedTeamId!);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles for team members (all are linked via user_id)
  const userIds = teamMembersData.map(m => m.user_id);
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-cards', userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, photo_url, card_photo_url')
        .in('id', userIds);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch line groups for team
  const { data: lineGroups = [] } = useQuery({
    queryKey: ['line-groups', selectedTeamId],
    enabled: !!selectedTeamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_groups')
        .select('id, line_key, display_name, is_default, sort_order')
        .eq('team_id', selectedTeamId!)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  // Build "my card" data
  const myCardData: SportsCardData | null = useMemo(() => {
    if (!myMembership || !myProfile) return null;
    const team = myMembership.teams;
    if (!team) return null;

    return {
      id: myMembership.id,
      firstName: myProfile.first_name || 'Unknown',
      lastName: myProfile.last_name || '',
      photoUrl: myProfile.card_photo_url || myProfile.photo_url || myProfile.avatar_url || null,
      teamName: team.name,
      sportKey: team.sport_key || '',
      sportName: team.sport_key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sport',
      seasonLabel: '2025-26',
      jerseyNumber: myMembership.jersey_number ? parseInt(myMembership.jersey_number) : undefined,
      positions: myMembership.position ? [{
        id: myMembership.id,
        position_key: myMembership.position,
        display_name: myMembership.position,
        is_primary: true,
        depth_order: 1,
      }] : [],
      lineGroups: [],
      gradYear: null,
      height: null,
      weight: null,
      role: myMembership.role === 'athlete' ? 'player' : myMembership.role === 'coach' ? 'coach' : 'staff',
      badges: myMembership.is_captain ? [{ key: 'captain', label: 'Captain' }] : [],
      backgroundStyle: 'classic' as const,
    };
  }, [myMembership, myProfile]);

  // Build card data for each team member
  const cardData: SportsCardData[] = useMemo(() => {
    if (!selectedTeam) return [];

    return teamMembersData.map(m => {
      const profile = profiles.find(p => p.id === m.user_id);
      const firstName = profile?.first_name || 'Unknown';
      const lastName = profile?.last_name || '';
      const photoUrl = profile?.card_photo_url || profile?.photo_url || profile?.avatar_url || null;

      // Build position from the team_members.position field
      const memberPositions = m.position ? [{
        id: m.id,
        position_key: m.position,
        display_name: m.position,
        is_primary: true,
        depth_order: 1,
      }] : [];

      return {
        id: m.id,
        firstName,
        lastName,
        photoUrl,
        teamName: selectedTeam.name,
        sportKey: selectedTeam.sport_key || '',
        sportName: selectedTeam.sport_key?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Sport',
        seasonLabel: '2025-26',
        jerseyNumber: m.jersey_number ? parseInt(m.jersey_number) : undefined,
        positions: memberPositions,
        lineGroups: [],
        gradYear: null,
        height: null,
        weight: null,
        role: m.role === 'athlete' ? 'player' : m.role === 'coach' ? 'coach' : 'staff',
        badges: m.is_captain ? [{ key: 'captain', label: 'Captain' }] : [],
        backgroundStyle: 'classic' as const,
      };
    });
  }, [teamMembersData, profiles, selectedTeam]);

  // Build reveal cards
  const revealCards: RevealCard[] = useMemo(() => {
    return cardData.map((card, i) => ({
      ...card,
      revealOrder: i,
      revealCategory: card.role === 'coach' ? 'head_coach' : 'roster' as const,
    }));
  }, [cardData]);

  // Build team member data for TeamView
  const teamMembersForLayout: TeamMemberForLayout[] = useMemo(() => {
    return cardData.map(card => ({
      id: card.id,
      membershipId: card.id,
      cardData: card,
      positions: card.positions.map(p => p.position_key),
      lineGroups: card.lineGroups.map(l => l.line_key),
      isStarter: card.positions.some(p => p.depth_order === 1),
      depthOrder: card.positions.find(p => p.is_primary)?.depth_order || undefined,
    }));
  }, [cardData]);

  const handleCardClick = (card: SportsCardData) => {
    setEditingCard({ card, memberId: card.id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sports Cards</h1>
            <p className="text-muted-foreground">View and manage athlete cards for your teams</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick actions for my card */}
            {myCardData && (
              <Button variant="outline" onClick={() => setViewingMyCard(true)}>
                <Eye className="h-4 w-4 mr-2" />
                View My Card
              </Button>
            )}
          </div>
        </div>

        {/* Team selector and view toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Select value={selectedTeamId || ''} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTeamId && (
            <>
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-none"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'team' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('team')}
                  className="rounded-none"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Team View
                </Button>
              </div>

              <Button onClick={() => setShowReveal(true)}>
                <Play className="h-4 w-4 mr-2" />
                Reveal Cards
              </Button>
            </>
          )}
        </div>

        {!selectedTeamId ? (
          <Card>
            <CardHeader>
              <CardTitle>Select a Team</CardTitle>
              <CardDescription>
                Choose a team from the dropdown above to view sports cards
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team selected</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cardData.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No team members found. Add athletes to this team first.
                </CardContent>
              </Card>
            ) : (
              cardData.map(card => (
                <div 
                  key={card.id} 
                  className="cursor-pointer group relative"
                  onClick={() => handleCardClick(card)}
                >
                  <SportsCard data={card} size="medium" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Button size="sm" variant="secondary">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <TeamView
              teamId={selectedTeam?.id || ''}
              teamName={selectedTeam?.name || ''}
              sportKey={selectedTeam?.sport_key || ''}
              sportName={selectedTeam?.sport_key?.replace(/_/g, ' ') || 'Sport'}
              seasonLabel="2025-26"
              members={teamMembersForLayout}
              lineGroups={lineGroups.map(lg => ({
                id: lg.id,
                lineKey: lg.line_key,
                displayName: lg.display_name,
              }))}
              canReplayReveal
              onReplayReveal={() => setShowReveal(true)}
              className="h-[calc(100vh-250px)]"
            />
          </Card>
        )}
      </div>

      {/* Pack Reveal Modal */}
      {showReveal && selectedTeam && revealCards.length > 0 && (
        <PackRevealModal
          cards={revealCards}
          teamName={selectedTeam.name}
          sportName={selectedTeam.sport_key?.replace(/_/g, ' ') || 'Sport'}
          seasonLabel="2025-26"
          onComplete={() => setShowReveal(false)}
          onClose={() => setShowReveal(false)}
        />
      )}

      {/* Card Edit Dialog */}
      <CardEditDialog
        card={editingCard?.card || null}
        memberId={editingCard?.memberId || null}
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
      />

      {/* View My Card Dialog */}
      {myCardData && (
        <CardEditDialog
          card={myCardData}
          memberId={myCardData.id}
          open={viewingMyCard}
          onOpenChange={setViewingMyCard}
        />
      )}
    </DashboardLayout>
  );
}
