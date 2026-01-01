import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CardRevealAnimation } from './CardRevealAnimation';
import { RevealCard } from './types';

interface RevealStageProps {
  cards: RevealCard[];
  onAllRevealed: () => void;
}

export function RevealStage({ cards, onAllRevealed }: RevealStageProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sort cards by reveal order
  const sortedCards = useMemo(() => 
    [...cards].sort((a, b) => a.revealOrder - b.revealOrder),
    [cards]
  );

  // Show max 5 cards at a time in the reveal zone
  const visibleCards = sortedCards.slice(
    Math.max(0, activeIndex - 2),
    activeIndex + 3
  );

  const handleRevealComplete = useCallback(() => {
    const newCount = revealedCount + 1;
    setRevealedCount(newCount);
    
    if (newCount < sortedCards.length) {
      setActiveIndex(newCount);
    } else {
      // All cards revealed
      setTimeout(onAllRevealed, 500);
    }
  }, [revealedCount, sortedCards.length, onAllRevealed]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {revealedCount + 1} / {sortedCards.length}
      </div>

      {/* Cards carousel */}
      <div className="relative flex items-center justify-center gap-4 perspective-1000">
        {visibleCards.map((card, idx) => {
          const globalIndex = sortedCards.findIndex(c => c.id === card.id);
          const offset = globalIndex - activeIndex;
          const isActive = offset === 0;
          const isPast = offset < 0;
          
          return (
            <div
              key={card.id}
              className={cn(
                'transition-all duration-500 absolute',
                isActive && 'z-20 scale-100 opacity-100',
                !isActive && isPast && 'z-10 scale-75 opacity-30 -translate-x-48',
                !isActive && !isPast && 'z-10 scale-75 opacity-30 translate-x-48'
              )}
            >
              <CardRevealAnimation
                card={card}
                delay={isActive ? 300 : 99999}
                onRevealComplete={isActive ? handleRevealComplete : () => {}}
              />
            </div>
          );
        })}
      </div>

      {/* Revealed cards tray at bottom */}
      <div className="absolute bottom-8 left-0 right-0 overflow-x-auto px-8">
        <div className="flex gap-2 justify-center">
          {sortedCards.slice(0, revealedCount).map((card) => (
            <div
              key={`mini-${card.id}`}
              className="w-12 h-16 rounded bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 overflow-hidden animate-fade-in"
            >
              {card.photoUrl ? (
                <img 
                  src={card.photoUrl} 
                  alt={card.firstName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-white/50 font-bold">
                  {card.firstName.charAt(0)}{card.lastName.charAt(0)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
