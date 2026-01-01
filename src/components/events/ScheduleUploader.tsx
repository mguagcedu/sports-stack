import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Sparkles, Calendar, Loader2, X, Link as LinkIcon, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExtractedEvent {
  name: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  venue_name?: string;
  venue_address?: string;
}

interface ScheduleUploaderProps {
  organizationId?: string;
  teamId?: string;
  onEventsExtracted?: (events: ExtractedEvent[]) => void;
}

export function ScheduleUploader({ organizationId, teamId, onEventsExtracted }: ScheduleUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'document' | null>(null);
  const [scheduleUrl, setScheduleUrl] = useState("");
  const [manualText, setManualText] = useState("");
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url" | "text">("file");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      
      // Determine file type
      const isImage = file.type.startsWith('image/');
      setFileType(isImage ? 'image' : 'document');
      
      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For documents, just show file info
        setFilePreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.heic'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const extractScheduleMutation = useMutation({
    mutationFn: async (input: { file?: File; url?: string; text?: string }) => {
      if (input.file) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('file', input.file);
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-schedule`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: formData,
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to extract schedule');
        }
        
        return response.json();
      } else {
        // Use JSON for URL or text
        const { data, error } = await supabase.functions.invoke('extract-schedule', {
          body: { url: input.url, text: input.text }
        });
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      if (data.events && data.events.length > 0) {
        setExtractedEvents(data.events);
        toast({ 
          title: "Schedule extracted!", 
          description: `Found ${data.events.length} events in the schedule.` 
        });
      } else {
        toast({ 
          title: "No events found", 
          description: "Could not extract events from the provided schedule. Try adding more context or a clearer image.",
          variant: "destructive"
        });
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Extraction failed", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const createEventsMutation = useMutation({
    mutationFn: async (events: ExtractedEvent[]) => {
      if (!organizationId) {
        throw new Error("Organization is required to create events");
      }
      
      const eventsToInsert = events.map(event => ({
        name: event.name,
        organization_id: organizationId,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time || null,
        venue_name: event.venue_name || null,
        venue_address: event.venue_address || null,
        home_team_id: teamId || null,
      }));

      const { data, error } = await supabase
        .from("events")
        .insert(eventsToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ 
        title: "Events created!", 
        description: `Successfully created ${data.length} events from the schedule.` 
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create events", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      if (uploadMode === "file" && uploadedFile) {
        await extractScheduleMutation.mutateAsync({ file: uploadedFile });
      } else if (uploadMode === "url" && scheduleUrl) {
        await extractScheduleMutation.mutateAsync({ url: scheduleUrl });
      } else if (uploadMode === "text" && manualText) {
        await extractScheduleMutation.mutateAsync({ text: manualText });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateEvents = () => {
    if (extractedEvents.length > 0) {
      createEventsMutation.mutate(extractedEvents);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUploadedFile(null);
    setFilePreview(null);
    setFileType(null);
    setScheduleUrl("");
    setManualText("");
    setExtractedEvents([]);
    setUploadMode("file");
  };

  const removeEvent = (index: number) => {
    setExtractedEvents(prev => prev.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof ExtractedEvent, value: string) => {
    setExtractedEvents(prev => prev.map((event, i) => 
      i === index ? { ...event, [field]: value } : event
    ));
  };

  const getFileIcon = () => {
    if (!uploadedFile) return null;
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    return '📁';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Import Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={uploadMode === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("file")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant={uploadMode === "url" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("url")}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              From URL
            </Button>
            <Button
              variant={uploadMode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setUploadMode("text")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Paste Text
            </Button>
          </div>

          {/* File Upload */}
          {uploadMode === "file" && (
            <div>
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive 
                      ? "Drop the file here..." 
                      : "Drag & drop a schedule file, or click to select"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports images (PNG, JPG), PDF, Word docs up to 20MB
                  </p>
                </div>
              ) : (
                <div className="relative p-4 border rounded-lg">
                  {fileType === 'image' && filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Schedule preview" 
                      className="max-h-64 mx-auto rounded-lg border"
                    />
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <span className="text-4xl">{getFileIcon()}</span>
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setUploadedFile(null);
                      setFilePreview(null);
                      setFileType(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {uploadMode === "url" && (
            <div className="space-y-2">
              <Label>Schedule URL</Label>
              <Input
                value={scheduleUrl}
                onChange={(e) => setScheduleUrl(e.target.value)}
                placeholder="https://example.com/schedule.png or website URL"
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct image URL, PDF link, or a webpage containing the schedule
              </p>
            </div>
          )}

          {/* Text Input */}
          {uploadMode === "text" && (
            <div className="space-y-2">
              <Label>Schedule Text</Label>
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste your schedule text here...&#10;&#10;Example:&#10;Jan 15 - vs Lincoln High @ 6:00 PM - Home&#10;Jan 22 - @ Roosevelt - 7:00 PM&#10;Jan 29 - vs Jefferson - 5:30 PM - Away"
                rows={6}
              />
            </div>
          )}

          {/* Extract Button */}
          <Button
            className="w-full"
            onClick={handleExtract}
            disabled={
              isExtracting || 
              (uploadMode === "file" && !uploadedFile) ||
              (uploadMode === "url" && !scheduleUrl) ||
              (uploadMode === "text" && !manualText)
            }
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting events...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extract Events with AI
              </>
            )}
          </Button>

          {/* Extracted Events */}
          {extractedEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Extracted Events ({extractedEvents.length})</CardTitle>
                <CardDescription>Review and edit before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {extractedEvents.map((event, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeEvent(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Event Name</Label>
                        <Input
                          value={event.name}
                          onChange={(e) => updateEvent(index, "name", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={event.event_type}
                          onValueChange={(value) => updateEvent(index, "event_type", value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="game">Game</SelectItem>
                            <SelectItem value="practice">Practice</SelectItem>
                            <SelectItem value="tournament">Tournament</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={event.start_time?.slice(0, 16) || ""}
                          onChange={(e) => updateEvent(index, "start_time", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Venue</Label>
                        <Input
                          value={event.venue_name || ""}
                          onChange={(e) => updateEvent(index, "venue_name", e.target.value)}
                          placeholder="Venue name"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {!organizationId && (
                  <Alert>
                    <AlertDescription>
                      Select an organization to create these events.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreateEvents}
                  disabled={!organizationId || createEventsMutation.isPending}
                >
                  {createEventsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating events...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Create {extractedEvents.length} Events
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}