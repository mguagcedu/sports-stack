import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Shield, FileText } from 'lucide-react';
import { PAGE_PERMISSIONS_DISPLAY, FEATURE_PERMISSIONS_DISPLAY, PageKey, FeatureKey } from '@/lib/permissions';
import { AppRole } from '@/hooks/useUserRoles';

const ROLE_CATEGORIES = {
  'System': ['superadmin', 'system_admin'] as AppRole[],
  'Organization': ['org_admin', 'athletic_director'] as AppRole[],
  'District': ['district_owner', 'district_admin', 'district_viewer'] as AppRole[],
  'School': ['school_owner', 'school_admin', 'school_viewer'] as AppRole[],
  'Team Staff': ['coach', 'assistant_coach', 'team_manager', 'trainer', 'scorekeeper'] as AppRole[],
  'Finance': ['finance_admin', 'finance_clerk', 'gate_staff'] as AppRole[],
  'Participants': ['parent', 'guardian', 'athlete', 'registrar', 'viewer'] as AppRole[],
};

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'Admin Dashboard',
  coach_dashboard: 'Coach Dashboard',
  parent_dashboard: 'Parent Dashboard',
  athlete_dashboard: 'Athlete Dashboard',
  schools: 'Schools',
  districts: 'Districts',
  organizations: 'Organizations',
  teams: 'Teams',
  users: 'Users',
  sports: 'Sports',
  seasons: 'Seasons',
  registrations: 'Registrations',
  events: 'Events',
  payments: 'Payments',
  reports: 'Reports',
  audit_logs: 'Audit Logs',
  settings: 'Settings',
  governance: 'Governance',
  import: 'Import Data',
  validation: 'Validation',
  approvals: 'Role Approvals',
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
  manage_users: 'Manage Users',
  manage_roles: 'Manage Roles',
  manage_schools: 'Manage Schools',
  manage_districts: 'Manage Districts',
  manage_organizations: 'Manage Organizations',
  manage_teams: 'Manage Teams',
  manage_rosters: 'Manage Rosters',
  manage_events: 'Manage Events',
  manage_registrations: 'Manage Registrations',
  view_payments: 'View Payments',
  manage_payments: 'Manage Payments',
  view_reports: 'View Reports',
  view_audit_logs: 'View Audit Logs',
  impersonate_users: 'Impersonate Users',
  bulk_import: 'Bulk Import',
  manage_governance: 'Manage Governance',
  view_child_info: 'View Child Info',
  submit_registrations: 'Submit Registrations',
};

const ROLE_LABELS: Record<AppRole, string> = {
  system_admin: 'System Admin',
  superadmin: 'Super Admin',
  org_admin: 'Org Admin',
  district_owner: 'District Owner',
  district_admin: 'District Admin',
  district_viewer: 'District Viewer',
  school_owner: 'School Owner',
  school_admin: 'School Admin',
  school_viewer: 'School Viewer',
  athletic_director: 'Athletic Director',
  coach: 'Coach',
  assistant_coach: 'Assistant Coach',
  team_manager: 'Team Manager',
  trainer: 'Trainer',
  scorekeeper: 'Scorekeeper',
  parent: 'Parent',
  guardian: 'Guardian',
  athlete: 'Athlete',
  registrar: 'Registrar',
  finance_admin: 'Finance Admin',
  finance_clerk: 'Finance Clerk',
  gate_staff: 'Gate Staff',
  viewer: 'Viewer',
};

export default function PermissionsMatrix() {
  const allRoles = Object.values(ROLE_CATEGORIES).flat();
  const pages = Object.keys(PAGE_PERMISSIONS_DISPLAY) as PageKey[];
  const features = Object.keys(FEATURE_PERMISSIONS_DISPLAY) as FeatureKey[];

  return (
    <DashboardLayout title="Permissions">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role Permissions Matrix
          </h1>
          <p className="text-muted-foreground">
            View and understand which roles have access to pages and features
          </p>
        </div>

        <Tabs defaultValue="pages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="h-4 w-4" />
              Page Access
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Shield className="h-4 w-4" />
              Feature Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Page Access by Role</CardTitle>
                <CardDescription>
                  Which pages each role can access in the application
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Page</TableHead>
                      {allRoles.map(role => (
                        <TableHead key={role} className="text-center min-w-[80px]">
                          <div className="text-xs font-medium">
                            {ROLE_LABELS[role]}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pages.map(page => (
                      <TableRow key={page}>
                        <TableCell className="sticky left-0 bg-background font-medium">
                          {PAGE_LABELS[page]}
                        </TableCell>
                        {allRoles.map(role => {
                          const hasAccess = PAGE_PERMISSIONS_DISPLAY[page].includes(role);
                          return (
                            <TableCell key={role} className="text-center">
                              {hasAccess ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Permissions by Role</CardTitle>
                <CardDescription>
                  Which features each role can use within the application
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Feature</TableHead>
                      {allRoles.map(role => (
                        <TableHead key={role} className="text-center min-w-[80px]">
                          <div className="text-xs font-medium">
                            {ROLE_LABELS[role]}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {features.map(feature => (
                      <TableRow key={feature}>
                        <TableCell className="sticky left-0 bg-background font-medium">
                          {FEATURE_LABELS[feature]}
                        </TableCell>
                        {allRoles.map(role => {
                          const hasPermission = FEATURE_PERMISSIONS_DISPLAY[feature].includes(role);
                          return (
                            <TableCell key={role} className="text-center">
                              {hasPermission ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Categories Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Role Categories</CardTitle>
            <CardDescription>Roles grouped by their primary function</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(ROLE_CATEGORIES).map(([category, roles]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                  <div className="flex flex-wrap gap-1">
                    {roles.map(role => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {ROLE_LABELS[role]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
