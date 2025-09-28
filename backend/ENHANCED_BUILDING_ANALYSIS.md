# Enhanced Building Analysis - Height and Volume Estimation

## Overview

This document describes the enhanced building analysis system that estimates both **height** and **area** from images to calculate building **volume** for more accurate cost estimation.

## Key Features

### 🏗️ **Height Estimation**
- **Depth-based estimation** using ZoeDepth/MiDaS models
- **Shadow analysis** for height calculation
- **Perspective analysis** using vertical line detection
- **Feature-based estimation** from architectural elements (floors, windows)

### 📐 **Area Estimation**
- **Traditional computer vision** (existing method)
- **Satellite imagery integration** using Mapbox API
- **Enhanced segmentation** for building footprint detection
- **Multi-method fusion** for improved accuracy

### 📊 **Volume Calculation**
- **Volume = Height × Area**
- **Volume-based cost estimation** (more accurate than area-only)
- **Fallback to area-based** when height data unavailable

## Architecture

```
Image Input
    ↓
Enhanced Building Analyzer
    ├── Height Estimation
    │   ├── Depth Analysis (ZoeDepth)
    │   ├── Shadow Analysis
    │   ├── Perspective Analysis
    │   └── Feature Analysis
    ├── Area Estimation
    │   ├── Traditional CV
    │   ├── Satellite Imagery
    │   └── Enhanced Segmentation
    └── Volume Calculation
        ↓
Volume-Based Cost Estimator
    ├── Volume-based pricing
    ├── Regional factors
    └── Damage multipliers
```

## Implementation Details

### 1. Enhanced Building Analyzer (`enhanced_building_analyzer.py`)

#### Height Estimation Methods:

**A. Depth-based Estimation**
```python
def _estimate_height_from_depth(self, image):
    # Uses ZoeDepth/MiDaS for monocular depth estimation
    # Analyzes depth variation in building region
    # Converts depth to height using scaling factors
```

**B. Shadow Analysis**
```python
def _estimate_height_from_shadows(self, img_array):
    # Detects shadows using HSV color space
    # Measures shadow length
    # Estimates height using sun angle assumptions
```

**C. Perspective Analysis**
```python
def _estimate_height_from_perspective(self, img_array, building_type):
    # Detects vertical lines (building edges)
    # Measures line lengths
    # Converts to real height using perspective
```

**D. Feature-based Estimation**
```python
def _estimate_height_from_features(self, img_array, building_type):
    # Detects horizontal lines (floors)
    # Counts floors from line clustering
    # Calculates height = floors × floor_height
```

#### Area Estimation Methods:

**A. Satellite Imagery Integration**
```python
def _estimate_area_from_satellite(self, pin_location, building_type):
    # Downloads satellite image from Mapbox
    # Segments building footprint
    # Converts pixels to square meters
```

**B. Enhanced Segmentation**
```python
def _segment_building_footprint(self, satellite_image):
    # Uses color-based segmentation
    # Finds largest connected component
    # Returns building mask
```

### 2. Volume-Based Cost Estimator (`volume_based_cost_estimation.py`)

#### Cost Calculation:
```python
def calculate_repair_cost(self, severity_score, damage_ratio, building_area_sqm, 
                        building_type, regional_data, damage_types=None, 
                        confidence_score=1.0, ai_analysis=None, 
                        building_height_m=None, building_volume_cubic_m=None):
    # Uses volume-based pricing when available
    # Falls back to area-based pricing
    # Applies regional and damage multipliers
```

#### Pricing Structure:
- **Volume-based**: Cost per cubic meter
- **Area-based**: Cost per square meter (fallback)
- **Regional factors**: Pakistan-specific pricing
- **Damage multipliers**: Type-specific adjustments

## API Integration

### Updated Assessment Endpoint

The `/api/assess` endpoint now returns enhanced data:

```json
{
  "success": true,
  "assessment_id": "...",
  "message": "Enhanced damage assessment completed successfully",
  "building_area_sqm": 150.5,
  "building_height_m": 6.2,
  "building_volume_cubic_m": 933.1,
  "calculation_method": "volume_based",
  "estimated_cost": 45000.0,
  "building_dimensions": {
    "area_sqm": 150.5,
    "height_m": 6.2,
    "volume_cubic_m": 933.1
  },
  "enhanced_analysis": {
    "height_confidence": 0.75,
    "area_confidence": 0.82,
    "volume_confidence": 0.78,
    "satellite_used": true
  }
}
```

### New Response Fields:
- `building_height_m`: Estimated building height in meters
- `building_volume_cubic_m`: Calculated volume in cubic meters
- `calculation_method`: "volume_based" or "area_based"
- `enhanced_analysis`: Confidence scores and method details

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Satellite imagery (optional)
MAPBOX_TOKEN=your_mapbox_token_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
BING_MAPS_API_KEY=your_bing_maps_key_here

# Model configuration
MODEL_PATH=damagenet_json_best.pth
MEMORY_THRESHOLD_PERCENT=80
```

### Dependencies

Updated `requirements.txt`:
```
transformers==4.30.0  # For ZoeDepth/MiDaS
requests==2.31.0      # For satellite imagery
```

## Usage Examples

### 1. Basic Usage
```python
from enhanced_building_analyzer import EnhancedBuildingAnalyzer

analyzer = EnhancedBuildingAnalyzer()
result = analyzer.analyze_building(
    image=your_image,
    building_type='residential',
    location={'city': 'Islamabad'},
    use_satellite=True,
    pin_location={'lat': 33.6844, 'lng': 73.0479}
)

print(f"Height: {result['height_analysis']['estimated_height_m']} m")
print(f"Area: {result['area_analysis']['estimated_area_sqm']} sqm")
print(f"Volume: {result['volume_analysis']['estimated_volume_cubic_m']} cubic m")
```

### 2. Volume-Based Cost Estimation
```python
from volume_based_cost_estimation import VolumeBasedCostEstimator

cost_estimator = VolumeBasedCostEstimator()
cost = cost_estimator.calculate_repair_cost(
    severity_score=0.5,
    damage_ratio=0.5,
    building_area_sqm=150.5,
    building_type='residential',
    regional_data=regional_data,
    building_height_m=6.2,
    building_volume_cubic_m=933.1
)

print(f"Total cost: ${cost['total_estimated_cost_usd']:,.2f}")
print(f"Method: {cost['calculation_method']}")
```

## Testing

Run the test script to verify functionality:

```bash
cd backend
python test_enhanced_building_analyzer.py
```

The test will:
1. Test height estimation methods
2. Test area estimation methods
3. Test volume-based cost calculation
4. Compare volume vs area-based costs
5. Test satellite integration (if API key available)

## Accuracy and Limitations

### Height Estimation Accuracy:
- **Depth-based**: Good for clear building images, requires camera calibration
- **Shadow-based**: Works with clear shadows, needs sun angle data
- **Perspective-based**: Good for structured buildings with clear edges
- **Feature-based**: Reliable for buildings with visible floors

### Area Estimation Accuracy:
- **Satellite imagery**: Most accurate, requires API key
- **Traditional CV**: Good for clear building images
- **Enhanced segmentation**: Improved over basic methods

### Limitations:
1. **Single image**: Limited 3D information from 2D images
2. **Camera calibration**: Depth estimation needs calibration for accuracy
3. **Weather conditions**: Shadows and visibility affect accuracy
4. **Building complexity**: Irregular shapes are harder to estimate
5. **API dependencies**: Satellite imagery requires external services

## Future Improvements

1. **Multi-view reconstruction**: Use multiple images for better 3D estimation
2. **Camera calibration**: Implement automatic camera parameter estimation
3. **Machine learning**: Train custom models on building-specific data
4. **Real-time processing**: Optimize for faster inference
5. **Accuracy validation**: Compare with ground truth measurements

## Troubleshooting

### Common Issues:

1. **Import errors**: Ensure all dependencies are installed
2. **API errors**: Check satellite imagery API keys
3. **Memory issues**: Adjust memory threshold in configuration
4. **Low accuracy**: Try different estimation methods or improve image quality

### Debug Mode:
Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Conclusion

The enhanced building analysis system provides:
- **More accurate cost estimation** using volume instead of just area
- **Multiple estimation methods** for robustness
- **Satellite imagery integration** for improved area accuracy
- **Backward compatibility** with existing area-based methods
- **Comprehensive analysis** including confidence scores

This implementation significantly improves the accuracy of building damage assessment and cost estimation while maintaining the same API interface.
