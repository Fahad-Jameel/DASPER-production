# test_enhanced_building_analyzer.py - Test script for enhanced building analyzer
import os
import sys
import logging
from PIL import Image
import numpy as np

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_enhanced_building_analyzer():
    """Test the enhanced building analyzer"""
    try:
        from enhanced_building_analyzer import EnhancedBuildingAnalyzer
        from volume_based_cost_estimation import VolumeBasedCostEstimator
        
        logger.info("🧪 Testing Enhanced Building Analyzer...")
        
        # Initialize analyzer
        analyzer = EnhancedBuildingAnalyzer()
        cost_estimator = VolumeBasedCostEstimator()
        
        # Create a test image (random RGB image)
        test_image = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
        
        # Test building analysis
        logger.info("📐 Testing building analysis...")
        building_analysis = analyzer.analyze_building(
            image=test_image,
            building_type='residential',
            location={'city': 'Islamabad', 'region_type': 'urban'},
            use_satellite=False,  # Disable satellite for testing
            pin_location={'lat': 33.6844, 'lng': 73.0479}
        )
        
        logger.info("✅ Building analysis completed:")
        logger.info(f"   Height: {building_analysis['height_analysis']['estimated_height_m']} m")
        logger.info(f"   Area: {building_analysis['area_analysis']['estimated_area_sqm']} sqm")
        logger.info(f"   Volume: {building_analysis['volume_analysis']['estimated_volume_cubic_m']} cubic m")
        logger.info(f"   Height confidence: {building_analysis['height_analysis']['confidence']}")
        logger.info(f"   Area confidence: {building_analysis['area_analysis']['confidence']}")
        
        # Test volume-based cost estimation
        logger.info("💰 Testing volume-based cost estimation...")
        cost_results = cost_estimator.calculate_repair_cost(
            severity_score=0.5,
            damage_ratio=0.5,
            building_area_sqm=building_analysis['area_analysis']['estimated_area_sqm'],
            building_type='residential',
            regional_data={
                'region': 'Pakistan_Urban',
                'construction': 0.35,
                'materials': 0.40,
                'labor': 0.25,
                'currency': 'PKR',
                'exchange_rate': 280.0,
                'inflation_factor': 1.15,
                'market_volatility': 0.20,
                'emergency_premium': 1.25
            },
            damage_types=['structural', 'water'],
            confidence_score=0.8,
            building_height_m=building_analysis['height_analysis']['estimated_height_m'],
            building_volume_cubic_m=building_analysis['volume_analysis']['estimated_volume_cubic_m']
        )
        
        logger.info("✅ Cost estimation completed:")
        logger.info(f"   Total cost: ${cost_results['total_estimated_cost_usd']:,.2f}")
        logger.info(f"   Calculation method: {cost_results['calculation_method']}")
        logger.info(f"   Structural cost: ${cost_results['structural_cost']:,.2f}")
        logger.info(f"   Non-structural cost: ${cost_results['non_structural_cost']:,.2f}")
        logger.info(f"   Content cost: ${cost_results['content_cost']:,.2f}")
        logger.info(f"   Building dimensions: {cost_results['building_dimensions']}")
        
        # Test comparison with area-based calculation
        logger.info("🔄 Testing area-based fallback...")
        area_cost_results = cost_estimator.calculate_repair_cost(
            severity_score=0.5,
            damage_ratio=0.5,
            building_area_sqm=building_analysis['area_analysis']['estimated_area_sqm'],
            building_type='residential',
            regional_data={
                'region': 'Pakistan_Urban',
                'construction': 0.35,
                'materials': 0.40,
                'labor': 0.25,
                'currency': 'PKR',
                'exchange_rate': 280.0,
                'inflation_factor': 1.15,
                'market_volatility': 0.20,
                'emergency_premium': 1.25
            },
            damage_types=['structural', 'water'],
            confidence_score=0.8
            # No height/volume provided - should fallback to area-based
        )
        
        logger.info("✅ Area-based cost estimation completed:")
        logger.info(f"   Total cost: ${area_cost_results['total_estimated_cost_usd']:,.2f}")
        logger.info(f"   Calculation method: {area_cost_results['calculation_method']}")
        
        # Compare results
        volume_cost = cost_results['total_estimated_cost_usd']
        area_cost = area_cost_results['total_estimated_cost_usd']
        difference = abs(volume_cost - area_cost)
        percentage_diff = (difference / area_cost) * 100 if area_cost > 0 else 0
        
        logger.info("📊 Comparison Results:")
        logger.info(f"   Volume-based cost: ${volume_cost:,.2f}")
        logger.info(f"   Area-based cost: ${area_cost:,.2f}")
        logger.info(f"   Difference: ${difference:,.2f} ({percentage_diff:.1f}%)")
        
        logger.info("🎉 All tests completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def test_satellite_integration():
    """Test satellite imagery integration (requires API key)"""
    try:
        from enhanced_building_analyzer import EnhancedBuildingAnalyzer
        
        logger.info("🛰️ Testing satellite imagery integration...")
        
        # Check if Mapbox token is available
        mapbox_token = os.getenv('MAPBOX_TOKEN')
        if not mapbox_token:
            logger.warning("⚠️ MAPBOX_TOKEN not found, skipping satellite test")
            return True
        
        analyzer = EnhancedBuildingAnalyzer()
        
        # Test with a real location (Islamabad)
        test_image = Image.fromarray(np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8))
        
        building_analysis = analyzer.analyze_building(
            image=test_image,
            building_type='residential',
            location={'city': 'Islamabad', 'region_type': 'urban'},
            use_satellite=True,
            pin_location={'lat': 33.6844, 'lng': 73.0479}
        )
        
        logger.info("✅ Satellite integration test completed:")
        logger.info(f"   Satellite used: {building_analysis['area_analysis'].get('satellite_used', False)}")
        logger.info(f"   Area: {building_analysis['area_analysis']['estimated_area_sqm']} sqm")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Satellite test failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("🚀 Starting Enhanced Building Analyzer Tests...")
    
    # Test 1: Basic functionality
    success1 = test_enhanced_building_analyzer()
    
    # Test 2: Satellite integration (optional)
    success2 = test_satellite_integration()
    
    if success1 and success2:
        logger.info("🎉 All tests passed!")
        sys.exit(0)
    else:
        logger.error("❌ Some tests failed!")
        sys.exit(1)
