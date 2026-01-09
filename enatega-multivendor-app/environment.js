/*****************************
 * environment.js
 * path: '/environment.js' (root of your project)
 * Uses shared backend configuration
 ******************************/

import * as Updates from 'expo-updates'
import { useContext } from 'react'
import ConfigurationContext from './src/context/Configuration'
import { getBackendUrls, getBackendEnvironment } from '../enatega-shared/config/backend.config'

// Environment variable for backend selection (set in app.config.js or .env)
// Options: 'local', 'lan', 'production'
const BACKEND_ENV = process.env.EXPO_PUBLIC_BACKEND_ENV || process.env.BACKEND_ENV

const useEnvVars = (env = Updates.channel) => {
  const configuration = useContext(ConfigurationContext)
  
  // Determine if we're in development mode
  const isDev = env !== 'production' && env !== 'staging'
  
  // Get backend URLs from shared config
  const backend = getBackendUrls(BACKEND_ENV, isDev)
  const backendEnv = getBackendEnvironment(BACKEND_ENV, isDev)
  
  // Log current backend in dev mode
  if (__DEV__) {
    console.log(`📱 Customer App - Backend: ${backendEnv}`)
  }

  return {
    // Backend URLs
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
    SERVER_URL: backend.graphql,
    SERVER_REST_URL: backend.rest,
    
    // Current environment info
    BACKEND_ENV: backendEnv,
    
    // Google Auth Configuration
    IOS_CLIENT_ID_GOOGLE: configuration?.iOSClientID,
    ANDROID_CLIENT_ID_GOOGLE: configuration?.androidClientID,
    EXPO_CLIENT_ID: configuration?.expoClientID,
    
    // External Services
    AMPLITUDE_API_KEY: configuration?.appAmplitudeApiKey,
    GOOGLE_MAPS_KEY: configuration?.googleApiKey,
    SENTRY_DSN: configuration?.customerAppSentryUrl ?? 'https://4213c02977911e1b75898c93cc5517fb@o1103026.ingest.us.sentry.io/4508662470803456',
    
    // App Configuration
    TERMS_AND_CONDITIONS: configuration?.termsAndConditions,
    PRIVACY_POLICY: configuration?.privacyPolicy,
    TEST_OTP: configuration?.testOtp,
    GOOGLE_PACES_API_BASE_URL: configuration?.googlePlacesApiBaseUrl
  }
}

export default useEnvVars
