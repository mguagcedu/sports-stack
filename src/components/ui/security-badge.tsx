import { cn } from '@/lib/utils';
import { Lock, LockOpen, Eye, EyeOff, Shield, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SecurityBadgeProps {
  type: 'locked' | 'unlocked' | 'private' | 'public' | 'protected' | 'warning';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const icons = {
  locked: Lock,
  unlocked: LockOpen,
  private: EyeOff,
  public: Eye,
  protected: Shield,
  warning: ShieldAlert,
};

const colors = {
  locked: 'text-green-600 bg-green-500/10',
  unlocked: 'text-yellow-600 bg-yellow-500/10',
  private: 'text-muted-foreground bg-muted',
  public: 'text-blue-600 bg-blue-500/10',
  protected: 'text-green-600 bg-green-500/10',
  warning: 'text-destructive bg-destructive/10',
};

const labels = {
  locked: 'Secured',
  unlocked: 'Unlocked',
  private: 'Private',
  public: 'Public',
  protected: 'Protected',
  warning: 'Security Warning',
};

const sizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const paddings = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
};

export function SecurityBadge({ 
  type, 
  label, 
  size = 'md', 
  showLabel = false,
  className 
}: SecurityBadgeProps) {
  const Icon = icons[type];
  const displayLabel = label || labels[type];

  const badge = (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full',
      colors[type],
      paddings[size],
      showLabel && 'px-2',
      className
    )}>
      <Icon className={sizes[size]} />
      {showLabel && (
        <span className="text-xs font-medium">{displayLabel}</span>
      )}
    </div>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{displayLabel}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
