import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const ReportCard = ({ 
  report, 
  onPress, 
  onGenerateReport, 
  showUserName = false 
}) => {
  const getSeverityColor = (severity) => {
    if (severity <= 0.25) return colors.success;
    if (severity <= 0.5) return colors.warning;
    if (severity <= 0.75) return colors.secondary;
    return colors.error;
  };

  const getSeverityLabel = (severity) => {
    if (severity <= 0.25) return 'Minimal';
    if (severity <= 0.5) return 'Moderate';
    if (severity <= 0.75) return 'Severe';
    return 'Destructive';
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount?.toFixed(0) || 0}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getBuildingTypeIcon = (type) => {
    const iconMap = {
      'residential': 'home',
      'commercial': 'business',
      'industrial': 'construct',
      'institutional': 'school',
      'mixed': 'layers'
    };
    return iconMap[type?.toLowerCase()] || 'business';
  };

  // Extract data from the API response structure (flat structure)
  const severityScore = (report?.damage_percentage || 0) / 100;  // Convert percentage to score
  const severityColor = getSeverityColor(severityScore);
  const severityLabel = getSeverityLabel(severityScore);
  const totalCost = report?.estimated_cost || 0;
  const buildingIcon = getBuildingTypeIcon(report?.building_type);
  
  // Get repair time from nested assessment details if available
  const repairTime = report?.assessment_details?.cost_estimation?.repair_time_days || 
                     report?.cost_breakdown?.repair_time_days || 
                     8; // Default fallback

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.buildingIcon, { backgroundColor: `${severityColor}15` }]}>
              <Ionicons name={buildingIcon} size={22} color={severityColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.buildingName} numberOfLines={1}>
                {report?.building_name || 'Unnamed Building'}
              </Text>
              <View style={styles.buildingMeta}>
                <Text style={styles.buildingType}>
                  {report?.building_type?.charAt(0).toUpperCase() + report?.building_type?.slice(1) || 'Unknown Type'}
                </Text>
                <View style={styles.separator} />
                <Text style={styles.assessmentDate}>
                  {formatDate(report?.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <Text style={styles.severityText}>{severityLabel}</Text>
            </View>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="analytics" size={16} color={colors.primary} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricValue}>
                {(severityScore * 100).toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Damage</Text>
            </View>
          </View>

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.secondary}15` }]}>
              <Ionicons name="cash" size={16} color={colors.secondary} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricValue}>
                {formatCurrency(totalCost)}
              </Text>
              <Text style={styles.metricLabel}>Est. Cost</Text>
            </View>
          </View>

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="resize" size={16} color={colors.accent} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricValue}>
                {report?.building_area_sqm?.toFixed(0) || 0}m²
              </Text>
              <Text style={styles.metricLabel}>Area</Text>
            </View>
          </View>

          <View style={styles.metric}>
            <View style={[styles.metricIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="time" size={16} color={colors.warning} />
            </View>
            <View style={styles.metricText}>
              <Text style={styles.metricValue}>
                {repairTime}d
              </Text>
              <Text style={styles.metricLabel}>Repair</Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {report?.pin_location || 'Unknown Location'}
          </Text>
          {report?.is_public && (
            <View style={styles.publicBadge}>
              <Ionicons name="globe" size={12} color={colors.info} />
              <Text style={styles.publicText}>Public</Text>
            </View>
          )}
        </View>

        {/* User Info (for public reports) */}
        {showUserName && report?.user_name && (
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={16} color={colors.textSecondary} />
            <Text style={styles.userName}>
              By {report.user_name}
            </Text>
            <View style={styles.confidenceContainer}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.confidenceText}>
                {((report?.confidence_score || 0.8) * 100).toFixed(0)}% confidence
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={16} color={colors.primary} />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={onGenerateReport}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={colors.primaryGradient}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="document-text" size={16} color={colors.textLight} />
              <Text style={styles.primaryActionText}>PDF Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(severityScore * 100, 100)}%`,
                  backgroundColor: severityColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Severity: {(severityScore * 100).toFixed(1)}% • Confidence: {((report?.confidence_score || 0.8) * 100).toFixed(0)}%
          </Text>
        </View>

        {/* Status Indicator Line */}
        <View style={[styles.statusIndicator, { backgroundColor: severityColor }]} />

        {/* Assessment Image Preview (if available) */}
        {report?.images?.original && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${report.images.original}` }}
              style={styles.previewImage}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="image" size={16} color={colors.textLight} />
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  buildingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  buildingName: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  buildingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buildingType: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  assessmentDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  severityText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 11,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: `${colors.primary}05`,
    borderRadius: 12,
    padding: spacing.md,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricText: {
    alignItems: 'center',
  },
  metricValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 13,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.info}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    marginLeft: spacing.sm,
  },
  publicText: {
    ...typography.caption,
    color: colors.info,
    marginLeft: spacing.xs,
    fontSize: 10,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  userName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
    fontSize: 10,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryAction: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  actionText: {
    ...typography.caption,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  primaryActionText: {
    ...typography.caption,
    color: colors.textLight,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  imagePreview: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReportCard;