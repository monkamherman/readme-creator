const { getDefaultConfig } = require('@expo/metro-config')
const defaultConfig = getDefaultConfig(__dirname)

// Configuration pour gérer les modules natifs sur web
defaultConfig.resolver = {
  ...defaultConfig.resolver,
  alias: {
    'react-native-maps': 'react-native-web-maps'
  },
  platformExtensions: ['ios', 'android', 'native', 'web'],
  sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs']
}

// Ignorer les modules natifs sur web
defaultConfig.transformer = {
  ...defaultConfig.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true
    }
  })
}

defaultConfig.resolver.sourceExts.push('cjs')
module.exports = defaultConfig
