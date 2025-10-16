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

const PrivacySettingsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  
  const [settings, setSettings] = useState({
    publicProfile: false,
    shareAssessments: true,
    locationSharing: false,
    analyticsSharing: true,
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
          
          <Text style={styles.headerTitle}>Privacy</Text>
          <Text style={styles.headerSubtitle}>
            Manage your privacy settings
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
          {/* Profile Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Profile Privacy
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="person-outline" size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Public Profile</Text>
                  <Text style={styles.settingDescription}>Allow others to view your profile</Text>
                </View>
              </View>
              <Switch
                value={settings.publicProfile}
                onValueChange={() => handleToggle('publicProfile')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Assessment Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Assessment Privacy
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text-outline" size={24} color={colors.success} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Share Assessments</Text>
                  <Text style={styles.settingDescription}>Allow your assessments to be viewed publicly</Text>
                </View>
              </View>
              <Switch
                value={settings.shareAssessments}
                onValueChange={() => handleToggle('shareAssessments')}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Location Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Location Privacy
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="location-outline" size={24} color={colors.warning} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Location Sharing</Text>
                  <Text style={styles.settingDescription}>Share your location in assessments</Text>
                </View>
              </View>
              <Switch
                value={settings.locationSharing}
                onValueChange={() => handleToggle('locationSharing')}
                trackColor={{ false: colors.border, true: colors.warning }}
                thumbColor={colors.textLight}
              />
            </View>
          </View>

          {/* Analytics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Analytics & Data
            </Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="analytics-outline" size={24} color={colors.info} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Analytics Sharing</Text>
                  <Text style={styles.settingDescription}>Help improve the app with anonymous data</Text>
                </View>
              </View>
              <Switch
                value={settings.analyticsSharing}
                onValueChange={() => handleToggle('analyticsSharing')}
                trackColor={{ false: colors.border, true: colors.info }}
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

export default PrivacySettingsScreen; 