import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SportsCard } from '../SportsCard';
import { RevealCard } from './types';

interface CardRevealAnimationProps {
  card: RevealCard;
  delay: number;
  onRevealComplete: () => void;
}

export function CardRevealAnimation({ card, delay, onRevealComplete }: CardRevealAnimationProps) {
  const [phase, setPhase] = useState<'hidden' | 'flipping' | 'revealed'>('hidden');

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setPhase('flipping');
    }, delay);

    const revealTimer = setTimeout(() => {
      setPhase('revealed');
      onRevealComplete();
    }, delay + 600);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(revealTimer);
    };
  }, [delay, onRevealComplete]);

  const categoryLabel = {
    head_coach: 'HEAD COACH',
    captain: 'CAPTAIN',
    starter: 'STARTER',
    roster: '',
  }[card.revealCategory];

  return (
    <div className="relative perspective-1000">
      {/* Category announcement */}
      {categoryLabel && phase === 'flipping' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
            {categoryLabel}
          </span>
        </div>
      )}

      {/* Card back (hidden state) */}
      <div
        className={cn(
          'absolute inset-0 backface-hidden transition-transform duration-500',
          'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
          'rounded-xl border-2 border-slate-600 shadow-2xl',
          'flex items-center justify-center',
          phase === 'hidden' && 'rotate-y-0',
          phase !== 'hidden' && 'rotate-y-180'
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Card back design */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
          <span className="text-2xl font-black text-white">?</span>
        </div>
      </div>

      {/* Card front */}
      <div
        className={cn(
          'transition-all duration-500',
          phase === 'hidden' && 'opacity-0 rotate-y-180 scale-90',
          phase === 'flipping' && 'opacity-100 rotate-y-0 scale-100',
          phase === 'revealed' && 'opacity-100 rotate-y-0 scale-100'
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {/* Glow effect during reveal */}
        {phase === 'flipping' && (
          <div className="absolute inset-0 rounded-xl bg-white/30 blur-xl animate-pulse" />
        )}
        
        <SportsCard data={card} size="medium" />
      </div>
    </div>
  );
}
