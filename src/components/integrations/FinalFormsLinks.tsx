import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, User, GraduationCap, Briefcase } from 'lucide-react';
import {
  generateFinalFormsUrl,
  FINALFORMS_SEARCH_URL,
  type FinalFormsConfig,
  type FinalFormsRole,
} from '@/lib/integrations';

interface FinalFormsLinksProps {
  config: FinalFormsConfig;
  enabled: boolean;
  compact?: boolean;
}

const ROLE_ICONS: Record<FinalFormsRole, typeof User> = {
  parents: User,
  students: GraduationCap,
  staff: Briefcase,
};

export function FinalFormsLinks({ config, enabled, compact = false }: FinalFormsLinksProps) {
  if (!enabled) return null;

  const links = [
    { role: 'parents' as const, action: 'login' as const, label: 'Parent Login' },
    { role: 'parents' as const, action: 'registration' as const, label: 'Parent New Account' },
    { role: 'students' as const, action: 'login' as const, label: 'Student Login' },
    { role: 'staff' as const, action: 'login' as const, label: 'Staff Login' },
  ];

  const handleClick = (role: FinalFormsRole, action: 'login' | 'registration') => {
    const url = generateFinalFormsUrl(config, role, action);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {links.slice(0, 2).map((link) => {
          const Icon = ROLE_ICONS[link.role];
          return (
            <Button
              key={`${link.role}-${link.action}`}
              variant="outline"
              size="sm"
              onClick={() => handleClick(link.role, link.action)}
            >
              <Icon className="mr-1 h-3 w-3" />
              {link.label}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Forms & Eligibility</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Powered by FinalForms
          </Badge>
        </div>
        <CardDescription>
          Complete eligibility forms and registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => {
            const Icon = ROLE_ICONS[link.role];
            return (
              <Button
                key={`${link.role}-${link.action}`}
                variant="outline"
                className="justify-between h-auto py-3"
                onClick={() => handleClick(link.role, link.action)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                <ExternalLink className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Opens in a new tab at FinalForms
        </p>
      </CardContent>
    </Card>
  );
}

// Fallback component when FinalForms URL fails
export function FinalFormsFallback() {
  return (
    <Card>
      <CardContent className="py-6 text-center">
        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-medium mb-2">Forms Portal Not Found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We couldn't locate your school's FinalForms portal automatically.
        </p>
        <Button asChild>
          <a href={FINALFORMS_SEARCH_URL} target="_blank" rel="noopener noreferrer">
            Search FinalForms
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
