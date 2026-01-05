import { ReactNode, useEffect } from 'react';
import { useSecurityHeaders, useSessionIntegrity } from '@/hooks/useSecurityHeaders';

interface SecurityProviderProps {
  children: ReactNode;
}

/**
 * SecurityProvider component that applies client-side security measures
 * - Clickjacking prevention
 * - Console warning in production
 * - Session integrity checking
 */
export function SecurityProvider({ children }: SecurityProviderProps) {
  // Apply security headers and measures
  useSecurityHeaders();
  useSessionIntegrity();

  // Log security initialization in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Security provider initialized');
    }
  }, []);

  return <>{children}</>;
}
