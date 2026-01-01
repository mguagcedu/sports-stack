import { 
  Activity,
  Bike,
  Target,
  Circle,
  Waves,
  Wind,
  Footprints,
  Trophy,
  Flag,
  Swords,
  Dumbbell,
  Volleyball,
  Snowflake,
  Gamepad2,
  Music,
  Crosshair,
  type LucideIcon
} from 'lucide-react';
import { useSchoolBranding } from '@/contexts/SchoolBrandingContext';
import { cn } from '@/lib/utils';

// Map of sport icon keys to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  football: Activity,
  basketball: Circle,
  baseball: Target,
  softball: Target,
  soccer: Circle,
  volleyball: Volleyball,
  tennis: Activity,
  golf: Flag,
  swimming: Waves,
  track: Footprints,
  cross_country: Wind,
  wrestling: Swords,
  lacrosse: Activity,
  hockey: Activity,
  cheerleading: Trophy,
  gymnastics: Dumbbell,
  cycling: Bike,
  skiing: Snowflake,
  bowling: Circle,
  dance: Music,
  archery: Crosshair,
  rugby: Activity,
  weightlifting: Dumbbell,
  esports: Gamepad2,
  default: Activity
};

interface SportIconProps {
  sportIconKey?: string | null;
  sportName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  useSchoolColors?: boolean;
}

export function SportIcon({ 
  sportIconKey, 
  sportName, 
  size = 'md', 
  className,
  useSchoolColors = true 
}: SportIconProps) {
  const { branding } = useSchoolBranding();
  
  // Determine icon to use
  const key = sportIconKey?.toLowerCase() || 
    sportName?.toLowerCase().replace(/[^a-z]/g, '_') || 
    'default';
  const Icon = iconMap[key] || iconMap.default;
  
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  // Apply school colors if enabled and available
  const style = useSchoolColors && branding.schoolId ? {
    color: branding.primaryColor.startsWith('#') 
      ? branding.primaryColor 
      : `hsl(${branding.primaryColor})`
  } : undefined;

  return (
    <Icon 
      className={cn(sizeClasses[size], className)} 
      style={style}
    />
  );
}

// Wrapper component for sport tiles with background
interface SportTileProps {
  sportIconKey?: string | null;
  sportName: string;
  imageUrl?: string | null;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SportTile({ 
  sportIconKey, 
  sportName, 
  imageUrl,
  selected, 
  onClick,
  className 
}: SportTileProps) {
  const { branding } = useSchoolBranding();
  
  const primaryColor = branding.schoolId && branding.primaryColor.startsWith('#')
    ? branding.primaryColor
    : undefined;
  const secondaryColor = branding.schoolId && branding.secondaryColor.startsWith('#')
    ? branding.secondaryColor
    : undefined;

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border-2 transition-all text-center",
        selected 
          ? "ring-2 ring-offset-2 ring-primary" 
          : "hover:border-primary/50",
        className
      )}
      style={{
        borderColor: selected && primaryColor ? primaryColor : undefined,
        ...(selected && primaryColor ? { '--tw-ring-color': primaryColor } as React.CSSProperties : {})
      }}
    >
      <div 
        className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center overflow-hidden"
        style={{ 
          backgroundColor: primaryColor ? `${primaryColor}15` : 'hsl(var(--primary) / 0.1)'
        }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={sportName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <SportIcon 
            sportIconKey={sportIconKey} 
            sportName={sportName}
            size="lg"
          />
        )}
      </div>
      <span className="text-sm font-medium">{sportName}</span>
    </button>
  );
}
