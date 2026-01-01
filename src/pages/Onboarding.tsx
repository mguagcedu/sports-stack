import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultDashboard } from '@/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, GraduationCap, UserCheck } from 'lucide-react';

const AVAILABLE_ROLES: { value: AppRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'parent', label: 'Parent / Guardian', description: 'Register and manage your children\'s athletic activities', icon: <Users className="h-5 w-5" /> },
  { value: 'athlete', label: 'Athlete', description: 'View your team, schedule, and performance', icon: <UserCheck className="h-5 w-5" /> },
  { value: 'coach', label: 'Coach', description: 'Manage your team, roster, and events', icon: <GraduationCap className="h-5 w-5" /> },
  { value: 'viewer', label: 'Viewer', description: 'View public team and event information', icon: <Shield className="h-5 w-5" /> },
];

interface Organization {
  id: string;
  name: string;
  type: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // Redirect if user already has roles
  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
      } else if (roles.length > 0) {
        const destination = getDefaultDashboard(roles[0]?.role || null);
        navigate(destination);
      }
    }
  }, [user, roles, authLoading, rolesLoading, navigate]);

  // Fetch available organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .order('name');
      
      if (error) {
        console.error('Error fetching organizations:', error);
      } else {
        setOrganizations(data || []);
      }
      setLoadingOrgs(false);
    };

    fetchOrganizations();
  }, []);

  const handleSubmit = async () => {
    if (!selectedRole || !user) {
      toast({
        title: 'Please select a role',
        description: 'You must select a role to continue.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert the user's role
      const roleData: {
        user_id: string;
        role: AppRole;
        organization_id?: string;
      } = {
        user_id: user.id,
        role: selectedRole,
      };

      if (selectedOrg) {
        roleData.organization_id = selectedOrg;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert(roleData);

      if (error) throw error;

      toast({
        title: 'Welcome!',
        description: 'Your account has been set up successfully.',
      });

      // Navigate to the appropriate dashboard
      const destination = getDefaultDashboard(selectedRole);
      navigate(destination);
    } catch (error: any) {
      console.error('Error setting up account:', error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to set up your account. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Welcome to Team Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's get your account set up
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Select Your Role</CardTitle>
            <CardDescription>
              Choose the role that best describes how you'll use the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              {AVAILABLE_ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedRole === role.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{role.label}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Organization Selection (optional for some roles) */}
            {selectedRole && ['coach', 'athletic_director', 'team_manager'].includes(selectedRole) && (
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select an organization"} />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select your school or organization if applicable
                </p>
              </div>
            )}

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={!selectedRole || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
