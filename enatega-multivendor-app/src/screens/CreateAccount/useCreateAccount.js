// useCreateAccount.js - Expo Go Compatible Version

import { useMutation } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { useContext, useState } from 'react'
import useEnvVars from '../../../environment'
import { LOGIN_MUTATION } from '../../apollo/mutations'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme as Theme } from '../../utils/themeColors'
import { useGoogleAuth } from '../../utils/googleAuth'

const useCreateAccount = () => {
  const navigation = useNavigation()
  const themeContext = useContext(ThemeContext)
  const { GOOGLE_MAPS_KEY, ANDROID_CLIENT_ID_GOOGLE, IOS_CLIENT_ID_GOOGLE } = useEnvVars()
  const [loginButton, loginButtonSetter] = useState(null)
  const currentTheme = Theme[themeContext.ThemeValue]
  
  // Use the Expo Go compatible Google Auth hook
  const { signInWithGoogle, isExpoGo } = useGoogleAuth()

  const [mutateLogin, { loading }] = useMutation(LOGIN_MUTATION)

  const enableApple = true

  const navigateToLogin = () => {
    navigation.navigate('Login')
  }

  const signIn = async () => {
    try {
      loginButtonSetter('Google')
      
      const result = await signInWithGoogle()
      
      const user = {
        email: result.user.email,
        name: result.user.name,
        picture: result.user.photo || '',
        googleId: result.user.id,
        phone: '',
        password: '',
        type: 'google'
      }

      mutateLogin({
        variables: {
          email: user.email,
          password: user.password,
          name: user.name,
          phone: user.phone,
          picture: user.picture,
          googleId: user.googleId,
          type: user.type
        }
      })

    } catch (error) {
      console.error('Google Sign-In Error:', error)
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('User cancelled sign-in')
      } else {
        console.error('Sign-in failed:', error.message)
      }
      
      loginButtonSetter(null)
    }
  }

  return {
    enableApple,
    loginButton,
    loginButtonSetter,
    loading,
    themeContext,
    currentTheme,
    mutateLogin,
    navigateToLogin,
    navigation,
    signIn,
    isExpoGo // Expose this to show a warning in UI if needed
  }
}

export default useCreateAccount
