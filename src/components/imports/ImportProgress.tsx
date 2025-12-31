import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileUp, FileSearch, Database, CheckCircle2 } from "lucide-react";

interface ImportProgressProps {
  progress: number;
  stage: 'idle' | 'uploading' | 'parsing' | 'importing' | 'complete' | 'error';
  fileName?: string;
  message?: string;
}

const stages = [
  { key: 'uploading', label: 'Upload', icon: FileUp },
  { key: 'parsing', label: 'Parse', icon: FileSearch },
  { key: 'importing', label: 'Import', icon: Database },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
] as const;

export function ImportProgress({ progress, stage, fileName, message }: ImportProgressProps) {
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
      case 'parsing': return 1;
      case 'importing': return 2;
      case 'complete': return 3;
      default: return -1;
    }
  };

  const currentStageIndex = getCurrentStageIndex();

  if (stage === 'idle') return null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* File info */}
      {fileName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileUp className="h-4 w-4" />
          <span className="truncate">{fileName}</span>
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
    </div>
  );
}
