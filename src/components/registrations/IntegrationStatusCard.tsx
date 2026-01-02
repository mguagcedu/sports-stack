import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Ticket, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Settings,
  Link as LinkIcon 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FinalFormsLinks } from '@/components/integrations';

interface IntegrationStatusCardProps {
  schoolId?: string;
  districtId?: string;
  showConfigLink?: boolean;
}

export function IntegrationStatusCard({ schoolId, districtId, showConfigLink }: IntegrationStatusCardProps) {
  // Fetch school integration settings
  const { data: schoolSettings } = useQuery({
    queryKey: ['school-integrations', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data } = await supabase
        .from('schools')
        .select('finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled, name')
        .eq('id', schoolId)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId,
  });

  // Fetch district integration settings as fallback
  const { data: districtSettings } = useQuery({
    queryKey: ['district-integrations', districtId],
    queryFn: async () => {
      if (!districtId) return null;
      const { data } = await supabase
        .from('districts')
        .select('finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled, name')
        .eq('id', districtId)
        .maybeSingle();
      return data;
    },
    enabled: !!districtId,
  });

  // Use school settings if available, fall back to district
  const settings = schoolSettings?.finalforms_enabled || schoolSettings?.gofan_enabled 
    ? schoolSettings 
    : districtSettings;

  const hasFinalForms = settings?.finalforms_enabled && settings?.finalforms_portal_url;
  const hasGoFan = settings?.gofan_enabled && settings?.gofan_school_url;
  const hasAnyIntegration = hasFinalForms || hasGoFan;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          External Integrations
        </CardTitle>
        <CardDescription>
          Connected services for forms and ticketing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FinalForms Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasFinalForms ? 'bg-green-500/10' : 'bg-muted'}`}>
              <FileText className={`h-5 w-5 ${hasFinalForms ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">FinalForms</p>
              <p className="text-sm text-muted-foreground">
                {hasFinalForms ? 'Connected for health & eligibility forms' : 'Not configured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasFinalForms ? (
              <>
                <Badge className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Active
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <a href={settings?.finalforms_portal_url!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" /> Not Configured
              </Badge>
            )}
          </div>
        </div>

        {/* FinalForms Quick Access */}
        {hasFinalForms && settings && (
          <div className="pt-2">
            <FinalFormsLinks
              config={{
                stateCode: 'OH', // Default, should come from school/district
                districtName: settings.name || '',
                subdomainOverride: settings.finalforms_portal_url?.replace('https://', '').split('.finalforms.com')[0] || null,
              }}
              enabled={true}
              compact
            />
          </div>
        )}

        {/* GoFan Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${hasGoFan ? 'bg-green-500/10' : 'bg-muted'}`}>
              <Ticket className={`h-5 w-5 ${hasGoFan ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="font-medium">GoFan</p>
              <p className="text-sm text-muted-foreground">
                {hasGoFan ? 'Connected for event ticketing' : 'Not configured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasGoFan ? (
              <>
                <Badge className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" /> Active
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <a href={settings?.gofan_school_url!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" /> Not Configured
              </Badge>
            )}
          </div>
        </div>

        {!hasAnyIntegration && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              No external integrations are configured. 
              {showConfigLink && (
                <Link to="/integrations" className="ml-1 underline hover:text-primary">
                  Configure integrations →
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        {showConfigLink && hasAnyIntegration && (
          <Button variant="outline" className="w-full" asChild>
            <Link to="/integrations">
              <Settings className="mr-2 h-4 w-4" />
              Manage Integrations
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}