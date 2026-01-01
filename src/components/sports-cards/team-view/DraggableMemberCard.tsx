import { useDrag } from 'react-dnd';
import { cn } from '@/lib/utils';
import { MiniCard } from '../MiniCard';
import { TeamMemberForLayout } from './types';

export const DRAG_TYPE = 'TEAM_MEMBER';

interface DraggableMemberCardProps {
  member: TeamMemberForLayout;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DraggableMemberCard({ member, isSelected, onClick }: DraggableMemberCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPE,
    item: { memberId: member.id, membershipId: member.membershipId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [member.id, member.membershipId]);

  return (
    <div 
      ref={drag}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-opacity',
        isDragging && 'opacity-50'
      )}
      onClick={onClick}
    >
      <MiniCard
        firstName={member.cardData.firstName}
        lastName={member.cardData.lastName}
        photoUrl={member.cardData.photoUrl}
        jerseyNumber={member.cardData.jerseyNumber}
        positions={member.positions.slice(0, 2)}
        lineGroups={member.lineGroups.slice(0, 1)}
        isActive={isSelected}
      />
    </div>
  );
}
