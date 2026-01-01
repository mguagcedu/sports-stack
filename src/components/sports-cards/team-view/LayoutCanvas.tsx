import { cn } from '@/lib/utils';
import { SportsCard } from '../SportsCard';
import { SportLayoutTemplate, TeamMemberForLayout, SlotAssignment } from './types';
import { useMemo } from 'react';

interface LayoutCanvasProps {
  template: SportLayoutTemplate;
  members: TeamMemberForLayout[];
  slotAssignments: SlotAssignment[];
  highlightedMemberId: string | null;
  onSlotClick?: (slotKey: string) => void;
  onMemberDrop?: (slotKey: string, memberId: string) => void;
  className?: string;
}

export function LayoutCanvas({
  template,
  members,
  slotAssignments,
  highlightedMemberId,
  onSlotClick,
  className,
}: LayoutCanvasProps) {
  // Create a map of slot -> member
  const slotMemberMap = useMemo(() => {
    const map = new Map<string, TeamMemberForLayout>();
    
    for (const assignment of slotAssignments) {
      const member = members.find(m => m.id === assignment.memberId);
      if (member) {
        map.set(assignment.slotKey, member);
      }
    }
    
    return map;
  }, [slotAssignments, members]);

  // Auto-assign members to slots based on positions if no assignments
  const autoAssignments = useMemo(() => {
    if (slotAssignments.length > 0) return slotMemberMap;
    
    const map = new Map<string, TeamMemberForLayout>();
    const usedMembers = new Set<string>();
    
    for (const slot of template.slots) {
      // Find best match for this slot
      const match = members.find(m => 
        !usedMembers.has(m.id) &&
        m.positions.some(p => slot.positionKeys?.includes(p))
      );
      
      if (match) {
        map.set(slot.key, match);
        usedMembers.add(match.id);
      }
    }
    
    return map;
  }, [template.slots, members, slotAssignments, slotMemberMap]);

  if (template.templateType === 'grouped_list') {
    return <GroupedListView members={members} highlightedMemberId={highlightedMemberId} />;
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* Field/Court background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-lg overflow-hidden"
        style={{ aspectRatio: template.aspectRatio || '16/10' }}
      >
        {/* Field markings based on sport */}
        <FieldMarkings templateType={template.templateType} sportKey={template.sportKey} />
        
        {/* Slots */}
        {template.slots.map(slot => {
          const member = autoAssignments.get(slot.key);
          const isHighlighted = member && member.id === highlightedMemberId;
          
          return (
            <div
              key={slot.key}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => onSlotClick?.(slot.key)}
            >
              {member ? (
                <div className={cn(
                  'transition-all duration-300',
                  isHighlighted && 'scale-110 ring-4 ring-primary ring-offset-2 rounded-xl'
                )}>
                  <SportsCard data={member.cardData} size="small" />
                </div>
              ) : (
                <div 
                  className={cn(
                    'w-20 h-28 rounded-lg border-2 border-dashed border-white/30',
                    'flex flex-col items-center justify-center',
                    'bg-black/20 backdrop-blur-sm cursor-pointer',
                    'hover:border-white/50 hover:bg-black/30 transition-all'
                  )}
                >
                  <span className="text-white/70 font-bold text-sm">{slot.label}</span>
                  <span className="text-white/40 text-xs">Empty</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Field markings component
function FieldMarkings({ templateType, sportKey }: { templateType: string; sportKey: string }) {
  if (templateType === 'court_map' && sportKey.includes('basketball')) {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 75" preserveAspectRatio="none">
        {/* Three point arc */}
        <path d="M 10 75 Q 50 30 90 75" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Key */}
        <rect x="35" y="55" width="30" height="20" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Free throw circle */}
        <circle cx="50" cy="55" r="10" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Basket */}
        <circle cx="50" cy="72" r="2" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
      </svg>
    );
  }

  if (templateType === 'field_map' && sportKey.includes('soccer')) {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="none">
        {/* Center circle */}
        <circle cx="50" cy="65" r="12" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Center line */}
        <line x1="0" y1="65" x2="100" y2="65" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Penalty box bottom */}
        <rect x="20" y="100" width="60" height="25" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Goal box bottom */}
        <rect x="30" y="115" width="40" height="15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
        {/* Penalty box top */}
        <rect x="20" y="0" width="60" height="25" fill="none" stroke="white" strokeWidth="0.3" opacity="0.4" />
      </svg>
    );
  }

  if (templateType === 'formation') {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        {/* Yard lines */}
        {[20, 40, 60, 80].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.2" opacity="0.3" />
        ))}
        {/* Line of scrimmage */}
        <line x1="0" y1="80" x2="100" y2="80" stroke="yellow" strokeWidth="0.4" opacity="0.6" />
      </svg>
    );
  }

  return null;
}

// Grouped list view for sports without formation templates
function GroupedListView({ 
  members, 
  highlightedMemberId 
}: { 
  members: TeamMemberForLayout[];
  highlightedMemberId: string | null;
}) {
  // Group by position
  const grouped = useMemo(() => {
    const groups = new Map<string, TeamMemberForLayout[]>();
    
    for (const member of members) {
      const primaryPos = member.positions[0] || 'Unassigned';
      const existing = groups.get(primaryPos) || [];
      groups.set(primaryPos, [...existing, member]);
    }
    
    return groups;
  }, [members]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {Array.from(grouped.entries()).map(([position, groupMembers]) => (
        <div key={position} className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">{position}</h4>
          <div className="space-y-2">
            {groupMembers.map(m => (
              <div 
                key={m.id}
                className={cn(
                  'transition-all',
                  highlightedMemberId === m.id && 'ring-2 ring-primary rounded-xl'
                )}
              >
                <SportsCard data={m.cardData} size="small" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
