import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ReportCard from '../../components/ReportCard';
import TabSelector from '../../components/TabSelector';

// Services
import DashboardService from '../../services/DashboardService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const { width } = Dimensions.get('window');

const ReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my' or 'public'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'severity', 'cost'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'minimal', 'moderate', 'severe', 'destructive'

  const { user } = useAuth();
  const { theme } = useTheme();

  const tabs = [
    { key: 'my', label: 'My Reports', icon: 'person' },
    { key: 'public', label: 'Public Reports', icon: 'globe' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date', icon: 'calendar' },
    { key: 'severity', label: 'Severity', icon: 'analytics' },
    { key: 'cost', label: 'Cost', icon: 'cash' },
  ];

  const filterOptions = [
    { key: 'all', label: 'All', color: colors.textSecondary },
    { key: 'minimal', label: 'Minimal', color: colors.success },
    { key: 'moderate', label: 'Moderate', color: colors.warning },
    { key: 'severe', label: 'Severe', color: colors.secondary },
    { key: 'destructive', label: 'Destructive', color: colors.error },
  ];

  useEffect(() => {
    loadReports();
  }, [activeTab]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [sortBy, filterBy]);

  const loadReports = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'my') {
        const userReports = await DashboardService.getUserAssessments(1, 50);
        setReports(userReports.assessments || []);
      } else {
        const publicReports = await DashboardService.getPublicAssessments(1, 50);
        setPublicReports(publicReports.assessments || []);
      }
    } catch (error) {
      console.error('Load reports error:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    const currentReports = activeTab === 'my' ? reports : publicReports;
    let filtered = [...currentReports];

    // Apply filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(report => 
        report.damage_assessment?.severity_category?.toLowerCase() === filterBy
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'severity':
          return (b.damage_assessment?.severity_score || 0) - (a.damage_assessment?.severity_score || 0);
        case 'cost':
          return (b.cost_estimation?.total_estimated_cost_usd || 0) - (a.cost_estimation?.total_estimated_cost_usd || 0);
        default:
          return 0;
      }
    });

    if (activeTab === 'my') {
      setReports(filtered);
    } else {
      setPublicReports(filtered);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadReports();
  };

  const handleReportPress = (report) => {
    navigation.navigate('ReportDetail', { 
      assessmentId: report._id,
      reportData: report 
    });
  };

  const handleGenerateReport = (assessmentId) => {
    // Navigate to results screen or trigger report generation
    Alert.alert(
      'Generate Report',
      'Do you want to generate a PDF report for this assessment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate', 
          onPress: () => generatePDFReport(assessmentId)
        }
      ]
    );
  };

  const generatePDFReport = async (assessmentId) => {
    try {
      const reportData = await DashboardService.generateReport(assessmentId);
      Alert.alert(
        'Success',
        'PDF report has been generated successfully!',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LottieView
        source={require('../../../assets/animations/empty-reports.json')}
        autoPlay
        loop={false}
        style={styles.emptyAnimation}
      />
      <Text style={[styles.emptyText, { color: theme.colors.text }]}>
        {activeTab === 'my' ? 'No reports yet' : 'No public reports available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'my' 
          ? 'Start by creating your first assessment'
          : 'Check back later for community reports'
        }
      </Text>
      {activeTab === 'my' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('Assessment')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.primaryGradient}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color={colors.textLight} />
            <Text style={styles.createButtonText}>New Assessment</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderReportsList = () => {
    const currentReports = activeTab === 'my' ? reports : publicReports;
    
    if (currentReports.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.reportsContainer}>
        {currentReports.map((report, index) => (
          <Animatable.View
            key={report._id || index}
            animation="fadeInUp"
            delay={index * 100}
            duration={500}
          >
            <ReportCard
              report={report}
              onPress={() => handleReportPress(report)}
              onGenerateReport={() => handleGenerateReport(report._id)}
              showUserName={activeTab === 'public'}
            />
          </Animatable.View>
        ))}
      </View>
    );
  };

  const currentReports = activeTab === 'my' ? reports : publicReports;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
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
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Assessment Reports</Text>
              <Text style={styles.headerSubtitle}>
                {currentReports.length} report{currentReports.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Assessment')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Animatable.View>
      </LinearGradient>

     {/* Filters and Sort */}
    {/*}  <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
         {/*{/* Sort Options */}
         {/* <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Sort by:</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  sortBy === option.key && styles.filterChipActive
                ]}
                onPress={() => setSortBy(option.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={sortBy === option.key ? colors.textLight : colors.textSecondary}
                />
                <Text style={[
                  styles.filterChipText,
                  sortBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Filter Options */}
          {/* <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>Filter:</Text>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  filterBy === option.key && [
                    styles.filterChipActive,
                    { backgroundColor: option.color }
                  ]
                ]}
                onPress={() => setFilterBy(option.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterChipText,
                  filterBy === option.key && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView> */}
      {/*</View>*/}

      {/* Content */}
      <ScrollView
        style={styles.content}
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
        {renderReportsList()}
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    marginBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textLight,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  filterGroupLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  filterChipTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  reportsContainer: {
    paddingTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyAnimation: {
    width: 120,
    height: 120,
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
    marginBottom: spacing.xl,
  },
  createButton: {
    borderRadius: 25,
    overflow: 'hidden',
    ...shadowStyles.medium,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  createButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
});

export default ReportsScreen;