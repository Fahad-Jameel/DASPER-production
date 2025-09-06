import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_cost_estimation import EnhancedRegionalCostEstimator

def test_cost_estimator():
    """Test the cost estimator in isolation"""
    print("Testing EnhancedRegionalCostEstimator...")
    
    # Create estimator
    estimator = EnhancedRegionalCostEstimator()
    
    # Test data
    severity_score = 0.5
    damage_ratio = 0.5
    building_area_sqm = 100.0
    building_type = 'residential'
    regional_data = {
        'region': 'Pakistan_Urban',
        'construction': 0.35,
        'materials': 0.40,
        'labor': 0.25,
        'currency': 'PKR',
        'exchange_rate': 280.0,
        'inflation_factor': 1.15,
        'market_volatility': 0.20,
        'emergency_premium': 1.25
    }
    damage_types = ['Structural', 'Fire']
    
    print(f"Input parameters:")
    print(f"  severity_score: {severity_score} (type: {type(severity_score)})")
    print(f"  damage_ratio: {damage_ratio} (type: {type(damage_ratio)})")
    print(f"  building_area_sqm: {building_area_sqm} (type: {type(building_area_sqm)})")
    print(f"  building_type: {building_type} (type: {type(building_type)})")
    print(f"  regional_data: {regional_data} (type: {type(regional_data)})")
    print(f"  damage_types: {damage_types} (type: {type(damage_types)})")
    
    try:
        # Test the method
        result = estimator.calculate_repair_cost(
            severity_score=severity_score,
            damage_ratio=damage_ratio,
            building_area_sqm=building_area_sqm,
            building_type=building_type,
            regional_data=regional_data,
            damage_types=damage_types
        )
        
        print("✅ Cost calculation successful!")
        print(f"Result: {result}")
        
    except Exception as e:
        print(f"❌ Cost calculation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_cost_estimator() 