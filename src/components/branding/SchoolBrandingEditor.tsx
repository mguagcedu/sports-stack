import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  Palette, 
  Check, 
  Loader2, 
  ImageIcon,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPair {
  primary: string;
  secondary: string;
  textOnPrimary: 'white' | 'black';
}

interface SchoolBrandingEditorProps {
  schoolId: string;
  initialData?: {
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
    text_on_primary?: string | null;
    theme_source?: string | null;
  };
  onSave?: () => void;
}

export function SchoolBrandingEditor({ schoolId, initialData, onSave }: SchoolBrandingEditorProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoPickColors, setAutoPickColors] = useState(true);
  
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(initialData?.primary_color || '#1e40af');
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondary_color || '#f59e0b');
  const [accentColor, setAccentColor] = useState(initialData?.accent_color || '');
  const [textOnPrimary, setTextOnPrimary] = useState<'white' | 'black'>(
    (initialData?.text_on_primary as 'white' | 'black') || 'white'
  );
  
  const [colorPairs, setColorPairs] = useState<ColorPair[]>([]);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);

  // Compute text color based on luminance
  const computeTextColor = (hex: string): 'white' | 'black' => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'white';
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.5 ? 'black' : 'white';
  };

  const extractColorsFromLogo = async (imageUrl: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-logo-colors', {
        body: { imageUrl }
      });
      
      if (error) throw error;
      
      if (data?.colorPairs && data.colorPairs.length > 0) {
        setColorPairs(data.colorPairs);
        // Auto-select first pair
        const firstPair = data.colorPairs[0];
        setPrimaryColor(firstPair.primary);
        setSecondaryColor(firstPair.secondary);
        setTextOnPrimary(firstPair.textOnPrimary);
        setSelectedPairIndex(0);
        
        toast({
          title: 'Colors extracted',
          description: 'Select a color pair or customize manually'
        });
      }
    } catch (error) {
      console.error('Error extracting colors:', error);
      toast({
        title: 'Color extraction failed',
        description: 'You can still set colors manually',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, or SVG image',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId}-${Date.now()}.${fileExt}`;
      const filePath = `${schoolId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('school-logos')
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl;
      setLogoUrl(newLogoUrl);

      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully'
      });

      // Auto extract colors if enabled
      if (autoPickColors) {
        await extractColorsFromLogo(newLogoUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload logo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  }, [schoolId, autoPickColors, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const selectColorPair = (index: number) => {
    const pair = colorPairs[index];
    setPrimaryColor(pair.primary);
    setSecondaryColor(pair.secondary);
    setTextOnPrimary(pair.textOnPrimary);
    setSelectedPairIndex(index);
  };

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
    setTextOnPrimary(computeTextColor(color));
    setSelectedPairIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor || null,
          text_on_primary: textOnPrimary,
          theme_source: autoPickColors && colorPairs.length > 0 ? 'logo' : 'manual'
        })
        .eq('id', schoolId);

      if (error) throw error;

      toast({
        title: 'Branding saved',
        description: 'School branding has been updated successfully'
      });
      
      onSave?.();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save branding. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            School Logo
          </CardTitle>
          <CardDescription>
            Upload your school logo (PNG or SVG preferred for best quality)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : logoUrl ? (
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={logoUrl} 
                  alt="School logo" 
                  className="max-h-24 max-w-48 object-contain"
                />
                <p className="text-sm text-muted-foreground">
                  Drop a new image or click to replace
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? 'Drop the logo here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, or SVG up to 5MB</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-pick"
                checked={autoPickColors}
                onCheckedChange={setAutoPickColors}
              />
              <Label htmlFor="auto-pick">Auto pick colors from logo</Label>
            </div>
            {logoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => extractColorsFromLogo(logoUrl)}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-extract colors
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            School Colors
          </CardTitle>
          <CardDescription>
            {colorPairs.length > 0 
              ? 'Select a suggested pair or customize manually'
              : 'Set your school\'s primary and secondary colors'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Suggested Color Pairs */}
          {isExtracting ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : colorPairs.length > 0 && (
            <div className="space-y-2">
              <Label>Suggested color pairs from logo</Label>
              <div className="grid grid-cols-3 gap-4">
                {colorPairs.map((pair, index) => (
                  <button
                    key={index}
                    onClick={() => selectColorPair(index)}
                    className={cn(
                      "relative rounded-lg border-2 p-1 transition-all",
                      selectedPairIndex === index 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent hover:border-muted-foreground/50"
                    )}
                  >
                    <div className="flex rounded overflow-hidden">
                      <div 
                        className="h-16 flex-1"
                        style={{ backgroundColor: pair.primary }}
                      />
                      <div 
                        className="h-16 flex-1"
                        style={{ backgroundColor: pair.secondary }}
                      />
                    </div>
                    {selectedPairIndex === index && (
                      <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Color Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <div 
                  className="w-10 h-10 rounded-md border shrink-0"
                  style={{ backgroundColor: primaryColor }}
                />
                <Input
                  id="primary-color"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  placeholder="#1e40af"
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handlePrimaryColorChange(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <div 
                  className="w-10 h-10 rounded-md border shrink-0"
                  style={{ backgroundColor: secondaryColor }}
                />
                <Input
                  id="secondary-color"
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#f59e0b"
                />
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color (Optional)</Label>
              <div className="flex gap-2">
                <div 
                  className="w-10 h-10 rounded-md border shrink-0"
                  style={{ backgroundColor: accentColor || 'transparent' }}
                />
                <Input
                  id="accent-color"
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#10b981"
                />
                <input
                  type="color"
                  value={accentColor || '#10b981'}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text on Primary</Label>
              <div className="flex items-center gap-2 h-10">
                <Badge 
                  variant="outline" 
                  className="px-3 py-1"
                  style={{ 
                    backgroundColor: primaryColor, 
                    color: textOnPrimary,
                    borderColor: primaryColor
                  }}
                >
                  {textOnPrimary === 'white' ? 'White text' : 'Black text'}
                </Badge>
                <span className="text-sm text-muted-foreground">(auto-computed)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            See how your branding will look across the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-4 rounded-lg border bg-background">
            {/* Header Preview */}
            <div 
              className="rounded-lg p-4 flex items-center gap-4"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="h-10 w-10 rounded bg-white/20" />
              )}
              <span 
                className="font-semibold text-lg"
                style={{ color: textOnPrimary }}
              >
                School Name
              </span>
            </div>

            {/* Buttons Preview */}
            <div className="flex gap-2 flex-wrap">
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: textOnPrimary 
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-md font-medium"
                style={{ 
                  backgroundColor: secondaryColor, 
                  color: computeTextColor(secondaryColor) 
                }}
              >
                Secondary Button
              </button>
              <button
                className="px-4 py-2 rounded-md font-medium border-2"
                style={{ 
                  borderColor: primaryColor, 
                  color: primaryColor,
                  backgroundColor: 'transparent'
                }}
              >
                Outline Button
              </button>
            </div>

            {/* Badges Preview */}
            <div className="flex gap-2 flex-wrap">
              <span
                className="px-2 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: primaryColor, 
                  color: textOnPrimary 
                }}
              >
                Varsity
              </span>
              <span
                className="px-2 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: secondaryColor, 
                  color: computeTextColor(secondaryColor) 
                }}
              >
                JV
              </span>
              <span
                className="px-2 py-1 rounded-full text-sm font-medium border"
                style={{ 
                  borderColor: primaryColor, 
                  color: primaryColor 
                }}
              >
                Freshman
              </span>
            </div>

            {/* Sport Tiles Preview */}
            <div className="grid grid-cols-4 gap-2">
              {['Football', 'Basketball', 'Soccer', 'Baseball'].map(sport => (
                <div 
                  key={sport}
                  className="p-3 rounded-lg border text-center"
                  style={{ borderColor: primaryColor }}
                >
                  <div 
                    className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <span style={{ color: primaryColor }}>⚽</span>
                  </div>
                  <span className="text-xs">{sport}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
