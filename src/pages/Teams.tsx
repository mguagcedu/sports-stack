import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Filter, Shield } from "lucide-react";
import { TeamCreationWizard } from "@/components/teams/TeamCreationWizard";
import { SanctionBadge } from "@/components/governance/SanctionBadge";

export default function Teams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [sanctionFilter, setSanctionFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navigate = useNavigate();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          organizations(name, state, district_id),
          sports(name, icon, code),
          seasons(name),
          schools(name, state, district_id)
        `)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: sports } = useQuery({
    queryKey: ["sports-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: seasons } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all state sanctions for filtering
  const { data: stateSanctions } = useQuery({
    queryKey: ["all-state-sanctions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("state_code, sport_code, sanctioned");
      if (error) throw error;
      const map = new Map<string, boolean>();
      data.forEach((s) => {
        map.set(`${s.state_code}-${s.sport_code}`, s.sanctioned ?? false);
      });
      return map;
    },
  });

  // Helper to get state and district for a team
  const getTeamLocation = (team: any) => {
    const state = team.organizations?.state || team.schools?.state;
    const districtId = team.organizations?.district_id || team.schools?.district_id;
    return { state, districtId };
  };

  const filteredTeams = useMemo(() => {
    return teams?.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = sportFilter === "all" || team.sport_id === sportFilter;
      const matchesSeason = seasonFilter === "all" || team.season_id === seasonFilter;
      
      // Sanction filter
      if (sanctionFilter !== "all" && stateSanctions) {
        const { state } = getTeamLocation(team);
        const sportCode = team.sports?.code;
        if (state && sportCode) {
          const key = `${state}-${sportCode}`;
          const isSanctioned = stateSanctions.get(key);
          if (sanctionFilter === "sanctioned" && isSanctioned !== true) return false;
          if (sanctionFilter === "unsanctioned" && isSanctioned !== false) return false;
          if (sanctionFilter === "unknown" && isSanctioned !== undefined) return false;
        } else if (sanctionFilter !== "unknown") {
          return false;
        }
      }
      
      return matchesSearch && matchesSport && matchesSeason;
    });
  }, [teams, searchTerm, sportFilter, seasonFilter, sanctionFilter, stateSanctions]);

  const getLevelBadgeVariant = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case "varsity": return "default";
      case "jv": return "secondary";
      case "freshman": return "outline";
      default: return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">Manage teams and rosters</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
          <TeamCreationWizard open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sportFilter} onValueChange={setSportFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports?.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sanctionFilter} onValueChange={setSanctionFilter}>
            <SelectTrigger className="w-[180px]">
              <Shield className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sanction status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sanctioned">Sanctioned</SelectItem>
              <SelectItem value="unsanctioned">Not Sanctioned</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-center">Roster</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading teams...</TableCell>
                </TableRow>
              ) : filteredTeams?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No teams found. Create your first team to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams?.map((team) => {
                  const { state, districtId } = getTeamLocation(team);
                  const sportCode = team.sports?.code;
                  
                  return (
                    <TableRow
                      key={team.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/teams/${team.id}`)}
                    >
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.organizations?.name || "-"}</TableCell>
                      <TableCell>{team.sports?.name || "-"}</TableCell>
                      <TableCell>
                        <SanctionBadge
                          stateCode={state}
                          sportCode={sportCode}
                          sportName={team.sports?.name}
                          districtId={districtId}
                          compact
                        />
                      </TableCell>
                      <TableCell>{team.seasons?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getLevelBadgeVariant(team.level)}>
                          {team.level || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>0/{team.max_roster_size || "∞"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
