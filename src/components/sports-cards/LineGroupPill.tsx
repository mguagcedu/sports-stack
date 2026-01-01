import { cn } from '@/lib/utils';
import { LineGroup } from './types';

interface LineGroupPillProps {
  lineGroup: LineGroup;
  isPrimary?: boolean;
  size?: 'small' | 'medium';
}

export function LineGroupPill({ lineGroup, isPrimary = false, size = 'small' }: LineGroupPillProps) {
  const sizeClasses = {
    small: 'text-[8px] px-1.5 py-0.5',
    medium: 'text-[10px] px-2 py-0.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold uppercase tracking-wider',
        sizeClasses[size],
        isPrimary
          ? 'bg-emerald-500/90 text-white shadow-sm'
          : 'bg-white/10 text-white/70 border border-white/20'
      )}
    >
      {lineGroup.display_name}
    </span>
  );
}
