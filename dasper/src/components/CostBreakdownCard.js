import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const CostBreakdownCard = ({ costData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `PKR ${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `PKR ${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `PKR ${(amount / 1000).toFixed(0)}K`;
    }
    return `PKR ${amount.toFixed(0)}`;
  };

  const costItems = [
    {
      label: 'Structural Repairs',
      amount: costData.structural_cost || 0,
      icon: 'construct',
      color: colors.primary,
      description: 'Foundation, walls, and load-bearing elements',
    },
    {
      label: 'Non-Structural',
      amount: costData.non_structural_cost || 0,
      icon: 'hammer',
      color: colors.secondary,
      description: 'Interior finishes, partitions, and fixtures',
    },
    {
      label: 'Contents & Equipment',
      amount: costData.content_cost || 0,
      icon: 'cube',
      color: colors.accent,
      description: 'Furniture, appliances, and movable items',
    },
    {
      label: 'Professional Fees',
      amount: costData.professional_fees || 0,
      icon: 'people',
      color: colors.warning,
      description: 'Architects, engineers, and project management',
    },
    {
      label: 'Labor Costs',
      amount: costData.labor_cost || 0,
      icon: 'person-circle',
      color: '#9C27B0',
      description: 'Construction workers and skilled trades',
    },
    {
      label: 'Materials',
      amount: costData.material_cost || 0,
      icon: 'layers',
      color: '#FF5722',
      description: 'Raw materials and building supplies',
    },
    {
      label: 'Equipment & Tools',
      amount: costData.equipment_cost || 0,
      icon: 'settings',
      color: '#607D8B',
      description: 'Machinery rental and specialized tools',
    },
    {
      label: 'Permits & Regulatory',
      amount: costData.permit_costs || 0,
      icon: 'document-text',
      color: '#795548',
      description: 'Building permits and compliance costs',
    },
    {
      label: 'Emergency Response',
      amount: costData.emergency_response_cost || 0,
      icon: 'medical',
      color: colors.error,
      description: 'Immediate safety and stabilization measures',
    },
    {
      label: 'Contingency',
      amount: costData.contingency || 0,
      icon: 'shield-checkmark',
      color: '#4CAF50',
      description: 'Buffer for unexpected costs and changes',
    },
  ].filter(item => item.amount > 0);

  const totalCost = costData.total_estimated_cost_pkr || 0;
  const costRangeLow = costData.cost_range_low_pkr || totalCost * 0.85;
  const costRangeHigh = costData.cost_range_high_pkr || totalCost * 1.15;

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Ionicons name="calculator" size={24} color={colors.primary} />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total Estimated Cost</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalCost)}</Text>
          </View>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Cost Range */}
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeLabel}>Estimated Range:</Text>
          <Text style={styles.rangeText}>
            {formatCurrency(costRangeLow)} - {formatCurrency(costRangeHigh)}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {costData.repair_time_days || 0}
            </Text>
            <Text style={styles.quickStatLabel}>Days</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {((costData.confidence_score || 0.8) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.quickStatLabel}>Confidence</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {costItems.length}
            </Text>
            <Text style={styles.quickStatLabel}>Categories</Text>
          </View>
        </View>
      </View>

      {/* Detailed Breakdown */}
      {isExpanded && (
        <Animatable.View
          animation="fadeInUp"
          duration={300}
          style={styles.detailsContainer}
        >
          <Text style={styles.detailsTitle}>Cost Breakdown</Text>
          
          {costItems.map((item, index) => {
            const percentage = ((item.amount / totalCost) * 100).toFixed(1);
            
            return (
              <Animatable.View
                key={item.label}
                animation="fadeInRight"
                delay={index * 50}
                style={styles.costItem}
              >
                <View style={styles.costItemHeader}>
                  <View style={styles.costItemLeft}>
                    <View style={[
                      styles.costItemIcon,
                      { backgroundColor: `${item.color}15` }
                    ]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.costItemInfo}>
                      <Text style={styles.costItemLabel}>{item.label}</Text>
                      <Text style={styles.costItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.costItemRight}>
                    <Text style={styles.costItemAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.costItemPercentage}>
                      {percentage}%
                    </Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <Animatable.View
                      animation="slideInLeft"
                      delay={index * 100 + 200}
                      duration={800}
                      style={[
                        styles.progressBar,
                        {
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Animatable.View>
            );
          })}

          {/* Additional Information */}
          <View style={styles.additionalInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={16} color={colors.info} />
              <Text style={styles.infoText}>
                Costs are estimated based on regional factors and current market rates
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="trending-up" size={16} color={colors.warning} />
              <Text style={styles.infoText}>
                Actual costs may vary based on material availability and labor rates
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.success} />
              <Text style={styles.infoText}>
                Timeline estimates include permits and material delivery
              </Text>
            </View>
          </View>
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowStyles.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: 'bold',
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}08`,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  rangeLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  rangeText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowStyles.small,
  },
  detailsTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  costItem: {
    marginBottom: spacing.lg,
  },
  costItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  costItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  costItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  costItemInfo: {
    flex: 1,
  },
  costItemLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  costItemDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  costItemRight: {
    alignItems: 'flex-end',
  },
  costItemAmount: {
    ...typography.h6,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  costItemPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  additionalInfo: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
});

export default CostBreakdownCard;