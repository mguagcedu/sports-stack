import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 
  | 'system_admin'
  | 'org_admin'
  | 'athletic_director'
  | 'coach'
  | 'assistant_coach'
  | 'team_manager'
  | 'parent'
  | 'athlete'
  | 'guardian'
  | 'registrar'
  | 'finance_admin'
  | 'gate_staff'
  | 'viewer'
  | 'superadmin'
  | 'district_owner'
  | 'district_admin'
  | 'district_viewer'
  | 'school_owner'
  | 'school_admin'
  | 'school_viewer'
  | 'trainer'
  | 'scorekeeper'
  | 'finance_clerk';

interface UserRole {
  id: string;
  role: AppRole;
  organization_id: string | null;
  team_id: string | null;
}

export function useUserRoles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<AppRole | null>(null);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role, organization_id, team_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        const typedRoles = (data || []).map(r => ({
          ...r,
          role: r.role as AppRole
        }));
        setRoles(typedRoles);
        
        // Set default active role (highest privilege first)
        const roleHierarchy: AppRole[] = [
          'system_admin', 'org_admin', 'athletic_director', 
          'coach', 'assistant_coach', 'team_manager',
          'registrar', 'finance_admin', 'gate_staff',
          'parent', 'guardian', 'athlete', 'viewer'
        ];
        
        const highestRole = roleHierarchy.find(r => 
          typedRoles.some(ur => ur.role === r)
        );
        setActiveRole(highestRole || null);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.some(r => r.role === role);
  };

  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return roles.some(r => checkRoles.includes(r.role));
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['system_admin', 'org_admin']);
  };

  return {
    roles,
    activeRole,
    setActiveRole,
    loading,
    hasRole,
    hasAnyRole,
    isAdmin
  };
}
