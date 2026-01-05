import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android';
}

export type NotificationReceivedCallback = (notification: PushNotificationSchema) => void;
export type NotificationActionCallback = (action: ActionPerformed) => void;
export type TokenReceivedCallback = (token: PushNotificationToken) => void;

let registrationListener: any = null;
let notificationReceivedListener: any = null;
let notificationActionListener: any = null;

export const pushNotificationService = {
  /**
   * Check if push notifications are available
   */
  isAvailable: () => isNative,

  /**
   * Request permission for push notifications
   */
  requestPermission: async (): Promise<boolean> => {
    if (!isNative) return false;
    
    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.warn('Push notification permission request failed:', error);
      return false;
    }
  },

  /**
   * Check current permission status
   */
  checkPermission: async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (!isNative) return 'denied';
    
    try {
      const result = await PushNotifications.checkPermissions();
      const status = result.receive;
      // Map 'prompt-with-rationale' to 'prompt'
      if (status === 'prompt-with-rationale') return 'prompt';
      return status as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.warn('Push notification permission check failed:', error);
      return 'denied';
    }
  },

  /**
   * Register for push notifications
   */
  register: async (): Promise<void> => {
    if (!isNative) return;
    
    try {
      await PushNotifications.register();
    } catch (error) {
      console.warn('Push notification registration failed:', error);
    }
  },

  /**
   * Set up listener for token registration
   */
  onTokenReceived: (callback: TokenReceivedCallback): void => {
    if (!isNative) return;
    
    registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      const platform = Capacitor.getPlatform() as 'ios' | 'android';
      callback({ token: token.value, platform });
    });
  },

  /**
   * Set up listener for push notification received (foreground)
   */
  onNotificationReceived: (callback: NotificationReceivedCallback): void => {
    if (!isNative) return;
    
    notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      callback
    );
  },

  /**
   * Set up listener for notification action (user tapped notification)
   */
  onNotificationAction: (callback: NotificationActionCallback): void => {
    if (!isNative) return;
    
    notificationActionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      callback
    );
  },

  /**
   * Remove all listeners
   */
  removeAllListeners: async (): Promise<void> => {
    if (!isNative) return;
    
    try {
      if (registrationListener) {
        await registrationListener.remove();
        registrationListener = null;
      }
      if (notificationReceivedListener) {
        await notificationReceivedListener.remove();
        notificationReceivedListener = null;
      }
      if (notificationActionListener) {
        await notificationActionListener.remove();
        notificationActionListener = null;
      }
    } catch (error) {
      console.warn('Failed to remove push notification listeners:', error);
    }
  },

  /**
   * Get delivered notifications
   */
  getDeliveredNotifications: async () => {
    if (!isNative) return { notifications: [] };
    
    try {
      return await PushNotifications.getDeliveredNotifications();
    } catch (error) {
      console.warn('Failed to get delivered notifications:', error);
      return { notifications: [] };
    }
  },

  /**
   * Remove all delivered notifications
   */
  removeAllDeliveredNotifications: async (): Promise<void> => {
    if (!isNative) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.warn('Failed to remove delivered notifications:', error);
    }
  },
};

export default pushNotificationService;
