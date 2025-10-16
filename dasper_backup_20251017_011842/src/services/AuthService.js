import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import ENV from '../../config/env.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || "your-api-key",
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: ENV.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: ENV.FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  // Set authorization header
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : '',
    };
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const token = this.token || await AsyncStorage.getItem('userToken');
      
      const response = await fetch(`${ENV.API_BASE_URL}/api${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async checkAuthStatus() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        
        // Verify token is still valid
        const isValid = await this.verifyToken(token);
        return isValid;
      }

      return false;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }

  // Verify token validity
  async verifyToken(token) {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Login with email and password
  async login(email, password) {
    try {
      console.log(`🌐 AuthService: Attempting login to ${ENV.API_BASE_URL}/api/auth/login`);
      
      const response = await fetch(`${ENV.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log(`📡 AuthService: Response status: ${response.status}`);
      
      const data = await response.json();
      console.log(`📦 AuthService: Response data:`, {
        hasToken: !!data.access_token,
        hasUser: !!data.user,
        message: data.message
      });

      if (!response.ok) {
        console.error(`❌ AuthService: Login failed with status ${response.status}:`, data.error);
        
        // Handle password reset requirement
        if (data.reset_required) {
          throw new Error('PASSWORD_RESET_REQUIRED');
        }
        
        throw new Error(data.error || 'Login failed');
      }

      this.token = data.access_token;
      this.user = data.user;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userToken', data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      console.log('✅ AuthService: Login successful, data stored');
      return data;
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      throw error;
    }
  }

  // Check if server is reachable
  async checkServerConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try main URL
      try {
        const response = await fetch(`${ENV.API_BASE_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response && response.ok) {
          console.log('Main server connected');
          return true;
        }
      } catch (error) {
        console.error('Main URL health check failed:', error);
      }
      
      // Try backup URL if main fails
      if (ENV.API_BACKUP_URL) {
        const backupController = new AbortController();
        const backupTimeoutId = setTimeout(() => backupController.abort(), 5000);
        
        try {
          const backupResponse = await fetch(`${ENV.API_BACKUP_URL}/api/health`, {
            method: 'GET',
            signal: backupController.signal
          });
          
          clearTimeout(backupTimeoutId);
          
          if (backupResponse && backupResponse.ok) {
            console.log('Backup server connected');
            return true;
          }
        } catch (error) {
          console.error('Backup URL health check failed:', error);
        }
      }
      
      console.error('All server health checks failed');
      return false;
    } catch (error) {
      console.error('Server connection check failed:', error);
      return false;
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log(`Attempting to register user at: ${ENV.API_BASE_URL}/api/auth/register`);
      
      let response;
      let error1 = null;
      
      // Try main URL first
      try {
        response = await fetch(`${ENV.API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
      } catch (err) {
        error1 = err;
        console.error('Primary URL failed:', err);
      }
      
      // If main URL fails, try backup URL
      if (!response && ENV.API_BACKUP_URL) {
        console.log(`Trying backup URL: ${ENV.API_BACKUP_URL}/api/auth/register`);
        try {
          response = await fetch(`${ENV.API_BACKUP_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });
        } catch (err) {
          console.error('Backup URL also failed:', err);
          // If both URLs fail, throw the first error
          throw error1 || err;
        }
      }

      if (!response) {
        throw new Error('No response from server. Check backend service.');
      }

      const data = await response.json().catch(error => {
        console.error('Failed to parse response:', error);
        throw new Error('Received invalid response from server');
      });

      if (!response.ok) {
        throw new Error(data.error || `Registration failed with status ${response.status}`);
      }

      this.token = data.access_token;
      this.user = data.user;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userToken', data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // Login with Google
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Send to backend
      return await this.loginWithFirebase(idToken);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Login with Facebook
  async loginWithFacebook() {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Send to backend
      return await this.loginWithFirebase(idToken);
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  // Login with Firebase token
  async loginWithFirebase(firebaseToken) {
    try {
      console.log("Sending Firebase token to backend...");
      
      // Try main URL first
      let response;
      let error1 = null;
      
      try {
        response = await fetch(`${ENV.API_BASE_URL}/api/auth/firebase-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ firebase_token: firebaseToken }),
        });
      } catch (err) {
        error1 = err;
        console.error('Primary URL failed:', err);
      }
      
      // If main URL fails, try backup URL
      if (!response && ENV.API_BACKUP_URL) {
        console.log(`Trying backup URL: ${ENV.API_BACKUP_URL}/api/auth/firebase-login`);
        try {
          response = await fetch(`${ENV.API_BACKUP_URL}/api/auth/firebase-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firebase_token: firebaseToken }),
          });
        } catch (err) {
          console.error('Backup URL also failed:', err);
          // If both URLs fail, throw the first error
          throw error1 || err;
        }
      }

      if (!response) {
        throw new Error('No response from server. Check backend service.');
      }

      const data = await response.json().catch(error => {
        console.error('Failed to parse response:', error);
        throw new Error('Received invalid response from server');
      });

      if (!response.ok) {
        throw new Error(data.error || 'Firebase login failed');
      }

      this.token = data.access_token;
      this.user = data.user;
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userToken', data.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      console.log("Firebase login successful");
      return {
        success: true,
        ...data
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      return {
        success: false,
        error: error.message || 'Firebase login failed'
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Update local user data
      this.user = { ...this.user, ...profileData };

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/profile');
      this.user = data.user;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Sign out from Firebase if authenticated
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Clear local data
      this.token = null;
      this.user = null;
      
      // Clear AsyncStorage data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email, newPassword) {
    try {
      console.log(`Attempting to reset password for: ${email}`);
      
      const response = await fetch(`${ENV.API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          new_password: newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      console.log('Password reset successful');
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      const data = await this.makeAuthenticatedRequest('/auth/delete-account', {
        method: 'DELETE',
      });

      // Clear local data
      this.token = null;
      this.user = null;

      return data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
}

// export const AuthService = new AuthService();
export default new AuthService();