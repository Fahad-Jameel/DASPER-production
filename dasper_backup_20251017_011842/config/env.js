// config/env.js - Environment-based configuration
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to get the current backend URL
const getBackendUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('backend_url');
    if (savedUrl) {
      return savedUrl;
    }
  } catch (error) {
    console.error('Error loading saved backend URL:', error);
  }
  
  // Fallback to environment variables or defaults
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.17.49.38:5000';
};

const ENV = {
  // Backend API Configuration - Dynamic URL loading
  // ✅ DEPLOYED: Your DASPER backend is running on local network!
  get API_BASE_URL() {
    // This will be set dynamically when the app loads
    return this._currentBackendUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://172.17.49.38:5000';
  },
  set API_BASE_URL(url) {
    this._currentBackendUrl = url;
  },
  API_BACKUP_URL: process.env.EXPO_PUBLIC_API_BACKUP_URL || 'http://127.0.0.1:5000', // Android emulator
  API_LOCALHOST_URL: process.env.EXPO_PUBLIC_API_LOCALHOST_URL || 'http://172.17.49.38:5000', // Localhost
  
  // 📝 Production deployment examples:
  // API_BASE_URL: 'https://your-app.herokuapp.com',           // Heroku
  // API_BASE_URL: 'https://your-project.up.railway.app',     // Railway
  // API_BASE_URL: 'http://your-server-ip:5000',              // Self-hosted
  API_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 60000, // Timeout in milliseconds

  // Map Configuration  
  DEFAULT_LATITUDE: 31.5204,
  DEFAULT_LONGITUDE: 74.3587,
  DEFAULT_REGION: 'Pakistan',

  // Image Configuration - OPTIMIZED FOR FULL IMAGES
  IMAGE_QUALITY: 0.8,           // Good quality for analysis
  MAX_IMAGE_SIZE: 10485760,     // ✅ INCREASED TO 10MB for full resolution images
  SUPPORTED_FORMATS: 'jpg,jpeg,png',

  // Location Configuration
  LOCATION_TIMEOUT: 10000,
  LOCATION_ACCURACY: 'high',

  // Image Processing Notes
  CROP_IMAGES: false,           // ✅ FLAG TO INDICATE NO CROPPING
  PRESERVE_ASPECT_RATIO: true,  // ✅ MAINTAIN ORIGINAL PROPORTIONS
  
  // Maps Configuration - Using Native Maps (Free, No API Key Required)
  USE_NATIVE_MAPS: true, // Uses Apple Maps on iOS, Google Maps on Android
  
  // Firebase Configuration - Use environment variables or defaults
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCCq3ks4sKUwjpJMuiKBUfB0585LKYn6AE",
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "dasper-mobile.firebaseapp.com",
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dasper-mobile",
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "dasper-mobile.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1004273760155",
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1004273760155:web:c077e68f110c0df7a5133e",

  // Optional: Google Maps API Key
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  
  // Debug Configuration
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' || __DEV__,
};

// Initialize the backend URL on app start
const initializeBackendUrl = async () => {
  try {
    const url = await getBackendUrl();
    ENV.API_BASE_URL = url;
    console.log('Backend URL initialized:', url);
  } catch (error) {
    console.error('Error initializing backend URL:', error);
  }
};

export default ENV;
export { initializeBackendUrl };