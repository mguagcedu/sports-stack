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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, Sparkles, Edit, AlertTriangle, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SportTypeSelector } from "@/components/governance/SportTypeSelector";

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

export function TeamCreationWizard({ open, onOpenChange }: TeamCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("organization");
  const [teamData, setTeamData] = useState({
    organization_id: "",
    sport_code: "",
    sport_name: "",
    sport_gender: "",
    season_id: "",
    level: "varsity",
    max_roster_size: 25,
    name: "",
    useCustomName: false,
  });

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

  const { data: seasons } = useQuery({
    queryKey: ["seasons-with-dates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name, is_active, start_date, end_date, academic_year")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Categorize seasons
  const categorizedSeasons = useMemo(() => {
    if (!seasons) return { current: [], future: [], past: [] };
    const now = new Date();
    const current: typeof seasons = [];
    const future: typeof seasons = [];
    const past: typeof seasons = [];
    
    seasons.forEach((season) => {
      const startDate = season.start_date ? new Date(season.start_date) : null;
      const endDate = season.end_date ? new Date(season.end_date) : null;
      
      if (season.is_active) {
        current.push(season);
      } else if (startDate && startDate > now) {
        future.push(season);
      } else if (endDate && endDate < now) {
        past.push(season);
      } else {
        // Default to current if dates are unclear
        current.push(season);
      }
    });
    
    return { current, future, past };
  }, [seasons]);

  // Derived data
  const selectedOrg = organizations?.find((o) => o.id === teamData.organization_id);
  const selectedSeason = seasons?.find((s) => s.id === teamData.season_id);
  const selectedLevel = LEVELS.find((l) => l.value === teamData.level);

  // State code for sanctioning checks
  const stateCode = selectedOrg?.state || undefined;

  // Check sanctioning status for the selected sport in the org's state
  const { data: sanctionStatus } = useQuery({
    queryKey: ["sanction-status", stateCode, teamData.sport_code],
    queryFn: async () => {
      if (!stateCode || !teamData.sport_code) return null;
      const { data, error } = await supabase
        .from("state_sport_sanction")
        .select("sanctioned, rules_url, last_verified_date")
        .eq("state_code", stateCode)
        .eq("sport_code", teamData.sport_code)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!stateCode && !!teamData.sport_code,
  });

  // Map gender from sport type
  const mapGenderToTeam = (sportGender: string): string => {
    if (sportGender === "Boys") return "boys";
    if (sportGender === "Girls") return "girls";
    return "coed";
  };

  // Generate team name suggestions
  const nameSuggestions = useMemo(() => {
    if (!selectedOrg || !teamData.sport_name) return [];
    
    const orgName = selectedOrg.name;
    const sportName = teamData.sport_name;
    const genderLabel = teamData.sport_gender || "Coed";
    const levelLabel = selectedLevel?.label || "";
    
    // Extract short org name
    const shortOrgName = orgName.split(" ")[0];
    
    return [
      // Full format
      `${orgName} ${genderLabel} ${levelLabel} ${sportName}`,
      // Level + Sport
      `${levelLabel} ${sportName}`,
      // Gender + Sport
      `${genderLabel} ${sportName}`,
      // Short org + Sport
      `${shortOrgName} ${sportName}`,
    ].filter((name) => name.trim());
  }, [selectedOrg, teamData.sport_name, teamData.sport_gender, selectedLevel]);

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
          season_id: teamData.season_id || null,
          level: teamData.level,
          gender: mapGenderToTeam(teamData.sport_gender),
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
      sport_code: "",
      sport_name: "",
      sport_gender: "",
      season_id: "",
      level: "varsity",
      max_roster_size: 25,
      name: "",
      useCustomName: false,
    });
  };

  const handleSportSelect = (sport: SportType) => {
    setTeamData({
      ...teamData,
      sport_code: sport.sport_code,
      sport_name: sport.sport_name,
      sport_gender: sport.gender,
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "organization":
        return !!teamData.organization_id;
      case "sport":
        return !!teamData.sport_code;
      case "details":
        return !!teamData.season_id && !!teamData.level;
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
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetWizard();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px]">
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
        <div className="min-h-[250px]">
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
              <div className="space-y-2">
                <Label>Select Sport Type</Label>
                <p className="text-sm text-muted-foreground">
                  Choose from 67 sport types with season, gender, and format details
                </p>
              </div>

              <SportTypeSelector
                value={teamData.sport_code}
                onSelect={handleSportSelect}
                stateCode={stateCode}
                placeholder="Browse sports..."
              />

              {/* State Sanctioning Status */}
              {teamData.sport_code && stateCode && (
                <div className="pt-2">
                  {sanctionStatus?.sanctioned === true ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <span className="font-medium">{teamData.sport_name}</span> is sanctioned in {stateCode}
                        {sanctionStatus.rules_url && (
                          <a href={sanctionStatus.rules_url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                            View Rules
                          </a>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : sanctionStatus?.sanctioned === false ? (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <span className="font-medium">{teamData.sport_name}</span> is not sanctioned in {stateCode}. 
                        You can still create this team, but state playoffs may not be available.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-muted">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <AlertDescription className="text-muted-foreground">
                        Sanctioning status unknown for {stateCode}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {teamData.sport_code && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{teamData.sport_gender}</Badge>
                  <Badge variant="secondary">{teamData.sport_name}</Badge>
                </div>
              )}
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
                    {categorizedSeasons.current.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Current Season</div>
                        {categorizedSeasons.current.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            <span className="flex items-center gap-2">
                              {season.name}
                              {season.is_active && <Badge variant="default" className="text-xs h-5">Active</Badge>}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {categorizedSeasons.future.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Future Seasons</div>
                        {categorizedSeasons.future.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            <span className="flex items-center gap-2">
                              {season.name}
                              <Badge variant="outline" className="text-xs h-5">Upcoming</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {categorizedSeasons.past.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Past Seasons</div>
                        {categorizedSeasons.past.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            <span className="text-muted-foreground">{season.name}</span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {teamData.season_id && categorizedSeasons.future.some(s => s.id === teamData.season_id) && (
                  <p className="text-xs text-muted-foreground">
                    Creating a team for a future season allows you to plan ahead.
                  </p>
                )}
              </div>

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

              {/* Sport summary */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-sm text-muted-foreground mb-1">Selected Sport</div>
                <div className="font-medium">{teamData.sport_name}</div>
                <div className="text-sm text-muted-foreground">{teamData.sport_gender}</div>
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

              <Popover>
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
                <div className="p-3 flex justify-between items-center">
                  <span className="text-muted-foreground">Sport</span>
                  <div className="text-right">
                    <span className="font-medium">{teamData.sport_name}</span>
                    {sanctionStatus?.sanctioned === true && (
                      <Badge variant="outline" className="ml-2 text-green-700 border-green-300 bg-green-50">
                        Sanctioned
                      </Badge>
                    )}
                    {sanctionStatus?.sanctioned === false && (
                      <Badge variant="outline" className="ml-2 text-amber-700 border-amber-300 bg-amber-50">
                        Not Sanctioned
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{teamData.sport_gender}</span>
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

              {sanctionStatus?.sanctioned === false && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    This sport is not sanctioned in {stateCode}. The team will be created, but state playoffs eligibility may be affected.
                  </AlertDescription>
                </Alert>
              )}
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
