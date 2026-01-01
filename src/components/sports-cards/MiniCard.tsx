import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface MiniCardProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  positions?: string[];
  lineGroups?: string[];
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const MiniCard = forwardRef<HTMLDivElement, MiniCardProps>(({
  firstName,
  lastName,
  photoUrl,
  jerseyNumber,
  positions = [],
  lineGroups = [],
  onClick,
  isActive = false,
  className,
}, ref) => {
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
        'hover:bg-accent/50',
        isActive && 'bg-accent ring-2 ring-primary',
        className
      )}
    >
      {/* Mini photo */}
      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        {jerseyNumber && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded">
            {jerseyNumber}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {firstName} {lastName}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {positions.slice(0, 2).map((pos, i) => (
            <span 
              key={i}
              className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium"
            >
              {pos}
            </span>
          ))}
          {lineGroups.slice(0, 1).map((lg, i) => (
            <span 
              key={i}
              className="text-[9px] px-1 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {lg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

MiniCard.displayName = 'MiniCard';
