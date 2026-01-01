import { CardBackgroundStyle } from './types';
import { cn } from '@/lib/utils';

interface CardBackgroundProps {
  style: CardBackgroundStyle;
  accentColor?: string | null;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const styleClasses: Record<CardBackgroundStyle, string> = {
  classic: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-600',
  neon: 'bg-gradient-to-br from-violet-950 via-fuchsia-950 to-purple-950 border-fuchsia-500',
  chrome: 'bg-gradient-to-br from-zinc-200 via-slate-300 to-zinc-400 border-zinc-400',
  matte: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-neutral-600',
  heritage: 'bg-gradient-to-br from-amber-950 via-orange-950 to-red-950 border-amber-700',
};

const overlayClasses: Record<CardBackgroundStyle, string> = {
  classic: 'from-transparent via-transparent to-black/40',
  neon: 'from-fuchsia-500/10 via-transparent to-purple-900/50',
  chrome: 'from-white/30 via-transparent to-black/20',
  matte: 'from-transparent via-transparent to-black/30',
  heritage: 'from-amber-500/10 via-transparent to-black/40',
};

export function CardBackground({ style, accentColor, children, className, onClick }: CardBackgroundProps) {
  const accentStyle = accentColor 
    ? { '--card-accent': accentColor } as React.CSSProperties 
    : {};

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-xl border-2 shadow-2xl',
        styleClasses[style],
        className
      )}
      style={accentStyle}
      onClick={onClick}
    >
      {/* Holographic shimmer effect */}
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:200%_200%] animate-[shimmer_3s_ease-in-out_infinite]" />
      
      {/* Gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-b pointer-events-none', overlayClasses[style])} />
      
      {/* Accent glow */}
      {accentColor && (
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
