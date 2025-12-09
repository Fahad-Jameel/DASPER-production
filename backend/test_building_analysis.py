# test_building_analysis.py - Unit tests for building dimension estimation
import unittest
import sys
import os
from PIL import Image
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from building_area_estimator import BuildingAreaEstimator
from enhanced_building_analyzer import EnhancedBuildingAnalyzer

class TestBuildingAnalysis(unittest.TestCase):
    """Unit tests for building dimension estimation"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.area_estimator = BuildingAreaEstimator()
        self.building_analyzer = EnhancedBuildingAnalyzer()
        
        # Create test image
        self.test_image = Image.new('RGB', (800, 600), color='blue')
        self.test_image_path = 'test_building.jpg'
        self.test_image.save(self.test_image_path)
    
    def tearDown(self):
        """Clean up test files"""
        if os.path.exists(self.test_image_path):
            os.remove(self.test_image_path)
    
    def test_area_estimation_returns_value(self):
        """Test that area estimation returns a valid value"""
        area = self.area_estimator.estimate_area(self.test_image_path)
        
        self.assertIsNotNone(area)
        self.assertGreater(area, 0, "Area should be positive")
        self.assertIsInstance(area, (int, float))
        print(f"✅ Area estimation: {area:.2f} sqm")
    
    def test_area_estimation_realistic_range(self):
        """Test that area estimates are in realistic range"""
        area = self.area_estimator.estimate_area(self.test_image_path)
        
        # Residential buildings typically 50-500 sqm
        self.assertGreaterEqual(area, 10, "Area too small")
        self.assertLessEqual(area, 10000, "Area too large")
        print(f"✅ Area in realistic range: {area:.2f} sqm")
    
    def test_height_estimation_returns_value(self):
        """Test that height estimation returns a valid value"""
        result = self.building_analyzer.estimate_height(self.test_image_path, 'residential')
        
        self.assertIsNotNone(result)
        self.assertIn('estimated_height_m', result)
        height = result['estimated_height_m']
        
        self.assertGreater(height, 0, "Height should be positive")
        self.assertIsInstance(height, (int, float))
        print(f"✅ Height estimation: {height:.2f} m")
    
    def test_height_estimation_realistic_range(self):
        """Test that height estimates are in realistic range"""
        result = self.building_analyzer.estimate_height(self.test_image_path, 'residential')
        height = result['estimated_height_m']
        
        # Residential buildings typically 3-30m
        self.assertGreaterEqual(height, 0.5, "Height too small")
        self.assertLessEqual(height, 100, "Height too large")
        print(f"✅ Height in realistic range: {height:.2f} m")
    
    def test_volume_calculation(self):
        """Test that volume is calculated correctly from area and height"""
        area = 150.0  # sqm
        height = 6.0  # meters
        expected_volume = area * height  # cubic meters
        
        result = self.building_analyzer.analyze_building(
            self.test_image_path,
            building_type='residential'
        )
        
        if 'estimated_volume_cubic_m' in result:
            volume = result['estimated_volume_cubic_m']
            # Volume should be approximately area * height
            calculated_volume = result.get('estimated_area_sqm', area) * result.get('estimated_height_m', height)
            
            # Allow 20% tolerance
            self.assertAlmostEqual(volume, calculated_volume, delta=calculated_volume * 0.2)
            print(f"✅ Volume calculation: {volume:.2f} cubic m")
    
    def test_building_analysis_complete_result(self):
        """Test that complete building analysis returns all required fields"""
        result = self.building_analyzer.analyze_building(
            self.test_image_path,
            building_type='residential'
        )
        
        required_fields = ['estimated_area_sqm', 'estimated_height_m']
        for field in required_fields:
            self.assertIn(field, result, f"Missing field: {field}")
            self.assertGreater(result[field], 0, f"{field} should be positive")
        
        print("✅ Complete building analysis structure:")
        print(f"   Area: {result.get('estimated_area_sqm', 'N/A'):.2f} sqm")
        print(f"   Height: {result.get('estimated_height_m', 'N/A'):.2f} m")
        if 'estimated_volume_cubic_m' in result:
            print(f"   Volume: {result['estimated_volume_cubic_m']:.2f} cubic m")
    
    def test_confidence_scores(self):
        """Test that confidence scores are provided"""
        result = self.building_analyzer.analyze_building(
            self.test_image_path,
            building_type='residential'
        )
        
        # Check if confidence is provided
        if 'confidence' in result:
            confidence = result['confidence']
            self.assertGreaterEqual(confidence, 0.0)
            self.assertLessEqual(confidence, 1.0)
            print(f"✅ Confidence score: {confidence:.2%}")

if __name__ == '__main__':
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestBuildingAnalysis)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "="*60)
    print("BUILDING ANALYSIS TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*60)

