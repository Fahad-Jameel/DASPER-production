# cv_building_analyzer.py - CV Model Enhanced Building Analysis
import os
import base64
import json
import logging
from typing import Dict, Tuple, Optional, Union
from PIL import Image
import io
import google.generativeai as genai
from datetime import datetime
import cv2
import numpy as np

logger = logging.getLogger(__name__)

class CVBuildingAnalyzer:
    """
    Enhanced building analyzer using CV Model
    for accurate height and area estimation from images
    """
    
    def __init__(self):
        self.cv_model = None
        self.quota_exceeded = False
        self.initialized = self._initialize_cv_model()
        
        # Building type defaults for validation
        self.building_height_defaults = {
            'residential': {
                'Pakistan_Urban': {'min': 3.0, 'avg': 8.0, 'max': 30.0},
                'Pakistan_Rural': {'min': 2.5, 'avg': 5.0, 'max': 20.0},
                'Pakistan_SEZ': {'min': 4.0, 'avg': 10.0, 'max': 35.0},
                'default': {'min': 3.0, 'avg': 8.0, 'max': 30.0}
            },
            'commercial': {
                'Pakistan_Urban': {'min': 4.0, 'avg': 15.0, 'max': 80.0},
                'Pakistan_Rural': {'min': 3.0, 'avg': 10.0, 'max': 40.0},
                'Pakistan_SEZ': {'min': 6.0, 'avg': 20.0, 'max': 100.0},
                'default': {'min': 4.0, 'avg': 15.0, 'max': 80.0}
            },
            'industrial': {
                'Pakistan_Urban': {'min': 6.0, 'avg': 18.0, 'max': 60.0},
                'Pakistan_Rural': {'min': 4.0, 'avg': 12.0, 'max': 40.0},
                'Pakistan_SEZ': {'min': 8.0, 'avg': 22.0, 'max': 80.0},
                'default': {'min': 6.0, 'avg': 18.0, 'max': 60.0}
            }
        }
        
        self.building_area_defaults = {
            'residential': {
                'Pakistan_Urban': {'min': 80, 'avg': 150, 'max': 2000},
                'Pakistan_Rural': {'min': 60, 'avg': 120, 'max': 1500},
                'Pakistan_SEZ': {'min': 100, 'avg': 200, 'max': 2500},
                'default': {'min': 100, 'avg': 200, 'max': 2000}
            },
            'commercial': {
                'Pakistan_Urban': {'min': 200, 'avg': 500, 'max': 5000},
                'Pakistan_Rural': {'min': 100, 'avg': 300, 'max': 3000},
                'Pakistan_SEZ': {'min': 300, 'avg': 800, 'max': 6000},
                'default': {'min': 300, 'avg': 800, 'max': 5000}
            },
            'industrial': {
                'Pakistan_Urban': {'min': 500, 'avg': 1500, 'max': 10000},
                'Pakistan_Rural': {'min': 300, 'avg': 800, 'max': 5000},
                'Pakistan_SEZ': {'min': 800, 'avg': 2000, 'max': 12000},
                'default': {'min': 1000, 'avg': 2500, 'max': 10000}
            }
        }
    
    def _initialize_cv_model(self):
        """Initialize CV Model"""
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            logger.info(f"🔍 Checking GEMINI_API_KEY: {'Found' if api_key else 'Not found'}")
            if not api_key:
                logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
                return False
            
            logger.info("🔧 Configuring CV Model API...")
            genai.configure(api_key=api_key)
            
            logger.info("🔧 Initializing CV model...")
            # Initialize the vision model
            self.cv_model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("✅ CV Model initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize CV Model: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return False
    
    def analyze_building_with_cv_model(self, image, building_type='residential', location=None, pin_location=None):
        """
        Analyze building using CV Model for accurate height and area estimation
        
        Args:
            image: PIL Image or image path
            building_type: Type of building (residential, commercial, industrial)
            location: Location information
            pin_location: Pin location for context
            
        Returns:
            dict: Complete analysis results with CV Model insights
        """
        try:
            # Convert to PIL if needed
            if isinstance(image, str):
                image = Image.open(image).convert('RGB')
            
            # Get region type
            region_type = self._get_region_type(location)
            
            # Analyze with CV Model
            cv_analysis = self._analyze_with_cv_vision(image, building_type, region_type, pin_location)
            
            # Debug logging
            logger.info(f"🔍 CV Analysis Results: {cv_analysis}")
            logger.info(f"🔍 Raw height estimate: {cv_analysis.get('height_estimate', 0)}")
            logger.info(f"🔍 Raw area estimate: {cv_analysis.get('area_estimate', 0)}")
            
            # Validate and refine estimates
            validated_height = self._validate_height_estimate(
                cv_analysis.get('height_estimate', 0),
                building_type, region_type
            )
            
            validated_area = self._validate_area_estimate(
                cv_analysis.get('area_estimate', 0),
                building_type, region_type
            )
            
            logger.info(f"🔍 Validated height: {validated_height}")
            logger.info(f"🔍 Validated area: {validated_area}")
            
            # Calculate volume
            volume = validated_height * validated_area
            
            # Calculate confidence based on CV Model analysis quality
            confidence = self._calculate_confidence(cv_analysis, validated_height, validated_area)
            
            # Get regional costs and repair time estimates
            regional_costs = self._research_regional_costs(pin_location, building_type, validated_area, validated_height)
            repair_time_estimate = self._estimate_repair_time(cv_analysis, regional_costs, building_type)
            
            return {
                'height_analysis': {
                    'estimated_height_m': round(float(validated_height), 2),
                    'confidence': round(float(confidence), 3),
                    'method': 'cv_model_analysis',
                    'cv_insights': cv_analysis.get('height_insights', ''),
                    'bounds': {
                        'min': 0.5,  # Minimal realistic height
                        'max': 1000.0,  # Maximum realistic height
                        'note': 'No artificial limits applied - trusting CV Model analysis'
                    }
                },
                'area_analysis': {
                    'estimated_area_sqm': round(float(validated_area), 2),
                    'confidence': round(float(confidence), 3),
                    'method': 'cv_model_analysis',
                    'cv_insights': cv_analysis.get('area_insights', ''),
                    'satellite_used': False
                },
                'volume_analysis': {
                    'estimated_volume_cubic_m': round(volume, 2),
                    'height_m': float(validated_height),
                    'area_sqm': float(validated_area),
                    'confidence': round(float(confidence), 3)
                },
                'cv_analysis': {
                    'building_type_detected': cv_analysis.get('building_type_detected', building_type),
                    'architectural_features': cv_analysis.get('architectural_features', []),
                    'construction_materials': cv_analysis.get('construction_materials', []),
                    'age_estimate': cv_analysis.get('age_estimate', 'unknown'),
                    'condition_assessment': cv_analysis.get('condition_assessment', 'unknown')
                },
                'building_type': building_type,
                'region_type': region_type,
                'regional_costs': regional_costs,
                'repair_time_estimate': repair_time_estimate,
                'analysis_timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"CV Model building analysis error: {e}")
            return self._get_fallback_analysis(building_type, region_type)
    
    def _analyze_with_cv_vision(self, image, building_type, region_type, pin_location):
        """Analyze building using CV Model"""
        try:
            # Check if quota is exceeded
            if self.quota_exceeded:
                logger.warning("⚠️ Gemini API quota exceeded. Skipping API call, using fallback.")
                return self._get_fallback_gemini_analysis()
            
            logger.info(f"🔍 CV Model status: initialized={self.initialized}, model={self.cv_model is not None}")
            if not self.cv_model:
                logger.warning("⚠️ CV model not available, using fallback")
                return self._get_fallback_gemini_analysis()
            
            # Prepare the prompt for CV Model
            prompt = self._create_analysis_prompt(building_type, region_type, pin_location)
            
            # Convert image to base64 for CV Model
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG', quality=95)
            img_data = img_buffer.getvalue()
            
            # Generate content with CV Model
            response = self.cv_model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": img_data
                }
            ])
            
            # Parse CV Model response
            cv_analysis = self._parse_gemini_response(response.text)
            
            logger.info(f"✅ CV Model analysis completed: {cv_analysis}")
            return cv_analysis
            
        except Exception as e:
            error_str = str(e)
            # Check for quota exceeded error (429)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate.limit' in error_str.lower():
                logger.warning("⚠️ Gemini API quota exceeded. Using fallback analysis.")
                logger.warning(f"⚠️ Quota error details: {error_str[:200]}")
                # Set flag to avoid further API calls
                self.quota_exceeded = True
            else:
            logger.error(f"CV Model API error: {e}")
            return self._get_fallback_gemini_analysis()
    
    def _create_analysis_prompt(self, building_type, region_type, pin_location):
        """Create detailed prompt for CV Model"""
        
        location_context = ""
        if pin_location:
            location_context = f"Location: {pin_location}. "
        
        prompt = f"""
You are an expert architectural analyst specializing in building assessment from images. Analyze this building image and provide detailed measurements and insights.

{location_context}Building Type: {building_type}, Region: {region_type}

Please analyze the image and provide the following information in JSON format:

1. **Height Estimation**: 
   - Estimate the building height in meters
   - Consider architectural features like floors, windows, doors
   - Look for reference objects (cars, people, trees) for scale
   - Account for perspective and camera angle

2. **Area Estimation**:
   - Estimate the building footprint area in square meters
   - Consider the visible building dimensions
   - Look for architectural features that indicate scale

3. **Building Analysis**:
   - Detect the actual building type (residential/commercial/industrial)
   - Identify key architectural features (floors, windows, doors, roof type)
   - Assess construction materials (concrete, brick, steel, etc.)
   - Estimate building age/condition
   - Note any damage or structural issues

4. **Confidence Assessment**:
   - Rate your confidence in height estimate (0-1)
   - Rate your confidence in area estimate (0-1)
   - Explain any limitations or uncertainties

Please respond in this exact JSON format:
{{
    "height_estimate": <number in meters>,
    "area_estimate": <number in square meters>,
    "height_confidence": <number 0-1>,
    "area_confidence": <number 0-1>,
    "building_type_detected": "<detected type>",
    "architectural_features": ["feature1", "feature2", ...],
    "construction_materials": ["material1", "material2", ...],
    "age_estimate": "<age range>",
    "condition_assessment": "<condition>",
    "height_insights": "<detailed explanation of height estimation>",
    "area_insights": "<detailed explanation of area estimation>",
    "reference_objects": ["object1", "object2", ...],
    "limitations": ["limitation1", "limitation2", ...]
}}

Be precise and realistic in your estimates. Consider the context of {region_type} region where buildings typically have specific characteristics.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text):
        """Parse Gemini response and extract structured data"""
        try:
            # Try to extract JSON from the response
            import re
            
            # Look for JSON block in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                analysis = json.loads(json_str)
                
                # Validate and clean the data
                return {
                    'height_estimate': float(analysis.get('height_estimate', 0)),
                    'area_estimate': float(analysis.get('area_estimate', 0)),
                    'height_confidence': float(analysis.get('height_confidence', 0.5)),
                    'area_confidence': float(analysis.get('area_confidence', 0.5)),
                    'building_type_detected': analysis.get('building_type_detected', 'residential'),
                    'architectural_features': analysis.get('architectural_features', []),
                    'construction_materials': analysis.get('construction_materials', []),
                    'age_estimate': analysis.get('age_estimate', 'unknown'),
                    'condition_assessment': analysis.get('condition_assessment', 'unknown'),
                    'height_insights': analysis.get('height_insights', ''),
                    'area_insights': analysis.get('area_insights', ''),
                    'reference_objects': analysis.get('reference_objects', []),
                    'limitations': analysis.get('limitations', [])
                }
            else:
                # Fallback: try to extract numbers from text
                return self._extract_estimates_from_text(response_text)
                
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return self._get_fallback_gemini_analysis()
    
    def _extract_estimates_from_text(self, text):
        """Extract height and area estimates from unstructured text"""
        try:
            import re
            
            # Look for height mentions
            height_patterns = [
                r'height[:\s]*(\d+(?:\.\d+)?)\s*m(?:eters?)?',
                r'(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:high|tall)',
                r'(\d+(?:\.\d+)?)\s*metres?'
            ]
            
            height_estimate = 0
            for pattern in height_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    height_estimate = float(match.group(1))
                    break
            
            # Look for area mentions
            area_patterns = [
                r'area[:\s]*(\d+(?:\.\d+)?)\s*sq\.?\s*m(?:eters?)?',
                r'(\d+(?:\.\d+)?)\s*square\s*m(?:eters?)?',
                r'(\d+(?:\.\d+)?)\s*sqm'
            ]
            
            area_estimate = 0
            for pattern in area_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    area_estimate = float(match.group(1))
                    break
            
            return {
                'height_estimate': height_estimate,
                'area_estimate': area_estimate,
                'height_confidence': 0.4,
                'area_confidence': 0.4,
                'building_type_detected': 'residential',
                'architectural_features': [],
                'construction_materials': [],
                'age_estimate': 'unknown',
                'condition_assessment': 'unknown',
                'height_insights': 'Extracted from text analysis',
                'area_insights': 'Extracted from text analysis',
                'reference_objects': [],
                'limitations': ['Unstructured text parsing']
            }
            
        except Exception as e:
            logger.error(f"Error extracting estimates from text: {e}")
            return self._get_fallback_gemini_analysis()
    
    def _validate_height_estimate(self, height_estimate, building_type, region_type):
        """Validate height estimate - NO LIMITS, trust Gemini's analysis"""
        try:
            logger.info(f"🔍 Validating height estimate: {height_estimate}")
            
            # If estimate is 0 or invalid, use a reasonable default
            if height_estimate <= 0:
                defaults = self._get_height_defaults(building_type, region_type)
                logger.warning(f"⚠️ Height estimate is 0 or invalid, using default: {defaults['avg']}")
                return defaults['avg']
            
            # NO BOUNDS - Trust Gemini's analysis completely
            # Only apply minimal validation for obviously wrong values
            if height_estimate < 0.5:  # Less than 0.5m is unrealistic
                logger.warning(f"⚠️ Height estimate too low ({height_estimate}), using minimum: 2.0")
                return 2.0  # Minimum realistic height
            elif height_estimate > 1000:  # More than 1000m is unrealistic
                logger.warning(f"⚠️ Height estimate too high ({height_estimate}), using maximum: 100.0")
                return 100.0  # Maximum realistic height
            
            # Return Gemini's estimate as-is
            logger.info(f"✅ Using CV model height estimate: {height_estimate}")
            return height_estimate
            
        except Exception as e:
            logger.error(f"Height validation error: {e}")
            defaults = self._get_height_defaults(building_type, region_type)
            return defaults['avg']
    
    def _validate_area_estimate(self, area_estimate, building_type, region_type):
        """Validate area estimate - NO LIMITS, trust Gemini's analysis"""
        try:
            logger.info(f"🔍 Validating area estimate: {area_estimate}")
            
            # If estimate is 0 or invalid, use a reasonable default
            if area_estimate <= 0:
                defaults = self._get_area_defaults(building_type, region_type)
                logger.warning(f"⚠️ Area estimate is 0 or invalid, using default: {defaults['avg']}")
                return defaults['avg']
            
            # NO BOUNDS - Trust Gemini's analysis completely
            # Only apply minimal validation for obviously wrong values
            if area_estimate < 1:  # Less than 1 sqm is unrealistic
                logger.warning(f"⚠️ Area estimate too low ({area_estimate}), using minimum: 50.0")
                return 50.0  # Minimum realistic area
            elif area_estimate > 100000:  # More than 100,000 sqm is unrealistic
                logger.warning(f"⚠️ Area estimate too high ({area_estimate}), using maximum: 10000.0")
                return 10000.0  # Maximum realistic area
            
            # Return Gemini's estimate as-is
            logger.info(f"✅ Using CV model area estimate: {area_estimate}")
            return area_estimate
            
        except Exception as e:
            logger.error(f"Area validation error: {e}")
            defaults = self._get_area_defaults(building_type, region_type)
            return defaults['avg']
    
    def _calculate_confidence(self, cv_analysis, height, area):
        """Calculate overall confidence based on CV analysis"""
        try:
            base_confidence = (cv_analysis.get('height_confidence', 0.5) + 
                             cv_analysis.get('area_confidence', 0.5)) / 2
            
            # Boost confidence if reference objects were identified
            if cv_analysis.get('reference_objects'):
                base_confidence += 0.1
            
            # Reduce confidence if limitations were noted
            if cv_analysis.get('limitations'):
                base_confidence -= 0.1
            
            # Boost confidence if architectural features were identified
            if cv_analysis.get('architectural_features'):
                base_confidence += 0.05
            
            return max(0.3, min(0.95, base_confidence))
            
        except Exception as e:
            logger.error(f"Confidence calculation error: {e}")
            return 0.5
    
    def _get_region_type(self, location):
        """Determine region type from location"""
        if not location:
            return 'default'
        
        if isinstance(location, dict):
            region_type = location.get('region_type', '')
            if region_type:
                if region_type == 'urban':
                    return 'Pakistan_Urban'
                elif region_type == 'rural':
                    return 'Pakistan_Rural'
                elif region_type == 'sez':
                    return 'Pakistan_SEZ'
            
            city = location.get('city', '').lower()
            if any(urban in city for urban in ['karachi', 'lahore', 'islamabad', 'rawalpindi']):
                return 'Pakistan_Urban'
        
        return 'Pakistan_Rural'
    
    def _get_height_defaults(self, building_type, region_type):
        """Get default height values for building type and region"""
        if building_type not in self.building_height_defaults:
            building_type = 'residential'
        
        if region_type in self.building_height_defaults[building_type]:
            return self.building_height_defaults[building_type][region_type]
        
        return self.building_height_defaults[building_type]['default']
    
    def _get_area_defaults(self, building_type, region_type):
        """Get default area values for building type and region"""
        if building_type not in self.building_area_defaults:
            building_type = 'residential'
        
        if region_type in self.building_area_defaults[building_type]:
            return self.building_area_defaults[building_type][region_type]
        
        return self.building_area_defaults[building_type]['default']
    
    def _get_fallback_gemini_analysis(self):
        """Get fallback analysis when Gemini is not available"""
        return {
            'height_estimate': 0,
            'area_estimate': 0,
            'height_confidence': 0.3,
            'area_confidence': 0.3,
            'building_type_detected': 'residential',
            'architectural_features': [],
            'construction_materials': [],
            'age_estimate': 'unknown',
            'condition_assessment': 'unknown',
            'height_insights': 'Gemini analysis not available',
            'area_insights': 'Gemini analysis not available',
            'reference_objects': [],
            'limitations': ['Gemini API not available']
        }
    
    def estimate_cost_with_cv_model(self, image, severity_score, building_type, area_sqm, height_m, volume_cubic_m, pin_location):
        """
        Estimate repair cost using CV Model with image analysis
        
        Args:
            image: PIL Image or image path
            severity_score: Damage severity (0-1)
            building_type: Type of building
            area_sqm: Building area in square meters
            height_m: Building height in meters
            volume_cubic_m: Building volume in cubic meters
            pin_location: Location coordinates
            
        Returns:
            dict: Cost estimation results from CV Model
        """
        try:
            # Check if quota is exceeded
            if self.quota_exceeded:
                logger.warning("⚠️ Gemini API quota exceeded. Skipping cost estimation API call, using traditional method.")
                return None
            
            if not self.cv_model or not self.initialized:
                logger.warning("CV Model not available for cost estimation")
                return None
            
            # Convert to PIL if needed
            if isinstance(image, str):
                image = Image.open(image).convert('RGB')
            
            # Convert image to base64
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG', quality=95)
            img_data = img_buffer.getvalue()
            
            # Calculate estimated number of floors (more conservative)
            # Use 3.2m per floor for residential (includes slab thickness)
            estimated_floors = max(1, round(height_m / 3.2))
            # Cap at reasonable maximum (10 floors for residential)
            if building_type == 'residential':
                estimated_floors = min(estimated_floors, 10)
            elif building_type == 'commercial':
                estimated_floors = min(estimated_floors, 15)
            
            total_covered_area_sqm = area_sqm * estimated_floors
            total_covered_area_sqft = total_covered_area_sqm * 10.764
            
            logger.info(f"📊 Cost calculation: {estimated_floors} floors × {area_sqm:.1f} sqm = {total_covered_area_sqm:.1f} sqm ({total_covered_area_sqft:.1f} sq ft)")
            
            # Create detailed cost estimation prompt
            prompt = f"""
You are an expert structural engineer and cost estimator specializing in disaster damage assessment for Pakistan (2024-2025 market rates).

Analyze this damaged building image and provide a comprehensive cost estimation for repair/reconstruction.

**Building Information:**
- Type: {building_type}
- Footprint Area: {area_sqm:.1f} square meters ({area_sqm * 10.764:.1f} sq ft)
- Height: {height_m:.1f} meters
- Estimated Floors: {estimated_floors} floors
- **TOTAL COVERED AREA (all floors)**: {total_covered_area_sqm:.1f} sqm ({total_covered_area_sqft:.1f} sq ft)
- Volume: {volume_cubic_m:.1f} cubic meters
- Location: {pin_location if pin_location else 'Pakistan'}
- Damage Severity: {severity_score * 100:.1f}% (from AI model)

**CRITICAL: Calculate costs based on TOTAL COVERED AREA (all floors), NOT just footprint!**

**Your Task:**
Based on the visual evidence in the image, provide a realistic cost estimation for the Pakistani construction market (2024-2025).

**For Catastrophic Damage (80-100%):**
- This requires COMPLETE DEMOLITION + FULL RECONSTRUCTION
- Calculate costs for the ENTIRE building (all {estimated_floors} floors)
- Use TOTAL COVERED AREA: {total_covered_area_sqft:.1f} sq ft

**Cost Components:**
1. **Demolition & Debris Removal**: PKR 1,000 - 1,500 per sq ft of TOTAL COVERED AREA
2. **Full Reconstruction (Grey Structure)**: PKR 4,000 - 8,000 per sq ft (residential) / PKR 6,000 - 12,000 per sq ft (commercial)
3. **Finishing (Complete)**: PKR 4,500 - 7,000+ per sq ft
4. **Professional Fees**: 15% of construction cost
5. **Permits & Approvals**: 5% of construction cost
6. **Contingency**: 10-15% for uncertainties

**Market Rates (Pakistan 2024-2025):**
- Demolition: PKR 1,000 - 1,500 per sq ft (TOTAL COVERED AREA)
- Grey Structure: PKR 4,000 - 8,000 per sq ft (residential) / PKR 6,000 - 12,000 per sq ft (commercial)
- Finishing: PKR 4,500 - 7,000+ per sq ft
- For catastrophic collapse, use HIGHER end of ranges

**IMPORTANT:**
- Multiply all per-sq-ft costs by TOTAL COVERED AREA ({total_covered_area_sqft:.1f} sq ft)
- For 100% damage, assume complete demolition and full reconstruction
- Include all costs: demolition, reconstruction, finishing, fees, permits, contingency

Respond in this exact JSON format:
{{
    "actual_damage_percentage": <number 0-100>,
    "requires_demolition": <true/false>,
    "estimated_floors": {estimated_floors},
    "total_covered_area_sqft": {total_covered_area_sqft:.1f},
    "cost_breakdown": {{
        "demolition_cost_per_sqft": <number>,
        "grey_structure_cost_per_sqft": <number>,
        "finishing_cost_per_sqft": <number>,
        "professional_fees_percentage": 15,
        "permits_percentage": 5,
        "contingency_percentage": 12
    }},
    "total_cost_pkr": <total cost in PKR for ENTIRE building>,
    "total_cost_crore": <total cost in Crore>,
    "explanation": "<detailed explanation including how you calculated for all floors>",
    "confidence": <0-1>
}}
"""
            
            # Generate content with CV Model
            response = self.cv_model.generate_content([
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": img_data
                }
            ])
            
            # Parse response
            cost_data = self._parse_cost_estimation_response(response.text)
            logger.info(f"✅ CV Model cost estimation completed")
            return cost_data
            
        except Exception as e:
            error_str = str(e)
            # Check for quota exceeded error (429)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate.limit' in error_str.lower():
                logger.warning("⚠️ Gemini API quota exceeded for cost estimation. Using traditional method.")
                self.quota_exceeded = True
            else:
                logger.error(f"CV Model cost estimation error: {e}")
            return None
    
    def _parse_cost_estimation_response(self, response_text):
        """Parse CV Model cost estimation response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                data = json.loads(json_str)
                
                return {
                    'actual_damage_percentage': float(data.get('actual_damage_percentage', 0)),
                    'requires_demolition': bool(data.get('requires_demolition', False)),
                    'cost_breakdown': data.get('cost_breakdown', {}),
                    'total_cost_pkr': float(data.get('total_cost_pkr', 0)),
                    'total_cost_crore': float(data.get('total_cost_crore', 0)),
                    'explanation': data.get('explanation', ''),
                    'confidence': float(data.get('confidence', 0.7))
                }
            return None
        except Exception as e:
            logger.error(f"Error parsing cost estimation response: {e}")
            return None
    
    def _research_regional_costs(self, pin_location, building_type, area_sqm, height_m):
        """Research regional construction costs"""
        try:
            # Check if quota is exceeded
            if self.quota_exceeded:
                logger.warning("⚠️ Gemini API quota exceeded. Using default regional costs.")
                return self._get_default_regional_costs(building_type)
            
            if not self.cv_model:
                return self._get_default_regional_costs(building_type)
            
            prompt = f"""
Research current construction costs in Pakistan (2024-2025) for location: {pin_location}

Building Type: {building_type}
Area: {area_sqm:.1f} sqm
Height: {height_m:.1f} m

Provide current market rates in PKR per square meter for:
1. Structural materials (cement, steel, bricks)
2. Non-structural materials (tiles, paint, electrical, plumbing)
3. Labor costs
4. Equipment rental
5. Professional fees (architects, engineers)

Respond in JSON format:
{{
    "location": "{pin_location}",
    "cost_breakdown": {{
        "structural_materials": <PKR per sqm>,
        "non_structural_materials": <PKR per sqm>,
        "labor": <PKR per sqm>,
        "equipment": <PKR per sqm>,
        "professional_fees": <percentage of total>
    }},
    "regional_multiplier": <1.0-1.5>
}}
"""
            response = self.cv_model.generate_content([prompt])
            cost_data = self._parse_regional_cost_response(response.text)
            logger.info(f"✅ Regional cost research completed for {pin_location}")
            return cost_data
        except Exception as e:
            error_str = str(e)
            # Check for quota exceeded error (429)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate.limit' in error_str.lower():
                logger.warning("⚠️ Gemini API quota exceeded for regional cost research. Using defaults.")
                self.quota_exceeded = True
            else:
                logger.error(f"Regional cost research error: {e}")
            return self._get_default_regional_costs(building_type)
    
    def _parse_regional_cost_response(self, response_text):
        """Parse regional cost response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            return self._get_default_regional_costs('residential')
        except Exception as e:
            logger.error(f"Error parsing regional cost response: {e}")
            return self._get_default_regional_costs('residential')
    
    def _estimate_repair_time(self, cv_analysis, regional_costs, building_type):
        """Estimate repair time based on damage analysis"""
        try:
            # Check if quota is exceeded
            if self.quota_exceeded:
                logger.warning("⚠️ Gemini API quota exceeded. Using default repair time.")
                return self._get_default_repair_time(building_type)
            
            if not self.cv_model:
                return self._get_default_repair_time(building_type)
            
            condition = cv_analysis.get('condition_assessment', 'unknown')
            prompt = f"""
Estimate realistic repair time in days for a {building_type} building with the following condition:
{condition}

Consider:
- Demolition time (if needed)
- Material procurement
- Structural repair/rebuild
- Finishing work
- Permits and approvals

Respond in JSON:
{{
    "estimated_days": <number>,
    "breakdown": {{
        "planning_permit": <days>,
        "demolition": <days>,
        "material_procurement": <days>,
        "structural_work": <days>,
        "finishing": <days>
    }},
    "confidence": <0-1>
}}
"""
            response = self.cv_model.generate_content([prompt])
            time_data = self._parse_repair_time_response(response.text)
            logger.info(f"✅ Repair time estimation completed")
            return time_data
        except Exception as e:
            error_str = str(e)
            # Check for quota exceeded error (429)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate.limit' in error_str.lower():
                logger.warning("⚠️ Gemini API quota exceeded for repair time estimation. Using defaults.")
                self.quota_exceeded = True
            else:
                logger.error(f"Repair time estimation error: {e}")
            return self._get_default_repair_time(building_type)
    
    def _parse_repair_time_response(self, response_text):
        """Parse repair time response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            return self._get_default_repair_time('residential')
        except Exception as e:
            logger.error(f"Error parsing repair time response: {e}")
            return self._get_default_repair_time('residential')
    
    def _get_default_regional_costs(self, building_type):
        """Get default regional costs"""
        defaults = {
            'residential': {
                'location': 'Pakistan',
                'cost_breakdown': {
                    'structural_materials': 45000,
                    'non_structural_materials': 25000,
                    'labor': 30000,
                    'equipment': 10000,
                    'professional_fees': 0.15
                },
                'regional_multiplier': 1.0
            }
        }
        return defaults.get(building_type, defaults['residential'])
    
    def _get_default_repair_time(self, building_type):
        """Get default repair time"""
        defaults = {
            'residential': {
                'estimated_days': 90,
                'breakdown': {
                    'planning_permit': 7,
                    'demolition': 5,
                    'material_procurement': 15,
                    'structural_work': 40,
                    'finishing': 23
                },
                'confidence': 0.7
            }
        }
        return defaults.get(building_type, defaults['residential'])
    
    def _get_fallback_analysis(self, building_type, region_type):
        """Get fallback analysis when main analysis fails"""
        height_defaults = self._get_height_defaults(building_type, region_type)
        area_defaults = self._get_area_defaults(building_type, region_type)
        
        height = height_defaults['avg']
        area = area_defaults['avg']
        volume = height * area
        
        return {
            'height_analysis': {
                'estimated_height_m': float(height),
                'confidence': 0.3,
                'method': 'fallback_defaults',
                'cv_insights': 'Analysis failed, using defaults',
                'bounds': {
                    'min': float(height_defaults['min']),
                    'max': float(height_defaults['max'])
                }
            },
            'area_analysis': {
                'estimated_area_sqm': float(area),
                'confidence': 0.3,
                'method': 'fallback_defaults',
                'cv_insights': 'Analysis failed, using defaults',
                'satellite_used': False
            },
            'volume_analysis': {
                'estimated_volume_cubic_m': round(volume, 2),
                'height_m': float(height),
                'area_sqm': float(area),
                'confidence': 0.3
            },
            'cv_analysis': {
                'building_type_detected': building_type,
                'architectural_features': [],
                'construction_materials': [],
                'age_estimate': 'unknown',
                'condition_assessment': 'unknown'
            },
            'building_type': building_type,
            'region_type': region_type,
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
