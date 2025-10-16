import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
// import MapView, { Marker, Circle } from 'react-native-maps'; // Replaced with WebViewMap
import WebViewMap from '../../components/WebViewMap';
import LottieView from 'lottie-react-native';

// Components
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertCard from '../../components/AlertCard';
import FilterModal from '../../components/FilterModal';

// Services
import DashboardService from '../../services/DashboardService';
import { NotificationService } from '../../services/NotificationService';

import { colors, typography, spacing, shadowStyles } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const DisasterAlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [filters, setFilters] = useState({
    types: [],
    severity: [],
    distance: 20000, // km - Show global alerts by default
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [alertsStatus, setAlertsStatus] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  const { user } = useAuth();
  const { theme } = useTheme();
  const mapRef = useRef(null);

  const alertTypes = [
    { type: 'earthquake', label: 'Earthquake', icon: 'pulse', color: '#8B4513' },
    { type: 'flood', label: 'Flood', icon: 'water', color: '#1E90FF' },
    { type: 'fire', label: 'Fire', icon: 'flame', color: '#FF4500' },
    { type: 'storm', label: 'Storm', icon: 'thunderstorm', color: '#4B0082' },
    { type: 'weather', label: 'Weather', icon: 'cloud', color: '#696969' },
    { type: 'tsunami', label: 'Tsunami', icon: 'waves', color: '#008080' },
    { type: 'landslide', label: 'Landslide', icon: 'triangle', color: '#CD853F' },
  ];

  useEffect(() => {
    loadAlertsData();
    getUserLocation();
    
    // Set up periodic refresh
    const interval = setInterval(loadAlertsData, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [alerts, filters]);

  const loadAlertsData = async () => {
    try {
      const alertsData = await DashboardService.getRecentAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Load alerts error:', error);
      Alert.alert('Error', 'Failed to load disaster alerts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } else {
        console.log('Location permission denied');
        // Set default location for Pakistan region if permission denied
        setUserLocation({
          latitude: 33.6844,
          longitude: 73.0479,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      // Set default location on error
      setUserLocation({
        latitude: 33.6844,
        longitude: 73.0479,
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...alerts];

    // Filter by types
    if (filters && filters.types && filters.types.length > 0) {
      filtered = filtered.filter(alert => 
        filters.types.includes(alert.type?.toLowerCase())
      );
    }

    // Filter by severity
    if (filters && filters.severity && filters.severity.length > 0) {
      filtered = filtered.filter(alert => 
        filters.severity.includes(alert.severity?.toLowerCase())
      );
    }

    // Filter by distance
    if (userLocation && filters && filters.distance && filters.distance < 50000) { // Increased max distance for global alerts
      filtered = filtered.filter(alert => {
        if (!alert.location?.lat || !alert.location?.lng) return true;
        
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          alert.location.lat,
          alert.location.lng
        );
        
        return distance <= filters.distance;
      });
    }
    
    setFilteredAlerts(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadAlertsData();
    getUserLocation();
  };

  // Manual fetch live alerts from external APIs
  const fetchLiveAlerts = async () => {
    try {
      setIsFetchingLive(true);
      console.log('🌐 Triggering manual live alerts fetch...');
      
      const result = await DashboardService.fetchLiveAlerts();
      
      if (result.success) {
        Alert.alert(
          'Live Alerts Updated',
          `Successfully fetched ${result.stored_count} new alerts from external APIs.`,
          [
            { text: 'OK', onPress: () => loadAlertsData() } // Refresh the list
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch live alerts');
      }
    } catch (error) {
      console.error('Manual fetch error:', error);
      Alert.alert('Error', 'Failed to fetch live alerts from external APIs');
    } finally {
      setIsFetchingLive(false);
    }
  };

  // Get alerts system status
  const loadAlertsStatus = async () => {
    try {
      const status = await DashboardService.getAlertsStatus();
      setAlertsStatus(status);
      setShowStatusModal(true);
    } catch (error) {
      console.error('Load alerts status error:', error);
      Alert.alert('Error', 'Failed to load alerts status');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getSourceDescription = (source) => {
    switch (source) {
      case 'USGS': return 'US Geological Survey - Earthquake data';
      case 'OpenWeatherMap': return 'Weather alerts for Pakistan cities';
      case 'NASA EONET': return 'NASA Earth Observatory - Natural events';
      case 'GDACS': return 'Global Disaster Alert & Coordination System';
      case 'Manual': return 'Manually added alerts';
      default: return 'External data source';
    }
  };

  const getAlertTypeInfo = (type) => {
    return alertTypes.find(t => t.type === type?.toLowerCase()) || {
      type: 'unknown',
      label: 'Unknown',
      icon: 'alert-circle',
      color: colors.textSecondary
    };
  };

  const handleAlertPress = (alert) => {
    setSelectedAlert(alert);
    if (viewMode === 'map' && alert.location?.lat && alert.location?.lng) {
      mapRef.current?.animateToRegion({
        latitude: alert.location.lat,
        longitude: alert.location.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    }
  };

  const handleAlertAction = (alert) => {
    if (alert.url) {
      Linking.openURL(alert.url);
    } else {
      Alert.alert(
        alert.title,
        alert.description,
        [
          { text: 'Close', style: 'cancel' },
          { 
            text: 'Get Directions', 
            onPress: () => openDirections(alert.location)
          }
        ]
      );
    }
  };

  const openDirections = (location) => {
    if (location?.lat && location?.lng) {
      const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      Linking.openURL(url);
    }
  };

  const renderListView = () => (
    <ScrollView
      style={styles.listContainer}
      contentContainerStyle={styles.listContent}
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
      {filteredAlerts && filteredAlerts.length > 0 ? (
        filteredAlerts.map((alert, index) => (
          <Animatable.View
            key={alert._id || index}
            animation="fadeInUp"
            delay={index * 100}
            duration={500}
          >
            <AlertCard
              alert={alert}
              onPress={() => handleAlertPress(alert)}
              onAction={() => handleAlertAction(alert)}
              showDistance={userLocation}
              userLocation={userLocation}
            />
          </Animatable.View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <LottieView
            source={require('../../../assets/animations/no-alerts.json')}
            autoPlay
            loop={false}
            style={styles.emptyAnimation}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No alerts found
          </Text>
          <Text style={styles.emptySubtext}>
            {filters.types.length > 0 || filters.severity.length > 0
              ? 'Try adjusting your filters'
              : 'All clear in your area'
            }
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderMapView = () => {
    // Convert alerts to marker format for WebViewMap
    const markers = filteredAlerts && filteredAlerts
      .filter(alert => alert && alert.location?.lat && alert.location?.lng)
      .map(alert => ({
        latitude: alert.location.lat,
        longitude: alert.location.lng,
        title: alert.title || 'Disaster Alert',
        description: `${alert.description || ''}\n\nSeverity: ${alert.severity || 'Unknown'}\nType: ${alert.type || 'Unknown'}`,
        id: alert._id,
        severity: alert.severity,
        type: alert.type
      })) || [];

    return (
      <View style={styles.mapContainer}>
        <WebViewMap
          initialLocation={{
            latitude: userLocation?.latitude || 33.6844,  // Islamabad, Pakistan
            longitude: userLocation?.longitude || 73.0479,
          }}
          markers={markers}
          height={400}
          zoomLevel={userLocation ? 12 : 8}
          showUserLocation={true}
          style={styles.map}
          onLocationSelect={(location) => {
            // Handle location selection if needed
            console.log('Location selected:', location);
          }}
        />

        {/* Selected Alert Info */}
        {selectedAlert && (
          <Animatable.View
            animation="slideInUp"
            style={styles.selectedAlertCard}
          >
            <AlertCard
              alert={selectedAlert}
              onPress={() => setSelectedAlert(null)}
              onAction={() => handleAlertAction(selectedAlert)}
              showDistance={userLocation}
              userLocation={userLocation}
              compact={true}
            />
          </Animatable.View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading alerts...</Text>
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
              <Text style={styles.headerTitle}>Disaster Alerts</Text>
              <Text style={styles.headerSubtitle}>
                {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="filter" size={20} color={colors.textLight} />
                {(filters.types.length > 0 || filters.severity.length > 0) && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={loadAlertsStatus}
                activeOpacity={0.7}
              >
                <Ionicons name="analytics" size={20} color={colors.textLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerButton, isFetchingLive && styles.headerButtonDisabled]}
                onPress={fetchLiveAlerts}
                activeOpacity={0.7}
                disabled={isFetchingLive}
              >
                <Ionicons 
                  name={isFetchingLive ? "sync" : "cloud-download"} 
                  size={20} 
                  color={isFetchingLive ? colors.textSecondary : colors.textLight} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onRefresh}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="list" 
                size={18} 
                color={viewMode === 'list' ? colors.primary : colors.textLight} 
              />
              <Text style={[
                styles.toggleText,
                viewMode === 'list' && styles.toggleTextActive
              ]}>
                List
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'map' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="map" 
                size={18} 
                color={viewMode === 'map' ? colors.primary : colors.textLight} 
              />
              <Text style={[
                styles.toggleText,
                viewMode === 'map' && styles.toggleTextActive
              ]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </LinearGradient>

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderMapView()}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={setFilters}
        alertTypes={alertTypes}
      />

      {/* Alerts Status Modal */}
      {showStatusModal && alertsStatus && (
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>External APIs Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.statusContent}>
              {/* API Sources Statistics */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>🌐 Active Alerts by Source</Text>
                {Object.entries(alertsStatus.sources_stats || {}).map(([source, count]) => (
                  <View key={source} style={styles.statusRow}>
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceName}>{source}</Text>
                      <Text style={styles.sourceDescription}>
                        {getSourceDescription(source)}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{count}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* API Keys Status */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>🔑 API Configuration</Text>
                {Object.entries(alertsStatus.api_keys_configured || {}).map(([api, configured]) => (
                  <View key={api} style={styles.statusRow}>
                    <Text style={styles.sourceName}>{api.toUpperCase()}</Text>
                    <View style={[styles.statusBadge, configured ? styles.configuredBadge : styles.notConfiguredBadge]}>
                      <Text style={[styles.statusBadgeText, configured ? styles.configuredText : styles.notConfiguredText]}>
                        {configured ? 'Configured' : 'Not Configured'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* System Statistics */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>📊 System Statistics</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.sourceName}>Total Active Alerts</Text>
                  <Text style={styles.statValue}>{alertsStatus.total_active_alerts || 0}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.sourceName}>Fetched Last 24 Hours</Text>
                  <Text style={styles.statValue}>{alertsStatus.recent_fetches_24h || 0}</Text>
                </View>
              </View>

              {/* Manual Actions */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setShowStatusModal(false);
                    fetchLiveAlerts();
                  }}
                >
                  <Ionicons name="cloud-download" size={20} color={colors.textLight} />
                  <Text style={styles.actionButtonText}>Fetch Live Alerts</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: colors.textLight,
  },
  toggleText: {
    ...typography.body2,
    color: colors.textLight,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: colors.primary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f0f0f0',
    minHeight: 400,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.textLight,
    ...shadowStyles.medium,
  },
  selectedAlertCard: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    ...shadowStyles.large,
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  // Status Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  statusModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    maxHeight: '80%',
    width: '90%',
    ...shadowStyles.large,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  statusContent: {
    maxHeight: 400,
  },
  statusSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  sourceDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  configuredBadge: {
    backgroundColor: colors.success + '20',
  },
  notConfiguredBadge: {
    backgroundColor: colors.error + '20',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  configuredText: {
    color: colors.success,
  },
  notConfiguredText: {
    color: colors.error,
  },
  statValue: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    justifyContent: 'center',
    ...shadowStyles.small,
  },
  actionButtonText: {
    ...typography.body1,
    color: colors.textLight,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default DisasterAlertsScreen;