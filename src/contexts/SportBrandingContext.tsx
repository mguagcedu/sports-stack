import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SportBranding {
  logoUrl: string | null;
  primary1Hex: string;
  primary2Hex: string;
  tertiaryHexList: string[];
}

interface BrandingHierarchy {
  school: SportBranding | null;
  sport: SportBranding | null;
  team: SportBranding | null;
}

interface SportContextData {
  sportCode: string;
  sportName: string;
  teamId: string | null;
  teamName: string | null;
  schoolId: string | null;
  schoolName: string | null;
  branding: SportBranding;
  brandingSource: 'team' | 'sport' | 'school' | 'default';
}

interface SportContextState {
  activeSportCode: string | null;
  activeTeamId: string | null;
  sportContexts: SportContextData[];
  currentContext: SportContextData | null;
  isLoading: boolean;
  setActiveSport: (sportCode: string | null) => void;
  setActiveTeam: (teamId: string | null) => void;
  refreshContexts: () => Promise<void>;
  getLogoForSport: (sportCode: string) => string | null;
  getBrandingForSport: (sportCode: string) => SportBranding;
}

const defaultBranding: SportBranding = {
  logoUrl: null,
  primary1Hex: '#1e40af',
  primary2Hex: '#f59e0b',
  tertiaryHexList: [],
};

const SportBrandingContext = createContext<SportContextState>({
  activeSportCode: null,
  activeTeamId: null,
  sportContexts: [],
  currentContext: null,
  isLoading: false,
  setActiveSport: () => {},
  setActiveTeam: () => {},
  refreshContexts: async () => {},
  getLogoForSport: () => null,
  getBrandingForSport: () => defaultBranding,
});

export function useSportBranding() {
  return useContext(SportBrandingContext);
}

interface SportBrandingProviderProps {
  children: ReactNode;
}

export function SportBrandingProvider({ children }: SportBrandingProviderProps) {
  const { user } = useAuth();
  const [activeSportCode, setActiveSportCode] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [sportContexts, setSportContexts] = useState<SportContextData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [brandingCache, setBrandingCache] = useState<Map<string, BrandingHierarchy>>(new Map());

  // Fetch user's sport contexts (teams they're part of)
  const refreshContexts = useCallback(async () => {
    if (!user) {
      setSportContexts([]);
      return;
    }

    setIsLoading(true);
    try {
      // Get user's team memberships using raw query to avoid TS deep type issues
      const membershipResult = await (supabase as any)
        .from('team_members')
        .select('id, team_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const memberships = membershipResult.data as Array<{ id: string; team_id: string }> | null;
      if (membershipResult.error) throw membershipResult.error;

      if (!memberships || memberships.length === 0) {
        setSportContexts([]);
        setIsLoading(false);
        return;
      }

      // Fetch teams separately - use sport_key which is the correct column name
      const membershipTeamIds = memberships.map(m => m.team_id);
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, sport_key, school_id')
        .in('id', membershipTeamIds);

      if (!teams || teams.length === 0) {
        setSportContexts([]);
        setIsLoading(false);
        return;
      }

      // Fetch schools separately
      const schoolIds = teams.map(t => t.school_id).filter(Boolean) as string[];
      const { data: schools } = await supabase
        .from('schools')
        .select('id, name, logo_url, primary_color, secondary_color')
        .in('id', schoolIds);

      const schoolMap = new Map(schools?.map(s => [s.id, s]) || []);
      const teamMap = new Map(teams.map(t => [t.id, { ...t, school: schoolMap.get(t.school_id || '') }]));

      // Get unique sport codes and their teams
      const sportTeamMap = new Map<string, Array<{ teamId: string; team: any }>>();
      for (const m of memberships) {
        const team = teamMap.get(m.team_id);
        if (team?.sport_key) {
          const existing = sportTeamMap.get(team.sport_key) || [];
          existing.push({ teamId: m.team_id, team });
          sportTeamMap.set(team.sport_key, existing);
        }
      }

      // Fetch sport branding for all sport codes
      const sportCodes = Array.from(sportTeamMap.keys());
      const { data: sportBrandings } = await supabase
        .from('sport_branding')
        .select('*')
        .in('sport_code', sportCodes);

      const sportBrandingMap = new Map<string, any>();
      sportBrandings?.forEach(sb => {
        const key = `${sb.school_id}-${sb.sport_code}`;
        sportBrandingMap.set(key, sb);
      });

      // Fetch team branding for all teams
      const allTeamIds = memberships.map(m => m.team_id);
      const { data: teamBrandings } = await supabase
        .from('team_branding')
        .select('*')
        .in('team_id', allTeamIds);

      const teamBrandingMap = new Map<string, any>();
      teamBrandings?.forEach(tb => {
        teamBrandingMap.set(tb.team_id, tb);
      });

      // Build sport contexts with branding hierarchy
      const contexts: SportContextData[] = [];

      for (const [sportCode, teamMemberships] of sportTeamMap) {
        // Use the first team for this sport (could be enhanced to let user pick)
        const primaryMembership = teamMemberships[0];
        const team = primaryMembership.team;
        const school = team?.school;

        // Determine branding using hierarchy: Team > Sport > School > Default
        let branding = { ...defaultBranding };
        let brandingSource: 'team' | 'sport' | 'school' | 'default' = 'default';

        // Check team branding first
        const teamBranding = teamBrandingMap.get(team?.id);
        if (teamBranding?.logo_url || teamBranding?.primary1_hex) {
          branding = {
            logoUrl: teamBranding.logo_url || branding.logoUrl,
            primary1Hex: teamBranding.primary1_hex || branding.primary1Hex,
            primary2Hex: teamBranding.primary2_hex || branding.primary2Hex,
            tertiaryHexList: teamBranding.tertiary_hex_list || [],
          };
          brandingSource = 'team';
        }

        // If no team branding, check sport branding
        if (brandingSource === 'default' && school?.id) {
          const sportBranding = sportBrandingMap.get(`${school.id}-${sportCode}`);
          if (sportBranding?.logo_url || sportBranding?.primary1_hex) {
            branding = {
              logoUrl: sportBranding.logo_url || branding.logoUrl,
              primary1Hex: sportBranding.primary1_hex || branding.primary1Hex,
              primary2Hex: sportBranding.primary2_hex || branding.primary2Hex,
              tertiaryHexList: sportBranding.tertiary_hex_list || [],
            };
            brandingSource = 'sport';
          }
        }

        // If no sport branding, use school branding
        if (brandingSource === 'default' && school) {
          const schoolPrimary1 = school.primary1_hex || school.primary_color;
          const schoolPrimary2 = school.primary2_hex || school.secondary_color;
          if (school.logo_url || schoolPrimary1) {
            branding = {
              logoUrl: school.logo_url || branding.logoUrl,
              primary1Hex: schoolPrimary1 || branding.primary1Hex,
              primary2Hex: schoolPrimary2 || branding.primary2Hex,
              tertiaryHexList: school.tertiary_hex_list || [],
            };
            brandingSource = 'school';
          }
        }

        // Get sport display name
        const sportNames: Record<string, string> = {
          football: 'Football',
          basketball: 'Basketball',
          baseball: 'Baseball',
          softball: 'Softball',
          soccer: 'Soccer',
          volleyball: 'Volleyball',
          tennis: 'Tennis',
          golf: 'Golf',
          swimming: 'Swimming',
          track: 'Track & Field',
          cross_country: 'Cross Country',
          wrestling: 'Wrestling',
          hockey: 'Hockey',
          lacrosse: 'Lacrosse',
          cheerleading: 'Cheerleading',
          dance: 'Dance',
          gymnastics: 'Gymnastics',
        };

        contexts.push({
          sportCode,
          sportName: sportNames[sportCode.toLowerCase()] || sportCode,
          teamId: team?.id || null,
          teamName: team?.name || null,
          schoolId: school?.id || null,
          schoolName: school?.name || null,
          branding,
          brandingSource,
        });

        // Update branding cache
        const cacheKey = `${school?.id || 'none'}-${sportCode}`;
        setBrandingCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, {
            school: school ? {
              logoUrl: school.logo_url,
              primary1Hex: school.primary1_hex || school.primary_color || defaultBranding.primary1Hex,
              primary2Hex: school.primary2_hex || school.secondary_color || defaultBranding.primary2Hex,
              tertiaryHexList: school.tertiary_hex_list || [],
            } : null,
            sport: sportBrandingMap.get(`${school?.id}-${sportCode}`) ? {
              logoUrl: sportBrandingMap.get(`${school?.id}-${sportCode}`)?.logo_url,
              primary1Hex: sportBrandingMap.get(`${school?.id}-${sportCode}`)?.primary1_hex || defaultBranding.primary1Hex,
              primary2Hex: sportBrandingMap.get(`${school?.id}-${sportCode}`)?.primary2_hex || defaultBranding.primary2Hex,
              tertiaryHexList: sportBrandingMap.get(`${school?.id}-${sportCode}`)?.tertiary_hex_list || [],
            } : null,
            team: teamBranding ? {
              logoUrl: teamBranding.logo_url,
              primary1Hex: teamBranding.primary1_hex || defaultBranding.primary1Hex,
              primary2Hex: teamBranding.primary2_hex || defaultBranding.primary2Hex,
              tertiaryHexList: teamBranding.tertiary_hex_list || [],
            } : null,
          });
          return newCache;
        });
      }

      setSportContexts(contexts);

      // Set active sport to first one if not set
      if (!activeSportCode && contexts.length > 0) {
        setActiveSportCode(contexts[0].sportCode);
        setActiveTeamId(contexts[0].teamId);
      }
    } catch (error) {
      console.error('Error fetching sport contexts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeSportCode]);

  useEffect(() => {
    refreshContexts();
  }, [user]);

  const setActiveSport = useCallback((sportCode: string | null) => {
    setActiveSportCode(sportCode);
    
    // Update active team to match
    if (sportCode) {
      const context = sportContexts.find(c => c.sportCode === sportCode);
      if (context) {
        setActiveTeamId(context.teamId);
        
        // Apply branding to DOM
        applyBrandingToDOM(context.branding);
      }
    }
  }, [sportContexts]);

  const setActiveTeam = useCallback((teamId: string | null) => {
    setActiveTeamId(teamId);
    
    // Find context for this team
    const context = sportContexts.find(c => c.teamId === teamId);
    if (context) {
      setActiveSportCode(context.sportCode);
      applyBrandingToDOM(context.branding);
    }
  }, [sportContexts]);

  const getLogoForSport = useCallback((sportCode: string): string | null => {
    const context = sportContexts.find(c => c.sportCode === sportCode);
    return context?.branding.logoUrl || null;
  }, [sportContexts]);

  const getBrandingForSport = useCallback((sportCode: string): SportBranding => {
    const context = sportContexts.find(c => c.sportCode === sportCode);
    return context?.branding || defaultBranding;
  }, [sportContexts]);

  const currentContext = sportContexts.find(c => c.sportCode === activeSportCode) || null;

  // Apply sport branding to DOM via CSS variables
  const applyBrandingToDOM = (branding: SportBranding) => {
    const root = document.documentElement;
    root.style.setProperty('--sport-primary', hexToHsl(branding.primary1Hex));
    root.style.setProperty('--sport-secondary', hexToHsl(branding.primary2Hex));
  };

  return (
    <SportBrandingContext.Provider
      value={{
        activeSportCode,
        activeTeamId,
        sportContexts,
        currentContext,
        isLoading,
        setActiveSport,
        setActiveTeam,
        refreshContexts,
        getLogoForSport,
        getBrandingForSport,
      }}
    >
      {children}
    </SportBrandingContext.Provider>
  );
}

// Helper to convert hex to HSL for CSS variables
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '221 83% 53%';

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

// Sport Switcher Dropdown Component
export function SportSwitcher({ className }: { className?: string }) {
  const { sportContexts, activeSportCode, setActiveSport, isLoading } = useSportBranding();

  if (isLoading) {
    return <div className="h-8 w-24 bg-muted animate-pulse rounded" />;
  }

  if (sportContexts.length === 0) {
    return null;
  }

  return (
    <select
      value={activeSportCode || ''}
      onChange={(e) => setActiveSport(e.target.value || null)}
      className={cn(
        "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
        className
      )}
    >
      {sportContexts.map((ctx) => (
        <option key={ctx.sportCode} value={ctx.sportCode}>
          {ctx.sportName}
        </option>
      ))}
    </select>
  );
}
