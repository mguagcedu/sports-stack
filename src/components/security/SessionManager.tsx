import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  LogOut, 
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function SessionManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['user-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const terminateMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          forced_logout_at: new Date().toISOString(),
          forced_logout_reason: 'User initiated logout'
        })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', user?.id] });
      toast({ title: 'Session terminated' });
    },
    onError: (error) => {
      toast({ title: 'Error terminating session', description: error.message, variant: 'destructive' });
    },
  });

  const terminateAllMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false, 
          forced_logout_at: new Date().toISOString(),
          forced_logout_reason: 'User terminated all sessions'
        })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', user?.id] });
      toast({ title: 'All sessions terminated' });
    },
    onError: (error) => {
      toast({ title: 'Error terminating sessions', description: error.message, variant: 'destructive' });
    },
  });

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceInfo = (session: any) => {
    const deviceInfo = session.device_info || {};
    const ua = session.user_agent || '';
    
    let browser = 'Unknown browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return { browser, os };
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading sessions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across devices
            </CardDescription>
          </div>
          {sessions && sessions.length > 1 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => terminateAllMutation.mutate()}
              disabled={terminateAllMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout All Others
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions?.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No active sessions found
          </div>
        ) : (
          sessions?.map((session, index) => {
            const deviceInfo = getDeviceInfo(session);
            const isCurrentSession = index === 0; // Most recent is likely current
            
            return (
              <div 
                key={session.id}
                className={`p-4 rounded-lg border ${isCurrentSession ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md ${isCurrentSession ? 'bg-primary/10' : 'bg-muted'}`}>
                      {getDeviceIcon(session.user_agent)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deviceInfo.browser} on {deviceInfo.os}</span>
                        {isCurrentSession && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {session.ip_address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ip_address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last active {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Started {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentSession && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => terminateMutation.mutate(session.id)}
                      disabled={terminateMutation.isPending}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {sessions && sessions.length > 0 && (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              If you see any unfamiliar sessions, terminate them immediately and change your password.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
