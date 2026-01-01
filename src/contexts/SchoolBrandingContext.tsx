import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SchoolBranding {
  schoolId: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  textOnPrimary: 'white' | 'black';
  themeSource: 'logo' | 'manual';
}

interface SchoolBrandingContextType {
  branding: SchoolBranding;
  setActiveSchool: (schoolId: string | null) => void;
  isLoading: boolean;
}

const defaultBranding: SchoolBranding = {
  schoolId: null,
  logoUrl: null,
  primaryColor: 'hsl(221, 83%, 53%)', // Default primary from design system
  secondaryColor: 'hsl(38, 92%, 50%)',
  accentColor: null,
  textOnPrimary: 'white',
  themeSource: 'manual'
};

const SchoolBrandingContext = createContext<SchoolBrandingContextType>({
  branding: defaultBranding,
  setActiveSchool: () => {},
  isLoading: false
});

export function useSchoolBranding() {
  return useContext(SchoolBrandingContext);
}

// Convert hex to HSL for CSS variable compatibility
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
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
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface SchoolBrandingProviderProps {
  children: ReactNode;
}

export function SchoolBrandingProvider({ children }: SchoolBrandingProviderProps) {
  const [branding, setBranding] = useState<SchoolBranding>(defaultBranding);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSchoolId) {
      // Reset to default branding
      setBranding(defaultBranding);
      applyBrandingToDOM(defaultBranding);
      return;
    }

    const fetchBranding = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, logo_url, primary_color, secondary_color, accent_color, text_on_primary, theme_source')
          .eq('id', activeSchoolId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const newBranding: SchoolBranding = {
            schoolId: data.id,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || defaultBranding.primaryColor,
            secondaryColor: data.secondary_color || defaultBranding.secondaryColor,
            accentColor: data.accent_color,
            textOnPrimary: (data.text_on_primary as 'white' | 'black') || 'white',
            themeSource: (data.theme_source as 'logo' | 'manual') || 'manual'
          };
          setBranding(newBranding);
          applyBrandingToDOM(newBranding);
        }
      } catch (error) {
        console.error('Error fetching school branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [activeSchoolId]);

  const applyBrandingToDOM = (branding: SchoolBranding) => {
    const root = document.documentElement;
    
    if (branding.schoolId && branding.primaryColor) {
      // Check if color is hex and convert to HSL
      const primaryHsl = branding.primaryColor.startsWith('#') 
        ? hexToHsl(branding.primaryColor) 
        : branding.primaryColor;
      const secondaryHsl = branding.secondaryColor.startsWith('#')
        ? hexToHsl(branding.secondaryColor)
        : branding.secondaryColor;
      
      // Apply school branding CSS variables
      root.style.setProperty('--school-primary', primaryHsl);
      root.style.setProperty('--school-secondary', secondaryHsl);
      root.style.setProperty('--school-text-on-primary', branding.textOnPrimary === 'white' ? '0 0% 100%' : '0 0% 0%');
      
      if (branding.accentColor) {
        const accentHsl = branding.accentColor.startsWith('#')
          ? hexToHsl(branding.accentColor)
          : branding.accentColor;
        root.style.setProperty('--school-accent', accentHsl);
      }
      
      // Override primary color when school branding is active
      root.style.setProperty('--primary', primaryHsl);
      root.style.setProperty('--primary-foreground', branding.textOnPrimary === 'white' ? '0 0% 100%' : '0 0% 0%');
    } else {
      // Reset to default
      root.style.removeProperty('--school-primary');
      root.style.removeProperty('--school-secondary');
      root.style.removeProperty('--school-text-on-primary');
      root.style.removeProperty('--school-accent');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
    }
  };

  const setActiveSchool = (schoolId: string | null) => {
    setActiveSchoolId(schoolId);
  };

  return (
    <SchoolBrandingContext.Provider value={{ branding, setActiveSchool, isLoading }}>
      {children}
    </SchoolBrandingContext.Provider>
  );
}
