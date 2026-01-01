import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { canAccessPage, getDefaultDashboard, PageKey } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  pageKey?: PageKey;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  pageKey, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { activeRole, roles, loading: rolesLoading } = useUserRoles();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    // Wait for loading to complete
    if (authLoading || rolesLoading) {
      setShouldRedirect(null);
      return;
    }

    // Not authenticated
    if (!user && requireAuth) {
      setShouldRedirect('/auth');
      return;
    }

    // User has no roles - needs onboarding
    if (user && roles.length === 0 && location.pathname !== '/onboarding') {
      setShouldRedirect('/onboarding');
      return;
    }

    // Check page access
    if (pageKey && activeRole && !canAccessPage(activeRole, pageKey)) {
      const destination = getDefaultDashboard(activeRole);
      setShouldRedirect(destination);
      return;
    }

    setShouldRedirect(null);
  }, [user, activeRole, roles, authLoading, rolesLoading, pageKey, requireAuth, location.pathname]);

  // Show loading state
  if (authLoading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle redirects
  if (shouldRedirect && shouldRedirect !== location.pathname) {
    return <Navigate to={shouldRedirect} replace />;
  }

  return <>{children}</>;
}

// Wrapper for pages that should only be accessible when NOT logged in
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { activeRole, loading: rolesLoading } = useUserRoles();

  if (loading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const destination = getDefaultDashboard(activeRole);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
