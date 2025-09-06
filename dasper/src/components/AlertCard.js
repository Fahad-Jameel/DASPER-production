import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const AlertCard = ({ 
  alert, 
  onPress, 
  onAction, 
  showDistance = false, 
  userLocation = null,
  compact = false 
}) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getAlertTypeIcon = (type) => {
    const iconMap = {
      'earthquake': 'pulse',
      'flood': 'water',
      'fire': 'flame',
      'storm': 'thunderstorm',
      'weather': 'cloud',
      'tsunami': 'waves',
      'landslide': 'triangle',
    };
    return iconMap[type?.toLowerCase()] || 'alert-circle';
  };

  const getAlertTypeColor = (type) => {
    const colorMap = {
      'earthquake': '#8B4513',
      'flood': '#1E90FF',
      'fire': '#FF4500',
      'storm': '#4B0082',
      'weather': '#696969',
      'tsunami': '#008080',
      'landslide': '#CD853F',
    };
    return colorMap[type?.toLowerCase()] || colors.textSecondary;
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

  const getDistanceText = () => {
    if (!showDistance || !userLocation || !alert.location?.lat || !alert.location?.lng) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      alert.location.lat,
      alert.location.lng
    );
    
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const severityColor = getSeverityColor(alert.severity);
  const typeIcon = getAlertTypeIcon(alert.type);
  const typeColor = getAlertTypeColor(alert.type);
  const distanceText = getDistanceText();

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeColor}20` }]}>
              <Ionicons name={typeIcon} size={24} color={typeColor} />
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.alertTitle} numberOfLines={compact ? 1 : 2}>
                {alert.title || 'Unknown Alert'}
              </Text>
              <View style={styles.metadata}>
                <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                  <Text style={styles.severityText}>
                    {(alert.severity || 'unknown').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {formatTimestamp(alert.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          {!compact && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAction}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {!compact && alert.description && (
          <Text style={styles.description} numberOfLines={3}>
            {alert.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.sourceContainer}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.sourceText}>
                {alert.source || 'Unknown Source'}
              </Text>
            </View>
            
            {alert.magnitude && (
              <View style={styles.magnitudeContainer}>
                <Ionicons name="pulse" size={16} color={colors.error} />
                <Text style={styles.magnitudeText}>
                  Magnitude {alert.magnitude}
                </Text>
              </View>
            )}
          </View>
          
          {distanceText && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          )}
        </View>

        {/* Severity Indicator */}
        <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  compactContainer: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowStyles.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  alertTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  severityText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 10,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 1,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sourceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  magnitudeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  magnitudeText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  distanceText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  severityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});

export default AlertCard;