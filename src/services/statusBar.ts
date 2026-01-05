import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const statusBarService = {
  /**
   * Set status bar style (light or dark content)
   */
  setStyle: async (style: 'light' | 'dark') => {
    if (!isNative) return;
    
    try {
      await StatusBar.setStyle({
        style: style === 'dark' ? Style.Dark : Style.Light,
      });
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Set status bar background color
   */
  setBackgroundColor: async (color: string) => {
    if (!isNative) return;
    
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Show the status bar
   */
  show: async () => {
    if (!isNative) return;
    
    try {
      await StatusBar.show();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Hide the status bar
   */
  hide: async () => {
    if (!isNative) return;
    
    try {
      await StatusBar.hide();
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Set whether the status bar overlays the web view
   */
  setOverlaysWebView: async (overlay: boolean) => {
    if (!isNative) return;
    
    try {
      await StatusBar.setOverlaysWebView({ overlay });
    } catch (error) {
      console.warn('StatusBar not available:', error);
    }
  },

  /**
   * Initialize status bar with default settings
   */
  initialize: async () => {
    if (!isNative) return;
    
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#0066CC' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.warn('StatusBar initialization failed:', error);
    }
  },
};

export default statusBarService;
