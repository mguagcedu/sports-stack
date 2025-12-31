import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UploadedFile {
  fileId: string;
  originalName: string;
  standardUrl?: string;
  previewUrl?: string;
  thumbUrl?: string;
}

interface PhotoUploaderProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  tenantId?: string;
  maxFiles?: number;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function PhotoUploader({ 
  onUploadComplete, 
  tenantId,
  maxFiles = 10,
  className 
}: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  const maxFileSize = 15 * 1024 * 1024; // 15 MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: File type not allowed. Accepted: JPG, PNG, HEIC, HEIF`;
    }
    if (file.size > maxFileSize) {
      return `${file.name}: File size exceeds 15 MB limit`;
    }
    return null;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    // Limit to maxFiles
    const limitedFiles = validFiles.slice(0, maxFiles);
    setSelectedFiles(prev => [...prev, ...limitedFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploadStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      if (tenantId) {
        formData.append('tenant_id', tenantId);
      }

      setProgress(30);

      const { data, error: uploadError } = await supabase.functions.invoke('upload-photo', {
        body: formData,
      });

      if (uploadError) throw uploadError;

      setProgress(100);

      if (data.success) {
        const uploaded: UploadedFile[] = data.results
          .filter((r: any) => r.success)
          .map((r: any, index: number) => ({
            fileId: r.fileId,
            originalName: selectedFiles[index]?.name || 'Unknown',
            standardUrl: r.standardUrl,
            previewUrl: r.previewUrl,
            thumbUrl: r.thumbUrl,
          }));

        setUploadedFiles(uploaded);
        setUploadStatus('success');
        
        if (onUploadComplete) {
          onUploadComplete(uploaded);
        }

        // Clear selected files after successful upload
        setSelectedFiles([]);
      } else {
        throw new Error(data.results?.find((r: any) => r.error)?.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setUploadStatus('error');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          uploadStatus === 'uploading' && "pointer-events-none opacity-50"
        )}
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Upload Photos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, HEIC, HEIF • Max 15 MB each • Up to {maxFiles} files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.heic,.heif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <p className="text-xs text-white truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading and processing...</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {uploadStatus === 'success' && uploadedFiles.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            Successfully uploaded {uploadedFiles.length} file(s)
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {uploadedFiles.map((file) => (
              <div 
                key={file.fileId} 
                className="rounded-lg overflow-hidden border bg-muted aspect-square"
              >
                <img
                  src={file.thumbUrl || file.previewUrl || file.standardUrl}
                  alt={file.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && uploadStatus !== 'uploading' && uploadStatus !== 'success' && (
        <Button 
          onClick={handleUpload} 
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}
