import { useState, useEffect } from 'react';
import { Check, ChevronDown, Building2, GraduationCap, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';

interface RoleContext {
  role: AppRole;
  organization_id: string | null;
  organization_name?: string;
  district_id: string | null;
  district_name?: string;
  school_id: string | null;
  school_name?: string;
}

const roleLabels: Record<AppRole, string> = {
  system_admin: 'System Admin',
  org_admin: 'Organization Admin',
  athletic_director: 'Athletic Director',
  coach: 'Coach',
  assistant_coach: 'Assistant Coach',
  team_manager: 'Team Manager',
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

const roleIcons: Partial<Record<AppRole, typeof Shield>> = {
  system_admin: Shield,
  superadmin: Shield,
  org_admin: Building2,
  district_owner: Building2,
  district_admin: Building2,
  school_owner: GraduationCap,
  school_admin: GraduationCap,
  coach: Users,
  athletic_director: Users,
};

interface RoleSwitcherProps {
  compact?: boolean;
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { user } = useAuth();
  const { roles, activeRole, setActiveRole } = useUserRoles();
  const [roleContexts, setRoleContexts] = useState<RoleContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || roles.length === 0) {
      setRoleContexts([]);
      setIsLoading(false);
      return;
    }

    const fetchContexts = async () => {
      setIsLoading(true);
      
      // Build contexts for each role
      const contexts: RoleContext[] = [];
      
      for (const role of roles) {
        const context: RoleContext = {
          role: role.role,
          organization_id: role.organization_id,
          district_id: null,
          school_id: null,
        };

        // Fetch organization name if applicable
        if (role.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, district_id, school_id')
            .eq('id', role.organization_id)
            .single();
          
          if (org) {
            context.organization_name = org.name;
            context.district_id = org.district_id;
            context.school_id = org.school_id;
          }
        }

        contexts.push(context);
      }

      setRoleContexts(contexts);
      setIsLoading(false);
    };

    fetchContexts();
  }, [user, roles]);

  const handleRoleSelect = async (context: RoleContext) => {
    setActiveRole(context.role);
    
    // Save to user_role_contexts table
    if (user) {
      await supabase
        .from('user_role_contexts')
        .upsert({
          user_id: user.id,
          active_role: context.role,
          active_organization_id: context.organization_id,
          active_district_id: context.district_id,
          active_school_id: context.school_id,
        }, { onConflict: 'user_id' });
    }
  };

  const ActiveIcon = activeRole ? (roleIcons[activeRole] || Shield) : Shield;
  const activeContext = roleContexts.find(c => c.role === activeRole);

  if (roles.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={compact ? "sm" : "default"}
          className={cn(
            "gap-2",
            compact && "h-8 px-2"
          )}
        >
          <ActiveIcon className="h-4 w-4" />
          {!compact && (
            <>
              <span className="max-w-[120px] truncate">
                {activeRole ? roleLabels[activeRole] : 'Select Role'}
              </span>
              {activeContext?.organization_name && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeContext.organization_name}
                </Badge>
              )}
            </>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-popover">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Global Roles */}
        {roleContexts.filter(c => !c.organization_id).length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Global Roles
            </DropdownMenuLabel>
            {roleContexts
              .filter(c => !c.organization_id)
              .map((context, index) => {
                const Icon = roleIcons[context.role] || Shield;
                return (
                  <DropdownMenuItem
                    key={`global-${index}`}
                    onClick={() => handleRoleSelect(context)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{roleLabels[context.role]}</span>
                    {activeRole === context.role && !activeContext?.organization_id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuGroup>
        )}

        {/* Organization Roles */}
        {roleContexts.filter(c => c.organization_id).length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organization Roles
              </DropdownMenuLabel>
              {roleContexts
                .filter(c => c.organization_id)
                .map((context, index) => {
                  const Icon = roleIcons[context.role] || Building2;
                  return (
                    <DropdownMenuItem
                      key={`org-${index}`}
                      onClick={() => handleRoleSelect(context)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div>{roleLabels[context.role]}</div>
                        {context.organization_name && (
                          <div className="text-xs text-muted-foreground">
                            {context.organization_name}
                          </div>
                        )}
                      </div>
                      {activeRole === context.role && 
                       activeContext?.organization_id === context.organization_id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
