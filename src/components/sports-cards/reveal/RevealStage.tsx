import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CardRevealAnimation } from './CardRevealAnimation';
import { RevealCard } from './types';
import { Button } from '@/components/ui/button';
import { ChevronRight, SkipForward } from 'lucide-react';

interface RevealStageProps {
  cards: RevealCard[];
  onAllRevealed: () => void;
  autoAdvance?: boolean; // If true, cards auto-advance after delay
  autoAdvanceDelay?: number; // Delay between cards (default 3500ms for ~10-15s total)
}

export function RevealStage({ 
  cards, 
  onAllRevealed,
  autoAdvance = true,
  autoAdvanceDelay = 3500, // 3.5 seconds per card
}: RevealStageProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardRevealed, setCardRevealed] = useState(false);

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

  const advanceToNext = useCallback(() => {
    const newCount = revealedCount + 1;
    setRevealedCount(newCount);
    setCardRevealed(false);
    
    if (newCount < sortedCards.length) {
      setActiveIndex(newCount);
    } else {
      // All cards revealed
      setTimeout(onAllRevealed, 500);
    }
  }, [revealedCount, sortedCards.length, onAllRevealed]);

  const handleCardFlipComplete = useCallback(() => {
    setCardRevealed(true);
  }, []);

  const handleSkipAll = useCallback(() => {
    onAllRevealed();
  }, [onAllRevealed]);

  const isLastCard = activeIndex === sortedCards.length - 1;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <span className="text-white/60 text-sm">
          {revealedCount + 1} / {sortedCards.length}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkipAll}
          className="text-white/40 hover:text-white/80 text-xs"
        >
          <SkipForward className="w-3 h-3 mr-1" />
          Skip All
        </Button>
      </div>

      {/* Cards carousel */}
      <div className="relative flex items-center justify-center gap-4 perspective-1000 mb-24">
        {visibleCards.map((card) => {
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
                autoAdvanceDelay={isActive && autoAdvance ? autoAdvanceDelay : 0}
                onRevealComplete={isActive ? advanceToNext : () => {}}
                onCardClick={isActive && cardRevealed ? advanceToNext : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Next button - shows after card is revealed */}
      {cardRevealed && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-fade-in">
          <Button 
            size="lg" 
            onClick={advanceToNext}
            className="gap-2 px-8"
          >
            {isLastCard ? 'Finish' : 'Next Card'}
            <ChevronRight className="w-5 h-5" />
          </Button>
          {autoAdvance && (
            <p className="text-center text-xs text-white/40 mt-2">
              or click the card • auto-advancing...
            </p>
          )}
        </div>
      )}

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