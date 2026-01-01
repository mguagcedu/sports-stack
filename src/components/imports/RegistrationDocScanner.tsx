import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  Type as TextIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Scan
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface ExtractedAthlete {
  name: string;
  grade?: string;
  dob?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  physical_date?: string;
  forms_status?: string;
  confidence: number;
}

interface ExtractedData {
  athletes: ExtractedAthlete[];
  source_type: "image" | "pdf" | "text";
  extraction_notes?: string;
}

export function RegistrationDocScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<"upload" | "url" | "text">("upload");
  const [textContent, setTextContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      let payload: { image_base64?: string; image_url?: string; text_content?: string } = {};

      if (inputMethod === "upload" && uploadedFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        payload.image_base64 = base64;
      } else if (inputMethod === "url" && imageUrl) {
        payload.image_url = imageUrl;
      } else if (inputMethod === "text" && textContent) {
        payload.text_content = textContent;
      } else {
        throw new Error("Please provide content to scan");
      }

      const { data, error } = await supabase.functions.invoke("extract-registration-data", {
        body: payload,
      });

      if (error) throw error;
      return data as ExtractedData;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({ title: `Found ${data.athletes.length} athlete records` });
    },
    onError: (error) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTextContent("");
    setImageUrl("");
    setUploadedFile(null);
    setExtractedData(null);
    setInputMethod("upload");
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else setIsOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scan className="mr-2 h-4 w-4" />
          Scan Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Document Scanner</DialogTitle>
          <DialogDescription>
            Extract athlete registration data from images, PDFs, or pasted text
          </DialogDescription>
        </DialogHeader>

        {!extractedData ? (
          <div className="space-y-6">
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as typeof inputMethod)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-2">
                  <TextIcon className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {uploadedFile ? (
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Drop an image or PDF here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/registration-form.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste a direct link to an image of a registration form or roster
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Pasted Text</Label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste registration data, roster, or form content here..."
                    rows={10}
                  />
                  <p className="text-sm text-muted-foreground">
                    Paste text from forms, spreadsheets, emails, or any registration document
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The AI will extract athlete names, grades, parent contacts, medical notes, and other registration information. 
                Review all extracted data before importing.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => extractMutation.mutate()}
                disabled={
                  extractMutation.isPending ||
                  (inputMethod === "upload" && !uploadedFile) ||
                  (inputMethod === "url" && !imageUrl) ||
                  (inputMethod === "text" && !textContent)
                }
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Extract Data
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Extracted Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Found {extractedData.athletes.length} athlete records
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {extractedData.source_type}
                  </Badge>
                </div>

                {extractedData.extraction_notes && (
                  <Alert className="mb-4">
                    <AlertDescription>{extractedData.extraction_notes}</AlertDescription>
                  </Alert>
                )}

                <div className="rounded-md border overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Parent/Guardian</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extractedData.athletes.map((athlete, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{athlete.name}</TableCell>
                          <TableCell>{athlete.grade || "-"}</TableCell>
                          <TableCell>
                            {athlete.parent_name || "-"}
                            {athlete.parent_email && (
                              <span className="block text-xs text-muted-foreground">
                                {athlete.parent_email}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {athlete.parent_phone || athlete.emergency_contact_phone || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={athlete.confidence >= 0.8 ? "default" : athlete.confidence >= 0.5 ? "secondary" : "outline"}
                            >
                              {Math.round(athlete.confidence * 100)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetForm}>
                Scan Another
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // TODO: Implement import to registrations
                  toast({ title: "Import functionality coming soon" });
                }}>
                  Import to Registrations
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
