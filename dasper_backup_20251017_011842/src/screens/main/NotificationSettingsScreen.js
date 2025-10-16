import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    assessmentUpdates: true,
    disasterAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textLight} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            Manage your notification preferences
          </Text>
        </Animatable.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View
          animation="fadeInUp"
          delay={400}
          style={styles.contentContainer}
        >
          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Notification Types
            </Text>

            {/* Push Notifications */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive notifications on your device</Text>
                </View>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => handleToggle('pushNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textLight}
              />
            </View>

            {/* Email Notifications */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>Receive notifications via email</Text>
                </View>
              </View>
              <Switch
                value={settings.emailNotifications}
                onValueChange={() => handleToggle('emailNotifications')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Assessment Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Assessment Updates
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Assessment Results</Text>
                  <Text style={styles.settingDescription}>Get notified when your assessment is complete</Text>
                </View>
              </View>
              <Switch
                value={settings.assessmentUpdates}
                onValueChange={() => handleToggle('assessmentUpdates')}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Disaster Alerts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Disaster Alerts
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="warning-outline" size={24} color={colors.warning} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Disaster Alerts</Text>
                  <Text style={styles.settingDescription}>Receive alerts about disasters in your area</Text>
                </View>
              </View>
              <Switch
                value={settings.disasterAlerts}
                onValueChange={() => handleToggle('disasterAlerts')}
                trackColor={{ false: colors.border, true: colors.warning }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Reports */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Reports & Analytics
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics-outline" size={24} color={colors.info} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Weekly Reports</Text>
                  <Text style={styles.settingDescription}>Receive weekly assessment summaries</Text>
                </View>
              </View>
              <Switch
                value={settings.weeklyReports}
                onValueChange={() => handleToggle('weeklyReports')}
                trackColor={{ false: colors.border, true: colors.info }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Marketing */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Marketing & Updates
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="megaphone-outline" size={24} color={colors.secondary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Marketing Emails</Text>
                  <Text style={styles.settingDescription}>Receive updates about new features and services</Text>
                </View>
              </View>
              <Switch
                value={settings.marketingEmails}
                onValueChange={() => handleToggle('marketingEmails')}
                trackColor={{ false: colors.border, true: colors.secondary }}
                thumbColor={colors.textLight}
              />
            </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadowStyles.large,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textLight,
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSubtitle: {
    ...typography.subtitle,
    color: colors.textLight,
    opacity: 0.9,
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  contentContainer: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadowStyles.medium,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    fontSize: 20,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default NotificationSettingsScreen; 