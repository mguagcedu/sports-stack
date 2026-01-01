import { cn } from '@/lib/utils';
import { MiniCard } from '../MiniCard';
import { TeamMemberForLayout } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RosterSidebarProps {
  members: TeamMemberForLayout[];
  lineGroups: Array<{ id: string; displayName: string }>;
  positionGroups: string[];
  selectedMemberId: string | null;
  onMemberClick: (memberId: string) => void;
  filterLineGroup: string | null;
  filterPositionGroup: string | null;
  filterStartersOnly: boolean;
  onFilterChange: (filter: {
    lineGroup: string | null;
    positionGroup: string | null;
    startersOnly: boolean;
  }) => void;
  className?: string;
}

export function RosterSidebar({
  members,
  lineGroups,
  positionGroups,
  selectedMemberId,
  onMemberClick,
  filterLineGroup,
  filterPositionGroup,
  filterStartersOnly,
  onFilterChange,
  className,
}: RosterSidebarProps) {
  const [search, setSearch] = useState('');

  // Filter members
  const filteredMembers = members.filter(m => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const fullName = `${m.cardData.firstName} ${m.cardData.lastName}`.toLowerCase();
      if (!fullName.includes(searchLower)) return false;
    }
    
    // Line group filter
    if (filterLineGroup && !m.lineGroups.includes(filterLineGroup)) {
      return false;
    }
    
    // Position group filter
    if (filterPositionGroup && !m.positions.some(p => p.startsWith(filterPositionGroup))) {
      return false;
    }
    
    // Starters only
    if (filterStartersOnly && !m.isStarter) {
      return false;
    }
    
    return true;
  });

  // Group by role
  const coaches = filteredMembers.filter(m => m.cardData.role === 'coach');
  const athletes = filteredMembers.filter(m => m.cardData.role === 'player');
  const staff = filteredMembers.filter(m => m.cardData.role === 'staff');

  return (
    <div className={cn('flex flex-col h-full bg-card border-l', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <h3 className="font-semibold text-sm">Roster ({members.length})</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select
            value={filterLineGroup || 'all'}
            onValueChange={v => onFilterChange({
              lineGroup: v === 'all' ? null : v,
              positionGroup: filterPositionGroup,
              startersOnly: filterStartersOnly,
            })}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              {lineGroups.map(lg => (
                <SelectItem key={lg.id} value={lg.id}>{lg.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterPositionGroup || 'all'}
            onValueChange={v => onFilterChange({
              lineGroup: filterLineGroup,
              positionGroup: v === 'all' ? null : v,
              startersOnly: filterStartersOnly,
            })}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positionGroups.map(pg => (
                <SelectItem key={pg} value={pg}>{pg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Starters toggle */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={filterStartersOnly}
            onChange={e => onFilterChange({
              lineGroup: filterLineGroup,
              positionGroup: filterPositionGroup,
              startersOnly: e.target.checked,
            })}
            className="rounded"
          />
          Starters only
        </label>
      </div>

      {/* Member list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Coaches */}
          {coaches.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                Coaches ({coaches.length})
              </h4>
              <div className="space-y-0.5">
                {coaches.map(m => (
                  <MiniCard
                    key={m.id}
                    firstName={m.cardData.firstName}
                    lastName={m.cardData.lastName}
                    photoUrl={m.cardData.photoUrl}
                    positions={[m.cardData.roleTitle || 'Coach']}
                    onClick={() => onMemberClick(m.id)}
                    isActive={selectedMemberId === m.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Athletes */}
          {athletes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                Athletes ({athletes.length})
              </h4>
              <div className="space-y-0.5">
                {athletes.map(m => (
                  <MiniCard
                    key={m.id}
                    firstName={m.cardData.firstName}
                    lastName={m.cardData.lastName}
                    photoUrl={m.cardData.photoUrl}
                    jerseyNumber={m.cardData.jerseyNumber}
                    positions={m.positions.slice(0, 2)}
                    lineGroups={m.lineGroups.slice(0, 1)}
                    onClick={() => onMemberClick(m.id)}
                    isActive={selectedMemberId === m.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Staff */}
          {staff.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                Staff ({staff.length})
              </h4>
              <div className="space-y-0.5">
                {staff.map(m => (
                  <MiniCard
                    key={m.id}
                    firstName={m.cardData.firstName}
                    lastName={m.cardData.lastName}
                    photoUrl={m.cardData.photoUrl}
                    positions={[m.cardData.roleTitle || 'Staff']}
                    onClick={() => onMemberClick(m.id)}
                    isActive={selectedMemberId === m.id}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredMembers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No members match filters
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
