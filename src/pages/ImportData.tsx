import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { ImportProgress } from "@/components/imports/ImportProgress";

type ImportStage = 'idle' | 'uploading' | 'parsing' | 'importing' | 'complete' | 'error';

export default function ImportData() {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [districtFile, setDistrictFile] = useState<File | null>(null);
  const [schoolFile, setSchoolFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<'district' | 'school' | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ImportStage>('idle');
  const [stageMessage, setStageMessage] = useState('');
  const [result, setResult] = useState<{
    type?: 'district' | 'school';
    success?: boolean;
    total?: number;
    inserted?: number;
    skipped?: number;
    districtsCreated?: number;
    errors?: string[];
    // Auto-correction fields
    uniqueSchools?: number;
    duplicatesRemoved?: number;
    scientificNotationFixed?: number;
    format?: string;
  } | null>(null);

  const handleDistrictImport = async () => {
    if (!districtFile) {
      toast.error("Please select a district CSV file");
      return;
    }

    setImporting('district');
    setStage('uploading');
    setProgress(10);
    setStageMessage('Uploading file...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', districtFile);

      setStage('parsing');
      setProgress(30);
      setStageMessage('Parsing district data...');
      
      const response = await supabase.functions.invoke('import-districts', {
        body: formData,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setStage('importing');
      setProgress(70);
      setStageMessage('Importing to database...');

      // Simulate a brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      setStage('complete');
      setProgress(100);
      setStageMessage('Import complete!');

      setResult({ ...response.data, type: 'district' });
      
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.inserted} districts`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setStage('error');
      setStageMessage(error.message || 'Import failed');
      toast.error(error.message || "Import failed");
      setResult({ type: 'district', success: false, errors: [error.message] });
    } finally {
      setImporting(null);
    }
  };

  const handleSchoolImport = async () => {
    if (!schoolFile) {
      toast.error("Please select a school file");
      return;
    }

    // Determine which endpoint to use based on file type
    const isCSV = schoolFile.name.toLowerCase().endsWith('.csv');
    const endpoint = isCSV ? 'import-schools-csv' : 'import-schools';

    setImporting('school');
    setStage('uploading');
    setProgress(5);
    setStageMessage('Uploading file...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', schoolFile);

      // Simulate upload progress
      setProgress(15);
      setStage('parsing');
      setStageMessage(`Parsing ${isCSV ? 'CSV' : 'Excel'} file...`);
      
      const response = await supabase.functions.invoke(endpoint, {
        body: formData,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setStage('importing');
      setProgress(80);
      setStageMessage('Writing to database...');

      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));

      setStage('complete');
      setProgress(100);
      setStageMessage('Import complete!');

      setResult({ 
        type: 'school',
        success: response.data.success,
        total: response.data.totalRows,
        inserted: response.data.schoolsInserted,
        districtsCreated: response.data.districtsProcessed,
        uniqueSchools: response.data.uniqueSchools,
        duplicatesRemoved: response.data.duplicatesRemoved,
        scientificNotationFixed: response.data.scientificNotationFixed,
        format: response.data.format,
      });
      
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.schoolsInserted?.toLocaleString()} schools`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setStage('error');
      setStageMessage(error.message || 'Import failed');
      toast.error(error.message || "Import failed");
      setResult({ type: 'school', success: false, errors: [error.message] });
    } finally {
      setImporting(null);
    }
  };

  const resetImport = () => {
    setStage('idle');
    setProgress(0);
    setStageMessage('');
    setResult(null);
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
                Upload NCES LEA directory CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setDistrictFile(e.target.files?.[0] || null);
                    resetImport();
                  }}
                  disabled={!!importing}
                />
              </div>
              
              {districtFile && stage === 'idle' && (
                <p className="text-sm text-muted-foreground">
                  Selected: {districtFile.name} ({(districtFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              {importing === 'district' && (
                <ImportProgress 
                  progress={progress} 
                  stage={stage}
                  fileName={districtFile?.name}
                  message={stageMessage}
                />
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
                Upload school data CSV file. Districts will be auto-created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    setSchoolFile(e.target.files?.[0] || null);
                    resetImport();
                  }}
                  disabled={!!importing}
                />
              </div>
              
              {schoolFile && stage === 'idle' && (
                <p className="text-sm text-muted-foreground">
                  Selected: {schoolFile.name} ({(schoolFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              {importing === 'school' && (
                <ImportProgress 
                  progress={progress} 
                  stage={stage}
                  fileName={schoolFile?.name}
                  message={stageMessage}
                />
              )}

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Use CSV format for large files. Districts are automatically created.
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
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {result.type === 'school' ? 'School' : 'District'} Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Rows</p>
                      <p className="text-2xl font-bold">{result.total?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Imported</p>
                      <p className="text-2xl font-bold text-success">{result.inserted?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {result.districtsCreated !== undefined && result.districtsCreated > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Districts processed:</span> {result.districtsCreated?.toLocaleString()}
                    </p>
                  )}

                  {/* Auto-correction summary */}
                  {(result.duplicatesRemoved || result.scientificNotationFixed || result.format) && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-2">Auto-Corrections Applied</p>
                      <div className="space-y-1.5">
                        {result.format && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            Format detected: <span className="font-medium">{result.format}</span>
                          </p>
                        )}
                        {result.duplicatesRemoved !== undefined && result.duplicatesRemoved > 0 && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            Duplicates removed: <span className="font-medium">{result.duplicatesRemoved.toLocaleString()}</span>
                          </p>
                        )}
                        {result.scientificNotationFixed !== undefined && result.scientificNotationFixed > 0 && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            NCES IDs fixed (scientific notation): <span className="font-medium">{result.scientificNotationFixed.toLocaleString()}</span>
                          </p>
                        )}
                        {result.uniqueSchools !== undefined && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            Unique schools: <span className="font-medium">{result.uniqueSchools.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Convert Excel files to CSV format before uploading for best performance with large datasets.
              </AlertDescription>
            </Alert>
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
