import { cn } from '@/lib/utils';
import { Position } from './types';

interface PositionPillProps {
  position: Position;
  isPrimary?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function PositionPill({ position, isPrimary = false, size = 'medium' }: PositionPillProps) {
  const sizeClasses = {
    small: 'text-[9px] px-1.5 py-0.5',
    medium: 'text-[10px] px-2 py-0.5',
    large: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-bold uppercase tracking-wide',
        sizeClasses[size],
        isPrimary
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-white/20 text-white/90 backdrop-blur-sm'
      )}
    >
      {position.position_key}
    </span>
  );
}
