import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { ImportProgress } from "@/components/imports/ImportProgress";
import { DropZone, FileList } from "@/components/imports/DropZone";
import { ImportHistoryTable } from "@/components/imports/ImportHistoryTable";
import { parseCSV, extractDistricts, SchoolRow, DistrictData } from "@/lib/csvParser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

type ImportStage = 'idle' | 'uploading' | 'parsing' | 'importing' | 'processing' | 'complete' | 'error';

export default function ImportData() {
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [schoolFiles, setSchoolFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ImportStage>('idle');
  const [stageMessage, setStageMessage] = useState('');
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [activeXhr, setActiveXhr] = useState<XMLHttpRequest | null>(null);
  const [importHistoryId, setImportHistoryId] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [pollingRowsInserted, setPollingRowsInserted] = useState<number>(0);
  const [pollingTotalRows, setPollingTotalRows] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [result, setResult] = useState<{
    type?: 'district' | 'school';
    success?: boolean;
    total?: number;
    inserted?: number;
    skipped?: number;
    districtsCreated?: number;
    errors?: string[];
    uniqueSchools?: number;
    duplicatesRemoved?: number;
    scientificNotationFixed?: number;
    format?: string;
    statusBreakdown?: Record<string, number>;
    stateBreakdown?: Record<string, number>;
    expectedTotal?: number;
    matchesExpected?: boolean;
  } | null>(null);

  // Clear schools state
  const [schoolCount, setSchoolCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Upload with progress tracking using XMLHttpRequest
  const uploadWithProgress = (
    file: File,
    url: string,
    accessToken: string,
    onProgress: (loaded: number, total: number, estimatedSeconds: number | null, speedBytesPerSec: number) => void,
    onXhrCreated: (xhr: XMLHttpRequest) => void,
    historyId?: string
  ): Promise<{ data: any; error: any; cancelled?: boolean }> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      if (historyId) {
        formData.append('historyId', historyId);
      }
      const startTime = Date.now();

      // Expose XHR for cancellation
      onXhrCreated(xhr);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const bytesPerSecond = elapsedSeconds > 0 ? e.loaded / elapsedSeconds : 0;
          const remainingBytes = e.total - e.loaded;
          const estimatedSeconds = bytesPerSecond > 0 
            ? Math.ceil(remainingBytes / bytesPerSecond) 
            : null;
          onProgress(e.loaded, e.total, estimatedSeconds, bytesPerSecond);
        }
      });

      xhr.addEventListener('abort', () => {
        resolve({ data: null, error: { message: 'Import cancelled by user' }, cancelled: true });
      });

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ data: response, error: null });
          } else {
            resolve({ data: null, error: { message: response.error || 'Upload failed' } });
          }
        } catch {
          resolve({ data: null, error: { message: 'Invalid response from server' } });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ data: null, error: { message: 'Network error during upload' } });
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
      xhr.send(formData);
    });
  };

  const handleCancelImport = async () => {
    // Set cancelled flag
    setIsCancelled(true);
    
    // Stop polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    
    // Abort active upload
    if (activeXhr) {
      activeXhr.abort();
      setActiveXhr(null);
    }
    
    // Update history record as cancelled
    if (importHistoryId) {
      await supabase
        .from('import_history')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', importHistoryId);
      setHistoryRefreshTrigger(prev => prev + 1);
    }
    
    setImporting(false);
    setStage('idle');
    setProgress(0);
    setStageMessage('');
    setEstimatedTimeRemaining(null);
    setUploadSpeed(null);
    setImportHistoryId(null);
    setCurrentFileIndex(0);
    toast.info('Import cancelled');
  };

  // Fetch school count
  useEffect(() => {
    const fetchSchoolCount = async () => {
      setLoadingCount(true);
      try {
        const { count, error } = await supabase
          .from('schools')
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          setSchoolCount(count);
        }
      } catch (e) {
        console.error('Failed to fetch school count:', e);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchSchoolCount();
  }, [result]); // Refresh after import

  const handleSchoolImport = async () => {
    if (schoolFiles.length === 0) {
      toast.error("Please select school files");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to import data");
      return;
    }

    setImporting(true);
    setIsCancelled(false);
    setStage('parsing');
    setProgress(0);
    setStageMessage('Reading and parsing CSV files...');
    setResult(null);
    setPollingRowsInserted(0);
    setPollingTotalRows(0);
    setCurrentFileIndex(0);

    const BATCH_SIZE = 2000; // Schools per batch
    let cumulativeInserted = 0;
    let cumulativeTotal = 0;
    let cumulativeDistricts = 0;
    let lastFormat = '';
    const allStatusBreakdown: Record<string, number> = {};
    const allStateBreakdown: Record<string, number> = {};

    try {
      // Process each file
      for (let fileIndex = 0; fileIndex < schoolFiles.length; fileIndex++) {
        if (isCancelled) break;
        
        setCurrentFileIndex(fileIndex);
        const file = schoolFiles[fileIndex];
        
        setStageMessage(`Parsing file ${fileIndex + 1} of ${schoolFiles.length}: ${file.name}...`);
        setProgress(Math.round((fileIndex / schoolFiles.length) * 10));

        // Read file content on client
        const csvText = await file.text();
        const { schools, format } = parseCSV(csvText);
        lastFormat = format;

        if (schools.length === 0) {
          toast.error(`No valid data found in ${file.name}`);
          continue;
        }

        // Extract unique districts (only from first batch)
        const districts = extractDistricts(schools);
        cumulativeTotal += schools.length;

        // Create history record
        const { data: historyRecord } = await supabase
          .from('import_history')
          .insert({
            user_id: session.user.id,
            file_name: file.name,
            file_size_bytes: file.size,
            import_type: 'schools',
            status: 'processing',
            total_rows: schools.length,
            format: format,
          })
          .select('id')
          .single();

        if (!historyRecord) {
          toast.error(`Failed to create history record for ${file.name}`);
          continue;
        }

        const currentHistoryId = historyRecord.id;
        setImportHistoryId(currentHistoryId);

        // Split schools into batches
        const batchCount = Math.ceil(schools.length / BATCH_SIZE);
        setTotalBatches(batchCount);
        setStage('processing');
        setPollingTotalRows(cumulativeTotal);

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
          setCurrentBatch(batchIndex + 1);
          if (isCancelled) {
            await supabase
              .from('import_history')
              .update({ status: 'cancelled', completed_at: new Date().toISOString() })
              .eq('id', currentHistoryId);
            break;
          }

          const start = batchIndex * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, schools.length);
          const batchSchools = schools.slice(start, end);
          
          // Only send districts on first batch
          const batchDistricts = batchIndex === 0 ? districts : [];

          const overallProgress = 10 + (
            (fileIndex / schoolFiles.length) * 85 +
            ((batchIndex + 1) / batchCount) * (85 / schoolFiles.length)
          );
          setProgress(Math.round(overallProgress));
          setStageMessage(`File ${fileIndex + 1}/${schoolFiles.length}: Batch ${batchIndex + 1}/${batchCount} (${(cumulativeInserted + end).toLocaleString()} records)...`);

          // Send batch to edge function
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-schools-batch`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                historyId: currentHistoryId,
                schools: batchSchools,
                districts: batchDistricts,
                batchIndex,
                totalBatches: batchCount,
                isLastBatch: batchIndex === batchCount - 1,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Batch ${batchIndex + 1} failed`);
          }

          const batchResult = await response.json();
          
          if (batchResult.cancelled) {
            toast.info('Import cancelled');
            break;
          }

          cumulativeInserted += batchResult.inserted || 0;
          if (batchIndex === 0) {
            cumulativeDistricts += batchDistricts.length;
          }

          setPollingRowsInserted(cumulativeInserted);
        }

        if (isCancelled) break;

        // Get final status breakdown from history
        const { data: finalHistory } = await supabase
          .from('import_history')
          .select('status_breakdown, state_breakdown')
          .eq('id', currentHistoryId)
          .maybeSingle();

        if (finalHistory?.status_breakdown) {
          for (const [k, v] of Object.entries(finalHistory.status_breakdown as Record<string, number>)) {
            allStatusBreakdown[k] = (allStatusBreakdown[k] || 0) + v;
          }
        }
        if (finalHistory?.state_breakdown) {
          for (const [k, v] of Object.entries(finalHistory.state_breakdown as Record<string, number>)) {
            allStateBreakdown[k] = (allStateBreakdown[k] || 0) + v;
          }
        }

        toast.success(`Completed ${file.name}: ${schools.length.toLocaleString()} records`);
      }

      if (!isCancelled) {
        setStage('complete');
        setProgress(100);
        setStageMessage('Import complete!');
        setHistoryRefreshTrigger(prev => prev + 1);

        setResult({
          type: 'school',
          success: true,
          total: cumulativeTotal,
          inserted: cumulativeInserted,
          districtsCreated: cumulativeDistricts,
          format: lastFormat,
          statusBreakdown: allStatusBreakdown,
          stateBreakdown: allStateBreakdown,
        });

        toast.success(`Successfully imported ${cumulativeInserted.toLocaleString()} schools from ${schoolFiles.length} file(s)`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setStage('error');
      setStageMessage(error.message || 'Import failed');
      toast.error(error.message || 'Import failed');
      setResult({ type: 'school', success: false, errors: [error.message] });
      setHistoryRefreshTrigger(prev => prev + 1);
    } finally {
      setImporting(false);
      setIsCancelled(false);
    }
  };

  const handleClearSchools = async () => {
    if (confirmText !== 'DELETE') return;

    setClearing(true);
    try {
      const response = await supabase.functions.invoke('clear-schools');

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        setSchoolCount(0);
        setDialogOpen(false);
        setConfirmText('');
      } else {
        throw new Error(response.data.error || 'Failed to clear schools');
      }
    } catch (error: any) {
      console.error('Clear schools error:', error);
      toast.error(error.message || 'Failed to clear schools');
    } finally {
      setClearing(false);
    }
  };

  const resetImport = () => {
    setStage('idle');
    setProgress(0);
    setStageMessage('');
    setResult(null);
  };

  const removeSchoolFile = (index: number) => {
    setSchoolFiles(prev => prev.filter((_, i) => i !== index));
    resetImport();
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
            Import NCES school data from CSV files. Districts are automatically created.
          </p>
        </div>

        {/* School Import Card */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Schools
            </CardTitle>
            <CardDescription>
              Upload NCES school data CSV files. Districts are automatically created from the school data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DropZone
              onFilesSelected={(files) => {
                setSchoolFiles(files);
                resetImport();
              }}
              accept=".csv"
              maxFiles={300}
              disabled={importing}
            />
            
            <FileList 
              files={schoolFiles} 
              onRemove={removeSchoolFile}
              disabled={importing}
            />

              {importing && (
                <ImportProgress 
                  progress={progress} 
                  stage={stage}
                  fileName={schoolFiles[currentFileIndex]?.name}
                  message={stageMessage}
                  uploadedBytes={uploadedBytes}
                  totalBytes={totalBytes}
                  estimatedTimeRemaining={estimatedTimeRemaining}
                  uploadSpeed={uploadSpeed}
                  onCancel={handleCancelImport}
                  canCancel={stage === 'uploading' || stage === 'processing'}
                  rowsInserted={pollingRowsInserted}
                  totalRows={pollingTotalRows}
                  currentBatch={currentBatch}
                  totalBatches={totalBatches}
                />
              )}

            <Button 
              onClick={handleSchoolImport} 
              disabled={schoolFiles.length === 0 || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Schools ({schoolFiles.length} file{schoolFiles.length !== 1 ? 's' : ''})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

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
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-4">
                  {/* Validation Banner */}
                  {result.expectedTotal && (
                    <Alert className={result.matchesExpected ? "border-success bg-success/10" : "border-warning bg-warning/10"}>
                      <CheckCircle2 className={`h-4 w-4 ${result.matchesExpected ? "text-success" : "text-warning"}`} />
                      <AlertTitle>
                        {result.matchesExpected 
                          ? "✓ Record count matches CCD official total" 
                          : "⚠ Record count differs from expected"}
                      </AlertTitle>
                      <AlertDescription>
                        Expected: {result.expectedTotal.toLocaleString()} | 
                        Imported: {result.inserted?.toLocaleString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Rows Parsed</p>
                      <p className="text-2xl font-bold">{result.total?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Records Inserted</p>
                      <p className="text-2xl font-bold text-success">{result.inserted?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {result.districtsCreated !== undefined && result.districtsCreated > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Districts processed:</span> {result.districtsCreated?.toLocaleString()}
                    </p>
                  )}

                  {/* Status Breakdown */}
                  {result.statusBreakdown && Object.keys(result.statusBreakdown).length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-3">Count by SY_STATUS</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(result.statusBreakdown)
                          .sort((a, b) => b[1] - a[1])
                          .map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center p-2 rounded bg-muted/50">
                              <span className="text-sm truncate">{status || 'Unknown'}</span>
                              <span className="text-sm font-mono font-medium ml-2">{count.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* State Breakdown */}
                  {result.stateBreakdown && Object.keys(result.stateBreakdown).length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium mb-3">Count by State (Top 15)</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {Object.entries(result.stateBreakdown)
                          .slice(0, 15)
                          .map(([state, count]) => (
                            <div key={state} className="flex justify-between items-center p-2 rounded bg-muted/50">
                              <span className="text-sm font-medium">{state}</span>
                              <span className="text-sm font-mono">{count.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                      {Object.keys(result.stateBreakdown).length > 15 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {Object.keys(result.stateBreakdown).length - 15} more states
                        </p>
                      )}
                    </div>
                  )}

                  {result.format && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        Format detected: <span className="font-medium">{result.format}</span>
                      </p>
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

        {/* Import History */}
        <ImportHistoryTable refreshTrigger={historyRefreshTrigger} />

        {/* Data Management */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Manage imported school and district data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Schools in database</p>
                <p className="text-2xl font-bold">
                  {loadingCount ? (
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  ) : (
                    schoolCount?.toLocaleString() ?? '—'
                  )}
                </p>
              </div>
              
              <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={schoolCount === 0 || loadingCount}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Schools
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <span className="block">
                        This action cannot be undone. This will permanently delete all{' '}
                        <strong>{schoolCount?.toLocaleString()}</strong> schools from the database.
                      </span>
                      <span className="block">
                        Type <strong>DELETE</strong> to confirm:
                      </span>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="mt-2"
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmText('')}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearSchools}
                      disabled={confirmText !== 'DELETE' || clearing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {clearing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete All Schools'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

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
