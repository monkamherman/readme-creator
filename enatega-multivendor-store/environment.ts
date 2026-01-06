/*****************************
 * environment.ts
 * path: '/environment.ts' (root of store app)
 ******************************/

import Constants from "expo-constants";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Backend URLs configuration
const BACKEND_CONFIG = {
  // Local development
  local: {
    graphql: 'http://localhost:4000/graphql',
    ws: 'ws://localhost:4000/graphql',
  },
  // LAN development (for physical devices - replace with your IP)
  lan: {
    graphql: 'http://192.168.1.100:4000/graphql',
    ws: 'ws://192.168.1.100:4000/graphql',
  },
  // Production server
  production: {
    graphql: 'https://enatega-multivendor.up.railway.app/graphql',
    ws: 'wss://enatega-multivendor.up.railway.app/graphql',
  }
};

// Set your active backend here: 'local', 'lan', or 'production'
const ACTIVE_BACKEND: keyof typeof BACKEND_CONFIG = 'local';

const getEnvVars = () => {
  // Determine which backend URLs to use based on environment
  const isDev = __DEV__;
  
  const getBackendUrls = () => {
    if (!isDev) {
      return BACKEND_CONFIG.production;
    }
    return BACKEND_CONFIG[ACTIVE_BACKEND];
  };

  const backend = getBackendUrls();

  // Log Expo Go status
  if (isExpoGo && isDev) {
    console.log('ℹ️ Running in Expo Go - using backend:', ACTIVE_BACKEND);
  }

  return {
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
  };
};

export default getEnvVars;
