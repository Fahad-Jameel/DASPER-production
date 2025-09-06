import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard.js';
import RecentAssessmentCard from '../../components/RecentAssessmentCard';
import AlertCard from '../../components/AlertCard';

// Services
import DashboardService from '../../services/DashboardService';
import NotificationService from '../../services/NotificationService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  const { user } = useAuth();
  const { theme } = useTheme();
  const animationRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    setGreetingMessage();
    
    // Request notification permissions
    NotificationService.requestPermissions();
    
    // Set up periodic data refresh
    const interval = setInterval(loadDashboardData, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  };

  const loadDashboardData = async () => {
    try {
      const [userStats, globalStats, alerts] = await Promise.all([
        DashboardService.getUserStats(),
        DashboardService.getGlobalStats(),
        DashboardService.getRecentAlerts(),
      ]);

      setDashboardData(userStats);
      setGlobalData(globalStats);
      setRecentAlerts(alerts.slice(0, 3)); // Show only 3 recent alerts
      
    } catch (error) {
      console.error('Dashboard data load error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const navigateToAssessment = () => {
    navigation.navigate('Assessment');
  };

  const navigateToAlerts = () => {
    navigation.navigate('Alerts');
  };

  const navigateToReports = () => {
    navigation.navigate('Reports');
  };

  const navigateToProfile = () => {
    navigation.navigate('Profile');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header Section */}
      <LinearGradient
        colors={colors.primaryGradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.headerContent}
        >
          <View style={styles.userInfo}>
            <View style={styles.userDetails}>
              <Text style={styles.greetingText}>{greeting},</Text>
              <Text style={styles.userName}>
                {user?.full_name?.split(' ')[0] || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={navigateToProfile}
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerStats}>
            <Animatable.View
              animation="bounceIn"
              delay={500}
              style={styles.headerStatItem}
            >
              <Text style={styles.headerStatValue}>
                {dashboardData?.user_assessments || 0}
              </Text>
              <Text style={styles.headerStatLabel}>Assessments</Text>
            </Animatable.View>
            
            <Animatable.View
              animation="bounceIn"
              delay={700}
              style={styles.headerStatItem}
            >
              <Text style={styles.headerStatValue}>
                {dashboardData?.average_severity 
                  ? `${(dashboardData.average_severity * 100).toFixed(0)}%`
                  : '0%'
                }
              </Text>
              <Text style={styles.headerStatLabel}>Avg. Damage</Text>
            </Animatable.View>
            
            <Animatable.View
              animation="bounceIn"
              delay={900}
              style={styles.headerStatItem}
            >
              <Text style={styles.headerStatValue}>
                ${dashboardData?.total_estimated_cost 
                  ? (dashboardData.total_estimated_cost / 1000).toFixed(0) + 'K'
                  : '0'
                }
              </Text>
              <Text style={styles.headerStatLabel}>Total Cost</Text>
            </Animatable.View>
          </View>
        </Animatable.View>

        {/* Quick Actions */}
        <Animatable.View
          animation="fadeInUp"
          delay={1100}
          style={styles.quickActions}
        >
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={navigateToAssessment}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.secondaryGradient}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="scan" size={24} color={colors.textLight} />
              <Text style={styles.quickActionText}>New Assessment</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Statistics Cards */}
        <Animatable.View
          animation="fadeInUp"
          delay={1300}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Assessments"
              value={dashboardData?.user_assessments || 0}
              icon="document-text"
              color={colors.primary}
              trend={"+12%"}
              trendDirection="up"
            />
            
            <StatCard
              title="Active Alerts"
              value={recentAlerts?.length || 0}
              icon="alert-circle"
              color={colors.warning}
              trend="-3%"
              trendDirection="down"
            />
            
            <StatCard
              title="Reports Generated"
              value={dashboardData?.user_assessments || 0}
              icon="analytics"
              color={colors.accent}
              trend="+8%"
              trendDirection="up"
            />
            
            <StatCard
              title="Cost Saved"
              value={`$${((dashboardData?.total_estimated_cost || 0) * 0.15 / 1000).toFixed(0)}K`}
              icon="trending-up"
              color={colors.success}
              trend="+25%"
              trendDirection="up"
            />
          </View>
        </Animatable.View>

        {/* Charts Section */}
        <Animatable.View
          animation="fadeInUp"
          delay={1500}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Analytics
          </Text>
          
          <ChartCard
            title="Damage Severity Distribution"
            data={dashboardData?.severity_distribution || []}
            type="pie"
          />
          
          <ChartCard
            title="Building Types Assessed"
            data={dashboardData?.building_distribution || []}
            type="bar"
          />
        </Animatable.View>

        {/* Recent Assessments */}
        <Animatable.View
          animation="fadeInUp"
          delay={1700}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Assessments
            </Text>
            <TouchableOpacity
              onPress={navigateToReports}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData?.recent_assessments?.length > 0 ? (
            dashboardData.recent_assessments.slice(0, 3).map((assessment, index) => (
              <RecentAssessmentCard
                key={assessment._id || index}
                assessment={assessment}
                onPress={() => navigation.navigate('Reports', {
                  screen: 'ReportDetail',
                  params: { assessmentId: assessment._id }
                })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <LottieView
                source={require('../../../assets/animations/empty-state.json')}
                autoPlay
                loop={false}
                style={styles.emptyAnimation}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No assessments yet
              </Text>
              <Text style={styles.emptySubtext}>
                Start by creating your first damage assessment
              </Text>
            </View>
          )}
        </Animatable.View>

        {/* Disaster Alerts */}
        <Animatable.View
          animation="fadeInUp"
          delay={1900}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Disaster Alerts
            </Text>
            <TouchableOpacity
              onPress={navigateToAlerts}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentAlerts.length > 0 ? (
            recentAlerts.map((alert, index) => (
              <AlertCard
                key={alert._id || index}
                alert={alert}
                onPress={() => navigateToAlerts()}
              />
            ))
          ) : (
            <View style={styles.noAlertsContainer}>
              <Ionicons
                name="shield-checkmark"
                size={48}
                color={colors.success}
              />
              <Text style={[styles.noAlertsText, { color: theme.colors.text }]}>
                No active alerts
              </Text>
              <Text style={styles.noAlertsSubtext}>
                All clear in your area
              </Text>
            </View>
          )}
        </Animatable.View>

        {/* Global Statistics */}
        <Animatable.View
          animation="fadeInUp"
          delay={2100}
          style={[styles.section, styles.lastSection]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Global Impact
          </Text>
          
          <View style={styles.globalStatsCard}>
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>
                {globalData?.total_public_assessments || 0}
              </Text>
              <Text style={styles.globalStatLabel}>Global Assessments</Text>
            </View>
            
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>
                ${globalData?.global_cost_statistics?.total_cost 
                  ? (globalData.global_cost_statistics.total_cost / 1000000).toFixed(1) + 'M'
                  : '0'
                }
              </Text>
              <Text style={styles.globalStatLabel}>Total Damage Cost</Text>
            </View>
            
            <View style={styles.globalStatItem}>
              <Text style={styles.globalStatValue}>
                {globalData?.recent_alerts || 0}
              </Text>
              <Text style={styles.globalStatLabel}>Active Alerts</Text>
            </View>
          </View>
        </Animatable.View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  userDetails: {
    flex: 1,
  },
  greetingText: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h3,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatValue: {
    ...typography.h4,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerStatLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    alignItems: 'center',
  },
  quickActionButton: {
    borderRadius: 15,
    overflow: 'hidden',
    ...shadowStyles.medium,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  quickActionText: {
    ...typography.button,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    ...typography.h5,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  seeAllText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyAnimation: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.h6,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noAlertsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noAlertsText: {
    ...typography.h6,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noAlertsSubtext: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  globalStatsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    ...shadowStyles.medium,
  },
  globalStatItem: {
    alignItems: 'center',
  },
  globalStatValue: {
    ...typography.h5,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  globalStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default DashboardScreen;