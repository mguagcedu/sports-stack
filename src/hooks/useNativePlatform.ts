import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

interface NativePlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export function useNativePlatform(): NativePlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<NativePlatformInfo>(() => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();
    
    return {
      platform,
      isNative,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
    };
  });

  useEffect(() => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();
    
    setPlatformInfo({
      platform,
      isNative,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
    });
  }, []);

  return platformInfo;
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getPlatform(): Platform {
  return Capacitor.getPlatform() as Platform;
}
