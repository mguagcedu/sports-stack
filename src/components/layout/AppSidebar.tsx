import { 
  Home, 
  Building2, 
  Users, 
  GraduationCap,
  Settings,
  FileText,
  CreditCard,
  Ticket,
  MessageSquare,
  BarChart3,
  Database,
  Shield,
  LogOut,
  ChevronDown,
  ClipboardList,
  Trophy,
  UserCircle,
  Dumbbell,
  UserCheck,
  Plug,
} from 'lucide-react';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { canAccessPage, PageKey } from '@/lib/permissions';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  pageKey: PageKey;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: Home, pageKey: 'dashboard' },
  { title: 'Organizations', url: '/organizations', icon: Building2, pageKey: 'organizations' },
  { title: 'Teams', url: '/teams', icon: Users, pageKey: 'teams' },
  { title: 'Coach Dashboard', url: '/coach', icon: ClipboardList, pageKey: 'coach_dashboard' },
  { title: 'Parent Dashboard', url: '/parent', icon: UserCircle, pageKey: 'parent_dashboard' },
  { title: 'Athlete Dashboard', url: '/athlete', icon: Dumbbell, pageKey: 'athlete_dashboard' },
];

const managementNavItems: NavItem[] = [
  { title: 'Registrations', url: '/registrations', icon: FileText, pageKey: 'registrations' },
  { title: 'Payments', url: '/payments', icon: CreditCard, pageKey: 'payments' },
  { title: 'Events & Tickets', url: '/events', icon: Ticket, pageKey: 'events' },
];

const adminNavItems: NavItem[] = [
  { title: 'School Database', url: '/schools', icon: GraduationCap, pageKey: 'schools' },
  { title: 'Districts', url: '/districts', icon: Building2, pageKey: 'districts' },
  { title: 'Governance', url: '/governance', icon: Trophy, pageKey: 'governance' },
  { title: 'Integrations', url: '/integrations', icon: Plug, pageKey: 'integrations' },
  { title: 'Import Data', url: '/import', icon: Database, pageKey: 'import' },
  { title: 'User Management', url: '/users', icon: Users, pageKey: 'users' },
  { title: 'Role Approvals', url: '/approvals', icon: UserCheck, pageKey: 'approvals' },
  { title: 'Permissions', url: '/permissions', icon: Shield, pageKey: 'settings' },
  { title: 'Reports', url: '/reports', icon: BarChart3, pageKey: 'reports' },
  { title: 'Audit Logs', url: '/audit-logs', icon: Database, pageKey: 'audit_logs' },
];

const roleLabels: Record<AppRole, string> = {
  system_admin: 'System Admin',
  org_admin: 'Organization Admin',
  athletic_director: 'Athletic Director',
  head_coach: 'Head Coach',
  coach: 'Coach',
  assistant_coach: 'Assistant Coach',
  team_manager: 'Team Manager',
  equipment_manager: 'Equipment Manager',
  student_manager: 'Student Manager',
  student_equipment_manager: 'Student Equipment Manager',
  parent: 'Parent',
  athlete: 'Athlete',
  guardian: 'Guardian',
  registrar: 'Registrar',
  finance_admin: 'Finance Admin',
  gate_staff: 'Gate Staff',
  viewer: 'Viewer',
  superadmin: 'Superadmin',
  district_owner: 'District Owner',
  district_admin: 'District Admin',
  district_viewer: 'District Viewer',
  school_owner: 'School Owner',
  school_admin: 'School Admin',
  school_viewer: 'School Viewer',
  trainer: 'Trainer',
  scorekeeper: 'Scorekeeper',
  finance_clerk: 'Finance Clerk',
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const { activeRole } = useUserRoles();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Filter navigation items based on role permissions
  const filteredMainNav = mainNavItems.filter(item => 
    canAccessPage(activeRole, item.pageKey)
  );
  const filteredManagementNav = managementNavItems.filter(item => 
    canAccessPage(activeRole, item.pageKey)
  );
  const filteredAdminNav = adminNavItems.filter(item => 
    canAccessPage(activeRole, item.pageKey)
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">Team Management</span>
              <span className="text-xs text-sidebar-foreground/60">Enterprise Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredMainNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink 
                        to={item.url} 
                        end={item.url === '/'}
                        className={({ isActive }) => 
                          cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredManagementNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink 
                        to={item.url}
                        className={({ isActive }) => 
                          cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredAdminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <RouterNavLink 
                        to={item.url}
                        className={({ isActive }) => 
                          cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                              : "hover:bg-sidebar-accent/50"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </RouterNavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {user?.email}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {activeRole ? roleLabels[activeRole] : 'No Role'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
