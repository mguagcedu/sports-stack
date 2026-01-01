import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Layers, Search, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkDistrictOverrideEditorProps {
  districtId: string;
  stateCode: string;
  className?: string;
}

interface SportType {
  sport_code: string;
  sport_name: string;
  gender: string;
  season: string;
}

export function BulkDistrictOverrideEditor({ districtId, stateCode, className }: BulkDistrictOverrideEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"sanction" | "unsanction">("sanction");

  // Fetch sport types
  const { data: sportTypes, isLoading: loadingSports } = useQuery({
    queryKey: ["sport-types-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sport_types")
        .select("sport_code, sport_name, gender, season")
        .order("sport_name");
      if (error) throw error;
      const unique = new Map<string, SportType>();
      data.forEach((s) => {
        if (!unique.has(s.sport_code)) {
          unique.set(s.sport_code, s);
        }
      });
      return Array.from(unique.values());
    },
  });

  // Fetch existing overrides
  const { data: existingOverrides } = useQuery({
    queryKey: ["district-sport-overrides", districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("district_sport_override")
        .select("sport_code, sanctioned_override")
        .eq("district_id", districtId);
      if (error) throw error;
      return new Map(data.map((o) => [o.sport_code, o.sanctioned_override]));
    },
  });

  // Fetch state-level sanctions
  const { data: stateSanctions } = useQuery({
    queryKey: ["state-sanctions", stateCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("sport_code, sanctioned")
        .eq("state_code", stateCode);
      if (error) throw error;
      return new Map(data.map((s) => [s.sport_code, s.sanctioned]));
    },
  });

  const filteredSports = useMemo(() => {
    if (!sportTypes) return [];
    return sportTypes.filter((sport) => {
      if (search && !sport.sport_name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (seasonFilter !== "all" && !sport.season.includes(seasonFilter)) {
        return false;
      }
      return true;
    });
  }, [sportTypes, search, seasonFilter]);

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const sportsArray = Array.from(selectedSports);
      const sanctionedValue = bulkAction === "sanction";
      
      // For each selected sport, upsert the override
      for (const sportCode of sportsArray) {
        const existing = existingOverrides?.has(sportCode);
        
        if (existing) {
          await supabase
            .from("district_sport_override")
            .update({
              sanctioned_override: sanctionedValue,
              last_verified_date: new Date().toISOString().split("T")[0],
            })
            .eq("district_id", districtId)
            .eq("sport_code", sportCode);
        } else {
          await supabase
            .from("district_sport_override")
            .insert({
              district_id: districtId,
              sport_code: sportCode,
              sanctioned_override: sanctionedValue,
              last_verified_date: new Date().toISOString().split("T")[0],
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["district-sport-overrides", districtId] });
      setOpen(false);
      setSelectedSports(new Set());
      toast({ 
        title: `${selectedSports.size} sports updated`,
        description: `Set to ${bulkAction === "sanction" ? "sanctioned" : "not sanctioned"}` 
      });
    },
    onError: (error) => {
      toast({ title: "Error updating overrides", description: error.message, variant: "destructive" });
    },
  });

  const toggleSport = (sportCode: string) => {
    const newSet = new Set(selectedSports);
    if (newSet.has(sportCode)) {
      newSet.delete(sportCode);
    } else {
      newSet.add(sportCode);
    }
    setSelectedSports(newSet);
  };

  const selectAll = () => {
    setSelectedSports(new Set(filteredSports.map((s) => s.sport_code)));
  };

  const clearSelection = () => {
    setSelectedSports(new Set());
  };

  const getEffectiveStatus = (sportCode: string) => {
    if (existingOverrides?.has(sportCode)) {
      return existingOverrides.get(sportCode) ? "override-sanctioned" : "override-unsanctioned";
    }
    const stateStatus = stateSanctions?.get(sportCode);
    if (stateStatus === true) return "state-sanctioned";
    if (stateStatus === false) return "state-unsanctioned";
    return "unknown";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Layers className="h-4 w-4 mr-1" />
          Bulk Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Bulk Edit Sport Overrides
          </DialogTitle>
          <DialogDescription>
            Select multiple sports and apply sanctioning changes at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={seasonFilter} onValueChange={setSeasonFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            <Badge variant="secondary">
              {selectedSports.size} selected
            </Badge>
          </div>

          {/* Sports list */}
          {loadingSports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredSports.map((sport) => {
                  const status = getEffectiveStatus(sport.sport_code);
                  const isSelected = selectedSports.has(sport.sport_code);
                  
                  return (
                    <div
                      key={sport.sport_code}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10" : "hover:bg-muted"
                      )}
                      onClick={() => toggleSport(sport.sport_code)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{sport.sport_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {sport.gender} • {sport.season}
                        </div>
                      </div>
                      <div>
                        {status === "override-sanctioned" && (
                          <Badge className="bg-green-600 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Override
                          </Badge>
                        )}
                        {status === "override-unsanctioned" && (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Override
                          </Badge>
                        )}
                        {status === "state-sanctioned" && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                            Sanctioned
                          </Badge>
                        )}
                        {status === "state-unsanctioned" && (
                          <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                            Not Sanctioned
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Bulk action */}
          <div className="space-y-2 pt-2 border-t">
            <Label>Action for selected sports</Label>
            <Select value={bulkAction} onValueChange={(v) => setBulkAction(v as "sanction" | "unsanction")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sanction">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Mark as Sanctioned
                  </span>
                </SelectItem>
                <SelectItem value="unsanction">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Mark as Not Sanctioned
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => bulkMutation.mutate()} 
            disabled={selectedSports.size === 0 || bulkMutation.isPending}
          >
            {bulkMutation.isPending ? "Updating..." : `Update ${selectedSports.size} Sports`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
