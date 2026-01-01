import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Calculate luminance for contrast
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Determine if text should be white or black
function getTextColor(hex: string): 'white' | 'black' {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'white';
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179 ? 'black' : 'white';
}

// Check if color is too close to white, black, or gray
function isNeutral(r: number, g: number, b: number): boolean {
  const luminance = getLuminance(r, g, b);
  // Too white
  if (luminance > 0.9) return true;
  // Too black
  if (luminance < 0.05) return true;
  // Gray (low saturation)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  if (saturation < 0.15) return true;
  return false;
}

// Simple color quantization using k-means-like clustering
function extractDominantColors(imageData: Uint8Array, width: number, height: number): string[] {
  const colors: Array<{ r: number; g: number; b: number; count: number }> = [];
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < imageData.length; i += 16) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Skip neutral colors
    if (isNeutral(r, g, b)) continue;
    
    // Quantize to reduce color space
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    
    if (colorMap.has(key)) {
      const existing = colorMap.get(key)!;
      existing.count++;
      // Average the actual colors
      existing.r = (existing.r * (existing.count - 1) + r) / existing.count;
      existing.g = (existing.g * (existing.count - 1) + g) / existing.count;
      existing.b = (existing.b * (existing.count - 1) + b) / existing.count;
    } else {
      colorMap.set(key, { r, g, b, count: 1 });
    }
  }
  
  // Sort by frequency
  const sortedColors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return sortedColors.map(c => rgbToHex(c.r, c.g, c.b));
}

// Generate complementary color pairs
function generateColorPairs(colors: string[]): Array<{ primary: string; secondary: string }> {
  const pairs: Array<{ primary: string; secondary: string }> = [];
  
  if (colors.length === 0) {
    // Default fallback colors
    return [
      { primary: '#1e40af', secondary: '#f59e0b' },
      { primary: '#059669', secondary: '#3b82f6' },
      { primary: '#7c3aed', secondary: '#10b981' }
    ];
  }
  
  // Use top colors as primaries
  for (let i = 0; i < Math.min(3, colors.length); i++) {
    const primary = colors[i];
    // Find a contrasting secondary
    let secondary = colors[(i + 1) % colors.length];
    
    // If we have enough colors, try to find one that contrasts better
    if (colors.length > 3) {
      const primaryRgb = hexToRgb(primary);
      if (primaryRgb) {
        for (let j = i + 1; j < colors.length; j++) {
          const candidateRgb = hexToRgb(colors[j]);
          if (candidateRgb) {
            // Check if colors are different enough
            const diff = Math.abs(primaryRgb.r - candidateRgb.r) +
                        Math.abs(primaryRgb.g - candidateRgb.g) +
                        Math.abs(primaryRgb.b - candidateRgb.b);
            if (diff > 150) {
              secondary = colors[j];
              break;
            }
          }
        }
      }
    }
    
    pairs.push({ primary, secondary });
  }
  
  // Ensure we have at least 3 pairs
  while (pairs.length < 3) {
    const defaultPairs = [
      { primary: '#1e40af', secondary: '#f59e0b' },
      { primary: '#059669', secondary: '#3b82f6' },
      { primary: '#7c3aed', secondary: '#10b981' }
    ];
    pairs.push(defaultPairs[pairs.length]);
  }
  
  return pairs.slice(0, 3);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching image from:', imageUrl);
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const contentType = imageResponse.headers.get('content-type') || '';
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageData = new Uint8Array(arrayBuffer);
    
    console.log('Image fetched, size:', imageData.length, 'type:', contentType);
    
    // For PNG/JPEG, we'll do a simple color extraction
    // This is a simplified approach - in production you'd use a proper image library
    let dominantColors: string[] = [];
    
    if (contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('jpg')) {
      // Simple pixel sampling from raw data (works for uncompressed sections)
      // For better results, you'd decode the image properly
      const sampleColors: string[] = [];
      const step = Math.max(1, Math.floor(imageData.length / 1000));
      
      for (let i = 0; i < imageData.length - 3; i += step * 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        if (!isNeutral(r, g, b)) {
          sampleColors.push(rgbToHex(r, g, b));
        }
      }
      
      // Count and sort colors
      const colorCounts = new Map<string, number>();
      for (const color of sampleColors) {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
      
      dominantColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([color]) => color);
    }
    
    // Generate color pairs
    const colorPairs = generateColorPairs(dominantColors);
    
    // Add text color computation for each pair
    const pairsWithTextColor = colorPairs.map(pair => ({
      ...pair,
      textOnPrimary: getTextColor(pair.primary)
    }));

    console.log('Extracted colors:', dominantColors);
    console.log('Generated pairs:', pairsWithTextColor);

    return new Response(
      JSON.stringify({
        dominantColors,
        colorPairs: pairsWithTextColor
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting colors:', error);
    
    // Return fallback colors on error
    return new Response(
      JSON.stringify({
        dominantColors: [],
        colorPairs: [
          { primary: '#1e40af', secondary: '#f59e0b', textOnPrimary: 'white' },
          { primary: '#059669', secondary: '#3b82f6', textOnPrimary: 'white' },
          { primary: '#7c3aed', secondary: '#10b981', textOnPrimary: 'white' }
        ],
        error: 'Failed to extract colors, using defaults'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
