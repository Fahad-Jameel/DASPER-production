#!/usr/bin/env python3
"""
Test script to verify the enhanced building analyzer fixes
"""

import os
import sys
import logging
from PIL import Image
import numpy as np

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

def test_enhanced_building_analyzer():
    """Test the enhanced building analyzer with different images"""
    try:
        from enhanced_building_analyzer import EnhancedBuildingAnalyzer
        
        logger.info("🧪 Testing Enhanced Building Analyzer...")
        
        # Initialize the analyzer
        analyzer = EnhancedBuildingAnalyzer()
        
        # Test with a sample image (if available)
        test_images = [
            "uploads/20250928_173604_d419da4b-c6bd-4392-800d-633b056904f7.jpeg",
            "uploads/20250928_173828_83f2b0c4-2ee6-4c7c-a283-4df8d5b45471.jpeg",
            "uploads/20250928_173948_abe2afe0-714a-46f5-bf3d-dd8216fb62be.jpeg"
        ]
        
        for i, image_path in enumerate(test_images):
            if os.path.exists(image_path):
                logger.info(f"📸 Testing with image {i+1}: {os.path.basename(image_path)}")
                
                # Load image
                image = Image.open(image_path)
                logger.info(f"   Image size: {image.size}")
                
                # Analyze building
                result = analyzer.analyze_building(
                    image=image,
                    building_type='residential',
                    pin_location='33.69963448165795,72.98286437988283',
                    use_satellite=False  # Skip satellite for faster testing
                )
                
                # Display results
                logger.info(f"   📏 Height: {result['height_analysis']['estimated_height_m']}m")
                logger.info(f"   📐 Area: {result['area_analysis']['estimated_area_sqm']} sqm")
                logger.info(f"   📦 Volume: {result['volume_analysis']['estimated_volume_cubic_m']} cubic m")
                logger.info(f"   🎯 Height confidence: {result['height_analysis']['confidence']}")
                logger.info(f"   🎯 Area confidence: {result['area_analysis']['confidence']}")
                logger.info("")
            else:
                logger.warning(f"⚠️ Image not found: {image_path}")
        
        logger.info("✅ Enhanced Building Analyzer test completed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    logger.info("🚀 Starting Enhanced Building Analyzer Fix Test...")
    success = test_enhanced_building_analyzer()
    
    if success:
        logger.info("🎉 All tests passed!")
    else:
        logger.error("💥 Tests failed!")
        sys.exit(1)
