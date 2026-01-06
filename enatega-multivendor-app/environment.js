/*****************************
 * environment.js
 * path: '/environment.js' (root of your project)
 ******************************/

import * as Updates from 'expo-updates'
import { useContext } from 'react'
import ConfigurationContext from './src/context/Configuration'

// Backend URLs configuration
const BACKEND_CONFIG = {
  // Local development
  local: {
    graphql: 'http://localhost:4000/graphql',
    ws: 'ws://localhost:4000/graphql',
    rest: 'http://localhost:4000/'
  },
  // LAN development (for physical devices - replace with your IP)
  lan: {
    graphql: 'http://192.168.1.100:4000/graphql',
    ws: 'ws://192.168.1.100:4000/graphql',
    rest: 'http://192.168.1.100/'
  },
  // Production server
  production: {
    graphql: 'https://aws-server.enatega.com/graphql',
    ws: 'wss://aws-server.enatega.com/graphql',
    rest: 'https://aws-server.enatega.com/'
  }
}

// Set your active backend here: 'local', 'lan', or 'production'
const ACTIVE_BACKEND = 'local'

const useEnvVars = (env = Updates.channel) => {
  const configuration = useContext(ConfigurationContext)
  
  // Determine which backend URLs to use
  const getBackendUrls = () => {
    // In production/staging channel, use production backend
    if (env === 'production' || env === 'staging') {
      return BACKEND_CONFIG.production
    }
    // Otherwise use the configured active backend
    return BACKEND_CONFIG[ACTIVE_BACKEND] || BACKEND_CONFIG.local
  }

  const backend = getBackendUrls()

  return {
    // Backend URLs
    GRAPHQL_URL: backend.graphql,
    WS_GRAPHQL_URL: backend.ws,
    SERVER_URL: backend.graphql,
    SERVER_REST_URL: backend.rest,
    
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
