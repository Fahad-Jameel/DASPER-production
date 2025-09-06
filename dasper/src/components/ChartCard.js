import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import * as Animatable from 'react-native-animatable';
import { colors, typography, spacing, shadowStyles } from '../theme/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - spacing.lg * 2;

const ChartCard = ({ title, data, type = 'pie', delay = 0 }) => {
  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 35, 126, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    barPercentage: 0.7,
    fillShadowGradient: colors.primary,
    fillShadowGradientOpacity: 0.8,
  };

  const processedData = processData(data, type);

  const renderChart = () => {
    if (!processedData || processedData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    switch (type) {
      case 'pie':
        return (
          <PieChart
            data={processedData}
            width={chartWidth - spacing.xl * 2}
            height={200}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        );
      
      case 'bar':
        const barData = {
          labels: processedData.map(item => item.name?.substring(0, 8) || 'Unknown'),
          datasets: [{
            data: processedData.map(item => item.count || 0)
          }]
        };
        
        return (
          <BarChart
            data={barData}
            width={chartWidth - spacing.xl * 2}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={delay}
      duration={800}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.chartContainer}>
          {renderChart()}
        </View>

        {type === 'pie' && processedData && processedData.length > 0 && (
          <View style={styles.legend}>
            {processedData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor, 
                    { backgroundColor: item.color }
                  ]} 
                />
                <Text style={styles.legendText} numberOfLines={1}>
                  {item.name} ({item.count})
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animatable.View>
  );
};

const processData = (data, type) => {
  if (!data || !Array.isArray(data)) return [];

  const colorPalette = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.warning,
    colors.info,
    colors.success,
    '#9C27B0', // Purple
    '#FF5722', // Deep Orange
    '#607D8B', // Blue Grey
    '#795548', // Brown
  ];

  return data.map((item, index) => ({
    name: item._id || item.label || `Item ${index + 1}`,
    count: item.count || item.value || 0,
    color: colorPalette[index % colorPalette.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...shadowStyles.medium,
  },
  title: {
    ...typography.h6,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default ChartCard;