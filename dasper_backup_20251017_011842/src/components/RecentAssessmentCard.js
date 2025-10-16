import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const RecentAssessmentCard = ({ assessment, onPress, delay = 0 }) => {
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
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Extract data from the API response structure (flat structure)
  const severityScore = (assessment?.damage_percentage || 0) / 100;  // Convert percentage to score
  const severityColor = getSeverityColor(severityScore);
  const severityLabel = getSeverityLabel(severityScore);
  const totalCost = assessment?.estimated_cost || 0;

  return (
    <Animatable.View
      animation="fadeInRight"
      delay={delay}
      duration={600}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.surface, `${colors.primary}05`]}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.buildingIcon, { backgroundColor: `${severityColor}15` }]}>
                <Ionicons 
                  name="business" 
                  size={20} 
                  color={severityColor} 
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.buildingName} numberOfLines={1}>
                  {assessment?.building_name || 'Unnamed Building'}
                </Text>
                <Text style={styles.buildingType}>
                  {assessment?.building_type?.charAt(0).toUpperCase() + 
                   assessment?.building_type?.slice(1) || 'Unknown Type'}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                <Text style={styles.severityText}>{severityLabel}</Text>
              </View>
            </View>
          </View>

          {/* Metrics */}
          <View style={styles.metricsContainer}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {(severityScore * 100).toFixed(0)}%
              </Text>
              <Text style={styles.metricLabel}>Damage</Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {formatCurrency(totalCost)}
              </Text>
              <Text style={styles.metricLabel}>Est. Cost</Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {assessment?.building_area_sqm?.toFixed(0) || 0}m²
              </Text>
              <Text style={styles.metricLabel}>Area</Text>
            </View>
            
            <View style={styles.metric}>
              <Text style={styles.metricValue}>
                {assessment?.building_height_m?.toFixed(1) || 0}m
              </Text>
              <Text style={styles.metricLabel}>Height</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.timeText}>
                {formatDate(assessment?.timestamp)}
              </Text>
            </View>
            
            <View style={styles.footerRight}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {assessment?.pin_location || 'No location'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animatable.View
                animation="slideInLeft"
                delay={delay + 200}
                duration={800}
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.min(severityScore * 100, 100)}%`,
                    backgroundColor: severityColor,
                  },
                ]}
              />
            </View>
          </View>

          {/* Severity Indicator */}
          <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />

          {/* Assessment Image Preview */}
          {assessment?.images?.original && (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${assessment.images.original}` }}
                style={styles.previewImage}
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="image" size={12} color={colors.textLight} />
              </View>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadowStyles.medium,
  },
  cardGradient: {
    padding: spacing.lg,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  buildingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  buildingName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  buildingType: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  severityText: {
    ...typography.caption,
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 10,
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
  metricValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 14,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    maxWidth: 100,
  },
  progressContainer: {
    marginBottom: spacing.xs,
  },
  progressBackground: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  severityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  imagePreview: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 6,
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

export default RecentAssessmentCard;