import { useMemo } from 'react';
import { getPasswordStrength, validatePasswordRequirements, PasswordRequirements, defaultPasswordRequirements } from '@/lib/passwordValidation';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  requirements?: PasswordRequirements;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({ 
  password, 
  requirements = defaultPasswordRequirements,
  showRequirements = true 
}: PasswordStrengthMeterProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const validation = useMemo(
    () => validatePasswordRequirements(password, requirements),
    [password, requirements]
  );

  const strengthColors = {
    weak: 'bg-destructive',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthPercent = {
    weak: 25,
    fair: 50,
    good: 75,
    strong: 100,
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            'font-medium capitalize',
            strength.label === 'weak' && 'text-destructive',
            strength.label === 'fair' && 'text-orange-500',
            strength.label === 'good' && 'text-yellow-500',
            strength.label === 'strong' && 'text-green-500'
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-300', strengthColors[strength.label])}
            style={{ width: `${strengthPercent[strength.label]}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <RequirementItem 
            met={password.length >= requirements.minLength} 
            text={`At least ${requirements.minLength} characters`} 
          />
          {requirements.requireUppercase && (
            <RequirementItem 
              met={/[A-Z]/.test(password)} 
              text="One uppercase letter" 
            />
          )}
          {requirements.requireLowercase && (
            <RequirementItem 
              met={/[a-z]/.test(password)} 
              text="One lowercase letter" 
            />
          )}
          {requirements.requireNumber && (
            <RequirementItem 
              met={/[0-9]/.test(password)} 
              text="One number" 
            />
          )}
          {requirements.requireSpecial && (
            <RequirementItem 
              met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} 
              text="One special character" 
            />
          )}
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2 text-xs transition-colors',
      met ? 'text-green-600' : 'text-muted-foreground'
    )}>
      {met ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span>{text}</span>
    </div>
  );
}
