/**
 * Sentry Integration Helper
 * 
 * Provides Sentry functionality with Expo Go fallback.
 * In Expo Go, errors are logged to console instead.
 */

import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'

let Sentry = null

// Initialize Sentry only in development builds
if (!isExpoGo) {
  try {
    Sentry = require('@sentry/react-native')
  } catch (error) {
    console.warn('Sentry not available:', error.message)
  }
}

export const initSentry = (dsn, options = {}) => {
  if (isExpoGo) {
    console.log('ℹ️ Sentry disabled in Expo Go - errors will be logged to console')
    return
  }

  if (Sentry) {
    Sentry.init({
      dsn,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      ...options,
    })
  }
}

export const captureException = (error, context = {}) => {
  if (isExpoGo) {
    console.error('🔴 [Error Captured]:', error)
    if (Object.keys(context).length > 0) {
      console.error('📋 Context:', context)
    }
    return
  }

  if (Sentry) {
    Sentry.captureException(error, { extra: context })
  }
}

export const captureMessage = (message, level = 'info') => {
  if (isExpoGo) {
    const emoji = level === 'error' ? '🔴' : level === 'warning' ? '🟡' : 'ℹ️'
    console.log(`${emoji} [${level.toUpperCase()}]:`, message)
    return
  }

  if (Sentry) {
    Sentry.captureMessage(message, level)
  }
}

export const setUser = (user) => {
  if (isExpoGo) {
    console.log('👤 [Sentry User Set]:', user)
    return
  }

  if (Sentry) {
    Sentry.setUser(user)
  }
}

export const addBreadcrumb = (breadcrumb) => {
  if (isExpoGo) {
    console.log('🍞 [Breadcrumb]:', breadcrumb.message || breadcrumb.category)
    return
  }

  if (Sentry) {
    Sentry.addBreadcrumb(breadcrumb)
  }
}

export const setTag = (key, value) => {
  if (isExpoGo) {
    console.log(`🏷️ [Tag] ${key}:`, value)
    return
  }

  if (Sentry) {
    Sentry.setTag(key, value)
  }
}

export const setExtra = (key, value) => {
  if (isExpoGo) {
    console.log(`📎 [Extra] ${key}:`, value)
    return
  }

  if (Sentry) {
    Sentry.setExtra(key, value)
  }
}

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setTag,
  setExtra,
  isExpoGo,
}
