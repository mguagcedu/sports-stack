import { Badge as BadgeType } from './types';
import { Star, Award, Trophy, Shield, Crown, Zap, Target, Medal } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  award: Award,
  trophy: Trophy,
  shield: Shield,
  crown: Crown,
  zap: Zap,
  target: Target,
  medal: Medal,
  captain: Crown,
  mvp: Trophy,
  allstar: Star,
  starter: Zap,
};

interface CardBadgeProps {
  badge: BadgeType;
  size?: 'small' | 'medium';
}

export function CardBadge({ badge, size = 'small' }: CardBadgeProps) {
  const Icon = iconMap[badge.icon || badge.key] || Award;
  const sizeClasses = size === 'small' 
    ? 'h-4 px-1.5 text-[10px] gap-0.5' 
    : 'h-5 px-2 text-xs gap-1';
  const iconSize = size === 'small' ? 10 : 12;

  return (
    <div 
      className={`inline-flex items-center ${sizeClasses} rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-semibold shadow-sm`}
    >
      <Icon size={iconSize} className="shrink-0" />
      <span className="truncate">{badge.label}</span>
    </div>
  );
}
