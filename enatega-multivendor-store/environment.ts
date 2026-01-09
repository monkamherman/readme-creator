/*****************************
 * environment.ts
 * path: '/environment.ts' (root of store app)
 * Uses shared backend configuration
 ******************************/

import Constants from "expo-constants";
import { getBackendUrls, getBackendEnvironment } from "../enatega-shared/config/backend.config";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Environment variable for backend selection
const BACKEND_ENV = process.env.EXPO_PUBLIC_BACKEND_ENV || process.env.BACKEND_ENV;

const getEnvVars = () => {
  // Get backend URLs from shared config
  const backend = getBackendUrls(BACKEND_ENV, __DEV__);
  const backendEnv = getBackendEnvironment(BACKEND_ENV, __DEV__);

  // Log Expo Go status
  if (isExpoGo && __DEV__) {
    console.log(`🏪 Store App - Backend: ${backendEnv} (Expo Go)`);
  }

  return {
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
    BACKEND_ENV: backendEnv,
  };
};

export default getEnvVars;
