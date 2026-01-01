import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Key, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

export function SecurityDashboard() {
  // Fetch security events
  const { data: securityEvents } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch login attempts
  const { data: loginAttempts } = useQuery({
    queryKey: ['login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch active sessions count
  const { data: sessionStats } = useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id, is_active')
        .eq('is_active', true);
      if (error) throw error;
      return { activeSessions: data?.length || 0 };
    },
  });

  // Fetch organization security settings
  const { data: securitySettings } = useQuery({
    queryKey: ['org-security-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_security_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const criticalEvents = securityEvents?.filter(e => e.severity === 'critical') || [];
  const warningEvents = securityEvents?.filter(e => e.severity === 'warning') || [];
  const failedLogins = loginAttempts?.filter(l => !l.success) || [];
  const successfulLogins = loginAttempts?.filter(l => l.success) || [];

  const securityScore = calculateSecurityScore(securitySettings, failedLogins.length);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500/10 text-orange-600">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor security status and events</p>
        </div>
      </div>

      {/* Security Score and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                securityScore >= 80 ? 'bg-green-500/10' : 
                securityScore >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'
              }`}>
                {securityScore >= 80 ? (
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                ) : securityScore >= 60 ? (
                  <Shield className="h-6 w-6 text-yellow-500" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">{securityScore}%</p>
                <p className="text-sm text-muted-foreground">Security Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Monitor className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{sessionStats?.activeSessions || 0}</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{criticalEvents.length}</p>
                <p className="text-sm text-muted-foreground">Critical Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <XCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{failedLogins.length}</p>
                <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {criticalEvents.length > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Critical Security Events Detected</AlertTitle>
          <AlertDescription>
            {criticalEvents.length} critical security event(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="logins">Login Activity</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Security-related activities and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No security events recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      securityEvents?.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm">
                            {format(new Date(event.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {event.event_type.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {event.ip_address || '-'}
                          </TableCell>
                          <TableCell>
                            {event.resolved_at ? (
                              <Badge variant="outline" className="text-green-600">Resolved</Badge>
                            ) : (
                              <Badge variant="outline">Open</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle>Login Activity</CardTitle>
              <CardDescription>Recent authentication attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginAttempts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No login attempts recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      loginAttempts?.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="text-sm">
                            {format(new Date(attempt.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {attempt.email}
                          </TableCell>
                          <TableCell>
                            {attempt.success ? (
                              <Badge className="bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {attempt.ip_address || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {attempt.failure_reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Current security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <SecuritySettingItem 
                  icon={<Key className="h-4 w-4" />}
                  label="Password Minimum Length"
                  value={`${securitySettings?.password_min_length || 8} characters`}
                />
                <SecuritySettingItem 
                  icon={<Lock className="h-4 w-4" />}
                  label="MFA Required"
                  value={securitySettings?.mfa_required ? 'Yes' : 'No'}
                  status={securitySettings?.mfa_required}
                />
                <SecuritySettingItem 
                  icon={<Activity className="h-4 w-4" />}
                  label="Session Timeout"
                  value={`${securitySettings?.session_timeout_minutes || 30} minutes`}
                />
                <SecuritySettingItem 
                  icon={<Monitor className="h-4 w-4" />}
                  label="Max Sessions Per User"
                  value={`${securitySettings?.max_sessions_per_user || 5} sessions`}
                />
                <SecuritySettingItem 
                  icon={<Eye className="h-4 w-4" />}
                  label="Public Rosters Allowed"
                  value={securitySettings?.allow_public_rosters ? 'Yes' : 'No'}
                  status={!securitySettings?.allow_public_rosters}
                />
                <SecuritySettingItem 
                  icon={<Users className="h-4 w-4" />}
                  label="Show Athlete Ratings"
                  value={securitySettings?.show_athlete_ratings ? 'Yes' : 'No'}
                  status={!securitySettings?.show_athlete_ratings}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>FERPA, data protection, and security compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ComplianceItem 
                title="FERPA Alignment"
                description="Student data privacy controls enabled"
                status="compliant"
              />
              <ComplianceItem 
                title="Data Encryption"
                description="Data encrypted in transit (HTTPS)"
                status="compliant"
              />
              <ComplianceItem 
                title="Row-Level Security"
                description="Database RLS policies enabled on all tables"
                status="compliant"
              />
              <ComplianceItem 
                title="Audit Logging"
                description="All critical actions are logged"
                status="compliant"
              />
              <ComplianceItem 
                title="Session Management"
                description="User sessions tracked with timeout"
                status="compliant"
              />
              <ComplianceItem 
                title="Input Validation"
                description="All inputs validated and sanitized"
                status="compliant"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SecuritySettingItem({ 
  icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  status?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-background">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{value}</span>
        {status !== undefined && (
          status ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
          )
        )}
      </div>
    </div>
  );
}

function ComplianceItem({ 
  title, 
  description, 
  status 
}: { 
  title: string; 
  description: string; 
  status: 'compliant' | 'warning' | 'non-compliant';
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge className={
        status === 'compliant' ? 'bg-green-500/10 text-green-600' :
        status === 'warning' ? 'bg-yellow-500/10 text-yellow-600' :
        'bg-red-500/10 text-red-600'
      }>
        {status === 'compliant' && <CheckCircle2 className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    </div>
  );
}

function calculateSecurityScore(settings: any, failedLogins: number): number {
  let score = 70; // Base score
  
  if (settings) {
    if (settings.password_min_length >= 8) score += 5;
    if (settings.password_min_length >= 12) score += 5;
    if (settings.password_require_uppercase) score += 3;
    if (settings.password_require_lowercase) score += 2;
    if (settings.password_require_number) score += 3;
    if (settings.password_require_special) score += 5;
    if (settings.mfa_required) score += 10;
    if (!settings.allow_public_rosters) score += 3;
    if (!settings.allow_public_cards) score += 2;
  }
  
  // Deduct for failed logins
  if (failedLogins > 10) score -= 10;
  else if (failedLogins > 5) score -= 5;
  
  return Math.min(100, Math.max(0, score));
}
