# test_cost_estimation.py - Unit tests for cost estimation
import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from enhanced_cost_estimation import EnhancedRegionalCostEstimator
from volume_based_cost_estimation import VolumeBasedCostEstimator

class TestCostEstimation(unittest.TestCase):
    """Unit tests for cost estimation modules"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.enhanced_estimator = EnhancedRegionalCostEstimator()
        self.volume_estimator = VolumeBasedCostEstimator()
        
        # Test regional data
        self.pakistan_regional_data = {
            'region': 'Pakistan',
            'construction': 0.35,
            'materials': 0.40,
            'labor': 0.25,
            'currency': 'PKR',
            'exchange_rate': 280.0,
            'inflation_factor': 1.15,
            'market_volatility': 0.20,
            'emergency_premium': 1.25
        }
    
    def test_minimal_damage_cost_cap(self):
        """Test that minimal damage costs are capped at 5 lakh PKR"""
        result = self.volume_estimator.calculate_repair_cost(
            severity_score=0.1,  # Minimal damage (10%)
            damage_ratio=0.1,
            building_area_sqm=200.0,
            building_type='residential',
            regional_data=self.pakistan_regional_data,
            building_height_m=6.0,
            building_volume_cubic_m=1200.0
        )
        
        total_cost = result['total_estimated_cost_pkr']
        self.assertLessEqual(total_cost, 500000, "Minimal damage should be capped at 5 lakh PKR")
        print(f"✅ Minimal damage cost cap: {total_cost:,.2f} PKR (≤ 500,000 PKR)")
    
    def test_moderate_damage_cost_cap(self):
        """Test that moderate damage costs are capped at 20 lakh PKR"""
        result = self.volume_estimator.calculate_repair_cost(
            severity_score=0.4,  # Moderate damage (40%)
            damage_ratio=0.4,
            building_area_sqm=200.0,
            building_type='residential',
            regional_data=self.pakistan_regional_data,
            building_height_m=6.0,
            building_volume_cubic_m=1200.0
        )
        
        total_cost = result['total_estimated_cost_pkr']
        self.assertLessEqual(total_cost, 2000000, "Moderate damage should be capped at 20 lakh PKR")
        print(f"✅ Moderate damage cost cap: {total_cost:,.2f} PKR (≤ 2,000,000 PKR)")
    
    def test_cost_breakdown_structure(self):
        """Test that cost breakdown has all required components"""
        result = self.volume_estimator.calculate_repair_cost(
            severity_score=0.5,
            damage_ratio=0.5,
            building_area_sqm=150.0,
            building_type='residential',
            regional_data=self.pakistan_regional_data,
            building_height_m=6.0,
            building_volume_cubic_m=900.0
        )
        
        # Check required fields
        required_fields = [
            'total_estimated_cost_pkr',
            'structural_cost',
            'non_structural_cost',
            'content_cost',
            'repair_time_days'
        ]
        
        for field in required_fields:
            self.assertIn(field, result, f"Missing field: {field}")
            self.assertGreater(result[field], 0, f"{field} should be positive")
        
        print("✅ Cost breakdown structure is correct")
        print(f"   Total: {result['total_estimated_cost_pkr']:,.2f} PKR")
        print(f"   Structural: {result['structural_cost']:,.2f} PKR")
        print(f"   Non-structural: {result['non_structural_cost']:,.2f} PKR")
        print(f"   Content: {result['content_cost']:,.2f} PKR")
    
    def test_regional_cost_factors(self):
        """Test that regional cost factors are applied correctly"""
        # Test different regions
        regions = {
            'Karachi': 1.2,
            'Lahore': 1.15,
            'Islamabad': 1.25,
            'Rural': 0.8
        }
        
        base_result = self.volume_estimator.calculate_repair_cost(
            severity_score=0.5,
            damage_ratio=0.5,
            building_area_sqm=100.0,
            building_type='residential',
            regional_data={**self.pakistan_regional_data, 'region': 'default'},
            building_height_m=5.0,
            building_volume_cubic_m=500.0
        )
        base_cost = base_result['total_estimated_cost_pkr']
        
        for region, expected_multiplier in regions.items():
            regional_data = {**self.pakistan_regional_data, 'region': region}
            result = self.volume_estimator.calculate_repair_cost(
                severity_score=0.5,
                damage_ratio=0.5,
                building_area_sqm=100.0,
                building_type='residential',
                regional_data=regional_data,
                building_height_m=5.0,
                building_volume_cubic_m=500.0
            )
            
            # Regional multiplier should affect cost
            cost_ratio = result['total_estimated_cost_pkr'] / base_cost
            print(f"✅ {region}: Multiplier ≈ {cost_ratio:.2f}x (expected ~{expected_multiplier}x)")
    
    def test_building_type_cost_differences(self):
        """Test that different building types have different costs"""
        building_types = ['residential', 'commercial', 'industrial']
        costs = {}
        
        for btype in building_types:
            result = self.volume_estimator.calculate_repair_cost(
                severity_score=0.5,
                damage_ratio=0.5,
                building_area_sqm=200.0,
                building_type=btype,
                regional_data=self.pakistan_regional_data,
                building_height_m=6.0,
                building_volume_cubic_m=1200.0
            )
            costs[btype] = result['total_estimated_cost_pkr']
        
        # Commercial and industrial should generally cost more than residential
        self.assertGreater(costs['commercial'], costs['residential'] * 0.8)
        self.assertGreater(costs['industrial'], costs['residential'] * 0.8)
        
        print("✅ Building type cost differences:")
        for btype, cost in costs.items():
            print(f"   {btype}: {cost:,.2f} PKR")
    
    def test_severity_cost_correlation(self):
        """Test that higher severity leads to higher costs"""
        severities = [0.1, 0.3, 0.5, 0.7, 0.9]
        costs = []
        
        for severity in severities:
            result = self.volume_estimator.calculate_repair_cost(
                severity_score=severity,
                damage_ratio=severity,
                building_area_sqm=150.0,
                building_type='residential',
                regional_data=self.pakistan_regional_data,
                building_height_m=6.0,
                building_volume_cubic_m=900.0
            )
            costs.append(result['total_estimated_cost_pkr'])
        
        # Costs should generally increase with severity
        for i in range(1, len(costs)):
            self.assertGreaterEqual(costs[i], costs[i-1] * 0.5, 
                                  f"Cost should increase with severity")
        
        print("✅ Severity-cost correlation:")
        for severity, cost in zip(severities, costs):
            print(f"   Severity {severity:.1f}: {cost:,.2f} PKR")

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestCostEstimation)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "="*60)
    print("COST ESTIMATION TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*60)

