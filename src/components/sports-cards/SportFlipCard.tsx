import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getTextColor } from '@/lib/colorExtraction';

interface SportFlipCardProps {
  sportName: string;
  sportCode: string;
  seasonLabel?: string;
  quickStats?: { label: string; value: string | number }[];
  logoUrl: string | null;
  teamName?: string;
  schoolName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  onClick?: () => void;
  className?: string;
}

export function SportFlipCard({
  sportName,
  sportCode,
  seasonLabel,
  quickStats,
  logoUrl,
  teamName,
  schoolName,
  primaryColor = '#1e40af',
  secondaryColor = '#f59e0b',
  onClick,
  className,
}: SportFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
    if (e.key === 'Escape' && isFlipped) {
      setIsFlipped(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFlip();
    if (onClick && !isFlipped) {
      onClick();
    }
  };

  const textColorOnPrimary = getTextColor(primaryColor);
  const textColorOnSecondary = getTextColor(secondaryColor);

  // Sport icons mapping
  const sportIcons: Record<string, string> = {
    football: '🏈',
    basketball: '🏀',
    baseball: '⚾',
    softball: '🥎',
    soccer: '⚽',
    volleyball: '🏐',
    tennis: '🎾',
    golf: '⛳',
    swimming: '🏊',
    track: '🏃',
    cross_country: '🏃',
    wrestling: '🤼',
    hockey: '🏒',
    lacrosse: '🥍',
    cheerleading: '📣',
    dance: '💃',
    gymnastics: '🤸',
    default: '🏆',
  };

  const sportIcon = sportIcons[sportCode.toLowerCase()] || sportIcons.default;

  return (
    <div
      className={cn(
        "relative w-full aspect-[3/4] cursor-pointer perspective-1000",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${sportName} card. Press Enter to flip.`}
      ref={cardRef}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden shadow-lg border"
          style={{ 
            backfaceVisibility: 'hidden',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40" />
          
          {/* Content */}
          <div className="relative h-full flex flex-col p-4">
            {/* Sport Icon & Name */}
            <div className="flex items-center gap-2 mb-auto">
              <span className="text-3xl">{sportIcon}</span>
              <div>
                <h3 
                  className="text-lg font-bold tracking-tight"
                  style={{ color: textColorOnPrimary }}
                >
                  {sportName}
                </h3>
                {seasonLabel && (
                  <span 
                    className="text-xs opacity-80"
                    style={{ color: textColorOnPrimary }}
                  >
                    {seasonLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            {quickStats && quickStats.length > 0 && (
              <div className="mt-auto grid grid-cols-2 gap-2">
                {quickStats.slice(0, 4).map((stat, i) => (
                  <div 
                    key={i} 
                    className="rounded-lg p-2 bg-white/10 backdrop-blur-sm"
                  >
                    <div 
                      className="text-lg font-bold"
                      style={{ color: textColorOnPrimary }}
                    >
                      {stat.value}
                    </div>
                    <div 
                      className="text-xs opacity-70"
                      style={{ color: textColorOnPrimary }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tap hint */}
            <div 
              className="mt-4 text-center text-xs opacity-60"
              style={{ color: textColorOnPrimary }}
            >
              Tap to flip
            </div>
          </div>

          {/* Decorative pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: textColorOnPrimary }} />
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: textColorOnPrimary }} />
              <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: textColorOnPrimary }} />
            </svg>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden backface-hidden shadow-lg border rotate-y-180"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: `linear-gradient(180deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
          }}
        >
          {/* Subtle pattern background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${textColorOnSecondary} 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            {/* Logo */}
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${sportName} logo`}
                className="w-24 h-24 object-contain mb-4 drop-shadow-lg"
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 bg-white/10 backdrop-blur-sm"
              >
                {sportIcon}
              </div>
            )}

            {/* Team/School Name */}
            {teamName && (
              <h3 
                className="text-xl font-bold text-center mb-1"
                style={{ color: textColorOnSecondary }}
              >
                {teamName}
              </h3>
            )}
            {schoolName && (
              <p 
                className="text-sm opacity-80 text-center"
                style={{ color: textColorOnSecondary }}
              >
                {schoolName}
              </p>
            )}

            {/* Sport Name */}
            <div 
              className="mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
            >
              <span 
                className="text-sm font-medium"
                style={{ color: textColorOnSecondary }}
              >
                {sportName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sport cards grid component
interface SportCardsGridProps {
  sports: Array<{
    sportCode: string;
    sportName: string;
    seasonLabel?: string;
    logoUrl: string | null;
    teamName?: string;
    schoolName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    quickStats?: { label: string; value: string | number }[];
  }>;
  onSportClick?: (sportCode: string) => void;
  className?: string;
}

export function SportCardsGrid({ sports, onSportClick, className }: SportCardsGridProps) {
  if (sports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No sports available</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {sports.map((sport) => (
        <SportFlipCard
          key={sport.sportCode}
          {...sport}
          onClick={() => onSportClick?.(sport.sportCode)}
        />
      ))}
    </div>
  );
}
