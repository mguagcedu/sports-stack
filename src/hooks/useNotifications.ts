import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: string;
  reference_type?: string;
  reference_id?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}

// Helper function to create notifications (for use in other hooks/services)
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category,
      reference_type: input.reference_type,
      reference_id: input.reference_id,
    });
  
  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Send notification to multiple users
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'user_id'>
): Promise<void> {
  const notifications = userIds.map(user_id => ({
    user_id,
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    category: notification.category,
    reference_type: notification.reference_type,
    reference_id: notification.reference_id,
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);
  
  if (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}
