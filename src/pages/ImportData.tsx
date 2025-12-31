import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";

export default function ImportData() {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [districtFile, setDistrictFile] = useState<File | null>(null);
  const [schoolFile, setSchoolFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<'district' | 'school' | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    type?: 'district' | 'school';
    success?: boolean;
    total?: number;
    inserted?: number;
    skipped?: number;
    errors?: string[];
  } | null>(null);

  const handleDistrictImport = async () => {
    if (!districtFile) {
      toast.error("Please select a district CSV file");
      return;
    }

    setImporting('district');
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', districtFile);

      setProgress(30);
      
      const response = await supabase.functions.invoke('import-districts', {
        body: formData,
      });

      setProgress(100);

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult({ ...response.data, type: 'district' });
      
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.inserted} districts`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Import failed");
      setResult({ type: 'district', success: false, errors: [error.message] });
    } finally {
      setImporting(null);
    }
  };

  const handleSchoolImport = async () => {
    if (!schoolFile) {
      toast.error("Please select a school CSV file");
      return;
    }

    setImporting('school');
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', schoolFile);

      setProgress(30);
      
      const response = await supabase.functions.invoke('import-schools', {
        body: formData,
      });

      setProgress(100);

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult({ ...response.data, type: 'school' });
      
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.inserted} schools`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || "Import failed");
      setResult({ type: 'school', success: false, errors: [error.message] });
    } finally {
      setImporting(null);
    }
  };

  if (rolesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin()) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be a system administrator to access this page.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground">
            Import NCES school and district data from CSV files
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* District Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Districts (LEA)
              </CardTitle>
              <CardDescription>
                Upload the NCES LEA directory CSV file (ccd_lea_029_2425_w_0a_051425.csv)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setDistrictFile(e.target.files?.[0] || null)}
                  disabled={!!importing}
                />
              </div>
              
              {districtFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {districtFile.name} ({(districtFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              {importing === 'district' && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Importing districts... This may take a minute.
                  </p>
                </div>
              )}

              <Button 
                onClick={handleDistrictImport} 
                disabled={!districtFile || !!importing}
                className="w-full"
              >
                {importing === 'district' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Districts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* School Import Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Import Schools
              </CardTitle>
              <CardDescription>
                Upload the NCES School directory CSV file (ccd_sch_029_2425_w_0a_051425.csv)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSchoolFile(e.target.files?.[0] || null)}
                  disabled={!!importing}
                />
              </div>
              
              {schoolFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {schoolFile.name} ({(schoolFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              {importing === 'school' && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Importing schools... This may take a few minutes.
                  </p>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Import districts first to link schools to their districts.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSchoolImport} 
                disabled={!schoolFile || !!importing}
                className="w-full"
              >
                {importing === 'school' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Schools
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {result.type === 'school' ? 'School' : 'District'} Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Total records processed:</span> {result.total?.toLocaleString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Records imported:</span> {result.inserted?.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">Import failed</p>
                  {result.errors?.map((error, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{error}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              Download official NCES Common Core of Data files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">LEA (District) Directory</h4>
              <p className="text-sm text-muted-foreground">
                Contains 19,484 school districts with addresses, contact info, and grade ranges.
              </p>
              <a 
                href="https://nces.ed.gov/ccd/files.asp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Download from NCES →
              </a>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">School Directory</h4>
              <p className="text-sm text-muted-foreground">
                Contains 101,333 individual schools with detailed location and operational data.
              </p>
              <a 
                href="https://nces.ed.gov/ccd/files.asp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Download from NCES →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
