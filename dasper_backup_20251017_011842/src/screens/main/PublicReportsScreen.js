import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
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

// Services
import DashboardService from '../../services/DashboardService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const PublicReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const { user } = useAuth();
  const { theme } = useTheme();

  const regions = [
    { key: 'all', label: 'All Regions' },
    { key: 'north_america', label: 'North America' },
    { key: 'south_america', label: 'South America' },
    { key: 'europe', label: 'Europe' },
    { key: 'asia', label: 'Asia' },
    { key: 'africa', label: 'Africa' },
    { key: 'oceania', label: 'Oceania' },
  ];

  const severityLevels = [
    { key: 'all', label: 'All Severities', color: colors.textSecondary },
    { key: 'minimal', label: 'Minimal', color: colors.success },
    { key: 'moderate', label: 'Moderate', color: colors.warning },
    { key: 'severe', label: 'Severe', color: colors.secondary },
    { key: 'destructive', label: 'Destructive', color: colors.error },
  ];

  const sortOptions = [
    { key: 'date', label: 'Latest First' },
    { key: 'severity', label: 'Severity' },
    { key: 'cost', label: 'Cost' },
    { key: 'location', label: 'Location' },
  ];

  useEffect(() => {
    loadPublicReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery, selectedRegion, selectedSeverity, sortBy]);

  const loadPublicReports = async () => {
    try {
      const data = await DashboardService.getPublicAssessments(1, 100);
      setReports(data.assessments || []);
    } catch (error) {
      console.error('Load public reports error:', error);
      Alert.alert('Error', 'Failed to load public reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.building_name?.toLowerCase().includes(query) ||
        report.pin_location?.toLowerCase().includes(query) ||
        report.building_type?.toLowerCase().includes(query)
      );
    }

    // Apply region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(report => 
        report.region?.toLowerCase() === selectedRegion ||
        report.pin_location?.toLowerCase().includes(selectedRegion.replace('_', ' '))
      );
    }

    // Apply severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(report => 
        report.damage_severity?.toLowerCase() === selectedSeverity
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'severity':
          return (b.damage_percentage || 0) - (a.damage_percentage || 0);
        case 'cost':
          return (b.estimated_cost || 0) - (a.estimated_cost || 0);
        case 'location':
          return (a.pin_location || '').localeCompare(b.pin_location || '');
        default:
          return 0;
      }
    });

    setFilteredReports(filtered);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPublicReports();
  };

  const handleReportPress = (report) => {
    navigation.navigate('ReportDetail', { 
      assessmentId: report._id,
      reportData: report 
    });
  };

  const handleGenerateReport = (assessmentId) => {
    Alert.alert(
      'Generate Report',
      'Do you want to generate a PDF report for this public assessment?',
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
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('all');
    setSelectedSeverity('all');
    setSortBy('date');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderFilterChip = (options, selectedValue, onSelect, label) => (
    <View style={styles.filterChipContainer}>
      <Text style={styles.filterLabel}>{label}:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChips}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterChip,
              selectedValue === option.key && [
                styles.filterChipSelected,
                option.color && { backgroundColor: option.color }
              ]
            ]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedValue === option.key && styles.filterChipTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading public reports...</Text>
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textLight} />
            </TouchableOpacity>
            
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Public Reports</Text>
              <Text style={styles.headerSubtitle}>
                {filteredReports.length} of {reports.length} reports
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={clearFilters}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by building, location, or type..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>
      </LinearGradient>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {renderFilterChip(regions, selectedRegion, setSelectedRegion, 'Region')}
          {renderFilterChip(severityLevels, selectedSeverity, setSelectedSeverity, 'Severity')}
          {renderFilterChip(sortOptions, sortBy, setSortBy, 'Sort by')}
        </ScrollView>
      </View>

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
        {filteredReports.length > 0 ? (
          <View style={styles.reportsContainer}>
            {filteredReports.map((report, index) => (
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
                  showUserName={true}
                />
              </Animatable.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LottieView
              source={require('../../../assets/animations/empty-search.json')}
              autoPlay
              loop={false}
              style={styles.emptyAnimation}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {searchQuery || selectedRegion !== 'all' || selectedSeverity !== 'all'
                ? 'No reports match your filters'
                : 'No public reports available'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedRegion !== 'all' || selectedSeverity !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Check back later for community reports'
              }
            </Text>
            {(searchQuery || selectedRegion !== 'all' || selectedSeverity !== 'all') && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats Summary */}
        {filteredReports.length > 0 && (
          <Animatable.View
            animation="fadeInUp"
            delay={filteredReports.length * 100 + 200}
            style={styles.statsContainer}
          >
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
              Community Impact
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {filteredReports.length}
                </Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {filteredReports.reduce((sum, report) => 
                    sum + (report.estimated_building_area_sqm || 0), 0
                  ).toFixed(0)}m²
                </Text>
                <Text style={styles.statLabel}>Total Area</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${(filteredReports.reduce((sum, report) => 
                    sum + (report.estimated_cost || 0), 0
                  ) / 1000000).toFixed(1)}M
                </Text>
                <Text style={styles.statLabel}>Total Damage</Text>
              </View>
            </View>
          </Animatable.View>
        )}
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
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
  filterChipContainer: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextSelected: {
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
  clearFiltersButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  clearFiltersText: {
    ...typography.button,
    color: colors.textLight,
  },
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadowStyles.medium,
  },
  statsTitle: {
    ...typography.h6,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h5,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default PublicReportsScreen;