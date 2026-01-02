import { Shield, Lock, FileCheck, CreditCard, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const badges = [
  {
    name: 'SOC 2 Type II',
    description: 'Aligned with SOC 2 Type II security standards',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    name: 'ISO 27001',
    description: 'Following ISO 27001:2022 information security practices',
    icon: Lock,
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    name: 'FERPA',
    description: 'FERPA-aware for student data privacy',
    icon: FileCheck,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    name: 'PCI-DSS',
    description: 'PCI-DSS compliant payment processing',
    icon: CreditCard,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  {
    name: 'GDPR',
    description: 'Following GDPR data protection principles',
    icon: Globe,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  },
];

interface ComplianceBadgesProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function ComplianceBadges({ variant = 'full', className = '' }: ComplianceBadgesProps) {
  if (variant === 'minimal') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {badges.map((badge) => (
          <Badge key={badge.name} variant="outline" className="text-xs">
            {badge.name}
          </Badge>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {badges.map((badge) => (
          <Tooltip key={badge.name}>
            <TooltipTrigger asChild>
              <div className={`p-2 rounded-lg ${badge.color}`}>
                <badge.icon className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      {badges.map((badge) => (
        <div 
          key={badge.name}
          className="flex flex-col items-center text-center p-4 rounded-xl bg-background border"
        >
          <div className={`p-3 rounded-lg ${badge.color} mb-3`}>
            <badge.icon className="h-6 w-6" />
          </div>
          <h4 className="font-semibold text-sm">{badge.name}</h4>
          <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}

export function ComplianceFooter() {
  return (
    <div className="border-t py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p className="font-medium mb-1">Security & Compliance</p>
            <p>Data encrypted at rest and in transit. Regular security audits.</p>
          </div>
          <ComplianceBadges variant="compact" />
        </div>
      </div>
    </div>
  );
}
