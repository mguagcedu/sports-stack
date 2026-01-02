/**
 * Integration utilities for GoFan and FinalForms
 * Sports Stack is NOT affiliated with, endorsed by, or officially connected to GoFan or FinalForms.
 */

// Slugify utility - strict implementation per requirements
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// State code to state slug mapping
const STATE_SLUGS: Record<string, string> = {
  'AL': 'al', 'AK': 'ak', 'AZ': 'az', 'AR': 'ar', 'CA': 'ca',
  'CO': 'co', 'CT': 'ct', 'DE': 'de', 'FL': 'fl', 'GA': 'ga',
  'HI': 'hi', 'ID': 'id', 'IL': 'il', 'IN': 'in', 'IA': 'ia',
  'KS': 'ks', 'KY': 'ky', 'LA': 'la', 'ME': 'me', 'MD': 'md',
  'MA': 'ma', 'MI': 'mi', 'MN': 'mn', 'MS': 'ms', 'MO': 'mo',
  'MT': 'mt', 'NE': 'ne', 'NV': 'nv', 'NH': 'nh', 'NJ': 'nj',
  'NM': 'nm', 'NY': 'ny', 'NC': 'nc', 'ND': 'nd', 'OH': 'oh',
  'OK': 'ok', 'OR': 'or', 'PA': 'pa', 'RI': 'ri', 'SC': 'sc',
  'SD': 'sd', 'TN': 'tn', 'TX': 'tx', 'UT': 'ut', 'VT': 'vt',
  'VA': 'va', 'WA': 'wa', 'WV': 'wv', 'WI': 'wi', 'WY': 'wy',
  'DC': 'dc',
};

// FinalForms URL generation
export interface FinalFormsConfig {
  stateCode: string;
  districtName: string;
  subdomainOverride?: string | null;
}

export type FinalFormsRole = 'parents' | 'students' | 'staff';
export type FinalFormsAction = 'login' | 'registration';

export function generateFinalFormsUrl(
  config: FinalFormsConfig,
  role: FinalFormsRole,
  action: FinalFormsAction = 'login'
): string {
  const { stateCode, districtName, subdomainOverride } = config;
  
  // Use override if provided
  if (subdomainOverride) {
    const base = subdomainOverride.startsWith('https://') 
      ? subdomainOverride 
      : `https://${subdomainOverride}`;
    return `${base}/${role}/${action}`;
  }
  
  // Generate dynamic URL
  const districtSlug = slugify(districtName);
  const stateSlug = STATE_SLUGS[stateCode.toUpperCase()] || stateCode.toLowerCase();
  
  return `https://${districtSlug}-${stateSlug}.finalforms.com/${role}/${action}`;
}

export const FINALFORMS_SEARCH_URL = 'https://search.finalforms.com/';

export const FINALFORMS_ROLE_LABELS: Record<FinalFormsRole, string> = {
  parents: 'Parent/Guardian',
  students: 'Student Athlete',
  staff: 'Staff',
};

// GoFan URL generation
export interface GoFanConfig {
  schoolId?: string | null;
  schoolUrlOverride?: string | null;
}

export function generateGoFanSchoolUrl(config: GoFanConfig): string {
  const { schoolId, schoolUrlOverride } = config;
  
  if (schoolUrlOverride) {
    return schoolUrlOverride;
  }
  
  if (schoolId) {
    return `https://gofan.co/app/school/${schoolId}`;
  }
  
  return 'https://gofan.co/';
}

export function generateGoFanStateSearchUrl(stateCode: string): string {
  return `https://gofan.co/all-schools#${stateCode.toUpperCase()}`;
}

export function parseGoFanSchoolId(url: string): string | null {
  const match = url.match(/gofan\.co\/app\/school\/([A-Z0-9]+)/i);
  return match ? match[1] : null;
}

export const GOFAN_HELP_LINKS = {
  createAccount: 'https://gofan.co/sign-up',
  forgotPassword: 'https://hq.gofan.co/login/forgot-password',
};

// Legal disclaimer
export const INTEGRATION_DISCLAIMER = 
  'Sports Stack is not affiliated with, endorsed by, or officially connected to GoFan or FinalForms. ' +
  'GoFan and FinalForms are third-party platforms. Ticketing and athletic registration services are ' +
  'powered by their respective providers.';

// Ticket URL generation for events
export function generateEventTicketUrl(
  eventTicketUrl?: string | null,
  schoolGoFanUrl?: string | null,
  schoolGoFanId?: string | null
): string {
  if (eventTicketUrl) {
    return eventTicketUrl;
  }
  
  return generateGoFanSchoolUrl({
    schoolId: schoolGoFanId,
    schoolUrlOverride: schoolGoFanUrl,
  });
}
