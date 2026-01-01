import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultDashboard } from '@/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, GraduationCap, UserCheck, Mail, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

// Roles that require admin approval
const APPROVAL_REQUIRED_ROLES: AppRole[] = ['coach', 'athletic_director', 'registrar', 'team_manager'];

// Roles users can self-assign
const SELF_ASSIGN_ROLES: { value: AppRole; label: string; description: string; icon: React.ReactNode; requiresApproval: boolean }[] = [
  { value: 'parent', label: 'Parent / Guardian', description: 'Register and manage your children\'s athletic activities', icon: <Users className="h-5 w-5" />, requiresApproval: false },
  { value: 'athlete', label: 'Athlete', description: 'View your team, schedule, and performance', icon: <UserCheck className="h-5 w-5" />, requiresApproval: false },
  { value: 'coach', label: 'Coach', description: 'Manage your team, roster, and events (requires approval)', icon: <GraduationCap className="h-5 w-5" />, requiresApproval: true },
  { value: 'viewer', label: 'Viewer', description: 'View public team and event information', icon: <Shield className="h-5 w-5" />, requiresApproval: false },
];

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface PendingApproval {
  id: string;
  status: string;
  requested_role: string;
  created_at: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Check email verification status
  useEffect(() => {
    if (user) {
      setEmailVerified(user.email_confirmed_at !== null);
    }
  }, [user]);

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

  // Fetch available organizations and pending approvals
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, type')
        .order('name');
      
      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
      } else {
        setOrganizations(orgsData || []);
      }

      // Fetch pending approvals for this user
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('pending_approvals')
        .select('id, status, requested_role, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (approvalsError) {
        console.error('Error fetching pending approvals:', approvalsError);
      } else {
        setPendingApprovals(approvalsData || []);
      }

      setLoadingOrgs(false);
    };

    fetchData();
  }, [user]);

  const handleResendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox and click the verification link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend email',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const requiresApproval = selectedRole && APPROVAL_REQUIRED_ROLES.includes(selectedRole as AppRole);

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
      if (requiresApproval) {
        // Create a pending approval request
        // First, we need a team_id - for now we'll create a placeholder or use a default team
        // In a real system, we'd let them select a team or organization they want to join
        
        const { error } = await supabase
          .from('pending_approvals')
          .insert({
            user_id: user.id,
            requested_role: selectedRole,
            organization_id: selectedOrg || null,
            team_id: '00000000-0000-0000-0000-000000000000', // Placeholder - would be real team ID
            status: 'pending',
          });

        if (error) throw error;

        toast({
          title: 'Request Submitted',
          description: 'Your role request has been submitted for admin approval. You will be notified once approved.',
        });

        // Assign viewer role temporarily so they can at least access the app
        const { error: viewerError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'viewer' as AppRole,
          });

        if (viewerError && !viewerError.message.includes('duplicate')) {
          console.error('Error assigning viewer role:', viewerError);
        }

        // Refresh and navigate
        window.location.href = '/';
      } else {
        // Direct role assignment for self-service roles
        const roleData: {
          user_id: string;
          role: AppRole;
          organization_id?: string;
        } = {
          user_id: user.id,
          role: selectedRole as AppRole,
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
        const destination = getDefaultDashboard(selectedRole as AppRole);
        navigate(destination);
      }
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

        {/* Email Verification Status */}
        {emailVerified === false && (
          <Alert className="border-amber-200 bg-amber-50">
            <Mail className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Email not verified.</span>
                  <p className="text-sm">Please verify your email to access all features.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResendVerificationEmail}
                  disabled={resendingEmail}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {resendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {emailVerified === true && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <span className="font-medium">Email verified!</span> Your email address has been confirmed.
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <span className="font-medium">Pending approval:</span> Your request for{' '}
              {pendingApprovals.map(a => a.requested_role).join(', ')} role is awaiting admin review.
            </AlertDescription>
          </Alert>
        )}

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
              {SELF_ASSIGN_ROLES.map((role) => (
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{role.label}</p>
                      {role.requiresApproval && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Requires Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Organization Selection (for roles that need it) */}
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
              </div>
            )}

            {/* Justification for approval-required roles */}
            {requiresApproval && (
              <div className="space-y-2">
                <Label htmlFor="justification">Why do you need this role? (Optional)</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain your connection to the team or organization..."
                  rows={3}
                />
              </div>
            )}

            {/* Approval warning */}
            {requiresApproval && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This role requires admin approval. You'll be assigned a temporary Viewer role until your request is approved.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={!selectedRole || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {requiresApproval ? 'Submitting Request...' : 'Setting up...'}
                </>
              ) : (
                requiresApproval ? 'Submit for Approval' : 'Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
