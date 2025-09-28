#!/bin/bash

# Enhanced Building Analyzer Dependencies Installation Script

echo "🚀 Installing Enhanced Building Analyzer Dependencies..."

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Virtual environment detected: $VIRTUAL_ENV"
else
    echo "⚠️  No virtual environment detected. Consider using one for better dependency management."
fi

# Install/upgrade pip
echo "📦 Upgrading pip..."
python3 -m pip install --upgrade pip

# Install core dependencies
echo "📦 Installing core dependencies..."
pip install numpy<2.0.0
pip install torch==2.0.0 torchvision==0.15.1
pip install opencv-python==4.7.0.72
pip install pillow==9.4.0
pip install requests==2.31.0

# Install transformers for depth estimation (optional)
echo "📦 Installing transformers for depth estimation..."
pip install transformers==4.30.0

# Install other dependencies
echo "📦 Installing other dependencies..."
pip install -r requirements.txt

echo "✅ Dependencies installation completed!"
echo ""
echo "🔧 Configuration:"
echo "   - Add MAPBOX_TOKEN to your .env file for satellite imagery (optional)"
echo "   - Add GOOGLE_MAPS_API_KEY for alternative satellite imagery (optional)"
echo ""
echo "🧪 Testing:"
echo "   Run: python3 test_enhanced_building_analyzer.py"
echo ""
echo "📚 Documentation:"
echo "   See: ENHANCED_BUILDING_ANALYSIS.md"
