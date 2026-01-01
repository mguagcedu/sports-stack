import { AppRole } from '@/hooks/useUserRoles';

// Page access permissions
export type PageKey = 
  | 'dashboard' 
  | 'coach_dashboard'
  | 'parent_dashboard'
  | 'athlete_dashboard'
  | 'schools' 
  | 'districts'
  | 'organizations' 
  | 'teams' 
  | 'users' 
  | 'sports' 
  | 'seasons' 
  | 'registrations' 
  | 'events' 
  | 'payments' 
  | 'reports' 
  | 'audit_logs' 
  | 'settings' 
  | 'governance'
  | 'import'
  | 'validation'
  | 'approvals';

// Feature access permissions
export type FeatureKey = 
  | 'manage_users'
  | 'manage_roles'
  | 'manage_schools'
  | 'manage_districts'
  | 'manage_organizations'
  | 'manage_teams'
  | 'manage_rosters'
  | 'manage_events'
  | 'manage_registrations'
  | 'view_payments'
  | 'manage_payments'
  | 'view_reports'
  | 'view_audit_logs'
  | 'impersonate_users'
  | 'bulk_import'
  | 'manage_governance'
  | 'view_child_info'
  | 'submit_registrations';

// Admin roles that have full access
const ADMIN_ROLES: AppRole[] = ['superadmin', 'system_admin'];

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY: Partial<Record<AppRole, AppRole[]>> = {
  superadmin: ['system_admin', 'org_admin', 'district_owner', 'school_owner'],
  system_admin: ['org_admin', 'district_admin', 'school_admin'],
  district_owner: ['district_admin', 'district_viewer'],
  district_admin: ['district_viewer'],
  school_owner: ['school_admin', 'school_viewer'],
  school_admin: ['school_viewer'],
  org_admin: ['athletic_director'],
  athletic_director: ['coach'],
  coach: ['assistant_coach', 'team_manager'],
};

// Page permissions matrix
const PAGE_PERMISSIONS: Record<PageKey, AppRole[]> = {
  dashboard: ['superadmin', 'system_admin', 'org_admin', 'district_owner', 'district_admin', 'school_owner', 'school_admin', 'athletic_director'],
  coach_dashboard: ['coach', 'assistant_coach', 'team_manager', 'trainer', 'scorekeeper'],
  parent_dashboard: ['parent', 'guardian'],
  athlete_dashboard: ['athlete'],
  schools: ['superadmin', 'system_admin', 'district_owner', 'district_admin', 'district_viewer'],
  districts: ['superadmin', 'system_admin'],
  organizations: ['superadmin', 'system_admin', 'org_admin', 'district_owner', 'district_admin'],
  teams: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach', 'assistant_coach', 'team_manager', 'school_admin'],
  users: ['superadmin', 'system_admin', 'org_admin'],
  sports: ['superadmin', 'system_admin'],
  seasons: ['superadmin', 'system_admin', 'org_admin'],
  registrations: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'registrar', 'coach'],
  events: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach', 'team_manager', 'gate_staff'],
  payments: ['superadmin', 'system_admin', 'org_admin', 'finance_admin', 'finance_clerk'],
  reports: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'finance_admin'],
  audit_logs: ['superadmin', 'system_admin'],
  settings: ['superadmin', 'system_admin', 'org_admin'],
  governance: ['superadmin', 'system_admin', 'district_owner', 'district_admin'],
  import: ['superadmin', 'system_admin'],
  validation: ['superadmin', 'system_admin'],
  approvals: ['superadmin', 'system_admin', 'org_admin'],
};

// Feature permissions matrix
const FEATURE_PERMISSIONS: Record<FeatureKey, AppRole[]> = {
  manage_users: ['superadmin', 'system_admin', 'org_admin'],
  manage_roles: ['superadmin', 'system_admin'],
  manage_schools: ['superadmin', 'system_admin', 'district_owner', 'district_admin'],
  manage_districts: ['superadmin', 'system_admin'],
  manage_organizations: ['superadmin', 'system_admin', 'org_admin'],
  manage_teams: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach'],
  manage_rosters: ['coach', 'assistant_coach', 'team_manager', 'athletic_director'],
  manage_events: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'coach'],
  manage_registrations: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'registrar'],
  view_payments: ['superadmin', 'system_admin', 'org_admin', 'finance_admin', 'finance_clerk'],
  manage_payments: ['superadmin', 'system_admin', 'finance_admin'],
  view_reports: ['superadmin', 'system_admin', 'org_admin', 'athletic_director', 'finance_admin'],
  view_audit_logs: ['superadmin', 'system_admin'],
  impersonate_users: ['superadmin'],
  bulk_import: ['superadmin', 'system_admin'],
  manage_governance: ['superadmin', 'system_admin', 'district_owner', 'district_admin'],
  view_child_info: ['parent', 'guardian'],
  submit_registrations: ['parent', 'guardian', 'athlete'],
};

// Get all inherited roles
function getInheritedRoles(role: AppRole): AppRole[] {
  const inherited: AppRole[] = [role];
  const childRoles = ROLE_HIERARCHY[role];
  if (childRoles) {
    for (const childRole of childRoles) {
      inherited.push(...getInheritedRoles(childRole));
    }
  }
  return [...new Set(inherited)];
}

// Check if a role can access a page
export function canAccessPage(role: AppRole | null, page: PageKey): boolean {
  if (!role) return false;
  if (ADMIN_ROLES.includes(role)) return true;
  
  const allowedRoles = PAGE_PERMISSIONS[page] || [];
  return allowedRoles.includes(role);
}

// Check if a role has a feature permission
export function hasFeaturePermission(role: AppRole | null, feature: FeatureKey): boolean {
  if (!role) return false;
  if (ADMIN_ROLES.includes(role)) return true;
  
  const allowedRoles = FEATURE_PERMISSIONS[feature] || [];
  return allowedRoles.includes(role);
}

// Check if a role can access any of the given pages
export function canAccessAnyPage(role: AppRole | null, pages: PageKey[]): boolean {
  return pages.some(page => canAccessPage(role, page));
}

// Get all accessible pages for a role
export function getAccessiblePages(role: AppRole | null): PageKey[] {
  if (!role) return [];
  if (ADMIN_ROLES.includes(role)) return Object.keys(PAGE_PERMISSIONS) as PageKey[];
  
  return (Object.keys(PAGE_PERMISSIONS) as PageKey[]).filter(page => 
    PAGE_PERMISSIONS[page].includes(role)
  );
}

// Get the default dashboard for a role
export function getDefaultDashboard(role: AppRole | null): string {
  if (!role) return '/auth';
  
  // Admin roles
  if (['superadmin', 'system_admin', 'org_admin', 'district_owner', 'district_admin', 'school_owner', 'school_admin', 'athletic_director'].includes(role)) {
    return '/';
  }
  
  // Coach roles
  if (['coach', 'assistant_coach', 'team_manager', 'trainer', 'scorekeeper'].includes(role)) {
    return '/coach';
  }
  
  // Parent roles
  if (['parent', 'guardian'].includes(role)) {
    return '/parent';
  }
  
  // Athlete
  if (role === 'athlete') {
    return '/athlete';
  }
  
  // Finance roles
  if (['finance_admin', 'finance_clerk'].includes(role)) {
    return '/payments';
  }
  
  // Gate staff
  if (role === 'gate_staff') {
    return '/events';
  }
  
  // Registrar
  if (role === 'registrar') {
    return '/registrations';
  }
  
  // Default for viewers
  return '/';
}

// Export the permissions for display in UI
export const PAGE_PERMISSIONS_DISPLAY = PAGE_PERMISSIONS;
export const FEATURE_PERMISSIONS_DISPLAY = FEATURE_PERMISSIONS;
