import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, HelpCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface StateSanctionBadgeProps {
  stateCode: string;
  sportCode: string;
  showLabel?: boolean;
  className?: string;
}

interface SanctionStatus {
  sanctioned: boolean | null;
  rules_url: string | null;
  season_override: string | null;
  last_verified_date: string | null;
}

export function StateSanctionBadge({
  stateCode,
  sportCode,
  showLabel = false,
  className,
}: StateSanctionBadgeProps) {
  const { data: sanction, isLoading } = useQuery({
    queryKey: ["state-sanction", stateCode, sportCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("sanctioned, rules_url, season_override, last_verified_date")
        .eq("state_code", stateCode)
        .eq("sport_code", sportCode)
        .maybeSingle();

      if (error) throw error;
      return data as SanctionStatus | null;
    },
    enabled: !!stateCode && !!sportCode,
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)}>
        <HelpCircle className="h-3 w-3" />
      </Badge>
    );
  }

  const status = sanction?.sanctioned;
  
  const getStatusConfig = () => {
    if (status === true) {
      return {
        icon: <CheckCircle2 className="h-3 w-3" />,
        label: "Sanctioned",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        tooltip: `This sport is officially sanctioned in ${stateCode}`,
      };
    } else if (status === false) {
      return {
        icon: <XCircle className="h-3 w-3" />,
        label: "Not Sanctioned",
        variant: "outline" as const,
        className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        tooltip: `This sport is not officially sanctioned in ${stateCode}`,
      };
    } else {
      return {
        icon: <HelpCircle className="h-3 w-3" />,
        label: "Unknown",
        variant: "outline" as const,
        className: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400",
        tooltip: `Sanctioning status not yet verified for ${stateCode}`,
      };
    }
  };

  const config = getStatusConfig();

  const badge = (
    <Badge 
      variant={config.variant} 
      className={cn("gap-1 text-xs", config.className, className)}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1">
          {badge}
          {sanction?.rules_url && (
            <a
              href={sanction.rules_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <p>{config.tooltip}</p>
          {sanction?.season_override && (
            <p className="text-xs text-muted-foreground">
              Season: {sanction.season_override}
            </p>
          )}
          {sanction?.last_verified_date && (
            <p className="text-xs text-muted-foreground">
              Verified: {new Date(sanction.last_verified_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Hook for checking sanctioning status
export function useSanctionStatus(stateCode?: string, sportCode?: string) {
  return useQuery({
    queryKey: ["state-sanction", stateCode, sportCode],
    queryFn: async () => {
      if (!stateCode || !sportCode) return null;
      
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("*")
        .eq("state_code", stateCode)
        .eq("sport_code", sportCode)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!stateCode && !!sportCode,
  });
}
