import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileUp, FileSearch, Database, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportProgressProps {
  progress: number;
  stage: 'idle' | 'uploading' | 'parsing' | 'importing' | 'processing' | 'complete' | 'error';
  fileName?: string;
  message?: string;
  uploadedBytes?: number;
  totalBytes?: number;
  estimatedTimeRemaining?: number | null;
  uploadSpeed?: number | null;
  onCancel?: () => void;
  canCancel?: boolean;
  // Background processing stats
  rowsInserted?: number;
  totalRows?: number;
}

function formatTimeRemaining(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null;
  if (seconds < 60) return `About ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
  const minutes = Math.ceil(seconds / 60);
  return `About ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
}

const stages = [
  { key: 'uploading', label: 'Upload', icon: FileUp },
  { key: 'processing', label: 'Processing', icon: Database },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
] as const;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number | null): string | null {
  if (!bytesPerSec || bytesPerSec <= 0) return null;
  const mbps = bytesPerSec / (1024 * 1024);
  if (mbps >= 1) {
    return `${mbps.toFixed(1)} MB/s`;
  }
  const kbps = bytesPerSec / 1024;
  return `${kbps.toFixed(0)} KB/s`;
}

export function ImportProgress({ 
  progress, 
  stage, 
  fileName, 
  message,
  uploadedBytes,
  totalBytes,
  estimatedTimeRemaining,
  uploadSpeed,
  onCancel,
  canCancel,
  rowsInserted,
  totalRows
}: ImportProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayProgress < progress) {
        setDisplayProgress(prev => Math.min(prev + 1, progress));
      }
    }, 20);
    return () => clearTimeout(timer);
  }, [displayProgress, progress]);

  // Reset on new upload
  useEffect(() => {
    if (stage === 'idle') {
      setDisplayProgress(0);
    }
  }, [stage]);

  const getCurrentStageIndex = () => {
    switch (stage) {
      case 'uploading': return 0;
      case 'parsing': 
      case 'importing':
      case 'processing': return 1;
      case 'complete': return 2;
      default: return -1;
    }
  };

  const currentStageIndex = getCurrentStageIndex();

  if (stage === 'idle') return null;

  // Build upload details string
  const getUploadDetails = () => {
    if (stage !== 'uploading' || !totalBytes) return null;
    const uploaded = uploadedBytes ?? 0;
    const percent = Math.round((uploaded / totalBytes) * 100);
    const speedDisplay = formatSpeed(uploadSpeed);
    const baseDetails = `${formatBytes(uploaded)} / ${formatBytes(totalBytes)} (${percent}%)`;
    return speedDisplay ? `${baseDetails} • ${speedDisplay}` : baseDetails;
  };

  const uploadDetails = getUploadDetails();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* File info with upload details */}
      {fileName && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileUp className={cn("h-4 w-4", stage === 'uploading' && "animate-bounce")} />
            <span className="truncate max-w-[200px]">{fileName}</span>
          </div>
          {uploadDetails && (
            <span className="text-xs font-mono text-primary font-medium">
              {uploadDetails}
            </span>
          )}
          {stage === 'uploading' && estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <span className="text-xs text-muted-foreground">
              {formatTimeRemaining(estimatedTimeRemaining)}
            </span>
          )}
        </div>
      )}

      {/* Stage indicators */}
      <div className="flex items-center justify-between">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex || stage === 'complete';
          const isPending = index > currentStageIndex;

          return (
            <div key={s.key} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110",
                  isComplete && "bg-success text-success-foreground",
                  isPending && "bg-muted text-muted-foreground",
                  stage === 'error' && isActive && "bg-destructive text-destructive-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive && "text-primary",
                  isComplete && "text-success",
                  isPending && "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        {/* Animated gradient progress */}
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full relative overflow-hidden",
            stage === 'error' ? "bg-destructive" : "bg-gradient-to-r from-primary via-primary/80 to-primary"
          )}
          style={{ width: `${displayProgress}%` }}
        >
          {/* Shimmer effect */}
          {stage !== 'complete' && stage !== 'error' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>
        
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-xs font-bold",
            displayProgress > 50 ? "text-primary-foreground" : "text-foreground"
          )}>
            {Math.round(displayProgress)}%
          </span>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <p className={cn(
          "text-sm text-center",
          stage === 'error' ? "text-destructive" : "text-muted-foreground"
        )}>
          {message}
        </p>
      )}

      {/* Background processing stats */}
      {stage === 'processing' && rowsInserted !== undefined && totalRows !== undefined && totalRows > 0 && (
        <div className="text-center space-y-1">
          <p className="text-lg font-bold text-primary">
            {rowsInserted.toLocaleString()} / {totalRows.toLocaleString()} records
          </p>
          <p className="text-xs text-muted-foreground">
            Processing in background... Please wait.
          </p>
        </div>
      )}

      {/* Cancel Button */}
      {canCancel && onCancel && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Import
        </Button>
      )}
    </div>
  );
}
