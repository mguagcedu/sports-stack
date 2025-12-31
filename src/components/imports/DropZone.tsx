import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function DropZone({
  onFilesSelected,
  accept = ".csv",
  maxFiles = 300,
  disabled = false,
  className,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const acceptedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase());
    
    const validFiles = droppedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return acceptedExtensions.includes(extension);
    }).slice(0, maxFiles);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [disabled, accept, maxFiles, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = maxFiles > 1;
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []).slice(0, maxFiles);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    };
    
    input.click();
  }, [disabled, accept, maxFiles, onFilesSelected]);

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer",
        "flex flex-col items-center justify-center gap-3 min-h-[160px]",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "rounded-full p-3 transition-all duration-200",
        isDragOver ? "bg-primary/10" : "bg-muted"
      )}>
        <Upload className={cn(
          "h-6 w-6 transition-all duration-200",
          isDragOver ? "text-primary scale-110" : "text-muted-foreground"
        )} />
      </div>
      
      <div className="text-center">
        <p className={cn(
          "font-medium transition-colors",
          isDragOver ? "text-primary" : "text-foreground"
        )}>
          {isDragOver ? "Drop files here" : "Drag & drop CSV files"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse (up to {maxFiles} files)
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        <span>Accepts: {accept}</span>
      </div>
    </div>
  );
}

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function FileList({ files, onRemove, disabled }: FileListProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
        <span className="text-muted-foreground">Total: {formatFileSize(totalSize)}</span>
      </div>
      
      <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatFileSize(file.size)}
              </span>
            </div>
            
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
              >
                <X className="h-3.5 w-3.5 text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
