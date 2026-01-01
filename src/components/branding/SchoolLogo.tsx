import { useSchoolBranding } from '@/contexts/SchoolBrandingContext';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchoolLogoProps {
  logoUrl?: string | null;
  schoolName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

export function SchoolLogo({ 
  logoUrl: propLogoUrl, 
  schoolName,
  size = 'md', 
  className,
  showFallback = true
}: SchoolLogoProps) {
  const { branding } = useSchoolBranding();
  
  // Use prop logo if provided, otherwise use context branding
  const logoUrl = propLogoUrl ?? branding.logoUrl;
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt={schoolName || 'School logo'} 
        className={cn(
          sizeClasses[size],
          'object-contain',
          className
        )}
      />
    );
  }

  if (!showFallback) return null;

  // Fallback to icon with school colors
  const primaryColor = branding.schoolId && branding.primaryColor.startsWith('#')
    ? branding.primaryColor
    : undefined;

  return (
    <div 
      className={cn(
        sizeClasses[size],
        'rounded-full flex items-center justify-center',
        className
      )}
      style={{ 
        backgroundColor: primaryColor ? `${primaryColor}20` : 'hsl(var(--primary) / 0.1)'
      }}
    >
      <GraduationCap 
        className={iconSizes[size]}
        style={{ color: primaryColor }}
      />
    </div>
  );
}
