import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pushNotificationService, PushNotificationToken } from '@/services/pushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePushNotificationsReturn {
  isAvailable: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'loading';
  token: string | null;
  requestPermission: () => Promise<boolean>;
  isRegistered: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  const isAvailable = pushNotificationService.isAvailable();

  // Save token to database
  const saveTokenToDatabase = useCallback(async (tokenData: PushNotificationToken) => {
    if (!user) return;

    try {
      // Use raw SQL through RPC or direct insert - cast to any to avoid type issues
      // until the push_tokens table is created and types are regenerated
      const { error } = await (supabase as any)
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: tokenData.token,
          platform: tokenData.platform,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) {
        console.error('Failed to save push token:', error);
      } else {
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }, [user]);

  // Initialize push notifications
  useEffect(() => {
    if (!isAvailable) {
      setPermissionStatus('denied');
      return;
    }

    const init = async () => {
      const status = await pushNotificationService.checkPermission();
      setPermissionStatus(status);

      // Set up token listener
      pushNotificationService.onTokenReceived((tokenData) => {
        setToken(tokenData.token);
        saveTokenToDatabase(tokenData);
      });

      // Set up notification received listener (foreground)
      pushNotificationService.onNotificationReceived((notification) => {
        toast.info(notification.title || 'New Notification', {
          description: notification.body,
        });
      });

      // Set up notification action listener (user tapped)
      pushNotificationService.onNotificationAction((action) => {
        const data = action.notification.data;
        if (data?.route) {
          navigate(data.route);
        }
      });

      // Auto-register if already granted
      if (status === 'granted') {
        await pushNotificationService.register();
      }
    };

    init();

    return () => {
      pushNotificationService.removeAllListeners();
    };
  }, [isAvailable, navigate, saveTokenToDatabase]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;

    const granted = await pushNotificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');

    if (granted) {
      await pushNotificationService.register();
    }

    return granted;
  }, [isAvailable]);

  return {
    isAvailable,
    permissionStatus,
    token,
    requestPermission,
    isRegistered,
  };
}

export default usePushNotifications;
