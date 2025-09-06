import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationServiceClass {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize notification service
  async initialize() {
    try {
      // Request permissions
      await this.requestPermissions();
      
      // Get push token
      await this.getPushToken();
      
      // Set up listeners
      this.setupListeners();
      
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('NotificationService initialization failed:', error);
    }
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('Push notification permissions not granted');
          return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'DASPER Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1a237e',
            sound: 'default',
          });
        }

        return true;
      } else {
        console.warn('Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Get Expo push token
  async getPushToken() {
    try {
      if (Device.isDevice) {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        this.expoPushToken = token;
        
        // Store token locally
        await AsyncStorage.setItem('expoPushToken', token);
        
        console.log('Expo push token:', token);
        return token;
      }
    } catch (error) {
      console.error('Get push token error:', error);
      return null;
    }
  }

  // Set up notification listeners
  setupListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );

    // Listener for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );
  }

  // Handle notification received while app is active
  handleNotificationReceived(notification) {
    console.log('Notification received:', notification);
    
    // You can add custom logic here for foreground notifications
    // For example, show an in-app alert or update the UI
  }

  // Handle user interaction with notification
  handleNotificationResponse(response) {
    console.log('Notification response:', response);
    
    const { notification } = response;
    const data = notification.request.content.data;
    
    // Handle different notification types
    if (data?.type === 'disaster_alert') {
      // Navigate to disaster alerts screen
      // You would need to pass navigation reference or use a global navigator
      this.handleDisasterAlert(data);
    } else if (data?.type === 'assessment_complete') {
      // Navigate to assessment results
      this.handleAssessmentComplete(data);
    }
  }

  // Handle disaster alert notification
  handleDisasterAlert(data) {
    // This would typically navigate to the alerts screen
    console.log('Handling disaster alert:', data);
  }

  // Handle assessment complete notification
  handleAssessmentComplete(data) {
    // This would typically navigate to the results screen
    console.log('Handling assessment complete:', data);
  }

  // Schedule local notification
  async scheduleLocalNotification(title, body, data = {}, delay = 0) {
    try {
      const trigger = delay > 0 ? { seconds: delay } : null;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidImportance.HIGH,
        },
        trigger,
      });
      
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  }

  // Send push notification (would typically be called from backend)
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
      return result;
    } catch (error) {
      console.error('Send push notification error:', error);
      throw error;
    }
  }

  // Create notification for disaster alert
  async notifyDisasterAlert(alert) {
    const title = `🚨 ${alert.severity?.toUpperCase()} Alert: ${alert.type}`;
    const body = `${alert.title}\nLocation: ${alert.location || 'Unknown'}`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'disaster_alert',
      alertId: alert._id,
      alertType: alert.type,
      severity: alert.severity,
    });
  }

  // Create notification for assessment completion
  async notifyAssessmentComplete(assessment) {
    const title = '✅ Assessment Complete';
    const body = `Building: ${assessment.building_name}\nSeverity: ${assessment.severity_category}`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'assessment_complete',
      assessmentId: assessment._id,
      buildingName: assessment.building_name,
    });
  }

  // Create notification for report generation
  async notifyReportReady(reportData) {
    const title = '📄 Report Ready';
    const body = `Your assessment report for ${reportData.building_name} is ready to download.`;
    
    await this.scheduleLocalNotification(title, body, {
      type: 'report_ready',
      reportId: reportData.report_id,
      assessmentId: reportData.assessment_id,
    });
  }

  // Get notification settings
  async getSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : {
        disasterAlerts: true,
        assessmentUpdates: true,
        reportNotifications: true,
        maintenanceAlerts: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
    } catch (error) {
      console.error('Get notification settings error:', error);
      return {};
    }
  }

  // Update notification settings
  async updateSettings(settings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log('Notification settings updated');
    } catch (error) {
      console.error('Update notification settings error:', error);
    }
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Cancel notifications error:', error);
    }
  }

  // Cancel specific notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Get badge count error:', error);
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('Badge count set to:', count);
    } catch (error) {
      console.error('Set badge count error:', error);
    }
  }

  // Clear badge
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('Badge cleared');
    } catch (error) {
      console.error('Clear badge error:', error);
    }
  }

  // Test notification (for development)
  async testNotification() {
    await this.scheduleLocalNotification(
      'DASPER Test',
      'This is a test notification from DASPER app.',
      { type: 'test' },
      2 // 2 seconds delay
    );
  }

  // Clean up listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

const notificationServiceInstance = new NotificationServiceClass();
export const NotificationService = notificationServiceInstance;
export default notificationServiceInstance;