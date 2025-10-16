import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing } from '../theme/theme';

const TabSelector = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.activeTab
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            {isActive && (
              <Animatable.View
                animation="slideInLeft"
                duration={300}
                style={styles.activeBackground}
              />
            )}
            
            <View style={styles.tabContent}>
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? colors.primary : colors.textLight}
                  style={styles.tabIcon}
                />
              )}
              <Text style={[
                styles.tabText,
                isActive && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
  },
  activeTab: {
    // Active styles handled by background
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.textLight,
    borderRadius: 20,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  tabIcon: {
    marginRight: spacing.xs,
  },
  tabText: {
    ...typography.body2,
    color: colors.textLight,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
  },
});

export default TabSelector;