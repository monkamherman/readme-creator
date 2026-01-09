/*****************************
 * Unified Backend Configuration
 * Shared across all Enatega apps (app, rider, store)
 ******************************/

export type BackendEnvironment = 'local' | 'lan' | 'production';

export interface BackendUrls {
  graphql: string;
  ws: string;
  rest?: string;
}

// Backend URLs configuration
export const BACKEND_CONFIG: Record<BackendEnvironment, BackendUrls> = {
  // Local development (localhost)
  local: {
    graphql: 'http://localhost:4000/graphql',
    ws: 'ws://localhost:4000/graphql',
    rest: 'http://localhost:4000/',
  },
  // LAN development (for physical devices)
  // Update this IP to your local machine's IP address
  lan: {
    graphql: 'http://192.168.1.100:4000/graphql',
    ws: 'ws://192.168.1.100:4000/graphql',
    rest: 'http://192.168.1.100:4000/',
  },
  // Production server
  production: {
    graphql: 'https://enatega-multivendor.up.railway.app/graphql',
    ws: 'wss://enatega-multivendor.up.railway.app/graphql',
    rest: 'https://enatega-multivendor.up.railway.app/',
  },
};

// Default backend for development
export const DEFAULT_BACKEND: BackendEnvironment = 'local';

/**
 * Get backend URLs based on environment
 * Priority: ENV variable > isDev check > default
 */
export const getBackendUrls = (
  envOverride?: string,
  isDev: boolean = true
): BackendUrls => {
  // Check for environment variable override
  const envBackend = envOverride?.toLowerCase() as BackendEnvironment;
  
  if (envBackend && BACKEND_CONFIG[envBackend]) {
    return BACKEND_CONFIG[envBackend];
  }
  
  // In production builds, always use production backend
  if (!isDev) {
    return BACKEND_CONFIG.production;
  }
  
  // Default for development
  return BACKEND_CONFIG[DEFAULT_BACKEND];
};

/**
 * Get current backend environment name
 */
export const getBackendEnvironment = (
  envOverride?: string,
  isDev: boolean = true
): BackendEnvironment => {
  const envBackend = envOverride?.toLowerCase() as BackendEnvironment;
  
  if (envBackend && BACKEND_CONFIG[envBackend]) {
    return envBackend;
  }
  
  return isDev ? DEFAULT_BACKEND : 'production';
};
