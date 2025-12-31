import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Loader2, ShieldX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireAnyRole?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles = [],
  requireAnyRole = false,
  requireAdmin = false,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasAnyRole, isAdmin } = useUserRoles();

  // Show loading while checking auth/roles
  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // Check if user has required roles
  let hasAccess = false;

  if (requireAdmin) {
    hasAccess = isAdmin();
  } else if (allowedRoles.length > 0) {
    hasAccess = hasAnyRole(allowedRoles);
  } else if (requireAnyRole) {
    hasAccess = roles.length > 0;
  } else {
    // No specific requirements, just need to be authenticated
    hasAccess = true;
  }

  if (!hasAccess) {
    // Show fallback or access denied
    if (fallback) {
      return <>{fallback}</>;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <ShieldX className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page.
            {allowedRoles.length > 0 && (
              <span className="block mt-2 text-sm">
                Required roles: {allowedRoles.join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

// HOC version for wrapping pages
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RoleGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard {...guardProps}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
