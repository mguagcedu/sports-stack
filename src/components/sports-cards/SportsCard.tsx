import { cn } from '@/lib/utils';
import { SportsCardProps } from './types';
import { CardBackground } from './CardBackground';
import { CardBadge } from './CardBadge';
import { PositionPill } from './PositionPill';
import { LineGroupPill } from './LineGroupPill';
import { RoleRibbon } from './RoleRibbon';
import { PlayerSilhouette } from './PlayerSilhouette';

// Calculate current grade from graduation year
function calculateGrade(gradYear: number | null | undefined): string | null {
  if (!gradYear) return null;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  // If after June, use next school year
  const schoolYear = currentMonth >= 6 ? currentYear + 1 : currentYear;
  const yearsUntilGrad = gradYear - schoolYear;
  
  if (yearsUntilGrad < 0) return 'Alumni';
  if (yearsUntilGrad === 0) return 'Senior';
  if (yearsUntilGrad === 1) return 'Junior';
  if (yearsUntilGrad === 2) return 'Sophomore';
  if (yearsUntilGrad === 3) return 'Freshman';
  if (yearsUntilGrad === 4) return '8th';
  if (yearsUntilGrad === 5) return '7th';
  if (yearsUntilGrad === 6) return '6th';
  return `${12 - yearsUntilGrad}th`;
}

const sizeConfig = {
  mini: { width: 'w-16', height: 'h-24', photoHeight: 'h-14', showDetails: false },
  small: { width: 'w-28', height: 'h-40', photoHeight: 'h-20', showDetails: false },
  medium: { width: 'w-48', height: 'h-72', photoHeight: 'h-36', showDetails: true },
  large: { width: 'w-64', height: 'h-96', photoHeight: 'h-48', showDetails: true },
};

export function SportsCard({ 
  data, 
  size = 'medium', 
  onClick, 
  className,
  showDetails: showDetailsProp
}: SportsCardProps) {
  const config = sizeConfig[size];
  const showDetails = showDetailsProp ?? config.showDetails;
  const primaryPosition = data.positions.find(p => p.is_primary) || data.positions[0];
  const secondaryPositions = data.positions.filter(p => p.id !== primaryPosition?.id);
  const primaryLineGroup = data.lineGroups.find(l => l.is_primary) || data.lineGroups[0];
  const otherLineGroups = data.lineGroups.filter(l => l.id !== primaryLineGroup?.id);

  const isMini = size === 'mini';
  const isSmall = size === 'small';

  return (
    <CardBackground
      style={data.backgroundStyle}
      accentColor={data.accentColor}
      className={cn(
        config.width,
        config.height,
        'flex flex-col cursor-pointer transition-all duration-300',
        'hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Role ribbon for coaches/staff */}
      {!isMini && <RoleRibbon role={data.role} roleTitle={data.roleTitle} />}

      {/* Top bar with jersey number and sport */}
      {!isMini && (
        <div className="flex items-center justify-between px-2 pt-2">
          {data.jerseyNumber && (
            <span className={cn(
              'font-black text-white drop-shadow-lg',
              isSmall ? 'text-lg' : 'text-2xl'
            )}>
              #{data.jerseyNumber}
            </span>
          )}
          <span className={cn(
            'text-white/70 uppercase tracking-wider font-medium truncate ml-auto',
            isSmall ? 'text-[8px]' : 'text-[10px]'
          )}>
            {data.sportName}
          </span>
        </div>
      )}

      {/* Photo area */}
      <div className={cn('relative flex-1 overflow-hidden', isMini && 'rounded-t-lg')}>
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={`${data.firstName} ${data.lastName}`}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <PlayerSilhouette className="w-full h-full" />
        )}
        
        {/* Rating badge */}
        {showDetails && data.showRating && data.ratingOverall && (
          <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white/30">
            <span className="text-lg font-black text-white drop-shadow">{data.ratingOverall}</span>
          </div>
        )}

        {/* Grade badge - prominent display */}
        {data.gradYear && !isMini && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/20">
            <span className={cn(
              'font-bold text-white',
              isSmall ? 'text-[10px]' : 'text-xs'
            )}>
              {calculateGrade(data.gradYear)}
            </span>
          </div>
        )}

        {/* Position overlay */}
        {primaryPosition && !isMini && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            <PositionPill 
              position={primaryPosition} 
              isPrimary 
              size={isSmall ? 'small' : 'medium'} 
            />
            {showDetails && secondaryPositions.slice(0, 2).map(pos => (
              <PositionPill 
                key={pos.id} 
                position={pos} 
                size="small" 
              />
            ))}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className={cn(
        'bg-black/60 backdrop-blur-sm',
        isMini ? 'px-1 py-1' : isSmall ? 'px-2 py-2' : 'px-3 py-3'
      )}>
        {/* Name */}
        <div className={cn(
          'font-bold text-white truncate',
          isMini ? 'text-[8px]' : isSmall ? 'text-xs' : 'text-base'
        )}>
          {isMini ? (
            `${data.firstName.charAt(0)}. ${data.lastName}`
          ) : (
            `${data.firstName} ${data.lastName}`
          )}
        </div>

        {/* Team and season */}
        {!isMini && (
          <div className={cn(
            'text-white/60 truncate',
            isSmall ? 'text-[8px]' : 'text-xs'
          )}>
            {data.teamName} • {data.seasonLabel}
          </div>
        )}

        {/* Details section */}
        {showDetails && (
          <>
            {/* Grad year and physical stats */}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
              {data.gradYear && (
                <span className="font-medium text-white/70">
                  {calculateGrade(data.gradYear)} • Class of {data.gradYear}
                </span>
              )}
              {data.height && <span>• {data.height}</span>}
              {data.weight && <span>• {data.weight}</span>}
            </div>

            {/* Line groups */}
            {data.lineGroups.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {primaryLineGroup && (
                  <LineGroupPill lineGroup={primaryLineGroup} isPrimary size="medium" />
                )}
                {otherLineGroups.slice(0, 2).map(lg => (
                  <LineGroupPill key={lg.id} lineGroup={lg} size="small" />
                ))}
              </div>
            )}

            {/* Badges */}
            {data.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.badges.slice(0, 3).map(badge => (
                  <CardBadge key={badge.key} badge={badge} size="small" />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* School logo watermark */}
      {data.schoolLogo && !isMini && (
        <div className="absolute bottom-12 right-2 opacity-20">
          <img 
            src={data.schoolLogo} 
            alt={data.schoolName} 
            className={cn(
              'object-contain',
              isSmall ? 'w-6 h-6' : 'w-10 h-10'
            )} 
          />
        </div>
      )}
    </CardBackground>
  );
}
