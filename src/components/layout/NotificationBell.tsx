import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, Clock, User } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function NotificationBell() {
  const navigate = useNavigate();
  const { hasAnyRole } = useUserRoles();
  const [open, setOpen] = useState(false);
  
  const isAdmin = hasAnyRole(['system_admin', 'org_admin', 'superadmin']);

  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_approvals')
        .select(`
          id,
          user_id,
          requested_role,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Fetch profiles for these approvals
      if (data && data.length > 0) {
        const userIds = data.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        return data.map(approval => ({
          ...approval,
          profile: profileMap.get(approval.user_id)
        }));
      }
      
      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: totalCount } = useQuery({
    queryKey: ['pending-approvals-total'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pending_approvals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  if (!isAdmin) {
    return null;
  }

  const count = totalCount || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <p className="text-xs text-muted-foreground">
            {count === 0 ? 'No pending items' : `${count} pending approval${count === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="max-h-80 overflow-auto">
          {pendingApprovals?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
              All caught up!
            </div>
          ) : (
            <div className="divide-y">
              {pendingApprovals?.map((approval: any) => (
                <div
                  key={approval.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setOpen(false);
                    navigate('/pending-approvals');
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {approval.profile?.first_name || approval.profile?.email || 'New user'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requests <Badge variant="secondary" className="text-[10px] px-1 py-0">{approval.requested_role}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {count > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                navigate('/pending-approvals');
              }}
            >
              View all approvals
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
