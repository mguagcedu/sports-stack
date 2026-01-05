import { useEffect, ReactNode } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { statusBarService } from '@/services/statusBar';

interface NativeInitializerProps {
  children: ReactNode;
}

export function NativeInitializer({ children }: NativeInitializerProps) {
  useEffect(() => {
    const initializeNative = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Initialize status bar
        await statusBarService.initialize();

        // Hide splash screen after a short delay to ensure content is ready
        setTimeout(async () => {
          try {
            await SplashScreen.hide();
          } catch (error) {
            console.warn('Failed to hide splash screen:', error);
          }
        }, 500);

        // Set up keyboard listeners (iOS/Android)
        Keyboard.addListener('keyboardWillShow', (info) => {
          document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
          document.body.classList.add('keyboard-visible');
        });

        Keyboard.addListener('keyboardWillHide', () => {
          document.documentElement.style.setProperty('--keyboard-height', '0px');
          document.body.classList.remove('keyboard-visible');
        });

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // App came to foreground
            statusBarService.initialize();
          }
        });

        // Handle back button (Android)
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

      } catch (error) {
        console.warn('Native initialization error:', error);
      }
    };

    initializeNative();

    return () => {
      if (Capacitor.isNativePlatform()) {
        Keyboard.removeAllListeners();
        App.removeAllListeners();
      }
    };
  }, []);

  return <>{children}</>;
}

export default NativeInitializer;
