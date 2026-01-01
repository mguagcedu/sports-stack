import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { SportsCard } from '../SportsCard';
import { TeamMemberForLayout, LayoutSlot } from './types';
import { DRAG_TYPE } from './DraggableMemberCard';

interface DroppableSlotProps {
  slot: LayoutSlot;
  member: TeamMemberForLayout | null;
  isHighlighted?: boolean;
  onDrop: (memberId: string) => void;
  onRemove: () => void;
}

export function DroppableSlot({ slot, member, isHighlighted, onDrop, onRemove }: DroppableSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: (item: { memberId: string }) => {
      onDrop(item.memberId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  return (
    <div
      ref={drop}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      {member ? (
        <div 
          className={cn(
            'relative transition-all duration-300 cursor-pointer group',
            isHighlighted && 'scale-110 ring-4 ring-primary ring-offset-2 rounded-xl',
            isOver && 'ring-4 ring-green-500 ring-offset-2 rounded-xl'
          )}
          onDoubleClick={onRemove}
        >
          <SportsCard data={member.cardData} size="small" />
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="bg-destructive text-destructive-foreground rounded-full p-1 text-xs shadow-lg hover:bg-destructive/90"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            'w-20 h-28 rounded-lg border-2 border-dashed',
            'flex flex-col items-center justify-center',
            'bg-black/20 backdrop-blur-sm cursor-pointer transition-all',
            isOver && canDrop 
              ? 'border-green-500 bg-green-500/20 scale-105' 
              : 'border-white/30 hover:border-white/50 hover:bg-black/30'
          )}
        >
          <span className="text-white/70 font-bold text-sm">{slot.label}</span>
          <span className="text-white/40 text-xs">Drop here</span>
        </div>
      )}
    </div>
  );
}
