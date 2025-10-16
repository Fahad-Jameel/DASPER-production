import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const AboutScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const openLink = (url) => {
    Linking.openURL(url);
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
          
          <Text style={styles.headerTitle}>About</Text>
          <Text style={styles.headerSubtitle}>
            Learn more about Dasper
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
          {/* App Info */}
          <View style={styles.section}>
            <View style={styles.appLogo}>
              <Ionicons name="shield-checkmark" size={80} color={colors.primary} />
            </View>
            
            <Text style={[styles.appName, { color: theme.colors.text }]}>
              Dasper
            </Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              AI-powered building damage assessment platform for disaster response and recovery.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Key Features
            </Text>

            <View style={styles.featureItem}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>AI Damage Detection</Text>
                <Text style={styles.featureDescription}>
                  Advanced computer vision to analyze building damage from photos
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={24} color={colors.success} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Cost Estimation</Text>
                <Text style={styles.featureDescription}>
                  Automated repair cost calculations based on damage severity
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="location-outline" size={24} color={colors.warning} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Location Tracking</Text>
                <Text style={styles.featureDescription}>
                  Geographic mapping and regional cost analysis
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="document-text-outline" size={24} color={colors.info} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Detailed Reports</Text>
                <Text style={styles.featureDescription}>
                  Comprehensive assessment reports with recommendations
                </Text>
              </View>
            </View>
          </View>

          {/* Team */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Development Team
            </Text>
            
            <Text style={styles.teamDescription}>
              Dasper is developed by a team of engineers and researchers focused on 
              leveraging AI technology for disaster response and building safety.
            </Text>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Contact & Support
            </Text>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink('mailto:support@dasper.com')}
              activeOpacity={0.7}
            >
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
              <View style={styles.contactText}>
                <Text style={styles.contactTitle}>Email Support</Text>
                <Text style={styles.contactDescription}>support@dasper.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink('https://dasper.com')}
              activeOpacity={0.7}
            >
              <Ionicons name="globe-outline" size={24} color={colors.success} />
              <View style={styles.contactText}>
                <Text style={styles.contactTitle}>Website</Text>
                <Text style={styles.contactDescription}>www.dasper.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Legal
            </Text>

            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => openLink('https://dasper.com/privacy')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.legalItem}
              onPress={() => openLink('https://dasper.com/terms')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
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
  appLogo: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  appVersion: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: 16,
  },
  appDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 16,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    fontSize: 20,
    fontWeight: '600',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  featureText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  featureTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  teamDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  contactTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  contactDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 14,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legalText: {
    ...typography.body,
    color: colors.text,
    fontSize: 16,
  },
});

export default AboutScreen; 