import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AssessmentScreen from '../screens/main/AssessmentScreen';
import DisasterAlertsScreen from '../screens/main/DisasterAlertsScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CameraScreen from '../screens/main/CameraScreen';
import ResultsScreen from '../screens/main/ResultsScreen';
import ReportDetailScreen from '../screens/main/ReportDetailScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import PublicReportsScreen from '../screens/main/PublicReportsScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import PrivacySettingsScreen from '../screens/main/PrivacySettingsScreen';
import AboutScreen from '../screens/main/AboutScreen';

import { colors, typography, spacing } from '../theme/theme';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom tab bar icon component
const TabIcon = ({ name, focused, color, size }) => {
  return (
    <Animatable.View
      animation={focused ? 'bounceIn' : undefined}
      duration={300}
      style={[
        styles.tabIconContainer,
        focused && styles.tabIconFocused
      ]}
    >
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={size}
        color={color}
      />
      {focused && <View style={styles.tabIndicator} />}
    </Animatable.View>
  );
};

// Assessment Stack
const AssessmentStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="AssessmentMain" component={AssessmentScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
};

// Reports Stack
const ReportsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ReportsMain" component={ReportsScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="PublicReports" component={PublicReportsScreen} />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          }
        ],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Assessment':
              iconName = 'scan';
              break;
            case 'Alerts':
              iconName = 'alert';
              break;
            case 'Reports':
              iconName = 'document-text';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <TabIcon
              name={iconName}
              focused={focused}
              color={color}
              size={size}
            />
          );
        },
        tabBarButton: (props) => {
          return (
            <TouchableOpacity
              {...props}
              style={[styles.tabButton, props.style]}
              activeOpacity={0.7}
            >
              <Animatable.View
                animation={props.accessibilityState?.selected ? 'pulse' : undefined}
                duration={200}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                {props.children}
              </Animatable.View>
            </TouchableOpacity>
          );
        },
      })}
      initialRouteName="Dashboard"
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarBadge: undefined,
        }}
      />
      
      <Tab.Screen
        name="Assessment"
        component={AssessmentStack}
        options={{
          tabBarLabel: 'Assess',
          tabBarBadge: undefined,
        }}
      />
      
      <Tab.Screen
        name="Alerts"
        component={DisasterAlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: undefined, // Can be dynamically set based on unread alerts
        }}
      />
      
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{
          tabBarLabel: 'Reports',
          tabBarBadge: undefined,
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarBadge: undefined,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 2,
  },
  tabIconFocused: {
    backgroundColor: `${colors.primary}15`,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
});

export default MainNavigator;