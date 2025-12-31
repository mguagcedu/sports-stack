import { useState, useEffect } from 'react';
import { AlertTriangle, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ImpersonationSession {
  id: string;
  target_user_id: string;
  target_email?: string;
  target_name?: string;
  reason: string;
  started_at: string;
}

interface ImpersonationBannerProps {
  className?: string;
}

export function ImpersonationBanner({ className }: ImpersonationBannerProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!user) {
      setSession(null);
      return;
    }

    // Check for active impersonation session
    const checkSession = async () => {
      const { data, error } = await supabase
        .from('impersonation_sessions')
        .select('id, target_user_id, reason, started_at')
        .eq('superadmin_id', user.id)
        .is('ended_at', null)
        .single();

      if (error || !data) {
        setSession(null);
        return;
      }

      // Fetch target user info
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', data.target_user_id)
        .single();

      setSession({
        ...data,
        target_email: profile?.email,
        target_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : undefined,
      });
    };

    checkSession();
  }, [user]);

  const handleEndSession = async () => {
    if (!session) return;

    setIsEnding(true);

    try {
      const { error } = await supabase.functions.invoke('impersonate', {
        body: {
          action: 'end',
          session_id: session.id,
        },
      });

      if (error) throw error;

      setSession(null);
      // Optionally refresh the page to reset context
      window.location.reload();
    } catch (err) {
      console.error('Failed to end impersonation:', err);
    } finally {
      setIsEnding(false);
    }
  };

  if (!session) return null;

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 shadow-lg ${className}`}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-amber-600/30 rounded-md px-2 py-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-wide">God Mode</span>
          </div>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Viewing as: <strong>{session.target_name || session.target_email || 'User'}</strong>
            </span>
          </div>

          <span className="text-xs opacity-75">
            Duration: {formatDuration(session.started_at)}
          </span>

          {session.reason && (
            <span className="text-xs opacity-75 hidden md:inline">
              Reason: {session.reason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs opacity-75 hidden sm:inline">
            All actions are logged
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleEndSession}
            disabled={isEnding}
            className="bg-amber-600 hover:bg-amber-700 text-amber-50 border-0"
          >
            {isEnding ? (
              <>Ending...</>
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                End Session
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
