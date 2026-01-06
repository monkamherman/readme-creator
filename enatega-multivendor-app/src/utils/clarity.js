/**
 * Microsoft Clarity Integration Helper
 * 
 * Provides Clarity analytics with Expo Go fallback.
 * In Expo Go, events are logged to console instead.
 */

import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'

let Clarity = null

// Initialize Clarity only in development builds
if (!isExpoGo) {
  try {
    Clarity = require('@microsoft/react-native-clarity').default
  } catch (error) {
    console.warn('Microsoft Clarity not available:', error.message)
  }
}

export const initClarity = (projectId) => {
  if (isExpoGo) {
    console.log('ℹ️ Microsoft Clarity disabled in Expo Go')
    return
  }

  if (Clarity && projectId) {
    try {
      Clarity.initialize(projectId)
      console.log('✅ Microsoft Clarity initialized')
    } catch (error) {
      console.warn('Failed to initialize Clarity:', error.message)
    }
  }
}

export const setCustomUserId = (userId) => {
  if (isExpoGo) {
    console.log('👤 [Clarity User]:', userId)
    return
  }

  if (Clarity) {
    try {
      Clarity.setCustomUserId(userId)
    } catch (error) {
      console.warn('Clarity setCustomUserId error:', error.message)
    }
  }
}

export const setCustomSessionId = (sessionId) => {
  if (isExpoGo) {
    console.log('🔗 [Clarity Session]:', sessionId)
    return
  }

  if (Clarity) {
    try {
      Clarity.setCustomSessionId(sessionId)
    } catch (error) {
      console.warn('Clarity setCustomSessionId error:', error.message)
    }
  }
}

export const setCustomTag = (key, value) => {
  if (isExpoGo) {
    console.log(`🏷️ [Clarity Tag] ${key}:`, value)
    return
  }

  if (Clarity) {
    try {
      Clarity.setCustomTag(key, value)
    } catch (error) {
      console.warn('Clarity setCustomTag error:', error.message)
    }
  }
}

export const getCurrentSessionUrl = async () => {
  if (isExpoGo) {
    console.log('ℹ️ Clarity session URL not available in Expo Go')
    return null
  }

  if (Clarity) {
    try {
      return await Clarity.getCurrentSessionUrl()
    } catch (error) {
      console.warn('Clarity getCurrentSessionUrl error:', error.message)
      return null
    }
  }
  return null
}

export default {
  initialize: initClarity,
  setCustomUserId,
  setCustomSessionId,
  setCustomTag,
  getCurrentSessionUrl,
  isExpoGo,
}
