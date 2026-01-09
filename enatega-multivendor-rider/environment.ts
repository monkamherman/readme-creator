/*****************************
 * environment.ts
 * path: '/environment.ts' (root of rider app)
 * Uses shared backend configuration
 ******************************/

import { loadDevMessages, loadErrorMessages } from "@apollo/client/dev";
import { useContext } from "react";
import { ConfigurationContext } from "./lib/context/global/configuration.context";
import Constants from "expo-constants";
import { getBackendUrls, getBackendEnvironment } from "../enatega-shared/config/backend.config";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Environment variable for backend selection
const BACKEND_ENV = process.env.EXPO_PUBLIC_BACKEND_ENV || process.env.BACKEND_ENV;

const getEnvVars = () => {
  const configuration = useContext(ConfigurationContext);
  
  if (__DEV__) {
    loadDevMessages();
    loadErrorMessages();
  }

  // Get backend URLs from shared config
  const backend = getBackendUrls(BACKEND_ENV, __DEV__);
  const backendEnv = getBackendEnvironment(BACKEND_ENV, __DEV__);

  // Log Expo Go status
  if (isExpoGo && __DEV__) {
    console.log(`🏍️ Rider App - Backend: ${backendEnv} (Expo Go)`);
  }

  return {
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
    BACKEND_ENV: backendEnv,
    SENTRY_DSN:
      configuration?.riderAppSentryUrl ??
      "https://e963731ba0f84e5d823a2bbe2968ea4d@o1103026.ingest.sentry.io/6135261",
    GOOGLE_MAPS_KEY: configuration?.googleApiKey,
    ENVIRONMENT: __DEV__ ? "development" : "production",
  };
};

export default getEnvVars;
