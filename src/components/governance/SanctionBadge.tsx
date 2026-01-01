import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SanctionBadgeProps {
  stateCode?: string | null;
  sportCode?: string | null;
  sportName?: string | null;
  districtId?: string | null;
  compact?: boolean;
  className?: string;
}

export function SanctionBadge({
  stateCode,
  sportCode,
  sportName,
  districtId,
  compact = false,
  className,
}: SanctionBadgeProps) {
  // Fetch state-level sanction
  const { data: stateSanction, isLoading } = useQuery({
    queryKey: ["sanction-status", stateCode, sportCode],
    queryFn: async () => {
      if (!stateCode || !sportCode) return null;
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("sanctioned, rules_url")
        .eq("state_code", stateCode)
        .eq("sport_code", sportCode)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!stateCode && !!sportCode,
  });

  // Fetch district override if districtId provided
  const { data: districtOverride } = useQuery({
    queryKey: ["district-override", districtId, sportCode],
    queryFn: async () => {
      if (!districtId || !sportCode) return null;
      const { data, error } = await supabase
        .from("district_sport_override")
        .select("sanctioned_override, rules_url_override")
        .eq("district_id", districtId)
        .eq("sport_code", sportCode)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!districtId && !!sportCode,
  });

  if (!stateCode || !sportCode) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  // District override takes precedence
  const effectiveSanction = districtOverride?.sanctioned_override ?? stateSanction?.sanctioned;
  const hasDistrictOverride = districtOverride?.sanctioned_override !== null && districtOverride?.sanctioned_override !== undefined;

  if (effectiveSanction === null || effectiveSanction === undefined) {
    if (compact) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("text-muted-foreground", className)}>
              <HelpCircle className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sanctioning status unknown</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (effectiveSanction) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400",
                className
              )}
            >
              {compact ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sanctioned
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {sportName || sportCode} is sanctioned in {stateCode}
              {hasDistrictOverride && " (district override)"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400",
              className
            )}
          >
            {compact ? (
              <XCircle className="h-3 w-3" />
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Not Sanctioned
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {sportName || sportCode} is not sanctioned in {stateCode}
            {hasDistrictOverride && " (district override)"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook to get sanction status
export function useSanctionStatus(stateCode?: string | null, sportCode?: string | null, districtId?: string | null) {
  const stateSanction = useQuery({
    queryKey: ["sanction-status", stateCode, sportCode],
    queryFn: async () => {
      if (!stateCode || !sportCode) return null;
      const { data } = await supabase
        .from("state_sport_sanction")
        .select("sanctioned")
        .eq("state_code", stateCode)
        .eq("sport_code", sportCode)
        .maybeSingle();
      return data?.sanctioned ?? null;
    },
    enabled: !!stateCode && !!sportCode,
  });

  const districtOverride = useQuery({
    queryKey: ["district-override", districtId, sportCode],
    queryFn: async () => {
      if (!districtId || !sportCode) return null;
      const { data } = await supabase
        .from("district_sport_override")
        .select("sanctioned_override")
        .eq("district_id", districtId)
        .eq("sport_code", sportCode)
        .maybeSingle();
      return data?.sanctioned_override ?? null;
    },
    enabled: !!districtId && !!sportCode,
  });

  const effectiveSanction = districtOverride.data ?? stateSanction.data;

  return {
    sanctioned: effectiveSanction,
    isLoading: stateSanction.isLoading || districtOverride.isLoading,
    hasDistrictOverride: districtOverride.data !== null && districtOverride.data !== undefined,
  };
}
