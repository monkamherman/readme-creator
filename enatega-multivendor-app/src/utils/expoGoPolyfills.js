/**
 * Expo Go Polyfills
 * 
 * This file provides fallbacks for native modules that don't work in Expo Go.
 * These polyfills allow the app to run in Expo Go without native builds.
 */

import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo'

// Google Sign-In Fallback
export const GoogleSigninPolyfill = {
  configure: (config) => {
    if (isExpoGo) {
      console.warn('⚠️ Google Sign-In is not available in Expo Go. Please use a development build.')
    }
  },
  hasPlayServices: async () => {
    if (isExpoGo) {
      throw new Error('Google Sign-In requires a development build. Please run: npx expo run:android or npx expo run:ios')
    }
    return true
  },
  signIn: async () => {
    if (isExpoGo) {
      throw new Error('Google Sign-In requires a development build. Please run: npx expo run:android or npx expo run:ios')
    }
  },
  signOut: async () => {
    if (isExpoGo) {
      console.warn('⚠️ Google Sign-Out not available in Expo Go')
    }
  },
  getCurrentUser: () => {
    if (isExpoGo) {
      return null
    }
  },
  isSignedIn: async () => {
    if (isExpoGo) {
      return false
    }
  }
}

// Sentry Fallback
export const SentryPolyfill = {
  init: (config) => {
    if (isExpoGo) {
      console.log('ℹ️ Sentry disabled in Expo Go')
    }
  },
  captureException: (error) => {
    if (isExpoGo) {
      console.error('Sentry would capture:', error)
    }
  },
  captureMessage: (message) => {
    if (isExpoGo) {
      console.log('Sentry would log:', message)
    }
  },
  setUser: (user) => {
    if (isExpoGo) {
      console.log('Sentry user:', user)
    }
  },
  addBreadcrumb: (breadcrumb) => {
    if (isExpoGo) {
      console.log('Sentry breadcrumb:', breadcrumb)
    }
  }
}

// Microsoft Clarity Fallback
export const ClarityPolyfill = {
  initialize: (projectId) => {
    if (isExpoGo) {
      console.log('ℹ️ Microsoft Clarity disabled in Expo Go')
    }
  },
  setCustomUserId: (userId) => {
    if (isExpoGo) {
      console.log('Clarity userId:', userId)
    }
  },
  setCustomTag: (key, value) => {
    if (isExpoGo) {
      console.log('Clarity tag:', key, value)
    }
  }
}

// Helper to conditionally import native modules
export const safeRequire = (moduleName, fallback) => {
  try {
    if (isExpoGo) {
      console.log(`ℹ️ Using fallback for ${moduleName} in Expo Go`)
      return fallback
    }
    return require(moduleName)
  } catch (error) {
    console.warn(`⚠️ Failed to load ${moduleName}, using fallback:`, error.message)
    return fallback
  }
}

export default {
  isExpoGo,
  GoogleSigninPolyfill,
  SentryPolyfill,
  ClarityPolyfill,
  safeRequire
}
