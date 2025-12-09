# test_model_inference.py - Unit tests for DamageNet model inference
import unittest
import torch
import numpy as np
from PIL import Image
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from inference import DamageAssessmentPipeline
from model import DamageNet

class TestModelInference(unittest.TestCase):
    """Unit tests for model inference pipeline"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all tests"""
        cls.model_path = 'damagenet_json_best.pth'
        cls.device = 'cpu'
        
        # Check if model file exists
        if not os.path.exists(cls.model_path):
            print(f"⚠️ Warning: Model file {cls.model_path} not found. Some tests may be skipped.")
            cls.model_available = False
        else:
            cls.model_available = True
            try:
                cls.pipeline = DamageAssessmentPipeline(cls.model_path, device=cls.device)
            except Exception as e:
                print(f"⚠️ Warning: Could not load model: {e}")
                cls.model_available = False
    
    def setUp(self):
        """Create test image for each test"""
        # Create a simple test image (224x224 RGB)
        self.test_image = Image.new('RGB', (224, 224), color='red')
        self.test_image_path = 'test_image.jpg'
        self.test_image.save(self.test_image_path)
    
    def tearDown(self):
        """Clean up test files"""
        if os.path.exists(self.test_image_path):
            os.remove(self.test_image_path)
    
    def test_model_loading(self):
        """Test that model loads successfully"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        self.assertIsNotNone(self.pipeline.model)
        self.assertEqual(self.pipeline.device.type, self.device)
        print("✅ Model loaded successfully")
    
    def test_model_architecture(self):
        """Test model architecture is correct"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        model = self.pipeline.model
        self.assertIsInstance(model, torch.nn.Module)
        self.assertTrue(hasattr(model, 'backbone'))
        self.assertTrue(hasattr(model, 'head'))
        print("✅ Model architecture is correct")
    
    def test_image_preprocessing(self):
        """Test image preprocessing"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        # Test PIL image input
        input_tensor = self.pipeline.transform(self.test_image)
        self.assertEqual(input_tensor.shape, (3, 224, 224))
        print("✅ Image preprocessing works correctly")
    
    def test_severity_prediction(self):
        """Test damage severity prediction"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        result = self.pipeline.predict_damage_severity(self.test_image_path)
        
        # Check result structure
        self.assertIn('severity_score', result)
        self.assertIn('severity_category', result)
        self.assertIn('confidence', result)
        self.assertIn('predicted_class', result)
        
        # Check severity score is in valid range
        self.assertGreaterEqual(result['severity_score'], 0.0)
        self.assertLessEqual(result['severity_score'], 1.0)
        
        # Check severity category is valid
        valid_categories = ['minimal', 'moderate', 'severe', 'destructive']
        self.assertIn(result['severity_category'], valid_categories)
        
        print(f"✅ Severity prediction: {result['severity_score']:.3f} ({result['severity_category']})")
    
    def test_severity_categorization(self):
        """Test severity score to category mapping"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        # Test different severity ranges
        test_cases = [
            (0.1, 'minimal'),
            (0.3, 'moderate'),
            (0.6, 'severe'),
            (0.9, 'destructive')
        ]
        
        for score, expected_category in test_cases:
            category = self.pipeline._severity_to_category(score)
            self.assertEqual(category, expected_category)
        
        print("✅ Severity categorization works correctly")
    
    def test_output_range_clamping(self):
        """Test that output scores are clamped to [0, 1]"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        result = self.pipeline.predict_damage_severity(self.test_image_path)
        severity_score = result['severity_score']
        
        self.assertGreaterEqual(severity_score, 0.0)
        self.assertLessEqual(severity_score, 1.0)
        print(f"✅ Output clamping: {severity_score:.3f} is in valid range [0, 1]")
    
    def test_cost_estimation_integration(self):
        """Test complete assessment with cost estimation"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        result = self.pipeline.assess_damage_and_cost(
            image_path_or_pil=self.test_image_path,
            building_area_sqm=100.0,
            building_type='residential',
            region='Pakistan'
        )
        
        # Check result structure
        self.assertIn('damage_assessment', result)
        self.assertIn('cost_estimation', result)
        self.assertIn('summary', result)
        
        # Check cost estimation has required fields
        cost_est = result['cost_estimation']
        self.assertIn('total_estimated_cost_pkr', cost_est)
        self.assertGreater(cost_est['total_estimated_cost_pkr'], 0)
        
        print(f"✅ Cost estimation: {cost_est['total_estimated_cost_pkr']:,.2f} PKR")
    
    def test_model_eval_mode(self):
        """Test that model is in evaluation mode"""
        if not self.model_available:
            self.skipTest("Model not available")
        
        self.assertFalse(self.pipeline.model.training)
        print("✅ Model is in evaluation mode")

if __name__ == '__main__':
    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestModelInference)
    
    # Run tests with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {(result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100:.1f}%")
    print("="*60)

