import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import RegionalCostPanel from '../components/RegionalCostPanel';
import { colors } from '../config/colors';

const RegionalCostScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <RegionalCostPanel />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default RegionalCostScreen;
