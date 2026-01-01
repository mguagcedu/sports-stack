import { cn } from '@/lib/utils';
import { CardRenderVariant } from './types';

interface RoleRibbonProps {
  role: CardRenderVariant;
  roleTitle?: string;
}

const roleStyles: Record<CardRenderVariant, { bg: string; text: string; label: string }> = {
  player: { bg: 'bg-blue-600', text: 'text-white', label: 'ATHLETE' },
  coach: { bg: 'bg-amber-600', text: 'text-white', label: 'COACH' },
  staff: { bg: 'bg-emerald-600', text: 'text-white', label: 'STAFF' },
};

export function RoleRibbon({ role, roleTitle }: RoleRibbonProps) {
  if (role === 'player') return null;
  
  const style = roleStyles[role];
  const displayTitle = roleTitle || style.label;

  return (
    <div className="absolute top-3 -right-8 z-20">
      <div 
        className={cn(
          'px-10 py-1 transform rotate-45 shadow-lg',
          'text-[10px] font-bold uppercase tracking-wider text-center',
          style.bg,
          style.text
        )}
      >
        {displayTitle}
      </div>
    </div>
  );
}
