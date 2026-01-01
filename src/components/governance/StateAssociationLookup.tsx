import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  ExternalLink, 
  MapPin, 
  Shield, 
  CheckCircle2,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StateAssociation {
  state_association_id: string;
  state_code: string;
  state_name: string;
  association_name: string;
  association_abbrev: string;
  website: string | null;
  nfhs_status: string | null;
}

interface StateAssociationLookupProps {
  stateCode?: string;
  showCard?: boolean;
  compact?: boolean;
  className?: string;
}

export function StateAssociationLookup({
  stateCode,
  showCard = true,
  compact = false,
  className,
}: StateAssociationLookupProps) {
  const { data: association, isLoading, error } = useQuery({
    queryKey: ["state-association", stateCode],
    queryFn: async () => {
      if (!stateCode) return null;
      
      const { data, error } = await supabase
        .from("state_athletic_associations")
        .select("*")
        .eq("state_code", stateCode)
        .maybeSingle();

      if (error) throw error;
      return data as StateAssociation | null;
    },
    enabled: !!stateCode,
  });

  if (!stateCode) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    );
  }

  if (error || !association) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No association data found for {stateCode}
      </div>
    );
  }

  // Compact inline display
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Badge variant="outline" className="font-mono">
          {association.association_abbrev}
        </Badge>
        <span className="text-muted-foreground">{association.association_name}</span>
        {association.website && (
          <a
            href={association.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  // Full card display
  if (showCard) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-background shadow-sm">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {association.association_abbrev}
                  {association.nfhs_status === "member" && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      NFHS Member
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {association.association_name}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{association.state_name}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {association.state_code}
              </Badge>
            </div>
            
            {association.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={association.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {association.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            {association.website && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => window.open(association.website!, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit {association.association_abbrev} Website
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default inline display
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
        <Building2 className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{association.association_abbrev}</span>
          {association.nfhs_status === "member" && (
            <Badge variant="secondary" className="text-xs">
              NFHS Member
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {association.association_name}
        </p>
      </div>
      {association.website && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(association.website!, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Hook for fetching state association
export function useStateAssociation(stateCode?: string) {
  return useQuery({
    queryKey: ["state-association", stateCode],
    queryFn: async () => {
      if (!stateCode) return null;
      
      const { data, error } = await supabase
        .from("state_athletic_associations")
        .select("*")
        .eq("state_code", stateCode)
        .maybeSingle();

      if (error) throw error;
      return data as StateAssociation | null;
    },
    enabled: !!stateCode,
  });
}
