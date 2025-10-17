import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/colors';

const RegionalCostPanel = () => {
  const [regionalCosts, setRegionalCosts] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    fetchRegionalCosts();
    fetchDataSources();
  }, []);

  const fetchRegionalCosts = async () => {
    try {
      const response = await fetch('http://192.168.18.73:5000/api/regional-costs');
      const data = await response.json();
      
      if (data.success) {
        setRegionalCosts(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch regional cost data');
      }
    } catch (error) {
      console.error('Error fetching regional costs:', error);
      Alert.alert('Error', 'Network error while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSources = async () => {
    try {
      const response = await fetch('http://192.168.18.73:5000/api/regional-costs/sources');
      const data = await response.json();
      
      if (data.success) {
        setSources(data.sources);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderCityCard = (cityData) => (
    <TouchableOpacity
      key={cityData.id}
      style={styles.cityCard}
      onPress={() => setSelectedCity(selectedCity === cityData.id ? null : cityData.id)}
    >
      <View style={styles.cityHeader}>
        <View>
          <Text style={styles.cityName}>{cityData.city}</Text>
          <Text style={styles.regionName}>{cityData.region_name}</Text>
        </View>
        <Ionicons
          name={selectedCity === cityData.id ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </View>

      <View style={styles.costSummary}>
        <View style={styles.costItem}>
          <Text style={styles.costLabel}>Residential</Text>
          <Text style={styles.costValue}>
            {formatCurrency(cityData.construction_costs.residential_per_sqm)}/sqm
          </Text>
        </View>
        <View style={styles.costItem}>
          <Text style={styles.costLabel}>Commercial</Text>
          <Text style={styles.costValue}>
            {formatCurrency(cityData.construction_costs.commercial_per_sqm)}/sqm
          </Text>
        </View>
        <View style={styles.costItem}>
          <Text style={styles.costLabel}>Industrial</Text>
          <Text style={styles.costValue}>
            {formatCurrency(cityData.construction_costs.industrial_per_sqm)}/sqm
          </Text>
        </View>
      </View>

      {selectedCity === cityData.id && (
        <View style={styles.detailedView}>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceTitle}>Data Source</Text>
            <Text style={styles.sourceName}>{cityData.source}</Text>
            <Text style={styles.dataType}>{cityData.data_type}</Text>
          </View>

          <View style={styles.materialCosts}>
            <Text style={styles.sectionTitle}>Material Costs</Text>
            <View style={styles.costGrid}>
              <Text style={styles.materialItem}>
                Cement: {formatCurrency(cityData.material_costs.cement_per_bag)}/bag
              </Text>
              <Text style={styles.materialItem}>
                Steel: {formatCurrency(cityData.material_costs.steel_per_kg)}/kg
              </Text>
              <Text style={styles.materialItem}>
                Bricks: {formatCurrency(cityData.material_costs.bricks_per_1000)}/1000
              </Text>
              <Text style={styles.materialItem}>
                Sand: {formatCurrency(cityData.material_costs.sand_per_cubic_meter)}/m³
              </Text>
            </View>
          </View>

          <View style={styles.laborCosts}>
            <Text style={styles.sectionTitle}>Labor Costs (per day)</Text>
            <View style={styles.costGrid}>
              <Text style={styles.laborItem}>
                Skilled: {formatCurrency(cityData.labor_costs.skilled_labor_per_day)}
              </Text>
              <Text style={styles.laborItem}>
                Mason: {formatCurrency(cityData.labor_costs.mason_per_day)}
              </Text>
              <Text style={styles.laborItem}>
                Carpenter: {formatCurrency(cityData.labor_costs.carpenter_per_day)}
              </Text>
              <Text style={styles.laborItem}>
                Electrician: {formatCurrency(cityData.labor_costs.electrician_per_day)}
              </Text>
            </View>
          </View>

          <View style={styles.factors}>
            <Text style={styles.sectionTitle}>Economic Factors</Text>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Inflation Factor:</Text>
              <Text style={styles.factorValue}>{(cityData.inflation_factor * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.factorRow}>
              <Text style={styles.factorLabel}>Market Volatility:</Text>
              <Text style={styles.factorValue}>{(cityData.market_volatility * 100).toFixed(1)}%</Text>
            </View>
          </View>

          <Text style={styles.notes}>{cityData.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDataSource = (source) => (
    <View key={source.source} style={styles.sourceCard}>
      <Text style={styles.sourceTitle}>{source.source}</Text>
      <Text style={styles.recordCount}>{source.record_count} records</Text>
      <Text style={styles.sourceUrl}>{source.source_url}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Regional Cost Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Regional Construction Cost Data</Text>
        <Text style={styles.subtitle}>
          Official Pakistan Government Sources
        </Text>
      </View>

      <View style={styles.sourcesSection}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.sourcesGrid}>
          {sources.map(renderDataSource)}
        </View>
      </View>

      <View style={styles.citiesSection}>
        <Text style={styles.sectionTitle}>Regional Cost Data</Text>
        <Text style={styles.sectionSubtitle}>
          Tap on any city to view detailed cost breakdown
        </Text>
        {regionalCosts.map(renderCityCard)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data sourced from official Pakistan government agencies
        </Text>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  sourcesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sourceCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  recordCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sourceUrl: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  citiesSection: {
    padding: 20,
  },
  cityCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  regionName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  costItem: {
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  detailedView: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceInfo: {
    marginBottom: 16,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  dataType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  materialCosts: {
    marginBottom: 16,
  },
  laborCosts: {
    marginBottom: 16,
  },
  costGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  materialItem: {
    fontSize: 12,
    color: colors.text,
    width: '48%',
    marginBottom: 8,
  },
  laborItem: {
    fontSize: 12,
    color: colors.text,
    width: '48%',
    marginBottom: 8,
  },
  factors: {
    marginBottom: 16,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 14,
    color: colors.text,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default RegionalCostPanel;
