import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Palette, 
  Check, 
  Loader2, 
  ImageIcon,
  RefreshCw,
  Pipette,
  X,
  Copy,
  Download,
  ChevronRight,
  ZoomIn,
  Trash2,
  GripVertical
} from 'lucide-react';
import {
  extractColorsFromCanvas,
  createCanvasFromImage,
  sampleColorAtPosition,
  getTextColor,
  commonAccentColors,
  exportToCSS,
  exportToJSON,
  type ExtractedColor,
  type ColorExtractionOptions,
  type BrandingExport,
  defaultExtractionOptions,
} from '@/lib/colorExtraction';
import { useToast } from '@/hooks/use-toast';

interface ColorPickerState {
  primary1: string | null;
  primary2: string | null;
  tertiary: string[];
  extractedPalette: ExtractedColor[];
}

interface AdvancedColorPickerProps {
  onComplete: (branding: BrandingExport) => void;
  initialColors?: {
    primary1?: string;
    primary2?: string;
    tertiary?: string[];
  };
  className?: string;
}

type Step = 'upload' | 'palette' | 'primary1' | 'primary2' | 'tertiary' | 'export';

export function AdvancedColorPicker({ onComplete, initialColors, className }: AdvancedColorPickerProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [eyedropperPosition, setEyedropperPosition] = useState({ x: 0, y: 0 });
  const [eyedropperColor, setEyedropperColor] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(4);
  
  const [colors, setColors] = useState<ColorPickerState>({
    primary1: initialColors?.primary1 || null,
    primary2: initialColors?.primary2 || null,
    tertiary: initialColors?.tertiary || [],
    extractedPalette: [],
  });
  
  const [options, setOptions] = useState<ColorExtractionOptions>(defaultExtractionOptions);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'palette', label: 'Palette' },
    { key: 'primary1', label: 'Primary 1' },
    { key: 'primary2', label: 'Primary 2' },
    { key: 'tertiary', label: 'Tertiary' },
    { key: 'export', label: 'Export' },
  ];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, WEBP, or SVG image',
        variant: 'destructive'
      });
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStep('palette');

    // Load image and create canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const newCanvas = createCanvasFromImage(img);
      setCanvas(newCanvas);

      // Check for very small images
      if (img.naturalWidth < 50 || img.naturalHeight < 50) {
        toast({
          title: 'Small image detected',
          description: 'Consider using a higher resolution image for better color extraction',
        });
      }

      // Auto-extract colors
      await extractColors(newCanvas);
    };
    img.src = url;
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const extractColors = async (targetCanvas: HTMLCanvasElement) => {
    setIsExtracting(true);
    try {
      const extracted = await extractColorsFromCanvas(targetCanvas, options);
      setColors(prev => ({ ...prev, extractedPalette: extracted }));
      
      // Auto-select first two colors as primaries if not set
      if (!colors.primary1 && extracted.length > 0) {
        setColors(prev => ({ 
          ...prev, 
          primary1: extracted[0].hex,
          extractedPalette: extracted 
        }));
      }
      
      toast({
        title: 'Colors extracted',
        description: `Found ${extracted.length} distinct colors`
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: 'Extraction failed',
        description: 'Could not extract colors from image',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReextract = () => {
    if (canvas) {
      extractColors(canvas);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImageUrl(null);
    setCanvas(null);
    setColors({
      primary1: null,
      primary2: null,
      tertiary: [],
      extractedPalette: [],
    });
    setStep('upload');
    setEyedropperActive(false);
  };

  // Eyedropper handlers
  const handleEyedropperStart = () => {
    setEyedropperActive(true);
    toast({
      title: 'Eyedropper active',
      description: 'Click on the image to pick a color. Use arrow keys to fine-tune.'
    });
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperActive || !canvas || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setEyedropperPosition({ x, y });
    
    // Sample color at position
    const displayWidth = containerRef.current.offsetWidth;
    const displayHeight = containerRef.current.offsetHeight;
    const color = sampleColorAtPosition(canvas, x, y, displayWidth, displayHeight);
    setEyedropperColor(color);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!eyedropperActive || !eyedropperColor) return;
    e.preventDefault();
    
    selectEyedropperColor(eyedropperColor);
  };

  const selectEyedropperColor = (color: string) => {
    if (step === 'primary1' || step === 'palette') {
      if (!colors.primary1) {
        setColors(prev => ({ ...prev, primary1: color }));
        setStep('primary2');
      } else {
        setColors(prev => ({ ...prev, primary2: color }));
        setStep('tertiary');
      }
    } else if (step === 'primary2') {
      setColors(prev => ({ ...prev, primary2: color }));
      setStep('tertiary');
    } else if (step === 'tertiary') {
      if (colors.tertiary.length < 6) {
        setColors(prev => ({ ...prev, tertiary: [...prev.tertiary, color] }));
      } else {
        toast({ title: 'Maximum tertiary colors reached', description: 'You can only add up to 6 tertiary colors' });
      }
    }
    
    setEyedropperActive(false);
    toast({ title: 'Color selected', description: color.toUpperCase() });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!eyedropperActive) return;

    const step = e.shiftKey ? 10 : 1;
    let newX = eyedropperPosition.x;
    let newY = eyedropperPosition.y;

    switch (e.key) {
      case 'ArrowUp': newY -= step; break;
      case 'ArrowDown': newY += step; break;
      case 'ArrowLeft': newX -= step; break;
      case 'ArrowRight': newX += step; break;
      case 'Enter':
        if (eyedropperColor) selectEyedropperColor(eyedropperColor);
        return;
      case 'Escape':
        setEyedropperActive(false);
        return;
      default: return;
    }

    e.preventDefault();
    setEyedropperPosition({ x: newX, y: newY });
    
    if (canvas && containerRef.current) {
      const displayWidth = containerRef.current.offsetWidth;
      const displayHeight = containerRef.current.offsetHeight;
      const color = sampleColorAtPosition(canvas, newX, newY, displayWidth, displayHeight);
      setEyedropperColor(color);
    }
  }, [eyedropperActive, eyedropperPosition, eyedropperColor, canvas]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectPaletteColor = (color: ExtractedColor) => {
    if (step === 'palette' && !colors.primary1) {
      setColors(prev => ({ ...prev, primary1: color.hex }));
      setStep('primary1');
    } else if (step === 'primary1' || (step === 'palette' && colors.primary1 && !colors.primary2)) {
      if (colors.primary1) {
        setColors(prev => ({ ...prev, primary2: color.hex }));
        setStep('primary2');
      } else {
        setColors(prev => ({ ...prev, primary1: color.hex }));
      }
    } else if (step === 'primary2') {
      setColors(prev => ({ ...prev, primary2: color.hex }));
    } else if (step === 'tertiary') {
      addTertiaryColor(color.hex);
    }
  };

  const addTertiaryColor = (hex: string) => {
    if (colors.tertiary.includes(hex)) {
      toast({ title: 'Color already added' });
      return;
    }
    if (colors.tertiary.length >= 6) {
      toast({ title: 'Maximum reached', description: 'Remove a color first' });
      return;
    }
    setColors(prev => ({ ...prev, tertiary: [...prev.tertiary, hex] }));
  };

  const removeTertiaryColor = (index: number) => {
    setColors(prev => ({
      ...prev,
      tertiary: prev.tertiary.filter((_, i) => i !== index)
    }));
  };

  const handleExport = () => {
    if (!colors.primary1 || !colors.primary2) {
      toast({ title: 'Select colors first', variant: 'destructive' });
      return;
    }

    const branding: BrandingExport = {
      primary1_hex: colors.primary1,
      primary2_hex: colors.primary2,
      tertiary_hex_list: colors.tertiary,
      full_extracted_palette: colors.extractedPalette.map(c => c.hex),
      image_metadata: imageFile ? {
        filename: imageFile.name,
        width: canvas?.width || 0,
        height: canvas?.height || 0,
      } : undefined,
    };

    onComplete(branding);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const downloadJSON = () => {
    if (!colors.primary1 || !colors.primary2) return;
    const branding: BrandingExport = {
      primary1_hex: colors.primary1,
      primary2_hex: colors.primary2,
      tertiary_hex_list: colors.tertiary,
      full_extracted_palette: colors.extractedPalette.map(c => c.hex),
    };
    const blob = new Blob([exportToJSON(branding)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-colors.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSS = () => {
    if (!colors.primary1 || !colors.primary2) return;
    const branding: BrandingExport = {
      primary1_hex: colors.primary1,
      primary2_hex: colors.primary2,
      tertiary_hex_list: colors.tertiary,
      full_extracted_palette: colors.extractedPalette.map(c => c.hex),
    };
    const blob = new Blob([exportToCSS(branding)], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-colors.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const canProceed = () => {
    switch (step) {
      case 'upload': return !!imageUrl;
      case 'palette': return colors.extractedPalette.length > 0;
      case 'primary1': return !!colors.primary1;
      case 'primary2': return !!colors.primary2;
      case 'tertiary': return true;
      case 'export': return !!colors.primary1 && !!colors.primary2;
      default: return false;
    }
  };

  const goToNextStep = () => {
    const currentIndex = steps.findIndex(s => s.key === step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1].key);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = steps.findIndex(s => s.key === step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1].key);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => {
                const currentIdx = steps.findIndex(st => st.key === step);
                const targetIdx = steps.findIndex(st => st.key === s.key);
                if (targetIdx <= currentIdx || canProceed()) {
                  setStep(s.key);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                step === s.key 
                  ? "bg-primary text-primary-foreground" 
                  : steps.findIndex(st => st.key === step) > i
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-background/20">
                {i + 1}
              </span>
              <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Preview & Eyedropper */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Preview
            </CardTitle>
            {imageUrl && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEyedropperStart} disabled={!canvas}>
                  <Pipette className="h-4 w-4 mr-2" />
                  Eyedropper
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-2" />
                  Replace
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!imageUrl ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  PNG, JPG, WEBP, or SVG up to 10MB
                </p>
              </div>
            ) : (
              <div
                ref={containerRef}
                className={cn(
                  "relative rounded-lg overflow-hidden bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#f5f5f5_0%_50%)] bg-[length:20px_20px]",
                  eyedropperActive && "cursor-crosshair"
                )}
                onMouseMove={handleImageMouseMove}
                onClick={handleImageClick}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Uploaded"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                
                {/* Eyedropper Overlay */}
                {eyedropperActive && eyedropperColor && (
                  <>
                    {/* Crosshair */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: eyedropperPosition.x - 1,
                        top: eyedropperPosition.y - 20,
                        width: 2,
                        height: 40,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                      }}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: eyedropperPosition.x - 20,
                        top: eyedropperPosition.y - 1,
                        width: 40,
                        height: 2,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        boxShadow: '0 0 2px rgba(0,0,0,0.5)'
                      }}
                    />
                    
                    {/* Magnifier */}
                    <div
                      className="absolute pointer-events-none rounded-full border-4 border-white shadow-lg overflow-hidden"
                      style={{
                        left: eyedropperPosition.x + 20,
                        top: eyedropperPosition.y - 60,
                        width: 80,
                        height: 80,
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: eyedropperColor }}
                      />
                      <div 
                        className="absolute inset-0 flex items-center justify-center text-xs font-mono"
                        style={{ color: getTextColor(eyedropperColor) }}
                      >
                        {eyedropperColor.toUpperCase()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Zoom Slider (when eyedropper active) */}
            {eyedropperActive && (
              <div className="mt-4 flex items-center gap-4">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoomLevel]}
                  onValueChange={([v]) => setZoomLevel(v)}
                  min={1}
                  max={8}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">{zoomLevel}x</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {step === 'upload' && 'Upload an Image'}
              {step === 'palette' && 'Extracted Palette'}
              {step === 'primary1' && 'Select Primary Color 1'}
              {step === 'primary2' && 'Select Primary Color 2'}
              {step === 'tertiary' && 'Add Tertiary Colors'}
              {step === 'export' && 'Review & Export'}
            </CardTitle>
            <CardDescription>
              {step === 'upload' && 'Upload a logo, jersey, or banner to extract colors'}
              {step === 'palette' && 'Colors extracted from your image'}
              {step === 'primary1' && 'Choose your main brand color'}
              {step === 'primary2' && 'Choose your secondary brand color'}
              {step === 'tertiary' && 'Optional: add up to 6 accent colors'}
              {step === 'export' && 'Your brand colors are ready'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Extraction Options */}
            {step === 'palette' && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prefer-logo">Prefer logo colors (saturated)</Label>
                  <Switch
                    id="prefer-logo"
                    checked={options.preferLogoColors}
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, preferLogoColors: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ignore-bg">Ignore background</Label>
                  <Switch
                    id="ignore-bg"
                    checked={options.ignoreBackground}
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, ignoreBackground: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-neutrals">Include neutrals (white, gray, black)</Label>
                  <Switch
                    id="include-neutrals"
                    checked={options.includeNeutrals}
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, includeNeutrals: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Distinctness (merge similar colors)</Label>
                  <Slider
                    value={[options.distinctnessThreshold]}
                    onValueChange={([v]) => setOptions(prev => ({ ...prev, distinctnessThreshold: v }))}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleReextract} disabled={isExtracting}>
                  {isExtracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Re-extract
                </Button>
              </div>
            )}

            {/* Extracted Palette */}
            {(step === 'palette' || step === 'primary1' || step === 'primary2' || step === 'tertiary') && (
              <div className="space-y-2">
                <Label>Extracted Colors ({colors.extractedPalette.length})</Label>
                {isExtracting ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <Progress value={50} className="flex-1" />
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {colors.extractedPalette.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => selectPaletteColor(color)}
                        className={cn(
                          "aspect-square rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg relative group",
                          (color.hex === colors.primary1 || color.hex === colors.primary2 || colors.tertiary.includes(color.hex))
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={`${color.hex} (${Math.round(color.saturation * 100)}% saturation)`}
                      >
                        {color.hex === colors.primary1 && (
                          <Badge className="absolute -top-2 -right-2 text-[10px] px-1">1</Badge>
                        )}
                        {color.hex === colors.primary2 && (
                          <Badge className="absolute -top-2 -right-2 text-[10px] px-1">2</Badge>
                        )}
                        <span 
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-mono"
                          style={{ color: getTextColor(color.hex) }}
                        >
                          {color.hex.slice(1).toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Primary Colors */}
            {(step !== 'upload') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary 1</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg border-2",
                          colors.primary1 ? "border-primary" : "border-dashed border-muted-foreground"
                        )}
                        style={{ backgroundColor: colors.primary1 || 'transparent' }}
                      />
                      {colors.primary1 ? (
                        <div className="flex-1">
                          <div className="font-mono text-sm">{colors.primary1.toUpperCase()}</div>
                          <button
                            onClick={() => copyToClipboard(colors.primary1!)}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not selected</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary 2</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg border-2",
                          colors.primary2 ? "border-primary" : "border-dashed border-muted-foreground"
                        )}
                        style={{ backgroundColor: colors.primary2 || 'transparent' }}
                      />
                      {colors.primary2 ? (
                        <div className="flex-1">
                          <div className="font-mono text-sm">{colors.primary2.toUpperCase()}</div>
                          <button
                            onClick={() => copyToClipboard(colors.primary2!)}
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tertiary Colors */}
            {step === 'tertiary' && (
              <div className="space-y-4">
                <Label>Tertiary Colors ({colors.tertiary.length}/6)</Label>
                {colors.tertiary.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {colors.tertiary.map((hex, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-2 py-1 rounded-full border bg-muted"
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
                        <div
                          className="w-5 h-5 rounded-full border"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-xs font-mono">{hex.toUpperCase()}</span>
                        <button
                          onClick={() => removeTertiaryColor(i)}
                          className="p-0.5 hover:bg-destructive/20 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Common Accent Colors</Label>
                  <div className="grid grid-cols-6 gap-2">
                    {commonAccentColors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => addTertiaryColor(color.hex)}
                        disabled={colors.tertiary.includes(color.hex) || colors.tertiary.length >= 6}
                        className={cn(
                          "aspect-square rounded-lg border-2 transition-all hover:scale-105",
                          colors.tertiary.includes(color.hex)
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-muted-foreground/50",
                          color.hex === '#ffffff' && "border-muted-foreground/30"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Export Options */}
            {step === 'export' && colors.primary1 && colors.primary2 && (
              <div className="space-y-4">
                {/* Preview */}
                <div className="rounded-lg overflow-hidden">
                  <div
                    className="p-6 flex items-center gap-4"
                    style={{ backgroundColor: colors.primary1 }}
                  >
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: colors.primary2 }}
                    />
                    <div>
                      <div
                        className="text-xl font-bold"
                        style={{ color: getTextColor(colors.primary1) }}
                      >
                        Your Brand
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: getTextColor(colors.primary1), opacity: 0.8 }}
                      >
                        Preview of your color scheme
                      </div>
                    </div>
                  </div>
                  {colors.tertiary.length > 0 && (
                    <div className="flex">
                      {colors.tertiary.map((hex, i) => (
                        <div
                          key={i}
                          className="flex-1 h-8"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${colors.primary1}, ${colors.primary2}`)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HEX
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadCSS}>
                    <Download className="h-4 w-4 mr-2" />
                    CSS
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={goToPrevStep}
                disabled={step === 'upload'}
              >
                Back
              </Button>
              {step === 'export' ? (
                <Button onClick={handleExport} disabled={!colors.primary1 || !colors.primary2}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Colors
                </Button>
              ) : (
                <Button onClick={goToNextStep} disabled={!canProceed()}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
