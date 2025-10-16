import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Slider from '@react-native-community/slider';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const FilterModal = ({ 
  visible, 
  onClose, 
  filters, 
  onApplyFilters, 
  alertTypes 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const severityLevels = [
    { value: 'low', label: 'Low', color: colors.success },
    { value: 'medium', label: 'Medium', color: colors.warning },
    { value: 'high', label: 'High', color: colors.error },
  ];

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      types: [],
      severity: [],
      distance: 100,
    };
    setLocalFilters(resetFilters);
  };

  const toggleType = (type) => {
    const types = localFilters.types.includes(type)
      ? localFilters.types.filter(t => t !== type)
      : [...localFilters.types, type];
    
    setLocalFilters({ ...localFilters, types });
  };

  const toggleSeverity = (severity) => {
    const severities = localFilters.severity.includes(severity)
      ? localFilters.severity.filter(s => s !== severity)
      : [...localFilters.severity, severity];
    
    setLocalFilters({ ...localFilters, severity: severities });
  };

  const updateDistance = (distance) => {
    setLocalFilters({ ...localFilters, distance });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalBackdrop}>
          <Animatable.View
            animation="slideInUp"
            duration={300}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Alerts</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Alert Types */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Alert Types</Text>
                <View style={styles.typesGrid}>
                  {alertTypes.map((type) => {
                    const isSelected = localFilters.types.includes(type.type);
                    
                    return (
                      <TouchableOpacity
                        key={type.type}
                        style={[
                          styles.typeChip,
                          isSelected && [
                            styles.typeChipSelected,
                            { backgroundColor: type.color }
                          ]
                        ]}
                        onPress={() => toggleType(type.type)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={type.icon}
                          size={18}
                          color={isSelected ? colors.textLight : type.color}
                        />
                        <Text style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextSelected
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Severity Levels */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Severity Levels</Text>
                <View style={styles.severityGrid}>
                  {severityLevels.map((level) => {
                    const isSelected = localFilters.severity.includes(level.value);
                    
                    return (
                      <TouchableOpacity
                        key={level.value}
                        style={[
                          styles.severityChip,
                          isSelected && [
                            styles.severityChipSelected,
                            { backgroundColor: level.color }
                          ]
                        ]}
                        onPress={() => toggleSeverity(level.value)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.severityIndicator,
                          { backgroundColor: level.color }
                        ]} />
                        <Text style={[
                          styles.severityChipText,
                          isSelected && styles.severityChipTextSelected
                        ]}>
                          {level.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Distance Range */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Distance Range</Text>
                <View style={styles.distanceContainer}>
                  <Text style={styles.distanceLabel}>
                    Within {localFilters.distance === 1000 ? 'All' : `${localFilters.distance}km`}
                  </Text>
                  <Slider
                    style={styles.distanceSlider}
                    minimumValue={5}
                    maximumValue={1000}
                    value={localFilters.distance}
                    onValueChange={updateDistance}
                    step={5}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.border}
                    thumbStyle={styles.sliderThumb}
                  />
                  <View style={styles.distanceLabels}>
                    <Text style={styles.distanceLabelText}>5km</Text>
                    <Text style={styles.distanceLabelText}>All Areas</Text>
                  </View>
                </View>
              </View>

              {/* Filter Summary */}
              <View style={styles.filterSummary}>
                <Text style={styles.summaryTitle}>Active Filters</Text>
                
                {localFilters.types.length > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Types:</Text>
                    <Text style={styles.summaryValue}>
                      {localFilters.types.length} selected
                    </Text>
                  </View>
                )}
                
                {localFilters.severity.length > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Severity:</Text>
                    <Text style={styles.summaryValue}>
                      {localFilters.severity.length} levels
                    </Text>
                  </View>
                )}
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Distance:</Text>
                  <Text style={styles.summaryValue}>
                    {localFilters.distance === 1000 ? 'All areas' : `${localFilters.distance}km`}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={colors.primaryGradient}
                  style={styles.applyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                  <Ionicons name="checkmark" size={20} color={colors.textLight} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    ...shadowStyles.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h5,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipSelected: {
    borderColor: 'transparent',
  },
  typeChipText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  typeChipTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  severityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityChipSelected: {
    borderColor: 'transparent',
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  severityChipText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  severityChipTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
  },
  distanceContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distanceLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  distanceSlider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  distanceLabelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterSummary: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  applyButtonText: {
    ...typography.button,
    color: colors.textLight,
    marginRight: spacing.sm,
  },
});

export default FilterModal;