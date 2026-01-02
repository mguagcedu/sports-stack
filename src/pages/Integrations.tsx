import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { FileText, Ticket, ExternalLink, Info, AlertCircle, Save, Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GoFanConnectWizard, FinalFormsLinks, IntegrationDisclaimer } from "@/components/integrations";
import { INTEGRATION_DISCLAIMER } from "@/lib/integrations";

interface School {
  id: string;
  name: string;
  state: string | null;
  finalforms_portal_url: string | null;
  gofan_school_url: string | null;
  finalforms_enabled: boolean | null;
  gofan_enabled: boolean | null;
}

interface District {
  id: string;
  name: string;
  state: string;
  finalforms_portal_url: string | null;
  gofan_school_url: string | null;
  finalforms_enabled: boolean | null;
  gofan_enabled: boolean | null;
}

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedEntityType, setSelectedEntityType] = useState<"school" | "district">("school");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [isGoFanWizardOpen, setIsGoFanWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [finalformsUrl, setFinalformsUrl] = useState("");
  const [gofanUrl, setGofanUrl] = useState("");
  const [finalformsEnabled, setFinalformsEnabled] = useState(false);
  const [gofanEnabled, setGofanEnabled] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Fetch schools
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ["schools-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, state, finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled")
        .order("name");
      if (error) throw error;
      return data as School[];
    },
  });

  // Fetch districts
  const { data: districts, isLoading: districtsLoading } = useQuery({
    queryKey: ["districts-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("districts")
        .select("id, name, state, finalforms_portal_url, gofan_school_url, finalforms_enabled, gofan_enabled")
        .order("name");
      if (error) throw error;
      return data as District[];
    },
  });

  // Get the currently selected entity
  const selectedEntity = selectedEntityType === "school" 
    ? schools?.find(s => s.id === selectedEntityId)
    : districts?.find(d => d.id === selectedEntityId);

  // Update form when entity changes
  const handleEntityChange = (id: string) => {
    setSelectedEntityId(id);
    setUrlError(null);
    
    const entity = selectedEntityType === "school"
      ? schools?.find(s => s.id === id)
      : districts?.find(d => d.id === id);
    
    if (entity) {
      setFinalformsUrl(entity.finalforms_portal_url || "");
      setGofanUrl(entity.gofan_school_url || "");
      setFinalformsEnabled(entity.finalforms_enabled || false);
      setGofanEnabled(entity.gofan_enabled || false);
    }
  };

  // Validate URL format
  const validateUrl = (url: string, type: "finalforms" | "gofan"): boolean => {
    if (!url) return true; // Empty is ok
    
    if (!url.startsWith("https://")) {
      setUrlError(`${type === "finalforms" ? "FinalForms" : "GoFan"} URL must start with https://`);
      return false;
    }
    
    setUrlError(null);
    return true;
  };

  // Save school integrations
  const saveSchoolMutation = useMutation({
    mutationFn: async () => {
      if (!validateUrl(finalformsUrl, "finalforms") || !validateUrl(gofanUrl, "gofan")) {
        throw new Error("Invalid URL format");
      }
      
      const { error } = await supabase
        .from("schools")
        .update({
          finalforms_portal_url: finalformsUrl || null,
          gofan_school_url: gofanUrl || null,
          finalforms_enabled: finalformsEnabled,
          gofan_enabled: gofanEnabled,
        })
        .eq("id", selectedEntityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools-integrations"] });
      toast({ title: "Integration settings saved" });
    },
    onError: (error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  // Save district integrations
  const saveDistrictMutation = useMutation({
    mutationFn: async () => {
      if (!validateUrl(finalformsUrl, "finalforms") || !validateUrl(gofanUrl, "gofan")) {
        throw new Error("Invalid URL format");
      }
      
      const { error } = await supabase
        .from("districts")
        .update({
          finalforms_portal_url: finalformsUrl || null,
          gofan_school_url: gofanUrl || null,
          finalforms_enabled: finalformsEnabled,
          gofan_enabled: gofanEnabled,
        })
        .eq("id", selectedEntityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["districts-integrations"] });
      toast({ title: "Integration settings saved" });
    },
    onError: (error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (selectedEntityType === "school") {
      saveSchoolMutation.mutate();
    } else {
      saveDistrictMutation.mutate();
    }
  };

  const isSaving = saveSchoolMutation.isPending || saveDistrictMutation.isPending;
  const isLoading = schoolsLoading || districtsLoading;

  return (
    <DashboardLayout title="Integrations">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Configure external service integrations for eligibility and ticketing
          </p>
        </div>

        {/* Entity Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Organization</CardTitle>
            <CardDescription>
              Choose a school or district to configure integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select 
                  value={selectedEntityType} 
                  onValueChange={(v: "school" | "district") => {
                    setSelectedEntityType(v);
                    setSelectedEntityId("");
                    setSearchQuery("");
                    setFinalformsUrl("");
                    setGofanUrl("");
                    setFinalformsEnabled(false);
                    setGofanEnabled(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search {selectedEntityType === "school" ? "Schools" : "Districts"}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${selectedEntityType}s by name...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* Filtered results list */}
            {searchQuery && (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {selectedEntityType === "school" ? (
                  schools?.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 50)
                    .map((school) => (
                      <button
                        key={school.id}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${selectedEntityId === school.id ? 'bg-primary/10 border-primary' : ''}`}
                        onClick={() => {
                          handleEntityChange(school.id);
                          setSearchQuery("");
                        }}
                      >
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-muted-foreground">{school.state || 'No state'}</div>
                      </button>
                    ))
                ) : (
                  districts?.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 50)
                    .map((district) => (
                      <button
                        key={district.id}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${selectedEntityId === district.id ? 'bg-primary/10 border-primary' : ''}`}
                        onClick={() => {
                          handleEntityChange(district.id);
                          setSearchQuery("");
                        }}
                      >
                        <div className="font-medium">{district.name}</div>
                        <div className="text-sm text-muted-foreground">{district.state}</div>
                      </button>
                    ))
                )}
                {((selectedEntityType === "school" && schools?.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ||
                  (selectedEntityType === "district" && districts?.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0)) && (
                  <div className="p-4 text-center text-muted-foreground">No results found</div>
                )}
              </div>
            )}
            
            {/* Selected entity display */}
            {selectedEntity && !searchQuery && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Selected:</strong> {selectedEntity.name} ({selectedEntity.state})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {selectedEntityId && (
          <Tabs defaultValue="finalforms" className="space-y-4">
            <TabsList>
              <TabsTrigger value="finalforms" className="gap-2">
                <FileText className="h-4 w-4" />
                Eligibility & Forms
              </TabsTrigger>
              <TabsTrigger value="gofan" className="gap-2">
                <Ticket className="h-4 w-4" />
                Ticketing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="finalforms">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Eligibility and Forms Provider: FinalForms
                  </CardTitle>
                  <CardDescription>
                    Configure FinalForms integration for athlete eligibility verification and forms management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base">Enable FinalForms Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Show FinalForms links for coaches and staff
                      </p>
                    </div>
                    <Switch
                      checked={finalformsEnabled}
                      onCheckedChange={setFinalformsEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>FinalForms Portal URL</Label>
                    <Input
                      value={finalformsUrl}
                      onChange={(e) => {
                        setFinalformsUrl(e.target.value);
                        if (urlError?.includes("FinalForms")) setUrlError(null);
                      }}
                      placeholder="https://yourschool.finalforms.com"
                      disabled={!finalformsEnabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      Example: <code className="bg-muted px-1.5 py-0.5 rounded">https://yourschool.finalforms.com</code>
                    </p>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This integration provides direct links to your FinalForms portal. No data is synced or scraped from FinalForms. 
                      Coaches will use this link to verify athlete eligibility directly in FinalForms.
                    </AlertDescription>
                  </Alert>

                  {finalformsEnabled && selectedEntity && (
                    <div className="pt-4 border-t">
                      <Label className="mb-3 block">Preview Links</Label>
                      <FinalFormsLinks
                        config={{
                          stateCode: selectedEntity.state || "",
                          districtName: selectedEntity.name,
                          subdomainOverride: finalformsUrl?.replace("https://", "").replace(".finalforms.com", "") || null,
                        }}
                        enabled={finalformsEnabled}
                        compact
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gofan">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Ticketing Provider: GoFan
                  </CardTitle>
                  <CardDescription>
                    Configure GoFan integration for event ticketing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base">Enable GoFan Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Show GoFan ticket links for events
                      </p>
                    </div>
                    <Switch
                      checked={gofanEnabled}
                      onCheckedChange={setGofanEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GoFan School URL</Label>
                    <Input
                      value={gofanUrl}
                      onChange={(e) => {
                        setGofanUrl(e.target.value);
                        if (urlError?.includes("GoFan")) setUrlError(null);
                      }}
                      placeholder="https://gofan.co/app/school/XXXXXX"
                      disabled={!gofanEnabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      Example: <code className="bg-muted px-1.5 py-0.5 rounded">https://gofan.co/app/school/123456</code>
                    </p>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This integration provides links to your GoFan ticketing page. Individual events can have their own GoFan URLs 
                      configured on the Events page.
                    </AlertDescription>
                  </Alert>

                  {gofanEnabled && selectedEntity && (
                    <div className="pt-4 border-t">
                      <Label className="mb-3 block">Connect Your School</Label>
                      <Button variant="outline" onClick={() => setIsGoFanWizardOpen(true)}>
                        Find School on GoFan
                      </Button>
                      <GoFanConnectWizard
                        open={isGoFanWizardOpen}
                        onOpenChange={setIsGoFanWizardOpen}
                        stateCode={selectedEntity.state || ""}
                        onConnect={(schoolId, _url) => {
                          setGofanUrl(`https://gofan.co/app/school/${schoolId}`);
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {urlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{urlError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving || !!urlError}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Integration Settings
                  </>
                )}
              </Button>
            </div>
          </Tabs>
        )}

        {!selectedEntityId && !isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select an Organization</h3>
                <p className="text-sm">
                  Choose a school or district above to configure their integration settings
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Disclaimer */}
        <IntegrationDisclaimer />
      </div>
    </DashboardLayout>
  );
}
