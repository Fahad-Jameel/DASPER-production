import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const SeverityIndicator = ({ severity, confidence, category }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: severity,
        duration: 2000,
        useNativeDriver: false,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [severity]);

  const getSeverityColor = () => {
    if (severity <= 0.25) return colors.success;
    if (severity <= 0.5) return colors.warning;
    if (severity <= 0.75) return colors.secondary;
    return colors.error;
  };

  const getSeverityGradient = () => {
    if (severity <= 0.25) return [colors.success, '#66BB6A'];
    if (severity <= 0.5) return [colors.warning, '#FFB74D'];
    if (severity <= 0.75) return [colors.secondary, '#FF8A65'];
    return [colors.error, '#EF5350'];
  };

  const getSeverityIcon = () => {
    if (severity <= 0.25) return 'checkmark-circle';
    if (severity <= 0.5) return 'warning';
    if (severity <= 0.75) return 'alert-circle';
    return 'close-circle';
  };

  const getSeverityDescription = () => {
    if (severity <= 0.25) return 'Building shows minimal damage with minor repairs needed';
    if (severity <= 0.5) return 'Moderate damage detected requiring attention';
    if (severity <= 0.75) return 'Severe damage found requiring immediate action';
    return 'Destructive damage - immediate evacuation recommended';
  };

  const severityColor = getSeverityColor();
  const severityGradient = getSeverityGradient();

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Animatable.View
            animation="bounceIn"
            delay={500}
            style={[styles.iconContainer, { backgroundColor: `${severityColor}20` }]}
          >
            <Ionicons name={getSeverityIcon()} size={32} color={severityColor} />
          </Animatable.View>
          
          <View style={styles.headerText}>
            <Text style={styles.severityLabel}>Damage Severity</Text>
            <Text style={[styles.severityCategory, { color: severityColor }]}>
              {category?.charAt(0).toUpperCase() + category?.slice(1) || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>
              {(confidence * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={severityGradient}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            
            {/* Progress Labels */}
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>0%</Text>
              <Text style={styles.progressLabelText}>25%</Text>
              <Text style={styles.progressLabelText}>50%</Text>
              <Text style={styles.progressLabelText}>75%</Text>
              <Text style={styles.progressLabelText}>100%</Text>
            </View>
          </View>
          
          {/* Score Display */}
          <Animatable.View
            animation="fadeInUp"
            delay={1000}
            style={styles.scoreContainer}
          >
            <Text style={styles.scoreLabel}>Severity Score</Text>
            <Text style={[styles.scoreValue, { color: severityColor }]}>
              {(severity * 100).toFixed(1)}%
            </Text>
          </Animatable.View>
        </View>

        {/* Description */}
        <Animatable.View
          animation="fadeInUp"
          delay={1500}
          style={styles.descriptionContainer}
        >
          <Text style={styles.description}>
            {getSeverityDescription()}
          </Text>
        </Animatable.View>

        {/* Severity Scale Reference */}
        <View style={styles.scaleReference}>
          <Text style={styles.scaleTitle}>Severity Scale</Text>
          <View style={styles.scaleItems}>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: colors.success }]} />
              <Text style={styles.scaleText}>Minimal (0-25%)</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.scaleText}>Moderate (25-50%)</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: colors.secondary }]} />
              <Text style={styles.scaleText}>Severe (50-75%)</Text>
            </View>
            <View style={styles.scaleItem}>
              <View style={[styles.scaleDot, { backgroundColor: colors.error }]} />
              <Text style={styles.scaleText}>Destructive (75-100%)</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  card: {
    borderRadius: 20,
    padding: spacing.xl,
    ...shadowStyles.large,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  severityLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  severityCategory: {
    ...typography.h5,
    fontWeight: 'bold',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  confidenceValue: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBackground: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  progressLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: spacing.md,
  },
  scoreLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  description: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  scaleReference: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: spacing.md,
  },
  scaleTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  scaleItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.xs,
  },
  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  scaleText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default SeverityIndicator;