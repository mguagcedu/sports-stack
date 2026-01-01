import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Building2,
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useUserRoles } from "@/hooks/useUserRoles";
import { cn } from "@/lib/utils";

interface SportType {
  sport_id: string;
  sport_code: string;
  sport_name: string;
  season: string;
  format: string;
  gender: string;
  maturity: string;
}

interface StateAssociation {
  state_association_id: string;
  state_code: string;
  state_name: string;
  association_name: string;
  association_abbrev: string;
  website: string | null;
  nfhs_status: string | null;
}

interface StateSanction {
  id: string;
  state_code: string;
  sport_code: string;
  sanctioned: boolean | null;
  rules_url: string | null;
  season_override: string | null;
  last_verified_date: string | null;
}

const SEASON_COLORS: Record<string, string> = {
  Fall: "bg-orange-100 text-orange-800",
  Winter: "bg-blue-100 text-blue-800",
  Spring: "bg-green-100 text-green-800",
  "Fall/Winter": "bg-purple-100 text-purple-800",
  "Year-round": "bg-gray-100 text-gray-800",
};

export default function Governance() {
  const [activeTab, setActiveTab] = useState("sports");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [sanctionStatusFilter, setSanctionStatusFilter] = useState<string>("all");
  const [editingSanction, setEditingSanction] = useState<StateSanction | null>(null);
  
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRoles();

  // Fetch sport types
  const { data: sportTypes, isLoading: loadingSports } = useQuery({
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

  // Fetch state associations
  const { data: associations, isLoading: loadingAssociations } = useQuery({
    queryKey: ["state-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("state_athletic_associations")
        .select("*")
        .order("state_name");
      if (error) throw error;
      return data as StateAssociation[];
    },
  });

  // Fetch sanctions with filters
  const { data: sanctions, isLoading: loadingSanctions } = useQuery({
    queryKey: ["state-sanctions", stateFilter, sportFilter, sanctionStatusFilter],
    queryFn: async () => {
      let query = supabase.from("state_sport_sanction").select("*");
      
      if (stateFilter !== "all") {
        query = query.eq("state_code", stateFilter);
      }
      if (sportFilter !== "all") {
        query = query.eq("sport_code", sportFilter);
      }
      if (sanctionStatusFilter === "sanctioned") {
        query = query.eq("sanctioned", true);
      } else if (sanctionStatusFilter === "not_sanctioned") {
        query = query.eq("sanctioned", false);
      } else if (sanctionStatusFilter === "unknown") {
        query = query.is("sanctioned", null);
      }
      
      const { data, error } = await query.order("state_code").order("sport_code").limit(500);
      if (error) throw error;
      return data as StateSanction[];
    },
  });

  // Update sanction mutation
  const updateSanctionMutation = useMutation({
    mutationFn: async (sanction: Partial<StateSanction> & { id: string }) => {
      const { error } = await supabase
        .from("state_sport_sanction")
        .update({
          sanctioned: sanction.sanctioned,
          rules_url: sanction.rules_url,
          season_override: sanction.season_override,
          last_verified_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", sanction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["state-sanctions"] });
      toast.success("Sanction status updated");
      setEditingSanction(null);
    },
    onError: (error) => {
      toast.error("Failed to update sanction: " + error.message);
    },
  });

  const filteredSports = sportTypes?.filter((sport) =>
    sport.sport_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sport.sport_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssociations = associations?.filter((assoc) =>
    assoc.state_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assoc.association_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assoc.association_abbrev.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSanctionIcon = (sanctioned: boolean | null) => {
    if (sanctioned === true) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (sanctioned === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <HelpCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <DashboardLayout
      title="Governance"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="sports" className="gap-2">
              <Trophy className="h-4 w-4" />
              Sports ({sportTypes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="associations" className="gap-2">
              <Building2 className="h-4 w-4" />
              Associations ({associations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sanctions" className="gap-2">
              <Shield className="h-4 w-4" />
              Sanctioning
            </TabsTrigger>
          </TabsList>

          {activeTab !== "sanctions" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {/* Sports Tab */}
        <TabsContent value="sports">
          <Card>
            <CardHeader>
              <CardTitle>Sport Types</CardTitle>
              <CardDescription>
                Standardized list of 67 high school sports with season, format, and maturity data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSports ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sport</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Maturity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSports?.map((sport) => (
                        <TableRow key={sport.sport_id}>
                          <TableCell className="font-medium">{sport.sport_name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {sport.sport_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", SEASON_COLORS[sport.season] || SEASON_COLORS["Year-round"])}>
                              {sport.season}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{sport.format}</TableCell>
                          <TableCell>{sport.gender}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sport.maturity}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Associations Tab */}
        <TabsContent value="associations">
          <Card>
            <CardHeader>
              <CardTitle>State Athletic Associations</CardTitle>
              <CardDescription>
                All 51 state athletic associations (50 states + DC) with NFHS membership status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssociations ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Association</TableHead>
                        <TableHead>Abbreviation</TableHead>
                        <TableHead>NFHS Status</TableHead>
                        <TableHead>Website</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssociations?.map((assoc) => (
                        <TableRow key={assoc.state_association_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {assoc.state_code}
                              </Badge>
                              <span className="font-medium">{assoc.state_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {assoc.association_name}
                          </TableCell>
                          <TableCell>
                            <Badge>{assoc.association_abbrev}</Badge>
                          </TableCell>
                          <TableCell>
                            {assoc.nfhs_status === "member" ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Member
                              </Badge>
                            ) : (
                              <Badge variant="outline">{assoc.nfhs_status || "Unknown"}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {assoc.website && (
                              <a
                                href={assoc.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                              >
                                Visit <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sanctions Tab */}
        <TabsContent value="sanctions">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>State Sport Sanctioning Matrix</CardTitle>
                  <CardDescription>
                    Manage which sports are officially sanctioned in each state
                  </CardDescription>
                </div>
                {!isAdmin() && (
                  <Badge variant="outline" className="gap-1 self-start">
                    <Lock className="h-3 w-3" />
                    View Only
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Filters:</span>
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {associations?.map((a) => (
                      <SelectItem key={a.state_code} value={a.state_code}>
                        {a.state_code} - {a.state_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {sportTypes?.map((s) => (
                      <SelectItem key={s.sport_code} value={s.sport_code}>
                        {s.sport_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sanctionStatusFilter} onValueChange={setSanctionStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sanctioned">Sanctioned</SelectItem>
                    <SelectItem value="not_sanctioned">Not Sanctioned</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStateFilter("all");
                    setSportFilter("all");
                    setSanctionStatusFilter("all");
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              {loadingSanctions ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Season Override</TableHead>
                        <TableHead>Rules</TableHead>
                        <TableHead>Verified</TableHead>
                        {isAdmin() && <TableHead className="w-[80px]">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sanctions?.map((sanction) => {
                        const sport = sportTypes?.find((s) => s.sport_code === sanction.sport_code);
                        return (
                          <TableRow key={sanction.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {sanction.state_code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{sport?.sport_name || sanction.sport_code}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getSanctionIcon(sanction.sanctioned)}
                                <span className="text-sm">
                                  {sanction.sanctioned === true
                                    ? "Sanctioned"
                                    : sanction.sanctioned === false
                                    ? "Not Sanctioned"
                                    : "Unknown"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {sanction.season_override || "-"}
                            </TableCell>
                            <TableCell>
                              {sanction.rules_url ? (
                                <a
                                  href={sanction.rules_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  View Rules
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {sanction.last_verified_date
                                ? new Date(sanction.last_verified_date).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            {isAdmin() && (
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSanction(sanction)}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {sanctions?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sanctions found matching filters
                    </div>
                  )}
                </ScrollArea>
              )}

              <div className="text-xs text-muted-foreground">
                Showing {sanctions?.length || 0} records (max 500). Use filters to narrow results.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Sanction Dialog */}
      <Dialog open={!!editingSanction} onOpenChange={() => setEditingSanction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sanction Status</DialogTitle>
            <DialogDescription>
              Update sanctioning for {editingSanction?.sport_code} in {editingSanction?.state_code}
            </DialogDescription>
          </DialogHeader>
          {editingSanction && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sanctioned">Sanctioned Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="sanctioned"
                    checked={editingSanction.sanctioned === true}
                    onCheckedChange={(checked) =>
                      setEditingSanction({ ...editingSanction, sanctioned: checked })
                    }
                  />
                  <span className="text-sm">
                    {editingSanction.sanctioned ? "Sanctioned" : "Not Sanctioned"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules_url">Rules URL</Label>
                <Input
                  id="rules_url"
                  placeholder="https://..."
                  value={editingSanction.rules_url || ""}
                  onChange={(e) =>
                    setEditingSanction({ ...editingSanction, rules_url: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season_override">Season Override</Label>
                <Select
                  value={editingSanction.season_override || "none"}
                  onValueChange={(v) =>
                    setEditingSanction({
                      ...editingSanction,
                      season_override: v === "none" ? null : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No override" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Override</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Year-round">Year-round</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingSanction(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateSanctionMutation.mutate(editingSanction)}
                  disabled={updateSanctionMutation.isPending}
                >
                  {updateSanctionMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
