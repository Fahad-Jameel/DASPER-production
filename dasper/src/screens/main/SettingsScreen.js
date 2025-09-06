import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notifications: {
      disasterAlerts: true,
      assessmentUpdates: true,
      reportNotifications: true,
      maintenanceAlerts: false,
      soundEnabled: true,
      vibrationEnabled: true,
    },
    privacy: {
      shareLocation: true,
      publicAssessments: false,
      analyticsOptIn: true,
    },
    app: {
      autoSave: true,
      highQualityImages: true,
      offlineMode: false,
      advancedFeatures: false,
    },
  });

  const { user } = useAuth();
  const { theme, isDarkTheme, toggleTheme } = useTheme();
  const { updateSettings } = useNotifications();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Update notification settings
      await updateSettings(newSettings.notifications);
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              notifications: {
                disasterAlerts: true,
                assessmentUpdates: true,
                reportNotifications: true,
                maintenanceAlerts: false,
                soundEnabled: true,
                vibrationEnabled: true,
              },
              privacy: {
                shareLocation: true,
                publicAssessments: false,
                analyticsOptIn: true,
              },
              app: {
                autoSave: true,
                highQualityImages: true,
                offlineMode: false,
                advancedFeatures: false,
              },
            };
            saveSettings(defaultSettings);
            Alert.alert('Success', 'Settings have been reset to defaults');
          }
        },
      ]
    );
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderSectionHeader = (title, icon) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
    </View>
  );

  const renderSettingItem = (category, key, title, description, type = 'switch') => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.settingDescription}>
            {description}
          </Text>
        )}
      </View>
      
      <Switch
        value={settings[category][key]}
        onValueChange={(value) => updateSetting(category, key, value)}
        trackColor={{
          false: colors.border,
          true: `${colors.primary}50`
        }}
        thumbColor={settings[category][key] ? colors.primary : colors.surface}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          style={styles.headerContent}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Customize your experience</Text>
          </View>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefaults}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={colors.textLight} />
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={200}
          style={styles.section}
        >
          {renderSectionHeader('Appearance', 'color-palette')}
          
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Dark Mode
                </Text>
                <Text style={styles.settingDescription}>
                  Use dark theme for better viewing in low light
                </Text>
              </View>
              
              <Switch
                value={isDarkTheme}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}50`
                }}
                thumbColor={isDarkTheme ? colors.primary : colors.surface}
              />
            </View>
          </View>
        </Animatable.View>

        {/* Notifications Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={400}
          style={styles.section}
        >
          {renderSectionHeader('Notifications', 'notifications')}
          
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'notifications',
              'disasterAlerts',
              'Disaster Alerts',
              'Receive notifications about natural disasters in your area'
            )}
            
            {renderSettingItem(
              'notifications',
              'assessmentUpdates',
              'Assessment Updates',
              'Get notified when your assessments are processed'
            )}
            
            {renderSettingItem(
              'notifications',
              'reportNotifications',
              'Report Ready',
              'Notification when PDF reports are generated'
            )}
            
            {renderSettingItem(
              'notifications',
              'maintenanceAlerts',
              'Maintenance Alerts',
              'System maintenance and update notifications'
            )}
            
            <View style={styles.divider} />
            
            {renderSettingItem(
              'notifications',
              'soundEnabled',
              'Sound',
              'Play sound for notifications'
            )}
            
            {renderSettingItem(
              'notifications',
              'vibrationEnabled',
              'Vibration',
              'Vibrate device for notifications'
            )}
          </View>
        </Animatable.View>

        {/* Privacy Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={600}
          style={styles.section}
        >
          {renderSectionHeader('Privacy & Security', 'shield-checkmark')}
          
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'privacy',
              'shareLocation',
              'Share Location',
              'Allow app to access your location for better assessments'
            )}
            
            {renderSettingItem(
              'privacy',
              'publicAssessments',
              'Public Assessments by Default',
              'Make your assessments visible to other users'
            )}
            
            {renderSettingItem(
              'privacy',
              'analyticsOptIn',
              'Usage Analytics',
              'Help improve DASPER by sharing anonymous usage data'
            )}
          </View>
        </Animatable.View>

        {/* App Behavior Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.section}
        >
          {renderSectionHeader('App Behavior', 'settings')}
          
          <View style={styles.sectionContent}>
            {renderSettingItem(
              'app',
              'autoSave',
              'Auto-save Assessments',
              'Automatically save assessments as drafts while working'
            )}
            
            {renderSettingItem(
              'app',
              'highQualityImages',
              'High Quality Images',
              'Use higher resolution for better analysis (uses more storage)'
            )}
            
            {renderSettingItem(
              'app',
              'offlineMode',
              'Offline Mode',
              'Cache data for offline use (experimental)'
            )}
            
            {renderSettingItem(
              'app',
              'advancedFeatures',
              'Advanced Features',
              'Enable experimental and beta features'
            )}
          </View>
        </Animatable.View>

        {/* Data & Storage Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.section}
        >
          {renderSectionHeader('Data & Storage', 'folder')}
          
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Info', 'Cache clearing feature coming soon')}
              activeOpacity={0.7}
            >
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                  Clear Cache
                </Text>
                <Text style={styles.actionDescription}>
                  Free up space by clearing temporary files
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Info', 'Storage usage calculation coming soon')}
              activeOpacity={0.7}
            >
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
                  Storage Usage
                </Text>
                <Text style={styles.actionDescription}>
                  View how much space DASPER is using
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {/* About Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={1200}
          style={styles.section}
        >
          {renderSectionHeader('About', 'information-circle')}
          
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutText, { color: theme.colors.text }]}>
              DASPER v1.0.0
            </Text>
            <Text style={styles.aboutSubtext}>
              Disaster Assessment & Structural Performance Evaluation
            </Text>
            <Text style={styles.aboutSubtext}>
              Built with ❤️ for disaster response and recovery
            </Text>
          </View>
        </Animatable.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadowStyles.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body1,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body1,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  aboutContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadowStyles.small,
  },
  aboutText: {
    ...typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  aboutSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

export default SettingsScreen;