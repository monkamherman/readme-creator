/*****************************
 * environment.ts
 * path: '/environment.ts' (root of rider app)
 ******************************/

import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { useContext } from "react";
import { ConfigurationContext } from "./lib/context/global/configuration.context";
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
  const configuration = useContext(ConfigurationContext);
  
  if (__DEV__) {
    loadDevMessages();
    loadErrorMessages();
  }

  // Determine which backend URLs to use
  const getBackendUrls = () => {
    if (!__DEV__) {
      return BACKEND_CONFIG.production;
    }
    return BACKEND_CONFIG[ACTIVE_BACKEND];
  };

  const backend = getBackendUrls();

  // Log Expo Go status
  if (isExpoGo && __DEV__) {
    console.log('ℹ️ Running in Expo Go - using backend:', ACTIVE_BACKEND);
  }

  return {
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
    SENTRY_DSN:
      configuration?.riderAppSentryUrl ??
      "https://e963731ba0f84e5d823a2bbe2968ea4d@o1103026.ingest.sentry.io/6135261",
    GOOGLE_MAPS_KEY: configuration?.googleApiKey,
    ENVIRONMENT: __DEV__ ? "development" : "production",
  };
};

export default getEnvVars;
