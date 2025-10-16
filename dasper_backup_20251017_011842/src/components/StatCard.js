import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.lg * 3) / 2; // 2 cards per row with margins

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = colors.primary,
  trend,
  trendDirection = 'up',
  delay = 0
}) => {
  const getTrendColor = () => {
    return trendDirection === 'up' ? colors.success : colors.error;
  };

  const getTrendIcon = () => {
    return trendDirection === 'up' ? 'trending-up' : 'trending-down';
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={delay}
      duration={800}
      style={[styles.container, { width: cardWidth }]}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          
          {trend && (
            <View style={[styles.trendContainer, { backgroundColor: `${getTrendColor()}15` }]}>
              <Ionicons 
                name={getTrendIcon()} 
                size={12} 
                color={getTrendColor()} 
                style={styles.trendIcon}
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trend}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <Ionicons 
            name={icon} 
            size={60} 
            color={`${color}08`} 
            style={styles.backgroundIcon}
          />
        </View>
      </LinearGradient>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadowStyles.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  trendIcon: {
    marginRight: spacing.xs,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  value: {
    ...typography.h4,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  backgroundPattern: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.1,
  },
  backgroundIcon: {
    transform: [{ rotate: '15deg' }],
  },
});

export default StatCard;