import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Trophy, Users, User, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SportType {
  sport_id: string;
  sport_code: string;
  sport_name: string;
  season: string;
  format: string;
  gender: string;
  maturity: string;
  image_url: string | null;
}

interface SportTypeSelectorProps {
  value?: string;
  onSelect: (sport: SportType) => void;
  stateCode?: string; // Optional: filter by state sanctioning
  className?: string;
  placeholder?: string;
}

const SEASON_COLORS: Record<string, string> = {
  Fall: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Winter: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Spring: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Fall/Winter": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Fall/Spring": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Year-round": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const MATURITY_COLORS: Record<string, string> = {
  Core: "bg-emerald-500",
  Common: "bg-blue-500",
  Regional: "bg-amber-500",
  Emerging: "bg-purple-500",
};

const GENDER_ICONS: Record<string, React.ReactNode> = {
  Boys: <User className="h-3 w-3" />,
  Girls: <User className="h-3 w-3" />,
  Coed: <Users className="h-3 w-3" />,
};

export function SportTypeSelector({
  value,
  onSelect,
  stateCode,
  className,
  placeholder = "Select a sport...",
}: SportTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [maturityFilter, setMaturityFilter] = useState<string>("all");

  const { data: sportTypes, isLoading } = useQuery({
    queryKey: ["sport-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sport_types")
        .select("*")
        .order("sport_name");

      if (error) throw error;
      return data as SportType[];
    },
  });

  // Get sanctioned sports for the state if provided
  const { data: sanctionedSports } = useQuery({
    queryKey: ["state-sanctioned-sports", stateCode],
    queryFn: async () => {
      if (!stateCode) return null;
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("sport_code")
        .eq("state_code", stateCode)
        .eq("sanctioned", true);

      if (error) throw error;
      return data?.map((s) => s.sport_code) || [];
    },
    enabled: !!stateCode,
  });

  const selectedSport = sportTypes?.find((s) => s.sport_code === value);

  const filteredSports = useMemo(() => {
    if (!sportTypes) return [];

    return sportTypes.filter((sport) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !sport.sport_name.toLowerCase().includes(searchLower) &&
          !sport.sport_code.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Season filter
      if (seasonFilter !== "all" && !sport.season.includes(seasonFilter)) {
        return false;
      }

      // Gender filter
      if (genderFilter !== "all" && sport.gender !== genderFilter) {
        return false;
      }

      // Maturity filter
      if (maturityFilter !== "all" && sport.maturity !== maturityFilter) {
        return false;
      }

      return true;
    });
  }, [sportTypes, search, seasonFilter, genderFilter, maturityFilter]);

  // Group by season
  const groupedSports = useMemo(() => {
    const groups: Record<string, SportType[]> = {};
    filteredSports.forEach((sport) => {
      const season = sport.season.split("/")[0]; // Use primary season
      if (!groups[season]) groups[season] = [];
      groups[season].push(sport);
    });
    return groups;
  }, [filteredSports]);

  const handleSelect = (sport: SportType) => {
    onSelect(sport);
    setOpen(false);
  };

  const isSanctioned = (sportCode: string) => {
    if (!stateCode || !sanctionedSports) return null;
    return sanctionedSports.includes(sportCode);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "w-full justify-between h-auto min-h-[44px] py-2",
            !selectedSport && "text-muted-foreground",
            className
          )}
        >
          {selectedSport ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">{selectedSport.sport_name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-4">
                    {selectedSport.season}
                  </Badge>
                  <span>{selectedSport.gender}</span>
                </div>
              </div>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Select Sport Type
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-2">
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
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Year-round">Year-round</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Boys">Boys</SelectItem>
                <SelectItem value="Girls">Girls</SelectItem>
                <SelectItem value="Coed">Coed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={maturityFilter} onValueChange={setMaturityFilter}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Maturity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Core">Core</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Regional">Regional</SelectItem>
                <SelectItem value="Emerging">Emerging</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Maturity legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(MATURITY_COLORS).map(([maturity, color]) => (
              <div key={maturity} className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-muted-foreground">{maturity}</span>
              </div>
            ))}
          </div>

          {/* Sport list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedSports).map(([season, sports]) => (
                  <div key={season}>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge className={cn("text-xs", SEASON_COLORS[season] || SEASON_COLORS["Year-round"])}>
                        {season}
                      </Badge>
                      <span className="text-muted-foreground">({sports.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sports.map((sport) => {
                        const sanctioned = isSanctioned(sport.sport_code);
                        return (
                          <Card
                            key={sport.sport_id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                              value === sport.sport_code && "border-primary bg-primary/5",
                              sanctioned === false && "opacity-50"
                            )}
                            onClick={() => handleSelect(sport)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Sport image or maturity indicator */}
                                {sport.image_url ? (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    <img 
                                      src={sport.image_url} 
                                      alt={sport.sport_name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${MATURITY_COLORS[sport.maturity]}"><span class="text-white text-xs font-bold">${sport.sport_name.charAt(0)}</span></div>`;
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                      MATURITY_COLORS[sport.maturity]
                                    )}
                                  >
                                    <span className="text-white text-sm font-bold">
                                      {sport.sport_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {sport.sport_name}
                                    </span>
                                    {sanctioned === true && (
                                      <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">
                                        Sanctioned
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      {GENDER_ICONS[sport.gender]}
                                      {sport.gender}
                                    </span>
                                    <span>•</span>
                                    <span>{sport.format}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredSports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sports found matching your filters
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Stats */}
          <div className="text-xs text-muted-foreground text-center border-t pt-3">
            Showing {filteredSports.length} of {sportTypes?.length || 0} sports
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
