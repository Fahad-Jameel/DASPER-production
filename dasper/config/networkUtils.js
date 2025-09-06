// networkUtils.js - Dynamic network configuration
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './env';

class NetworkUtils {
  static async detectBackendURL() {
    const possibleURLs = [
      ENV.API_BASE_URL,           // Primary configured URL
      ENV.API_BACKUP_URL,         // Backup URL for emulators
      ENV.API_LOCALHOST_URL,      // Direct localhost
      'http://192.168.18.147:5000', // Current working IP
      'http://192.168.18.29:5000',  // Previous IP
      'http://192.168.1.100:5000',  // Common router range
      'http://192.168.0.100:5000',  // Alternative range
    ];

    console.log('🔍 Detecting backend URL...');

    for (const url of possibleURLs) {
      try {
        console.log(`Testing: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${url}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') {
            console.log(`✅ Backend found at: ${url}`);
            return url;
          }
        }
      } catch (error) {
        console.log(`❌ ${url} - ${error.message}`);
      }
    }

    console.error('❌ No backend server found');
    return ENV.API_BASE_URL; // Fallback to configured URL
  }

  static async getOptimalBackendURL() {
    const detectedURL = await this.detectBackendURL();
    
    // Cache the working URL for future use
    try {
      await AsyncStorage.setItem('lastWorkingBackendURL', detectedURL);
    } catch (error) {
      console.warn('Failed to cache backend URL:', error);
    }
    
    return detectedURL;
  }

  static async getCachedBackendURL() {
    try {
      const cachedURL = await AsyncStorage.getItem('lastWorkingBackendURL');
      if (cachedURL) {
        // Verify cached URL still works
        const response = await fetch(`${cachedURL}/api/health`, { 
          method: 'GET',
          timeout: 3000 
        });
        
        if (response.ok) {
          console.log(`✅ Using cached backend URL: ${cachedURL}`);
          return cachedURL;
        }
      }
    } catch (error) {
      console.warn('Cached URL not working, detecting new one...');
    }
    
    return await this.getOptimalBackendURL();
  }
}

export default NetworkUtils;
