import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Ticket, ExternalLink, Info } from "lucide-react";

interface ComplianceTicketingCardProps {
  schoolId?: string;
  districtId?: string;
}

export function ComplianceTicketingCard({ schoolId, districtId }: ComplianceTicketingCardProps) {
  // Fetch school integration settings
  const { data: schoolSettings } = useQuery({
    queryKey: ["school-integrations", schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from("schools")
        .select("finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled, name")
        .eq("id", schoolId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  // Fetch district integration settings as fallback
  const { data: districtSettings } = useQuery({
    queryKey: ["district-integrations", districtId],
    queryFn: async () => {
      if (!districtId) return null;
      const { data, error } = await supabase
        .from("districts")
        .select("finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled, name")
        .eq("id", districtId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!districtId && !schoolSettings?.finalforms_enabled && !schoolSettings?.gofan_enabled,
  });

  // Use school settings if available, fall back to district
  const settings = schoolSettings?.finalforms_enabled || schoolSettings?.gofan_enabled 
    ? schoolSettings 
    : districtSettings;

  const hasFinalForms = settings?.finalforms_enabled && settings?.finalforms_portal_url;
  const hasGoFan = settings?.gofan_enabled && settings?.gofan_school_url;

  // Don't render if no integrations are configured
  if (!hasFinalForms && !hasGoFan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance & Ticketing
          </CardTitle>
          <CardDescription>
            External service integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No integrations configured by your admin. Contact your administrator to set up FinalForms or GoFan.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Compliance & Ticketing
        </CardTitle>
        <CardDescription>
          Quick access to eligibility and ticketing tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {hasFinalForms && (
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start gap-2"
              asChild
            >
              <a 
                href={settings.finalforms_portal_url!} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">Forms & Eligibility</span>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </div>
                <span className="text-sm text-muted-foreground font-normal">
                  Open FinalForms to verify athlete eligibility
                </span>
              </a>
            </Button>
          )}

          {hasGoFan && (
            <Button
              variant="outline"
              className="h-auto py-4 flex-col items-start gap-2"
              asChild
            >
              <a 
                href={settings.gofan_school_url!} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-2 text-primary">
                  <Ticket className="h-5 w-5" />
                  <span className="font-semibold">Tickets</span>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </div>
                <span className="text-sm text-muted-foreground font-normal">
                  Open GoFan for event ticketing
                </span>
              </a>
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          These links open in a new tab. No data is synced between systems.
        </p>
      </CardContent>
    </Card>
  );
}
