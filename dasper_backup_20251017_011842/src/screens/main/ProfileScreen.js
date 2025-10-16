import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';

// Services
import DashboardService from '../../services/DashboardService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    disasterAlerts: true,
    assessmentUpdates: true,
    reportNotifications: true,
    maintenanceAlerts: false,
  });

  const { user, logout, updateProfile } = useAuth();
  const { theme, isDarkTheme, toggleTheme } = useTheme();

  const menuItems = [
    {
      section: 'Account',
      items: [
        { key: 'edit_profile', title: 'Edit Profile', icon: 'person-outline', action: () => handleEditProfile() },
        { key: 'change_password', title: 'Change Password', icon: 'lock-closed-outline', action: () => handleChangePassword() },
        { key: 'notifications', title: 'Notifications', icon: 'notifications-outline', action: () => handleNotifications() },
        { key: 'privacy', title: 'Privacy Settings', icon: 'shield-outline', action: () => handlePrivacy() },
      ]
    },
    {
      section: 'App',
      items: [
        { key: 'theme', title: 'Dark Mode', icon: 'moon-outline', type: 'switch', value: isDarkTheme, action: toggleTheme },
        { key: 'language', title: 'Language', icon: 'language-outline', subtitle: 'English', action: () => handleLanguage() },
        { key: 'about', title: 'About DASPER', icon: 'information-circle-outline', action: () => handleAbout() },
        { key: 'help', title: 'Help & Support', icon: 'help-circle-outline', action: () => handleHelp() },
      ]
    },
    {
      section: 'Data',
      items: [
        { key: 'export', title: 'Export Data', icon: 'download-outline', action: () => handleExportData() },
        { key: 'backup', title: 'Backup Settings', icon: 'cloud-upload-outline', action: () => handleBackup() },
        { key: 'storage', title: 'Storage Usage', icon: 'folder-outline', subtitle: 'Calculate...', action: () => handleStorage() },
      ]
    },
    {
      section: 'Account Actions',
      items: [
        { key: 'logout', title: 'Sign Out', icon: 'log-out-outline', action: () => handleLogout(), danger: true },
        { key: 'delete', title: 'Delete Account', icon: 'trash-outline', action: () => handleDeleteAccount(), danger: true },
      ]
    }
  ];

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await DashboardService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Load user stats error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileImageChange = async () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Gallery', onPress: () => pickImage('gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const updatedProfile = await updateProfile({
          profile_picture: result.assets[0].uri
        });
        
        if (updatedProfile.success) {
          Alert.alert('Success', 'Profile picture updated successfully');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handlePrivacy = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Multiple language support coming soon!');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'This will create a file with all your assessment data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: exportUserData },
      ]
    );
  };

  const exportUserData = async () => {
    try {
      const data = await DashboardService.exportUserData();
      Alert.alert(
        'Export Complete',
        'Your data has been prepared for export. Check your downloads folder.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleBackup = () => {
    Alert.alert('Backup', 'Cloud backup feature coming soon!');
  };

  const handleStorage = () => {
    Alert.alert('Storage', 'Storage usage calculation coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          onPress: confirmDeleteAccount, 
          style: 'destructive' 
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Type "DELETE" to confirm account deletion',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I understand', 
          onPress: () => Alert.alert('Info', 'Account deletion feature will be implemented'), 
          style: 'destructive' 
        },
      ]
    );
  };

  const renderMenuItem = (item, index) => {
    const isSwitch = item.type === 'switch';
    
    return (
      <Animatable.View
        key={item.key}
        animation="fadeInRight"
        delay={index * 50}
        duration={500}
      >
        <TouchableOpacity
          style={[
            styles.menuItem,
            item.danger && styles.dangerItem,
            isSwitch && styles.switchItem
          ]}
          onPress={isSwitch ? undefined : item.action}
          activeOpacity={isSwitch ? 1 : 0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[
              styles.menuItemIcon,
              item.danger && styles.dangerIcon
            ]}>
              <Ionicons
                name={item.icon}
                size={22}
                color={item.danger ? colors.error : colors.primary}
              />
            </View>
            <View style={styles.menuItemText}>
              <Text style={[
                styles.menuItemTitle,
                item.danger && styles.dangerText,
                { color: theme.colors.text }
              ]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles.menuItemSubtitle}>
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.menuItemRight}>
            {isSwitch ? (
              <Switch
                value={item.value}
                onValueChange={item.action}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}50`
                }}
                thumbColor={item.value ? colors.primary : colors.surface}
              />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleProfileImageChange}
              activeOpacity={0.8}
            >
              {user?.profile_picture ? (
                <Image
                  source={{ uri: user.profile_picture }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textLight} />
                </View>
              )}
              <View style={styles.profileImageEdit}>
                <Ionicons name="camera" size={16} color={colors.textLight} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.full_name || 'User Name'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'user@example.com'}
              </Text>
              {user?.organization && (
                <Text style={styles.profileOrganization}>
                  {user.organization}
                </Text>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          {userStats && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userStats.user_assessments || 0}
                </Text>
                <Text style={styles.statLabel}>Assessments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userStats.reports_count || 0}
                </Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${((userStats.total_estimated_cost || 0) / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.statLabel}>Total Cost</Text>
              </View>
            </View>
          )}
        </Animatable.View>
      </LinearGradient>

      {/* Menu */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((section, sectionIndex) => (
          <Animatable.View
            key={section.section}
            animation="fadeInUp"
            delay={sectionIndex * 200}
            duration={500}
            style={styles.menuSection}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {section.section}
            </Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => renderMenuItem(item, itemIndex))}
            </View>
          </Animatable.View>
        ))}

        {/* App Version */}
        <Animatable.View
          animation="fadeIn"
          delay={1000}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>
            DASPER v1.0.0
          </Text>
          <Text style={styles.versionSubtext}>
            Disaster Assessment & Structural Performance Evaluation
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  header: {
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    ...typography.h4,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  profileOrganization: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h5,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menuSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h6,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadowStyles.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  switchItem: {
    paddingVertical: spacing.lg,
  },
  dangerItem: {
    backgroundColor: `${colors.error}05`,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dangerIcon: {
    backgroundColor: `${colors.error}15`,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    ...typography.body1,
    fontWeight: '500',
    marginBottom: 2,
  },
  dangerText: {
    color: colors.error,
  },
  menuItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuItemRight: {
    marginLeft: spacing.md,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  versionText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  versionSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen;