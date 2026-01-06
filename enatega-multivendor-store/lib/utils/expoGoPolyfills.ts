/**
 * Expo Go Polyfills
 * 
 * This file provides fallbacks for native modules that don't work in Expo Go.
 */

import Constants from 'expo-constants';

// Check if running in Expo Go
export const isExpoGo = Constants.appOwnership === 'expo';

// Safe import helper
export const safeRequire = <T>(moduleName: string, fallback: T): T => {
  try {
    if (isExpoGo) {
      console.log(`ℹ️ Using fallback for ${moduleName} in Expo Go`);
      return fallback;
    }
    return require(moduleName);
  } catch (error) {
    console.warn(`⚠️ Failed to load ${moduleName}, using fallback`);
    return fallback;
  }
};

// Thermal Printer Fallback (for store app)
export const ThermalPrinterPolyfill = {
  printBluetooth: async (options: any) => {
    if (isExpoGo) {
      console.log('ℹ️ Thermal printing not available in Expo Go');
      console.log('📄 Would print:', options);
      return { success: false, message: 'Not available in Expo Go' };
    }
  },
  printNet: async (options: any) => {
    if (isExpoGo) {
      console.log('ℹ️ Network printing not available in Expo Go');
      return { success: false, message: 'Not available in Expo Go' };
    }
  },
  getBluetoothDeviceList: async () => {
    if (isExpoGo) {
      console.log('ℹ️ Bluetooth device list not available in Expo Go');
      return [];
    }
  },
};

export default {
  isExpoGo,
  safeRequire,
  ThermalPrinterPolyfill,
};
