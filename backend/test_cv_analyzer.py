#!/usr/bin/env python3
"""
Test script for Gemini Building Analyzer
Tests the new AI-powered building height and area estimation
"""

import os
import sys
from PIL import Image
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_cv_analyzer():
    """Test the Gemini building analyzer with a sample image"""
    
    try:
        # Import the analyzer
        from cv_building_analyzer import CVBuildingAnalyzer
        
        # Initialize analyzer
        analyzer = CVBuildingAnalyzer()
        
        if not analyzer.cv_model:
            logger.error("❌ Gemini model not initialized. Check GEMINI_API_KEY")
            return False
        
        # Test with a sample image (you can replace this with an actual building image)
        # For now, create a simple test image
        test_image = create_test_image()
        
        # Test analysis
        logger.info("🧪 Testing Gemini building analyzer...")
        
        result = analyzer.analyze_building_with_cv_model(
            image=test_image,
            building_type='residential',
            location={'region_type': 'urban'},
            pin_location="33.6844,73.0479"  # Islamabad coordinates
        )
        
        # Display results
        logger.info("📊 Analysis Results:")
        logger.info(f"   Height: {result['height_analysis']['estimated_height_m']}m")
        logger.info(f"   Area: {result['area_analysis']['estimated_area_sqm']} sqm")
        logger.info(f"   Volume: {result['volume_analysis']['estimated_volume_cubic_m']} cubic m")
        logger.info(f"   Confidence: {result['height_analysis']['confidence']}")
        logger.info(f"   Method: {result['height_analysis']['method']}")
        
        if 'cv_analysis' in result:
            cv_data = result['cv_analysis']
            logger.info("🤖 Gemini Insights:")
            logger.info(f"   Building Type Detected: {cv_data.get('building_type_detected', 'N/A')}")
            logger.info(f"   Architectural Features: {cv_data.get('architectural_features', [])}")
            logger.info(f"   Construction Materials: {cv_data.get('construction_materials', [])}")
            logger.info(f"   Age Estimate: {cv_data.get('age_estimate', 'N/A')}")
            logger.info(f"   Condition: {cv_data.get('condition_assessment', 'N/A')}")
        
        logger.info("✅ Gemini analyzer test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Gemini analyzer test failed: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def create_test_image():
    """Create a simple test image for testing"""
    from PIL import Image, ImageDraw
    
    # Create a simple building-like image
    img = Image.new('RGB', (800, 600), color='lightblue')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple building
    # Building base
    draw.rectangle([300, 400, 500, 500], fill='gray', outline='black', width=2)
    
    # Building top
    draw.rectangle([300, 200, 500, 400], fill='lightgray', outline='black', width=2)
    
    # Windows
    for i in range(3):
        for j in range(2):
            x = 320 + i * 60
            y = 220 + j * 80
            draw.rectangle([x, y, x+40, y+50], fill='darkblue', outline='black')
    
    # Door
    draw.rectangle([380, 450, 420, 500], fill='brown', outline='black')
    
    # Roof
    draw.polygon([(280, 200), (400, 150), (520, 200)], fill='red', outline='black')
    
    return img

def test_with_real_image():
    """Test with a real building image if available"""
    try:
        # Look for existing uploaded images
        uploads_dir = 'uploads'
        if os.path.exists(uploads_dir):
            image_files = [f for f in os.listdir(uploads_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            if image_files:
                # Use the most recent image
                latest_image = max(image_files, key=lambda x: os.path.getctime(os.path.join(uploads_dir, x)))
                image_path = os.path.join(uploads_dir, latest_image)
                
                logger.info(f"📸 Testing with real image: {latest_image}")
                
                from cv_building_analyzer import CVBuildingAnalyzer
                analyzer = CVBuildingAnalyzer()
                
                if analyzer.cv_model:
                    result = analyzer.analyze_building_with_cv_model(
                        image=image_path,
                        building_type='residential',
                        location={'region_type': 'urban'},
                        pin_location="33.6844,73.0479"
                    )
                    
                    logger.info("📊 Real Image Analysis Results:")
                    logger.info(f"   Height: {result['height_analysis']['estimated_height_m']}m")
                    logger.info(f"   Area: {result['area_analysis']['estimated_area_sqm']} sqm")
                    logger.info(f"   Volume: {result['volume_analysis']['estimated_volume_cubic_m']} cubic m")
                    logger.info(f"   Confidence: {result['height_analysis']['confidence']}")
                    
                    if 'cv_analysis' in result:
                        cv_data = result['cv_analysis']
                        logger.info("🤖 Gemini Insights:")
                        logger.info(f"   Building Type: {cv_data.get('building_type_detected', 'N/A')}")
                        logger.info(f"   Features: {cv_data.get('architectural_features', [])}")
                        logger.info(f"   Materials: {cv_data.get('construction_materials', [])}")
                        logger.info(f"   Age: {cv_data.get('age_estimate', 'N/A')}")
                        logger.info(f"   Condition: {cv_data.get('condition_assessment', 'N/A')}")
                    
                    return True
                else:
                    logger.warning("⚠️ Gemini model not available")
                    return False
            else:
                logger.info("📁 No images found in uploads directory")
                return False
        else:
            logger.info("📁 Uploads directory not found")
            return False
            
    except Exception as e:
        logger.error(f"❌ Real image test failed: {e}")
        return False

def main():
    """Main test function"""
    logger.info("🚀 Starting Gemini Building Analyzer Tests")
    logger.info("=" * 50)
    
    # Check if Gemini API key is available
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        logger.error("❌ GEMINI_API_KEY not found in environment variables")
        logger.info("💡 Please set your Gemini API key in the .env file")
        return False
    
    logger.info("✅ CV Model API key found")
    
    # Test 1: Basic functionality with test image
    logger.info("\n🧪 Test 1: Basic functionality with test image")
    test1_success = test_cv_analyzer()
    
    # Test 2: Real image test (if available)
    logger.info("\n🧪 Test 2: Real image analysis")
    test2_success = test_with_real_image()
    
    # Summary
    logger.info("\n📋 Test Summary:")
    logger.info(f"   Test 1 (Basic): {'✅ PASSED' if test1_success else '❌ FAILED'}")
    logger.info(f"   Test 2 (Real Image): {'✅ PASSED' if test2_success else '❌ FAILED'}")
    
    if test1_success or test2_success:
        logger.info("🎉 CV Building Analyzer is working!")
        return True
    else:
        logger.error("❌ All tests failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
