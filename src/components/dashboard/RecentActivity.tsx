import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign,
  Shield,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  organizationId?: string;
  limit?: number;
}

interface ActivityItem {
  id: string;
  type: 'event' | 'registration' | 'team' | 'payment' | 'audit';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof Activity;
  color: string;
}

export function RecentActivity({ organizationId, limit = 10 }: RecentActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', organizationId, limit],
    queryFn: async () => {
      const items: ActivityItem[] = [];

      // Fetch recent events
      const { data: events } = await supabase
        .from('events')
        .select('id, name, event_type, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      events?.forEach(event => {
        items.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.name,
          description: `New ${event.event_type} added`,
          timestamp: event.created_at,
          icon: Calendar,
          color: 'text-green-500',
        });
      });

      // Fetch recent registrations
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      registrations?.forEach(reg => {
        items.push({
          id: `reg-${reg.id}`,
          type: 'registration',
          title: 'New Registration',
          description: `Status: ${reg.status}`,
          timestamp: reg.created_at,
          icon: FileText,
          color: 'text-blue-500',
        });
      });

      // Fetch recent team changes
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      teams?.forEach(team => {
        items.push({
          id: `team-${team.id}`,
          type: 'team',
          title: team.name,
          description: 'Team created',
          timestamp: team.created_at,
          icon: Users,
          color: 'text-purple-500',
        });
      });

      // Fetch recent audit logs
      const { data: audits } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      audits?.forEach(audit => {
        items.push({
          id: `audit-${audit.id}`,
          type: 'audit',
          title: `${audit.action} ${audit.entity_type}`,
          description: 'System activity',
          timestamp: audit.created_at,
          icon: Shield,
          color: 'text-orange-500',
        });
      });

      // Sort by timestamp and limit
      return items
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates across your organization</CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
