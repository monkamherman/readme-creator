/**
 * Expo Go Polyfills
 * 
 * This file provides fallbacks for native modules that don't work in Expo Go.
 * These polyfills allow the app to run in Expo Go without native builds.
 */

import Constants from 'expo-constants';

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Safe import helper
export const safeRequire = <T>(moduleName: string, fallback: T): T => {
  try {
    if (isExpoGo) {
      console.log(`ℹ️ Using fallback for ${moduleName} in Expo Go`);
      return fallback;
    }
    return require(moduleName);
  } catch (error) {
    console.warn(`⚠️ Failed to load ${moduleName}, using fallback`);
    return fallback;
  }
};

// Sentry Fallback
export const SentryPolyfill = {
  init: (config: any) => {
    if (isExpoGo) {
      console.log('ℹ️ Sentry disabled in Expo Go');
    }
  },
  captureException: (error: any) => {
    if (isExpoGo) {
      console.error('🔴 [Sentry] Exception:', error);
    }
  },
  captureMessage: (message: string, level?: string) => {
    if (isExpoGo) {
      console.log(`ℹ️ [Sentry] ${level || 'info'}:`, message);
    }
  },
  setUser: (user: any) => {
    if (isExpoGo) {
      console.log('👤 [Sentry] User:', user);
    }
  },
  addBreadcrumb: (breadcrumb: any) => {
    if (isExpoGo) {
      console.log('🍞 [Sentry] Breadcrumb:', breadcrumb);
    }
  },
  wrap: <T extends React.ComponentType<any>>(component: T): T => component,
};

export default {
  isExpoGo,
  safeRequire,
  SentryPolyfill,
};
