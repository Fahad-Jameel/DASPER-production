// config/env.js - Updated environment config for full images
const ENV = {
  // Backend API Configuration
  API_BASE_URL: 'http://192.168.18.147:5000', // Local network IP for physical devices
  API_BACKUP_URL: 'http://10.0.2.2:5000', // Android emulator access to localhost
  API_LOCALHOST_URL: 'http://localhost:5000', // Direct localhost access
  API_TIMEOUT: 60000, // ✅ INCREASED TIMEOUT FOR LARGER IMAGES AND SLOW NETWORKS

  // Map Configuration  
  DEFAULT_LATITUDE: 31.5204,
  DEFAULT_LONGITUDE: 74.3587,
  DEFAULT_REGION: 'Pakistan',

  // Image Configuration - OPTIMIZED FOR FULL IMAGES
  DEBUG_MODE: true,
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
  
  // Optional: Google Maps API Key for enhanced tile loading (get free key from console.cloud.google.com)
  // Uncomment and add your API key if you want better map tiles:
  // GOOGLE_MAPS_API_KEY: "YOUR_API_KEY_HERE",
  
  // Firebase Configuration
  FIREBASE_API_KEY: "AIzaSyCCq3ks4sKUwjpJMuiKBUfB0585LKYn6AE",
  FIREBASE_AUTH_DOMAIN: "dasper-mobile.firebaseapp.com",
  FIREBASE_PROJECT_ID: "dasper-mobile",
  FIREBASE_STORAGE_BUCKET: "dasper-mobile.firebasestorage.app",
  FIREBASE_MESSAGING_SENDER_ID: "1004273760155",
  FIREBASE_APP_ID: "1:1004273760155:web:c077e68f110c0df7a5133e",
};

export default ENV;