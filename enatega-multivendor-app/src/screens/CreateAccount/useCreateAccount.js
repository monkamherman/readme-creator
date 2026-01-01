import { useMutation } from '@apollo/client'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { useNavigation } from '@react-navigation/native'
import { useContext, useState } from 'react'
import useEnvVars from '../../../environment'
import { LOGIN_MUTATION } from '../../apollo/mutations'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import { theme as Theme } from '../../utils/themeColors'

const useCreateAccount = () => {
  const navigation = useNavigation()
  const themeContext = useContext(ThemeContext)
  const { GOOGLE_MAPS_KEY, ANDROID_CLIENT_ID_GOOGLE, IOS_CLIENT_ID_GOOGLE } = useEnvVars()
  const [loginButton, loginButtonSetter] = useState(null)
  const currentTheme = Theme[themeContext.ThemeValue]

  const [mutateLogin, { loading }] = useMutation(LOGIN_MUTATION)

  const enableApple = true

  const navigateToLogin = () => {
    navigation.navigate('Login')
  }

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()

      const user = {
        email: userInfo.user.email,
        name: userInfo.user.name,
        picture: userInfo.user.photo,
        googleId: userInfo.user.id,
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

      loginButtonSetter('Google')
    } catch (error) {
      console.error('Google Sign-In Error:', error)
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
    signIn
  }
}

export default useCreateAccount
