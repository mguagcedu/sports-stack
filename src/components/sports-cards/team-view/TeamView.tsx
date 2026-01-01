import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutCanvas } from './LayoutCanvas';
import { RosterSidebar } from './RosterSidebar';
import { LineGroupSelector } from './LineGroupSelector';
import { TemplateSelector } from './TemplateSelector';
import { TeamMemberForLayout, TeamViewState, SportLayoutTemplate } from './types';
import { getTemplatesForSport, getDefaultTemplate } from './sportTemplates';
import { Play, Users, PanelRightClose, PanelRightOpen } from 'lucide-react';

interface TeamViewProps {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Get available templates for this sport
  const templates = useMemo(() => getTemplatesForSport(sportKey), [sportKey]);
  
  // Get the currently selected template
  const selectedTemplate = useMemo(() => {
    if (state.selectedTemplateId) {
      return templates.find(t => t.id === state.selectedTemplateId) || null;
    }
    return getDefaultTemplate(sportKey);
  }, [state.selectedTemplateId, templates, sportKey]);

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

  return (
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
          {/* Template selector */}
          <TemplateSelector
            templates={templates}
            selectedTemplateId={state.selectedTemplateId || selectedTemplate?.id || null}
            onSelect={handleTemplateSelect}
          />

          {/* Line group selector */}
          <LineGroupSelector
            lineGroups={lineGroups}
            selectedLineGroupId={state.selectedLineGroupId}
            onSelect={handleLineGroupSelect}
          />

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
              slotAssignments={state.slotAssignments}
              highlightedMemberId={state.highlightedMemberId}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Users className="h-8 w-8 mr-2" />
              No layout template available
            </div>
          )}
        </div>

        {/* Roster sidebar */}
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
          />
        )}
      </div>
    </div>
  );
}
