import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, Sparkles, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "organization" | "sport" | "details" | "name" | "review";

const STEPS: Step[] = ["organization", "sport", "details", "name", "review"];
const STEP_LABELS: Record<Step, string> = {
  organization: "Organization",
  sport: "Sport",
  details: "Details",
  name: "Team Name",
  review: "Review",
};

const LEVELS = [
  { value: "varsity", label: "Varsity" },
  { value: "jv", label: "Junior Varsity" },
  { value: "freshman", label: "Freshman" },
  { value: "middle_school", label: "Middle School" },
  { value: "youth", label: "Youth" },
];

const GENDERS = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "coed", label: "Co-ed" },
];

export function TeamCreationWizard({ open, onOpenChange }: TeamCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("organization");
  const [teamData, setTeamData] = useState({
    organization_id: "",
    sport_id: "",
    season_id: "",
    level: "varsity",
    gender: "coed",
    max_roster_size: 25,
    name: "",
    useCustomName: false,
  });
  const [showNameOptions, setShowNameOptions] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, city, state")
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
        .select("id, name, icon")
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
        .select("id, name, is_active")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Derived data
  const selectedOrg = organizations?.find((o) => o.id === teamData.organization_id);
  const selectedSport = sports?.find((s) => s.id === teamData.sport_id);
  const selectedSeason = seasons?.find((s) => s.id === teamData.season_id);
  const selectedLevel = LEVELS.find((l) => l.value === teamData.level);
  const selectedGender = GENDERS.find((g) => g.value === teamData.gender);

  // Generate team name suggestions
  const nameSuggestions = useMemo(() => {
    if (!selectedOrg || !selectedSport) return [];
    
    const orgName = selectedOrg.name;
    const sportName = selectedSport.name;
    const genderLabel = selectedGender?.label || "";
    const levelLabel = selectedLevel?.label || "";
    
    // Extract short org name (e.g., "Lincoln High School" -> "Lincoln")
    const shortOrgName = orgName.split(" ")[0];
    
    return [
      // Option 1: Full format - "Lincoln High School Boys Varsity Basketball"
      `${orgName} ${genderLabel} ${levelLabel} ${sportName}`,
      // Option 2: Short format - "Varsity Basketball"
      `${levelLabel} ${sportName}`,
      // Option 3: Gender + Sport - "Boys Basketball"
      `${genderLabel} ${sportName}`,
      // Option 4: Short org + Sport - "Lincoln Basketball"
      `${shortOrgName} ${sportName}`,
    ].filter((name) => name.trim());
  }, [selectedOrg, selectedSport, selectedGender, selectedLevel]);

  const defaultTeamName = nameSuggestions[0] || "";

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const finalName = teamData.useCustomName ? teamData.name : defaultTeamName;
      
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: finalName,
          organization_id: teamData.organization_id || null,
          sport_id: teamData.sport_id || null,
          season_id: teamData.season_id || null,
          level: teamData.level,
          gender: teamData.gender,
          max_roster_size: teamData.max_roster_size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({ title: "Team created successfully!" });
      resetWizard();
      onOpenChange(false);
      navigate(`/teams/${team.id}`);
    },
    onError: (error) => {
      toast({ title: "Error creating team", description: error.message, variant: "destructive" });
    },
  });

  const resetWizard = () => {
    setCurrentStep("organization");
    setTeamData({
      organization_id: "",
      sport_id: "",
      season_id: "",
      level: "varsity",
      gender: "coed",
      max_roster_size: 25,
      name: "",
      useCustomName: false,
    });
    setShowNameOptions(false);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "organization":
        return !!teamData.organization_id;
      case "sport":
        return !!teamData.sport_id;
      case "details":
        return !!teamData.season_id && !!teamData.level && !!teamData.gender;
      case "name":
        return !teamData.useCustomName || !!teamData.name.trim();
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const goBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const selectNameSuggestion = (name: string) => {
    setTeamData({ ...teamData, name, useCustomName: true });
    setShowNameOptions(false);
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetWizard();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  index < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : index === currentStepIndex
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{STEP_LABELS[currentStep]}</p>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {currentStep === "organization" && (
            <div className="space-y-4">
              <Label>Select Organization</Label>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {organizations?.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => setTeamData({ ...teamData, organization_id: org.id })}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      teamData.organization_id === org.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{org.name}</div>
                    {(org.city || org.state) && (
                      <div className="text-sm text-muted-foreground">
                        {[org.city, org.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                ))}
                {organizations?.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No organizations found. Create an organization first.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === "sport" && (
            <div className="space-y-4">
              <Label>Select Sport</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {sports?.map((sport) => (
                  <div
                    key={sport.id}
                    onClick={() => setTeamData({ ...teamData, sport_id: sport.id })}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors text-center",
                      teamData.sport_id === sport.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {sport.icon && <span className="text-2xl mb-1 block">{sport.icon}</span>}
                    <div className="font-medium">{sport.name}</div>
                  </div>
                ))}
                {sports?.length === 0 && (
                  <p className="text-muted-foreground text-center py-8 col-span-2">
                    No sports configured. Add sports in Settings.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === "details" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Season</Label>
                <Select
                  value={teamData.season_id}
                  onValueChange={(value) => setTeamData({ ...teamData, season_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons?.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name} {season.is_active && <Badge variant="secondary" className="ml-2">Active</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={teamData.level}
                    onValueChange={(value) => setTeamData({ ...teamData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={teamData.gender}
                    onValueChange={(value) => setTeamData({ ...teamData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Roster Size</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={teamData.max_roster_size}
                  onChange={(e) =>
                    setTeamData({ ...teamData, max_roster_size: parseInt(e.target.value) || 25 })
                  }
                />
              </div>
            </div>
          )}

          {currentStep === "name" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-base">Suggested Team Name</Label>
                </div>
                <div className="text-xl font-semibold">
                  {teamData.useCustomName ? teamData.name : defaultTeamName}
                </div>
              </div>

              <Popover open={showNameOptions} onOpenChange={setShowNameOptions}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Choose a different name
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground px-2 py-1">Name variations</p>
                    {nameSuggestions.map((name, index) => (
                      <div
                        key={index}
                        onClick={() => selectNameSuggestion(name)}
                        className="px-3 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
                      >
                        {name}
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2">
                      <p className="text-sm text-muted-foreground px-2 py-1">Custom name</p>
                      <Input
                        placeholder="Enter custom team name..."
                        value={teamData.useCustomName ? teamData.name : ""}
                        onChange={(e) =>
                          setTeamData({ ...teamData, name: e.target.value, useCustomName: true })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-4">
              <div className="rounded-lg border divide-y">
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Organization</span>
                  <span className="font-medium">{selectedOrg?.name}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Sport</span>
                  <span className="font-medium">{selectedSport?.name}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Season</span>
                  <span className="font-medium">{selectedSeason?.name}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <Badge variant="secondary">{selectedLevel?.label}</Badge>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium capitalize">{selectedGender?.label}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Max Roster</span>
                  <span className="font-medium">{teamData.max_roster_size}</span>
                </div>
                <div className="p-3 flex justify-between items-start">
                  <span className="text-muted-foreground">Team Name</span>
                  <span className="font-semibold text-right max-w-[60%]">
                    {teamData.useCustomName ? teamData.name : defaultTeamName}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep === "review" ? (
            <Button
              onClick={() => createTeamMutation.mutate()}
              disabled={createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
