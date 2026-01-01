import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Database, Trophy, Building2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SystemValidation() {
  const [importing, setImporting] = useState(false);

  // Fetch counts
  const { data: sportCount, isLoading: loadingSports, refetch: refetchSports } = useQuery({
    queryKey: ["sport-types-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("sport_types").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: assocCount, isLoading: loadingAssoc, refetch: refetchAssoc } = useQuery({
    queryKey: ["associations-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("state_athletic_associations").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: sanctionCount, isLoading: loadingSanctions, refetch: refetchSanctions } = useQuery({
    queryKey: ["sanctions-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("state_sport_sanction").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: featureCount } = useQuery({
    queryKey: ["features-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("subscription_features").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const runSanctionImport = async () => {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-sanction-data");
      if (error) throw error;
      toast.success(`Import complete: ${data.final_count} sanctions loaded`);
      refetchSanctions();
    } catch (error: any) {
      toast.error("Import failed: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const refetchAll = () => {
    refetchSports();
    refetchAssoc();
    refetchSanctions();
  };

  const EXPECTED = { sports: 67, associations: 51, sanctions: 3417 };

  const checks = [
    { label: "Sport Types", count: sportCount, expected: EXPECTED.sports, loading: loadingSports, icon: Trophy },
    { label: "State Associations", count: assocCount, expected: EXPECTED.associations, loading: loadingAssoc, icon: Building2 },
    { label: "State-Sport Sanctions", count: sanctionCount, expected: EXPECTED.sanctions, loading: loadingSanctions, icon: Shield },
  ];

  const allPassing = checks.every((c) => c.count === c.expected);
  const totalLoaded = (sportCount || 0) + (assocCount || 0) + (sanctionCount || 0);
  const totalExpected = EXPECTED.sports + EXPECTED.associations + EXPECTED.sanctions;
  const progress = totalExpected > 0 ? (totalLoaded / totalExpected) * 100 : 0;

  return (
    <DashboardLayout title="System Validation">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Integrity Check
                </CardTitle>
                <CardDescription>Verify all seed data has been properly loaded</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refetchAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{totalLoaded.toLocaleString()} / {totalExpected.toLocaleString()}</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {checks.map((check) => (
                <Card key={check.label} className={check.count === check.expected ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <check.icon className="h-4 w-4" />
                        <span className="font-medium">{check.label}</span>
                      </div>
                      {check.loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : check.count === check.expected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="text-2xl font-bold">{check.count?.toLocaleString() || 0}</div>
                    <div className="text-xs text-muted-foreground">Expected: {check.expected.toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {(sanctionCount || 0) < EXPECTED.sanctions && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div>
                  <p className="font-medium">Sanction Matrix Incomplete</p>
                  <p className="text-sm text-muted-foreground">Run import to load all 3,417 state-sport combinations</p>
                </div>
                <Button onClick={runSanctionImport} disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                  {importing ? "Importing..." : "Run Import"}
                </Button>
              </div>
            )}

            {allPassing && (
              <div className="flex items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">All Validation Checks Passed</p>
                  <p className="text-sm text-green-700">System is ready with {totalLoaded.toLocaleString()} governance records</p>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Subscription Features: {featureCount || 0} configured
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
