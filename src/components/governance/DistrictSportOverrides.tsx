import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Pencil, Trash2, Search, CheckCircle2, XCircle, Loader2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { BulkDistrictOverrideEditor } from "./BulkDistrictOverrideEditor";

interface DistrictSportOverridesProps {
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

interface Override {
  id: string;
  district_id: string;
  sport_code: string;
  sanctioned_override: boolean | null;
  rules_url_override: string | null;
  last_verified_date: string | null;
}

export function DistrictSportOverrides({ districtId, stateCode, className }: DistrictSportOverridesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editOverride, setEditOverride] = useState<Override | null>(null);
  const [formData, setFormData] = useState({
    sport_code: "",
    sanctioned_override: true,
    rules_url_override: "",
  });

  // Fetch existing overrides for this district
  const { data: overrides, isLoading: loadingOverrides } = useQuery({
    queryKey: ["district-sport-overrides", districtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("district_sport_override")
        .select("*")
        .eq("district_id", districtId)
        .order("sport_code");
      if (error) throw error;
      return data as Override[];
    },
  });

  // Fetch sport types
  const { data: sportTypes } = useQuery({
    queryKey: ["sport-types-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sport_types")
        .select("sport_code, sport_name, gender, season")
        .order("sport_name");
      if (error) throw error;
      // Deduplicate by sport_code
      const unique = new Map<string, SportType>();
      data.forEach((s) => {
        if (!unique.has(s.sport_code)) {
          unique.set(s.sport_code, s);
        }
      });
      return Array.from(unique.values());
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

  // Create/update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from("district_sport_override")
          .update({
            sanctioned_override: data.sanctioned_override,
            rules_url_override: data.rules_url_override || null,
            last_verified_date: new Date().toISOString().split("T")[0],
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("district_sport_override")
          .insert({
            district_id: districtId,
            sport_code: data.sport_code,
            sanctioned_override: data.sanctioned_override,
            rules_url_override: data.rules_url_override || null,
            last_verified_date: new Date().toISOString().split("T")[0],
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["district-sport-overrides", districtId] });
      setIsAddOpen(false);
      setEditOverride(null);
      toast({ title: editOverride ? "Override updated" : "Override added" });
    },
    onError: (error) => {
      toast({ title: "Error saving override", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("district_sport_override").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["district-sport-overrides", districtId] });
      toast({ title: "Override removed" });
    },
    onError: (error) => {
      toast({ title: "Error removing override", description: error.message, variant: "destructive" });
    },
  });

  const getSportName = (sportCode: string) => {
    return sportTypes?.find((s) => s.sport_code === sportCode)?.sport_name || sportCode;
  };

  const getStateSanctionStatus = (sportCode: string) => {
    return stateSanctions?.get(sportCode);
  };

  const overridesBySportCode = new Map(overrides?.map((o) => [o.sport_code, o]));

  // Filter sports that don't already have overrides
  const availableSports = sportTypes?.filter((s) => !overridesBySportCode.has(s.sport_code)) || [];
  const filteredAvailableSports = availableSports.filter((s) =>
    s.sport_name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setFormData({ sport_code: "", sanctioned_override: true, rules_url_override: "" });
    setEditOverride(null);
    setIsAddOpen(true);
  };

  const openEdit = (override: Override) => {
    setFormData({
      sport_code: override.sport_code,
      sanctioned_override: override.sanctioned_override ?? true,
      rules_url_override: override.rules_url_override || "",
    });
    setEditOverride(override);
    setIsAddOpen(true);
  };

  const handleSave = () => {
    if (!editOverride && !formData.sport_code) {
      toast({ title: "Please select a sport", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ ...formData, id: editOverride?.id });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              District Sport Overrides
            </CardTitle>
            <CardDescription>
              Customize sanctioning status for sports in this district
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <BulkDistrictOverrideEditor districtId={districtId} stateCode={stateCode} />
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Override
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingOverrides ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : overrides && overrides.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sport</TableHead>
                <TableHead>State Status</TableHead>
                <TableHead>District Override</TableHead>
                <TableHead>Rules URL</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override) => {
                const stateStatus = getStateSanctionStatus(override.sport_code);
                return (
                  <TableRow key={override.id}>
                    <TableCell className="font-medium">{getSportName(override.sport_code)}</TableCell>
                    <TableCell>
                      {stateStatus === true ? (
                        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sanctioned
                        </Badge>
                      ) : stateStatus === false ? (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Sanctioned
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unknown</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {override.sanctioned_override ? (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Sanctioned
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Sanctioned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {override.rules_url_override ? (
                        <a
                          href={override.rules_url_override}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Rules
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(override)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(override.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No sport overrides configured</p>
            <p className="text-sm mt-1">
              Add overrides to customize sanctioning for specific sports in this district
            </p>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editOverride ? "Edit Override" : "Add Sport Override"}</DialogTitle>
            <DialogDescription>
              {editOverride
                ? "Update the sanctioning status for this sport"
                : "Override the state-level sanctioning for a sport"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editOverride && (
              <div className="space-y-2">
                <Label>Sport</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sports..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <ScrollArea className="h-[150px] border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredAvailableSports.map((sport) => (
                      <div
                        key={sport.sport_code}
                        onClick={() => setFormData({ ...formData, sport_code: sport.sport_code })}
                        className={cn(
                          "p-2 rounded cursor-pointer transition-colors",
                          formData.sport_code === sport.sport_code
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="font-medium">{sport.sport_name}</div>
                        <div className="text-xs opacity-80">
                          {sport.gender} • {sport.season}
                        </div>
                      </div>
                    ))}
                    {filteredAvailableSports.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No sports available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {editOverride && (
              <div className="p-3 rounded-lg bg-muted">
                <Label className="text-muted-foreground text-xs">Sport</Label>
                <p className="font-medium">{getSportName(formData.sport_code)}</p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Sanctioned in District</Label>
                <p className="text-sm text-muted-foreground">Enable if this sport is sanctioned</p>
              </div>
              <Switch
                checked={formData.sanctioned_override}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sanctioned_override: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Rules URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={formData.rules_url_override}
                onChange={(e) => setFormData({ ...formData, rules_url_override: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editOverride ? "Update" : "Add Override"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
