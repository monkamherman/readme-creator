/**
 * Sentry Integration Helper
 * 
 * Provides Sentry functionality with Expo Go fallback.
 * In Expo Go, errors are logged to console instead.
 */

import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Type definitions
interface SentryConfig {
  dsn: string;
  environment?: string;
  debug?: boolean;
  tracesSampleRate?: number;
}

interface BreadcrumbData {
  category?: string;
  message?: string;
  level?: string;
  data?: Record<string, any>;
}

interface UserData {
  id?: string;
  email?: string;
  username?: string;
}

let Sentry: any = null;

// Initialize Sentry only in development builds
if (!isExpoGo) {
  try {
    Sentry = require('@sentry/react-native');
  } catch (error) {
    console.warn('Sentry not available');
  }
}

export const initSentry = (config?: Partial<SentryConfig>) => {
  if (isExpoGo) {
    console.log('ℹ️ Sentry disabled in Expo Go - errors will be logged to console');
    return;
  }

  if (Sentry) {
    console.log('Initializing Sentry');
    Sentry.init({
      dsn: config?.dsn || 'https://9303b1d33deae903abe4e00ea9f25467@o4507787652694016.ingest.us.sentry.io/4508759522017280',
      environment: config?.environment || 'development',
      debug: config?.debug || false,
      tracesSampleRate: config?.tracesSampleRate || 0.3,
    });
  }
};

export const captureException = (error: any, context: Record<string, any> = {}) => {
  if (isExpoGo) {
    console.error('🔴 [Error Captured]:', error);
    if (Object.keys(context).length > 0) {
      console.error('📋 Context:', context);
    }
    return;
  }

  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (isExpoGo) {
    const emoji = level === 'error' ? '🔴' : level === 'warning' ? '🟡' : 'ℹ️';
    console.log(`${emoji} [${level.toUpperCase()}]:`, message);
    return;
  }

  if (Sentry) {
    Sentry.captureMessage(message, level);
  }
};

export const setUser = (user: UserData | null) => {
  if (isExpoGo) {
    console.log('👤 [Sentry User Set]:', user);
    return;
  }

  if (Sentry) {
    Sentry.setUser(user);
  }
};

export const addBreadcrumb = (breadcrumb: BreadcrumbData) => {
  if (isExpoGo) {
    console.log('🍞 [Breadcrumb]:', breadcrumb.message || breadcrumb.category);
    return;
  }

  if (Sentry) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

export const setTag = (key: string, value: string) => {
  if (isExpoGo) {
    console.log(`🏷️ [Tag] ${key}:`, value);
    return;
  }

  if (Sentry) {
    Sentry.setTag(key, value);
  }
};

export const wrap = <T extends React.ComponentType<any>>(component: T): T => {
  if (isExpoGo || !Sentry) {
    return component;
  }
  return Sentry.wrap(component);
};

// Re-export for compatibility
export { isExpoGo };

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setTag,
  wrap,
  isExpoGo,
};
