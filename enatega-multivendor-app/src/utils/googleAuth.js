/**
 * Google Authentication Helper
 * 
 * Provides Google Sign-In with Expo Go fallback support.
 * Uses expo-auth-session for Expo Go compatibility.
 */

import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession()

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo'

// Google OAuth Client IDs - Replace with your actual IDs
const GOOGLE_CONFIG = {
  expoClientId: '650001300965-9ochl634tuvv6iguei6dl57jkmfto6r9.apps.googleusercontent.com',
  iosClientId: '650001300965-dkji7jutv8gc5m4n7cdg3nft87sauhn7.apps.googleusercontent.com',
  androidClientId: '650001300965-ii3nafver2uiu4qat9gbde9rkmhmvj0j.apps.googleusercontent.com',
  webClientId: '650001300965-9ochl634tuvv6iguei6dl57jkmfto6r9.apps.googleusercontent.com',
}

/**
 * Hook for Google Authentication
 * Works in both Expo Go (via expo-auth-session) and development builds (via native module)
 */
export const useGoogleAuth = () => {
  // Use expo-auth-session for Expo Go compatibility
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CONFIG.expoClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
  })

  const signInWithGoogle = async () => {
    if (isExpoGo) {
      // Use expo-auth-session for Expo Go
      console.log('🔐 Using expo-auth-session for Google Sign-In in Expo Go')
      const result = await promptAsync()
      
      if (result.type === 'success') {
        const { authentication } = result
        // Fetch user info with the access token
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication.accessToken}` },
          }
        )
        const userInfo = await userInfoResponse.json()
        
        return {
          user: {
            email: userInfo.email,
            name: userInfo.name,
            photo: userInfo.picture,
            id: userInfo.id,
          },
          idToken: authentication.idToken,
          accessToken: authentication.accessToken,
        }
      } else if (result.type === 'cancel') {
        throw { code: 'SIGN_IN_CANCELLED', message: 'User cancelled the sign-in' }
      } else {
        throw { code: 'SIGN_IN_FAILED', message: 'Sign-in failed' }
      }
    } else {
      // Use native Google Sign-In for development builds
      console.log('🔐 Using native Google Sign-In')
      const { GoogleSignin } = require('@react-native-google-signin/google-signin')
      
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.webClientId,
        androidClientId: GOOGLE_CONFIG.androidClientId,
        iosClientId: GOOGLE_CONFIG.iosClientId,
        offlineAccess: true,
      })
      
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      
      return {
        user: {
          email: userInfo.user.email,
          name: userInfo.user.name,
          photo: userInfo.user.photo,
          id: userInfo.user.id,
        },
        idToken: userInfo.idToken,
      }
    }
  }

  const signOut = async () => {
    if (!isExpoGo) {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin')
        await GoogleSignin.signOut()
      } catch (error) {
        console.warn('Google Sign-Out error:', error)
      }
    }
  }

  return {
    signInWithGoogle,
    signOut,
    isExpoGo,
    request, // For checking if auth request is ready
  }
}

export default useGoogleAuth
