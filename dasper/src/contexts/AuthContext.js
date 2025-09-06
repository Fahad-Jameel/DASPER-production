import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_TOKEN: 'RESTORE_TOKEN',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.RESTORE_TOKEN:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authentication state on app start
  useEffect(() => {
    restoreAuthState();
  }, []);

  const restoreAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        const user = JSON.parse(userData);
        
        // Verify token is still valid
        const isValid = await AuthService.verifyToken(token);
        
        if (isValid) {
          dispatch({
            type: AUTH_ACTIONS.RESTORE_TOKEN,
            payload: { user, token },
          });
        } else {
          // Token expired, clear storage
          await AsyncStorage.multiRemove(['userToken', 'userData']);
        }
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
    }
  };

  const login = async (email, password) => {
    console.log('🔐 AuthContext: Starting login process...');
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log('📞 AuthContext: Calling AuthService.login...');
      const response = await AuthService.login(email, password);
      console.log('✅ AuthContext: Login response received:', { 
        hasToken: !!response.access_token, 
        hasUser: !!response.user 
      });
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', response.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));

      console.log('🎯 AuthContext: Dispatching LOGIN_SUCCESS...');
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });

      console.log('🎉 AuthContext: Login successful, authentication state updated');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error.message);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Login failed',
      });
      return { success: false, error: error.message };
    }
  };

  const loginWithFirebase = async (firebaseToken) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await AuthService.loginWithFirebase(firebaseToken);
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', response.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Firebase login failed',
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await AuthService.register(userData);
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', response.access_token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.user,
          token: response.access_token,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message || 'Registration failed',
      });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      // Call logout service if needed
      await AuthService.logout();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if service call fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await AuthService.updateProfile(profileData);
      
      // Update stored user data
      const updatedUser = { ...state.user, ...profileData };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: profileData,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    loginWithFirebase,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;