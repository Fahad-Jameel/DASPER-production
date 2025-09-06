// src/contexts/NotificationContext.js - Push Notifications System
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  settings: {
    assessmentComplete: true,
    disasterAlerts: true,
    reportReady: true,
    systemUpdates: false,
    vibration: true,
    sound: true,
  },
  loading: false,
  error: null,
};

// Action types
const NOTIFICATION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_PUSH_TOKEN: 'SET_PUSH_TOKEN',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case NOTIFICATION_ACTIONS.SET_NOTIFICATIONS:
      const unreadCount = action.payload.filter(n => !n.read).length;
      return {
        ...state,
        notifications: action.payload,
        unreadCount,
        loading: false,
      };
    
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    
    case NOTIFICATION_ACTIONS.MARK_AS_READ:
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
      };
    
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };
    
    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      const remainingUnreadCount = filteredNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: remainingUnreadCount,
      };
    
    case NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    
    case NOTIFICATION_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case NOTIFICATION_ACTIONS.SET_PUSH_TOKEN:
      return { ...state, pushToken: action.payload };
    
    case NOTIFICATION_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case NOTIFICATION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    initializeNotifications();
    loadStoredNotifications();
    loadNotificationSettings();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Register for push notifications
      await registerForPushNotificationsAsync();

      // Listen for incoming notifications
      const notificationListener = Notifications.addNotificationReceivedListener(
        handleNotificationReceived
      );

      // Listen for notification responses (when user taps notification)
      const responseListener = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    } catch (error) {
      console.error('Notification initialization failed:', error);
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: 'Failed to initialize notifications',
      });
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted for push notifications');
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      dispatch({ type: NOTIFICATION_ACTIONS.SET_PUSH_TOKEN, payload: token });
      
      // Store token for backend registration
      await AsyncStorage.setItem('pushToken', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const handleNotificationReceived = (notification) => {
    const notificationData = {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      type: notification.request.content.data?.type || 'general',
      priority: notification.request.content.data?.priority || 'normal',
    };

    dispatch({
      type: NOTIFICATION_ACTIONS.ADD_NOTIFICATION,
      payload: notificationData,
    });

    // Store notification locally
    storeNotificationLocally(notificationData);
  };

  const handleNotificationResponse = (response) => {
    const notification = response.notification;
    const data = notification.request.content.data;

    // Handle notification tap - navigate to relevant screen
    if (data?.screen) {
      // Navigation logic would go here
      console.log('Navigate to:', data.screen);
    }

    // Mark as read when tapped
    if (data?.notificationId) {
      markAsRead(data.notificationId);
    }
  };

  const loadStoredNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        dispatch({
          type: NOTIFICATION_ACTIONS.SET_NOTIFICATIONS,
          payload: notifications,
        });
      }
    } catch (error) {
      console.error('Failed to load stored notifications:', error);
    }
  };

  const storeNotificationLocally = async (notification) => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      
      const newNotification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      notifications.unshift(newNotification);
      
      // Keep only last 100 notifications
      const limitedNotifications = notifications.slice(0, 100);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('notificationSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        dispatch({
          type: NOTIFICATION_ACTIONS.UPDATE_SETTINGS,
          payload: settings,
        });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...state.settings, ...newSettings };
      
      dispatch({
        type: NOTIFICATION_ACTIONS.UPDATE_SETTINGS,
        payload: newSettings,
      });
      
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      dispatch({
        type: NOTIFICATION_ACTIONS.SET_ERROR,
        payload: 'Failed to update settings',
      });
    }
  };

  const scheduleLocalNotification = async (title, body, data = {}, delay = 0) => {
    try {
      if (!state.settings.assessmentComplete && data.type === 'assessment') return;
      if (!state.settings.disasterAlerts && data.type === 'disaster') return;
      if (!state.settings.reportReady && data.type === 'report') return;
      if (!state.settings.systemUpdates && data.type === 'system') return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: state.settings.sound,
          vibrate: state.settings.vibration ? [0, 250, 250, 250] : [],
        },
        trigger: delay > 0 ? { seconds: delay } : null,
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.MARK_AS_READ,
      payload: notificationId,
    });

    // Update local storage
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to update notification read status:', error);
    }
  };

  const markAllAsRead = async () => {
    dispatch({ type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ });

    // Update local storage
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const updated = notifications.map(n => ({ ...n, read: true }));
        await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    dispatch({
      type: NOTIFICATION_ACTIONS.DELETE_NOTIFICATION,
      payload: notificationId,
    });

    // Update local storage
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        const filtered = notifications.filter(n => n.id !== notificationId);
        await AsyncStorage.setItem('notifications', JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    dispatch({ type: NOTIFICATION_ACTIONS.CLEAR_ALL_NOTIFICATIONS });

    try {
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const sendPushNotification = async (title, body, data = {}) => {
    try {
      // This would typically send to your backend to dispatch push notifications
      await scheduleLocalNotification(title, body, data);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  };

  const value = {
    ...state,
    updateSettings,
    scheduleLocalNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendPushNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;