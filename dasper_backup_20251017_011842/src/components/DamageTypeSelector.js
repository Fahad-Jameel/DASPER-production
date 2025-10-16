import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const DamageTypeSelector = ({ options, selectedTypes, onSelectionChange, error }) => {
  const damageTypeIcons = {
    'Structural': 'construct',
    'Fire': 'flame',
    'Flood': 'water',
    'Earthquake': 'pulse',
    'Wind': 'leaf',
    'Settlement': 'trending-down',
    'Cracks': 'git-branch',
    'Water Damage': 'rainy',
    'Collapse': 'close-circle',
  };

  const getDamageTypeColor = (type) => {
    const colorMap = {
      'Structural': colors.primary,
      'Fire': '#FF5722',
      'Flood': '#2196F3',
      'Earthquake': '#795548',
      'Wind': '#4CAF50',
      'Settlement': '#FF9800',
      'Cracks': '#9C27B0',
      'Water Damage': '#00BCD4',
      'Collapse': '#F44336',
    };
    return colorMap[type] || colors.textSecondary;
  };

  const toggleDamageType = (type) => {
    const isSelected = selectedTypes.includes(type);
    let newSelectedTypes;
    
    if (isSelected) {
      newSelectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      newSelectedTypes = [...selectedTypes, type];
    }
    
    onSelectionChange(newSelectedTypes);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.typesGrid}>
          {options.map((type, index) => {
            const isSelected = selectedTypes.includes(type);
            const typeColor = getDamageTypeColor(type);
            
            return (
              <Animatable.View
                key={type}
                animation="fadeInRight"
                delay={index * 100}
                duration={500}
              >
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    isSelected && [styles.typeOptionSelected, { borderColor: typeColor }],
                    error && !isSelected && styles.typeOptionError
                  ]}
                  onPress={() => toggleDamageType(type)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.iconContainer,
                    isSelected && [styles.iconContainerSelected, { backgroundColor: typeColor }]
                  ]}>
                    <Ionicons
                      name={damageTypeIcons[type] || 'alert-circle'}
                      size={20}
                      color={isSelected ? colors.textLight : typeColor}
                    />
                  </View>
                  
                  <Text style={[
                    styles.typeText,
                    isSelected && [styles.typeTextSelected, { color: typeColor }]
                  ]}>
                    {type}
                  </Text>
                  
                  {isSelected && (
                    <Animatable.View
                      animation="bounceIn"
                      duration={300}
                      style={[styles.checkmark, { backgroundColor: typeColor }]}
                    >
                      <Ionicons name="checkmark" size={12} color={colors.textLight} />
                    </Animatable.View>
                  )}
                </TouchableOpacity>
              </Animatable.View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Selected Types Summary */}
      {selectedTypes.length > 0 && (
        <Animatable.View
          animation="fadeInUp"
          duration={500}
          style={styles.selectedSummary}
        >
          <Text style={styles.selectedTitle}>
            Selected ({selectedTypes.length}):
          </Text>
          <View style={styles.selectedTags}>
            {selectedTypes.map((type) => (
              <View key={type} style={[
                styles.selectedTag,
                { backgroundColor: `${getDamageTypeColor(type)}15` }
              ]}>
                <Text style={[
                  styles.selectedTagText,
                  { color: getDamageTypeColor(type) }
                ]}>
                  {type}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleDamageType(type)}
                  style={styles.removeTag}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={14}
                    color={getDamageTypeColor(type)}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animatable.View>
      )}
      
      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.helpText}>
          Select all damage types visible in the building image
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingRight: spacing.lg,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  typeOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    minWidth: 90,
    position: 'relative',
    ...shadowStyles.small,
  },
  typeOptionSelected: {
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  typeOptionError: {
    borderColor: colors.error,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainerSelected: {
    // backgroundColor set dynamically
  },
  typeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  typeTextSelected: {
    fontWeight: '600',
    // color set dynamically
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor set dynamically
  },
  selectedSummary: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
    // backgroundColor set dynamically
  },
  selectedTagText: {
    ...typography.caption,
    fontWeight: '600',
    marginRight: spacing.xs,
    // color set dynamically
  },
  removeTag: {
    padding: 2,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default DamageTypeSelector;