/**
 * Advanced Color Extraction Utilities
 * Provides high-quality color extraction from images using canvas-based pixel sampling
 */

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface ExtractedColor {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  frequency: number;
  saturation: number;
}

export interface ColorExtractionOptions {
  preferLogoColors: boolean; // Boost saturated, high contrast colors
  ignoreBackground: boolean; // Attempt to detect and ignore background
  reduceNoise: boolean; // Median filter and cluster smoothing
  includeNeutrals: boolean; // Include whites, blacks, grays
  distinctnessThreshold: number; // 0-100, higher = merge more similar colors
  maxColors: number; // Maximum colors to return
}

export const defaultExtractionOptions: ColorExtractionOptions = {
  preferLogoColors: true,
  ignoreBackground: true,
  reduceNoise: true,
  includeNeutrals: false,
  distinctnessThreshold: 50,
  maxColors: 12,
};

// ===== Color Conversion Utilities =====

export function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): HSLColor {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// RGB to Lab (for perceptual color distance)
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // Convert to XYZ first
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;

  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;

  let x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) / 0.95047;
  let y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) / 1.0;
  let z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) / 1.08883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {
    L: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

// DeltaE (CIE76) - perceptual color distance
export function deltaE(color1: LabColor, color2: LabColor): number {
  const dL = color1.L - color2.L;
  const da = color1.a - color2.a;
  const db = color1.b - color2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// Get luminance for contrast calculation
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Determine optimal text color for a background
export function getTextColor(hex: string): 'white' | 'black' {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'white';
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? 'black' : 'white';
}

// Check if color is neutral (white, black, gray)
export function isNeutral(r: number, g: number, b: number): boolean {
  const luminance = getLuminance(r, g, b);
  if (luminance > 0.92) return true; // Too white
  if (luminance < 0.03) return true; // Too black
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.12) return true; // Gray
  
  return false;
}

// Calculate saturation for weighting
export function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

// ===== Canvas-Based Pixel Sampling =====

export function createCanvasFromImage(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  return canvas;
}

export function getPixelAt(canvas: HTMLCanvasElement, x: number, y: number): RGBColor & { a: number } {
  const ctx = canvas.getContext('2d')!;
  const data = ctx.getImageData(x, y, 1, 1).data;
  return { r: data[0], g: data[1], b: data[2], a: data[3] };
}

// Get exact color at position (for eyedropper) with coordinate scaling
export function sampleColorAtPosition(
  canvas: HTMLCanvasElement,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number
): string {
  const scaleX = canvas.width / displayWidth;
  const scaleY = canvas.height / displayHeight;
  const x = Math.floor(displayX * scaleX);
  const y = Math.floor(displayY * scaleY);
  
  const clampedX = Math.max(0, Math.min(canvas.width - 1, x));
  const clampedY = Math.max(0, Math.min(canvas.height - 1, y));
  
  const pixel = getPixelAt(canvas, clampedX, clampedY);
  return rgbToHex(pixel.r, pixel.g, pixel.b);
}

// ===== K-Means Color Clustering =====

interface ColorCluster {
  centroid: RGBColor;
  pixels: RGBColor[];
}

function kMeansClustering(colors: RGBColor[], k: number, iterations: number = 10): ColorCluster[] {
  if (colors.length === 0) return [];
  
  // Initialize centroids using k-means++
  const centroids: RGBColor[] = [];
  centroids.push(colors[Math.floor(Math.random() * colors.length)]);
  
  while (centroids.length < k) {
    const distances = colors.map(color => {
      const minDist = Math.min(...centroids.map(c => {
        const dr = color.r - c.r;
        const dg = color.g - c.g;
        const db = color.b - c.b;
        return dr*dr + dg*dg + db*db;
      }));
      return minDist;
    });
    
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      random -= distances[i];
      if (random <= 0) {
        centroids.push(colors[i]);
        break;
      }
    }
  }
  
  let clusters: ColorCluster[] = centroids.map(c => ({ centroid: c, pixels: [] }));
  
  // Iterate
  for (let iter = 0; iter < iterations; iter++) {
    // Clear clusters
    clusters.forEach(c => c.pixels = []);
    
    // Assign colors to nearest centroid
    for (const color of colors) {
      let minDist = Infinity;
      let nearestCluster = clusters[0];
      
      for (const cluster of clusters) {
        const dr = color.r - cluster.centroid.r;
        const dg = color.g - cluster.centroid.g;
        const db = color.b - cluster.centroid.b;
        const dist = dr*dr + dg*dg + db*db;
        
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = cluster;
        }
      }
      
      nearestCluster.pixels.push(color);
    }
    
    // Update centroids
    for (const cluster of clusters) {
      if (cluster.pixels.length > 0) {
        cluster.centroid = {
          r: Math.round(cluster.pixels.reduce((sum, p) => sum + p.r, 0) / cluster.pixels.length),
          g: Math.round(cluster.pixels.reduce((sum, p) => sum + p.g, 0) / cluster.pixels.length),
          b: Math.round(cluster.pixels.reduce((sum, p) => sum + p.b, 0) / cluster.pixels.length),
        };
      }
    }
  }
  
  return clusters.filter(c => c.pixels.length > 0);
}

// ===== Main Color Extraction =====

export async function extractColorsFromCanvas(
  canvas: HTMLCanvasElement,
  options: ColorExtractionOptions = defaultExtractionOptions
): Promise<ExtractedColor[]> {
  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;
  
  // Get all pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Sample pixels (every nth pixel for performance)
  const sampleRate = Math.max(1, Math.floor((width * height) / 10000));
  const pixels: RGBColor[] = [];
  
  // Detect background color (corner pixels)
  let bgColor: RGBColor | null = null;
  if (options.ignoreBackground) {
    const corners = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 },
    ];
    
    const cornerColors = corners.map(({ x, y }) => {
      const i = (y * width + x) * 4;
      return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
    });
    
    // Check if corners are similar (likely background)
    const firstCorner = cornerColors[0];
    const allSimilar = cornerColors.every(c => {
      const dr = Math.abs(c.r - firstCorner.r);
      const dg = Math.abs(c.g - firstCorner.g);
      const db = Math.abs(c.b - firstCorner.b);
      return dr < 30 && dg < 30 && db < 30;
    });
    
    if (allSimilar) {
      bgColor = { r: firstCorner.r, g: firstCorner.g, b: firstCorner.b };
    }
  }
  
  // Collect pixels
  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Skip neutrals if configured
    if (!options.includeNeutrals && isNeutral(r, g, b)) continue;
    
    // Skip background color
    if (bgColor) {
      const dr = Math.abs(r - bgColor.r);
      const dg = Math.abs(g - bgColor.g);
      const db = Math.abs(b - bgColor.b);
      if (dr < 25 && dg < 25 && db < 25) continue;
    }
    
    pixels.push({ r, g, b });
  }
  
  if (pixels.length === 0) {
    return [];
  }
  
  // Cluster colors
  const numClusters = Math.min(options.maxColors * 2, Math.ceil(Math.sqrt(pixels.length)));
  const clusters = kMeansClustering(pixels, numClusters);
  
  // Convert clusters to extracted colors
  let extractedColors: ExtractedColor[] = clusters.map(cluster => {
    const { r, g, b } = cluster.centroid;
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const saturation = getSaturation(r, g, b);
    
    return {
      hex,
      rgb: { r, g, b },
      hsl,
      frequency: cluster.pixels.length,
      saturation,
    };
  });
  
  // Score and sort colors
  extractedColors = extractedColors.map(color => {
    let score = color.frequency;
    
    if (options.preferLogoColors) {
      // Boost saturated colors
      score *= (1 + color.saturation * 2);
      // Boost non-neutral luminance
      const luminance = getLuminance(color.rgb.r, color.rgb.g, color.rgb.b);
      if (luminance > 0.1 && luminance < 0.9) {
        score *= 1.5;
      }
    }
    
    return { ...color, frequency: score };
  });
  
  extractedColors.sort((a, b) => b.frequency - a.frequency);
  
  // Deduplicate using perceptual distance
  const threshold = options.distinctnessThreshold * 0.5;
  const dedupedColors: ExtractedColor[] = [];
  
  for (const color of extractedColors) {
    const colorLab = rgbToLab(color.rgb.r, color.rgb.g, color.rgb.b);
    let isDuplicate = false;
    
    for (const existing of dedupedColors) {
      const existingLab = rgbToLab(existing.rgb.r, existing.rgb.g, existing.rgb.b);
      if (deltaE(colorLab, existingLab) < threshold) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      dedupedColors.push(color);
    }
    
    if (dedupedColors.length >= options.maxColors) break;
  }
  
  return dedupedColors;
}

export async function loadImageToCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = createCanvasFromImage(img);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

export async function extractColorsFromUrl(
  imageUrl: string,
  options?: Partial<ColorExtractionOptions>
): Promise<ExtractedColor[]> {
  const canvas = await loadImageToCanvas(imageUrl);
  return extractColorsFromCanvas(canvas, { ...defaultExtractionOptions, ...options });
}

// ===== Color Pair Generation =====

export interface ColorPair {
  primary: string;
  secondary: string;
  textOnPrimary: 'white' | 'black';
  textOnSecondary: 'white' | 'black';
}

export function generateColorPairs(colors: ExtractedColor[]): ColorPair[] {
  if (colors.length === 0) {
    return [
      { primary: '#1e40af', secondary: '#f59e0b', textOnPrimary: 'white', textOnSecondary: 'black' },
    ];
  }
  
  const pairs: ColorPair[] = [];
  
  for (let i = 0; i < Math.min(3, colors.length); i++) {
    const primary = colors[i];
    let secondaryIndex = (i + 1) % colors.length;
    
    // Find a contrasting secondary
    if (colors.length > 2) {
      let bestContrast = 0;
      for (let j = 0; j < colors.length; j++) {
        if (j === i) continue;
        const primaryLab = rgbToLab(primary.rgb.r, primary.rgb.g, primary.rgb.b);
        const candidateLab = rgbToLab(colors[j].rgb.r, colors[j].rgb.g, colors[j].rgb.b);
        const contrast = deltaE(primaryLab, candidateLab);
        if (contrast > bestContrast) {
          bestContrast = contrast;
          secondaryIndex = j;
        }
      }
    }
    
    const secondary = colors[secondaryIndex];
    
    pairs.push({
      primary: primary.hex,
      secondary: secondary.hex,
      textOnPrimary: getTextColor(primary.hex),
      textOnSecondary: getTextColor(secondary.hex),
    });
  }
  
  return pairs;
}

// ===== Common Accent Colors =====

export const commonAccentColors = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#6b7280' },
  { name: 'Gold', hex: '#fbbf24' },
  { name: 'Silver', hex: '#9ca3af' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Pink', hex: '#ec4899' },
];

// ===== Export Utilities =====

export interface BrandingExport {
  primary1_hex: string;
  primary2_hex: string;
  tertiary_hex_list: string[];
  full_extracted_palette: string[];
  image_metadata?: {
    filename: string;
    width: number;
    height: number;
  };
}

export function exportToCSS(branding: BrandingExport): string {
  let css = ':root {\n';
  css += `  --brand-primary: ${branding.primary1_hex};\n`;
  css += `  --brand-secondary: ${branding.primary2_hex};\n`;
  branding.tertiary_hex_list.forEach((color, i) => {
    css += `  --brand-tertiary-${i + 1}: ${color};\n`;
  });
  css += '}\n';
  return css;
}

export function exportToJSON(branding: BrandingExport): string {
  return JSON.stringify(branding, null, 2);
}
