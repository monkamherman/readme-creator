/**
 * OTP Input Component
 * 
 * Custom OTP input that works in both Expo Go and development builds.
 * Falls back to a custom implementation when the native module is unavailable.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native'
import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'

// Custom OTP Input for Expo Go
const CustomOTPInput = ({
  pinCount = 6,
  code = '',
  onCodeChanged,
  onCodeFilled,
  autoFocusOnLoad = true,
  codeInputFieldStyle,
  codeInputHighlightStyle,
  secureTextEntry = false,
  editable = true,
  keyboardType = 'number-pad',
  placeholderCharacter = '',
  placeholderTextColor = '#A4A4A4',
}) => {
  const [otp, setOtp] = useState(code.split(''))
  const inputRefs = useRef([])

  useEffect(() => {
    if (code) {
      setOtp(code.split(''))
    }
  }, [code])

  useEffect(() => {
    if (autoFocusOnLoad && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [autoFocusOnLoad])

  const handleChange = (text, index) => {
    const newOtp = [...otp]
    
    // Handle paste
    if (text.length > 1) {
      const pastedCode = text.slice(0, pinCount).split('')
      for (let i = 0; i < pastedCode.length; i++) {
        newOtp[i] = pastedCode[i]
      }
      setOtp(newOtp)
      const fullCode = newOtp.join('')
      onCodeChanged?.(fullCode)
      if (fullCode.length === pinCount) {
        onCodeFilled?.(fullCode)
        Keyboard.dismiss()
      }
      return
    }

    newOtp[index] = text
    setOtp(newOtp)

    const fullCode = newOtp.join('')
    onCodeChanged?.(fullCode)

    if (text && index < pinCount - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    if (fullCode.length === pinCount && !fullCode.includes('')) {
      onCodeFilled?.(fullCode)
      Keyboard.dismiss()
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleFocus = (index) => {
    // Select the input on focus
  }

  return (
    <View style={styles.container}>
      {Array(pinCount)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              codeInputFieldStyle,
              otp[index] ? codeInputHighlightStyle : null,
            ]}
            value={otp[index] || ''}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            keyboardType={keyboardType}
            maxLength={index === 0 ? pinCount : 1}
            secureTextEntry={secureTextEntry}
            editable={editable}
            placeholder={placeholderCharacter}
            placeholderTextColor={placeholderTextColor}
            selectTextOnFocus
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
          />
        ))}
    </View>
  )
}

// Wrapper component that uses native OTP input when available
const OTPInput = (props) => {
  if (isExpoGo) {
    return <CustomOTPInput {...props} />
  }

  try {
    const OTPInputView = require('@twotalltotems/react-native-otp-input').default
    return <OTPInputView {...props} />
  } catch (error) {
    console.warn('Native OTP input unavailable, using custom implementation')
    return <CustomOTPInput {...props} />
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#FAFAFA',
    color: '#000',
  },
})

export default OTPInput
