import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, Filter } from "lucide-react";

export default function Teams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    organization_id: "",
    sport_id: "",
    season_id: "",
    level: "varsity",
    gender: "coed",
    max_roster_size: 25,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          organizations(name),
          sports(name, icon),
          seasons(name),
          schools(name)
        `)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
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

  const createTeamMutation = useMutation({
    mutationFn: async (team: typeof newTeam) => {
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: team.name,
          organization_id: team.organization_id || null,
          sport_id: team.sport_id || null,
          season_id: team.season_id || null,
          level: team.level,
          gender: team.gender,
          max_roster_size: team.max_roster_size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setIsCreateOpen(false);
      setNewTeam({
        name: "",
        organization_id: "",
        sport_id: "",
        season_id: "",
        level: "varsity",
        gender: "coed",
        max_roster_size: 25,
      });
      toast({ title: "Team created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    },
  });

  const filteredTeams = teams?.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = sportFilter === "all" || team.sport_id === sportFilter;
    const matchesSeason = seasonFilter === "all" || team.season_id === seasonFilter;
    return matchesSearch && matchesSport && matchesSeason;
  });

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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Varsity Boys Basketball"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Select
                    value={newTeam.organization_id}
                    onValueChange={(value) => setNewTeam({ ...newTeam, organization_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport</Label>
                    <Select
                      value={newTeam.sport_id}
                      onValueChange={(value) => setNewTeam({ ...newTeam, sport_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {sports?.map((sport) => (
                          <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season">Season</Label>
                    <Select
                      value={newTeam.season_id}
                      onValueChange={(value) => setNewTeam({ ...newTeam, season_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons?.map((season) => (
                          <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={newTeam.level}
                      onValueChange={(value) => setNewTeam({ ...newTeam, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="varsity">Varsity</SelectItem>
                        <SelectItem value="jv">JV</SelectItem>
                        <SelectItem value="freshman">Freshman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={newTeam.gender}
                      onValueChange={(value) => setNewTeam({ ...newTeam, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boys">Boys</SelectItem>
                        <SelectItem value="girls">Girls</SelectItem>
                        <SelectItem value="coed">Coed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roster_size">Max Roster</Label>
                    <Input
                      id="roster_size"
                      type="number"
                      value={newTeam.max_roster_size}
                      onChange={(e) => setNewTeam({ ...newTeam, max_roster_size: parseInt(e.target.value) || 25 })}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => createTeamMutation.mutate(newTeam)}
                  disabled={!newTeam.name || createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Gender</TableHead>
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
                filteredTeams?.map((team) => (
                  <TableRow
                    key={team.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.organizations?.name || "-"}</TableCell>
                    <TableCell>{team.sports?.name || "-"}</TableCell>
                    <TableCell>{team.seasons?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getLevelBadgeVariant(team.level)}>
                        {team.level || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{team.gender || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>0/{team.max_roster_size || "∞"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
