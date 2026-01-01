import { useState, useMemo, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutCanvas } from './LayoutCanvas';
import { RosterSidebar } from './RosterSidebar';
import { LineGroupSelector } from './LineGroupSelector';
import { TemplateSelector } from './TemplateSelector';
import { TeamMemberForLayout, TeamViewState, SportLayoutTemplate, SlotAssignment } from './types';
import { getTemplatesForSport, getDefaultTemplate } from './sportTemplates';
import { Play, Users, PanelRightClose, PanelRightOpen, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TeamViewProps {
  teamId: string;
  teamName: string;
  sportKey: string;
  sportName: string;
  seasonLabel: string;
  members: TeamMemberForLayout[];
  lineGroups: Array<{ id: string; lineKey: string; displayName: string }>;
  onReplayReveal?: () => void;
  canReplayReveal?: boolean;
  className?: string;
}

export function TeamView({
  teamId,
  teamName,
  sportKey,
  sportName,
  seasonLabel,
  members,
  lineGroups,
  onReplayReveal,
  canReplayReveal = false,
  className,
}: TeamViewProps) {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSide, setActiveSide] = useState<'offense' | 'defense'>('offense');
  const [state, setState] = useState<TeamViewState>({
    selectedTemplateId: null,
    selectedLineGroupId: null,
    slotAssignments: [],
    highlightedMemberId: null,
    filter: {
      lineGroup: null,
      positionGroup: null,
      startersOnly: false,
    },
  });

  // Track assignments per side
  const [offenseAssignments, setOffenseAssignments] = useState<SlotAssignment[]>([]);
  const [defenseAssignments, setDefenseAssignments] = useState<SlotAssignment[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Get available templates for this sport
  const templates = useMemo(() => getTemplatesForSport(sportKey), [sportKey]);
  
  // Filter templates by side
  const offenseTemplates = useMemo(() => 
    templates.filter(t => t.side === 'offense' || !t.side), [templates]);
  const defenseTemplates = useMemo(() => 
    templates.filter(t => t.side === 'defense' || !t.side), [templates]);

  // Get current side's templates
  const currentTemplates = activeSide === 'offense' ? offenseTemplates : defenseTemplates;
  const currentAssignments = activeSide === 'offense' ? offenseAssignments : defenseAssignments;
  
  // Get the currently selected template
  const selectedTemplate = useMemo(() => {
    if (state.selectedTemplateId) {
      return templates.find(t => t.id === state.selectedTemplateId) || null;
    }
    // Default to first template of current side
    const sideTemplates = templates.filter(t => t.side === activeSide);
    return sideTemplates[0] || getDefaultTemplate(sportKey);
  }, [state.selectedTemplateId, templates, sportKey, activeSide]);

  // Get unique position groups from members
  const positionGroups = useMemo(() => {
    const groups = new Set<string>();
    members.forEach(m => m.positions.forEach(p => groups.add(p)));
    return Array.from(groups).sort();
  }, [members]);

  // Filter members based on selected line group
  const filteredMembers = useMemo(() => {
    if (!state.selectedLineGroupId) return members;
    return members.filter(m => m.lineGroups.includes(state.selectedLineGroupId!));
  }, [members, state.selectedLineGroupId]);

  const handleMemberClick = useCallback((memberId: string) => {
    setState(prev => ({
      ...prev,
      highlightedMemberId: prev.highlightedMemberId === memberId ? null : memberId,
    }));
  }, []);

  const handleFilterChange = useCallback((filter: typeof state.filter) => {
    setState(prev => ({ ...prev, filter }));
  }, []);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setState(prev => ({ ...prev, selectedTemplateId: templateId }));
  }, []);

  const handleLineGroupSelect = useCallback((lineGroupId: string | null) => {
    setState(prev => ({ ...prev, selectedLineGroupId: lineGroupId }));
  }, []);

  // Handle drag-and-drop
  const handleSlotDrop = useCallback((slotKey: string, memberId: string) => {
    const setter = activeSide === 'offense' ? setOffenseAssignments : setDefenseAssignments;
    setter(prev => {
      // Remove member from any existing slot
      const filtered = prev.filter(a => a.memberId !== memberId && a.slotKey !== slotKey);
      return [...filtered, { slotKey, memberId }];
    });
    setHasChanges(true);
  }, [activeSide]);

  const handleSlotRemove = useCallback((slotKey: string) => {
    const setter = activeSide === 'offense' ? setOffenseAssignments : setDefenseAssignments;
    setter(prev => prev.filter(a => a.slotKey !== slotKey));
    setHasChanges(true);
  }, [activeSide]);

  // Save depth chart mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Update depth_order and is_starter for all assigned members
      const allAssignments = [...offenseAssignments, ...defenseAssignments];
      const assignedMemberIds = new Set(allAssignments.map(a => a.memberId));
      
      // Get members with their depth order
      const updates = members.map((m, index) => ({
        id: m.membershipId,
        depth_order: assignedMemberIds.has(m.id) ? index : 99,
        is_starter: assignedMemberIds.has(m.id),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('team_members')
          .update({ depth_order: update.depth_order, is_starter: update.is_starter })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Depth chart saved!');
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save');
    },
  });

  // Check if sport has offense/defense sides
  const hasSides = templates.some(t => t.side === 'offense' || t.side === 'defense');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn('flex flex-col h-full bg-background', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold">{teamName}</h2>
              <p className="text-sm text-muted-foreground">{sportName} • {seasonLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Offense/Defense tabs */}
            {hasSides && (
              <Tabs value={activeSide} onValueChange={(v) => setActiveSide(v as 'offense' | 'defense')}>
                <TabsList>
                  <TabsTrigger value="offense">Offense</TabsTrigger>
                  <TabsTrigger value="defense">Defense</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Template selector */}
            <TemplateSelector
              templates={currentTemplates}
              selectedTemplateId={state.selectedTemplateId || selectedTemplate?.id || null}
              onSelect={handleTemplateSelect}
            />

            {/* Line group selector */}
            <LineGroupSelector
              lineGroups={lineGroups}
              selectedLineGroupId={state.selectedLineGroupId}
              onSelect={handleLineGroupSelect}
            />

            {/* Save button */}
            {hasChanges && (
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending}
                size="sm"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            )}

            {/* Replay reveal */}
            {canReplayReveal && onReplayReveal && (
              <Button variant="outline" size="sm" onClick={onReplayReveal}>
                <Play className="h-4 w-4 mr-1" />
                Replay Reveal
              </Button>
            )}

            {/* Toggle sidebar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas area */}
          <div className="flex-1 p-4 overflow-auto">
            {selectedTemplate ? (
              <LayoutCanvas
                template={selectedTemplate}
                members={filteredMembers}
                slotAssignments={currentAssignments}
                highlightedMemberId={state.highlightedMemberId}
                onSlotDrop={handleSlotDrop}
                onSlotRemove={handleSlotRemove}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Users className="h-8 w-8 mr-2" />
                No layout template available
              </div>
            )}
          </div>

          {/* Roster sidebar with draggable cards */}
          {sidebarOpen && (
            <RosterSidebar
              members={members}
              lineGroups={lineGroups}
              positionGroups={positionGroups}
              selectedMemberId={state.highlightedMemberId}
              onMemberClick={handleMemberClick}
              filterLineGroup={state.filter.lineGroup}
              filterPositionGroup={state.filter.positionGroup}
              filterStartersOnly={state.filter.startersOnly}
              onFilterChange={handleFilterChange}
              className="w-72 shrink-0"
              draggable
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}
