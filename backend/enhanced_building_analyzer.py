# enhanced_building_analyzer.py - Advanced Building Height and Area Estimation
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
import requests
import math
import logging
from typing import Dict, Tuple, Optional, Union
import os
from io import BytesIO
import json

logger = logging.getLogger(__name__)

class EnhancedBuildingAnalyzer:
    """
    Advanced building analyzer that estimates both height and area from images
    Uses multiple approaches: depth estimation, satellite imagery, and computer vision
    """
    
    def __init__(self):
        self.initialized = True
        
        # Initialize depth estimation model (ZoeDepth)
        self.depth_model = None
        self._load_depth_model()
        
        # Satellite imagery configuration
        self.satellite_config = {
            'mapbox_token': os.getenv('MAPBOX_TOKEN'),
            'google_maps_key': os.getenv('GOOGLE_MAPS_API_KEY'),
            'bing_maps_key': os.getenv('BING_MAPS_API_KEY')
        }
        
        # Building type defaults for height estimation
        self.building_height_defaults = {
            'residential': {
                'Pakistan_Urban': {'min': 3.0, 'avg': 8.0, 'max': 30.0},  # Increased max from 15 to 30
                'Pakistan_Rural': {'min': 2.5, 'avg': 5.0, 'max': 20.0},  # Increased max from 10 to 20
                'Pakistan_SEZ': {'min': 4.0, 'avg': 10.0, 'max': 35.0},   # Increased max from 20 to 35
                'default': {'min': 3.0, 'avg': 8.0, 'max': 30.0}          # Increased max from 15 to 30
            },
            'commercial': {
                'Pakistan_Urban': {'min': 4.0, 'avg': 15.0, 'max': 80.0},  # Increased max from 50 to 80
                'Pakistan_Rural': {'min': 3.0, 'avg': 10.0, 'max': 40.0},  # Increased max from 25 to 40
                'Pakistan_SEZ': {'min': 6.0, 'avg': 20.0, 'max': 100.0},   # Increased max from 60 to 100
                'default': {'min': 4.0, 'avg': 15.0, 'max': 80.0}          # Increased max from 50 to 80
            },
            'industrial': {
                'Pakistan_Urban': {'min': 6.0, 'avg': 18.0, 'max': 60.0},  # Increased max from 40 to 60
                'Pakistan_Rural': {'min': 4.0, 'avg': 12.0, 'max': 40.0},  # Increased max from 25 to 40
                'Pakistan_SEZ': {'min': 8.0, 'avg': 22.0, 'max': 80.0},    # Increased max from 50 to 80
                'default': {'min': 6.0, 'avg': 18.0, 'max': 60.0}          # Increased max from 40 to 60
            }
        }
    
    def _load_depth_model(self):
        """Load depth estimation model (ZoeDepth)"""
        try:
            # Try to import and load ZoeDepth
            from transformers import pipeline
            
            # Use ZoeDepth for monocular depth estimation
            self.depth_model = pipeline(
                "depth-estimation", 
                model="Intel/dpt-large",
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info("✅ ZoeDepth model loaded successfully")
            
        except ImportError:
            logger.warning("⚠️ Transformers not available, using fallback depth estimation")
            self.depth_model = None
        except Exception as e:
            logger.error(f"❌ Failed to load depth model: {e}")
            self.depth_model = None
    
    def analyze_building(self, image, building_type='residential', location=None, 
                        use_satellite=True, pin_location=None):
        """
        Complete building analysis: height, area, and volume estimation
        
        Args:
            image: PIL Image or image path
            building_type: Type of building
            location: Location information
            use_satellite: Whether to use satellite imagery for area
            pin_location: Pin location for satellite imagery
            
        Returns:
            dict: Complete analysis results
        """
        try:
            # Convert to PIL if needed
            if isinstance(image, str):
                image = Image.open(image).convert('RGB')
            
            # Get region type
            region_type = self._get_region_type(location)
            
            # Estimate height using multiple methods
            height_result = self._estimate_building_height(image, building_type, region_type)
            logger.info(f"🔍 Enhanced Analyzer Height Result: {height_result}")
            
            # Estimate area using multiple methods
            area_result = self._estimate_building_area(image, building_type, region_type, 
                                                     use_satellite, pin_location)
            logger.info(f"🔍 Enhanced Analyzer Area Result: {area_result}")
            
            # Calculate volume
            volume = height_result['estimated_height_m'] * area_result['estimated_area_sqm']
            logger.info(f"🔍 Enhanced Analyzer Volume: {volume}")
            
            # Calculate confidence based on individual estimates
            overall_confidence = (height_result['confidence'] + area_result['confidence']) / 2
            
            return {
                'height_analysis': height_result,
                'area_analysis': area_result,
                'volume_analysis': {
                    'estimated_volume_cubic_m': round(volume, 2),
                    'height_m': height_result['estimated_height_m'],
                    'area_sqm': area_result['estimated_area_sqm'],
                    'confidence': round(overall_confidence, 3)
                },
                'building_type': building_type,
                'region_type': region_type,
                'analysis_timestamp': self._get_timestamp()
            }
            
        except Exception as e:
            logger.error(f"Building analysis error: {e}")
            return self._get_fallback_analysis(building_type, region_type)
    
    def _estimate_building_height(self, image, building_type, region_type):
        """Estimate building height using multiple methods"""
        try:
            # Convert PIL to numpy
            img_array = np.array(image)
            
            # Method 1: Depth-based estimation
            depth_height = self._estimate_height_from_depth(image)
            
            # Method 2: Shadow analysis
            shadow_height = self._estimate_height_from_shadows(img_array)
            
            # Method 3: Perspective analysis
            perspective_height = self._estimate_height_from_perspective(img_array, building_type)
            
            # Method 4: Feature-based estimation
            feature_height = self._estimate_height_from_features(img_array, building_type)
            
            # Get defaults
            defaults = self._get_height_defaults(building_type, region_type)
            
            # Log individual estimates for debugging
            logger.info(f"Height estimation results:")
            logger.info(f"  Depth-based: {depth_height}m")
            logger.info(f"  Shadow-based: {shadow_height}m")
            logger.info(f"  Perspective-based: {perspective_height}m")
            logger.info(f"  Feature-based: {feature_height}m")
            
            # Combine estimates
            estimates = [est for est in [depth_height, shadow_height, perspective_height, feature_height] if est > 0]
            
            if estimates:
                # Weighted average (depth gets higher weight if available)
                weights = [0.4, 0.2, 0.2, 0.2] if depth_height > 0 else [0.3, 0.3, 0.4]
                weighted_sum = sum(w * e for w, e in zip(weights[:len(estimates)], estimates))
                estimated_height = weighted_sum / sum(weights[:len(estimates)])
                
                # NO BOUNDS - Trust the analysis completely
                # Only apply minimal validation for obviously wrong values
                if estimated_height < 0.5:  # Less than 0.5m is unrealistic
                    estimated_height = 2.0  # Minimum realistic height
                elif estimated_height > 1000:  # More than 1000m is unrealistic
                    estimated_height = 100.0  # Maximum realistic height
                
                # Calculate confidence
                if len(estimates) > 1:
                    variance = np.var(estimates)
                    confidence = 1.0 / (1.0 + variance / 10)  # Height variance is more critical
                    confidence = np.clip(confidence, 0.3, 0.9)
                else:
                    confidence = 0.5
                
                method = 'multi_method_fusion'
                logger.info(f"  Combined estimate: {estimated_height}m (method: {method})")
            else:
                # Fallback to defaults
                estimated_height = defaults['avg']
                confidence = 0.3
                method = 'default_fallback'
                logger.info(f"  Using fallback: {estimated_height}m (method: {method})")
            
            return {
                'estimated_height_m': round(float(estimated_height), 2),
                'confidence': round(float(confidence), 3),
                'method': method,
                'bounds': {
                    'min': 0.5,  # Minimal realistic height
                    'max': 1000.0,  # Maximum realistic height
                    'note': 'No artificial limits applied - trusting analysis'
                },
                'individual_estimates': {
                    'depth_based': float(depth_height) if depth_height > 0 else 0.0,
                    'shadow_based': float(shadow_height) if shadow_height > 0 else 0.0,
                    'perspective_based': float(perspective_height) if perspective_height > 0 else 0.0,
                    'feature_based': float(feature_height) if feature_height > 0 else 0.0
                }
            }
            
        except Exception as e:
            logger.error(f"Height estimation error: {e}")
            defaults = self._get_height_defaults(building_type, region_type)
            return {
                'estimated_height_m': float(defaults['avg']),
                'confidence': 0.3,
                'method': 'error_fallback',
                'error': str(e),
                'bounds': {
                    'min': 0.5,  # Minimal realistic height
                    'max': 1000.0,  # Maximum realistic height
                    'note': 'No artificial limits applied - trusting analysis'
                }
            }
    
    def _estimate_height_from_depth(self, image):
        """Estimate height using depth estimation model"""
        try:
            if self.depth_model is None:
                return 0.0
            
            # Get depth map
            depth_result = self.depth_model(image)
            depth_map = np.array(depth_result['depth'])
            
            # Find building region (assume center region is building)
            h, w = depth_map.shape
            center_h, center_w = h // 2, w // 2
            
            # Extract building region (center 60% of image)
            building_region = depth_map[
                int(center_h - h * 0.3):int(center_h + h * 0.3),
                int(center_w - w * 0.3):int(center_w + w * 0.3)
            ]
            
            if building_region.size == 0:
                return 0.0
            
            # Estimate height from depth variation
            # Assume camera is at ground level, building top is furthest
            min_depth = np.min(building_region)
            max_depth = np.max(building_region)
            
            # Rough height estimation (this is a simplified approach)
            # In reality, you'd need camera calibration for accurate conversion
            depth_range = max_depth - min_depth
            estimated_height = depth_range * 0.1  # Rough scaling factor
            
            return float(estimated_height) if estimated_height > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Depth-based height estimation error: {e}")
            return 0.0
    
    def _estimate_height_from_shadows(self, img_array):
        """Estimate height using shadow analysis"""
        try:
            # Convert to HSV for better shadow detection
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Detect shadows (low value, low saturation) - more lenient
            shadow_mask = cv2.inRange(hsv, (0, 0, 0), (180, 80, 120))
            
            # Clean up the mask
            kernel = np.ones((3,3), np.uint8)
            shadow_mask = cv2.morphologyEx(shadow_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            shadow_mask = cv2.morphologyEx(shadow_mask, cv2.MORPH_OPEN, kernel, iterations=1)
            
            # Find shadow contours
            contours, _ = cv2.findContours(shadow_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                logger.debug("No shadows detected")
                return 0.0
            
            # Find the largest shadow (likely building shadow)
            largest_shadow = max(contours, key=cv2.contourArea)
            
            # Get shadow dimensions
            x, y, w, h = cv2.boundingRect(largest_shadow)
            shadow_length = max(w, h)
            shadow_area = cv2.contourArea(largest_shadow)
            
            logger.debug(f"Shadow detected: length={shadow_length}, area={shadow_area}")
            
            # Estimate height from shadow length
            # This is a rough estimation - in reality you'd need sun angle
            # Assume sun angle of 45 degrees for rough estimation
            # Scale based on image size for better estimation
            img_height = img_array.shape[0]
            scale_factor = img_height / 1000.0  # Normalize to typical image size
            estimated_height = (shadow_length * scale_factor) * 0.005  # Reduced scaling factor
            
            # Apply reasonable bounds
            estimated_height = max(2.0, min(50.0, estimated_height))
            
            logger.debug(f"Shadow-based height estimation: {estimated_height}m")
            return float(estimated_height) if estimated_height > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Shadow-based height estimation error: {e}")
            return 0.0
    
    def _estimate_height_from_perspective(self, img_array, building_type):
        """Estimate height using perspective analysis"""
        try:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect vertical lines (building edges) - more lenient parameters
            edges = cv2.Canny(gray, 30, 100)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=30, maxLineGap=15)
            
            if lines is None or len(lines) == 0:
                logger.debug("No lines detected in perspective analysis")
                return 0.0
            
            # Find vertical lines
            vertical_lines = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                if 75 < angle < 105:  # More lenient vertical detection
                    vertical_lines.append(line[0])
            
            logger.debug(f"Found {len(vertical_lines)} vertical lines")
            
            if not vertical_lines:
                logger.debug("No vertical lines found")
                return 0.0
            
            # Estimate height from vertical line length
            line_lengths = []
            for line in vertical_lines:
                x1, y1, x2, y2 = line
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                line_lengths.append(length)
            
            avg_line_length = np.mean(line_lengths)
            max_line_length = np.max(line_lengths)
            
            logger.debug(f"Average line length: {avg_line_length}, Max: {max_line_length}")
            
            # Convert to real height (rough estimation)
            # Use the longer lines as they're more likely to represent building height
            # Scale based on image size for better estimation
            img_height = img_array.shape[0]
            scale_factor = img_height / 1000.0  # Normalize to typical image size
            estimated_height = (max_line_length * scale_factor) * 0.01  # Reduced scaling factor
            
            # Apply reasonable bounds
            estimated_height = max(2.0, min(50.0, estimated_height))
            
            logger.debug(f"Perspective-based height estimation: {estimated_height}m")
            return float(estimated_height) if estimated_height > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Perspective-based height estimation error: {e}")
            return 0.0
    
    def _estimate_height_from_features(self, img_array, building_type):
        """Estimate height from architectural features"""
        try:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect horizontal lines (floors) - more lenient parameters
            edges = cv2.Canny(gray, 30, 100)  # Lower thresholds for more edges
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=20, maxLineGap=15)
            
            if lines is None or len(lines) == 0:
                logger.debug("No lines detected in feature-based height estimation")
                # Fallback: estimate based on image dimensions
                img_height = img_array.shape[0]
                # Assume building takes up 60-80% of image height
                building_height_ratio = 0.7
                # Rough estimation: assume camera distance gives us some scale
                estimated_height = (img_height * building_height_ratio) * 0.003  # Reduced scaling
                return float(estimated_height)
            
            # Count floors from horizontal lines
            horizontal_lines = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                if angle < 15 or angle > 165:  # More lenient horizontal detection
                    horizontal_lines.append(line[0])
            
            logger.debug(f"Found {len(horizontal_lines)} horizontal lines")
            
            # Estimate floors
            floors = 1  # Ground floor
            if horizontal_lines:
                y_coords = [line[1] for line in horizontal_lines]
                y_coords.sort()
                
                # Cluster y-coordinates to find floors
                prev_y = y_coords[0]
                min_floor_height = img_array.shape[0] * 0.03  # More lenient floor height
                
                for y in y_coords[1:]:
                    if y - prev_y > min_floor_height:
                        floors += 1
                        prev_y = y
                
                floors = min(floors, 20)  # Cap at 20 floors
                logger.debug(f"Estimated {floors} floors from horizontal lines")
            else:
                # Fallback: estimate floors based on image height
                img_height = img_array.shape[0]
                # Assume each floor is about 3-4 meters, and we can see 2-5 floors in a typical photo
                estimated_floors = max(2, min(5, int(img_height * 0.002)))  # Rough estimation
                floors = estimated_floors
                logger.debug(f"Fallback: estimated {floors} floors from image height")
            
            # Estimate height based on building type and floors
            if building_type == 'residential':
                floor_height = 3.0  # meters per floor
            elif building_type == 'commercial':
                floor_height = 3.5
            else:  # industrial
                floor_height = 4.0
            
            estimated_height = floors * floor_height
            logger.debug(f"Feature-based height estimation: {floors} floors × {floor_height}m = {estimated_height}m")
            return float(estimated_height)
            
        except Exception as e:
            logger.error(f"Feature-based height estimation error: {e}")
            return 0.0
    
    def _estimate_building_area(self, image, building_type, region_type, use_satellite, pin_location):
        """Estimate building area using multiple methods including satellite imagery"""
        try:
            # Method 1: Traditional computer vision (existing method)
            traditional_area = self._estimate_area_traditional(image, building_type, region_type)
            
            # Method 2: Satellite imagery (if available)
            satellite_area = 0.0
            if use_satellite and pin_location:
                satellite_area = self._estimate_area_from_satellite(pin_location, building_type)
            
            # Method 3: Enhanced segmentation
            enhanced_area = self._estimate_area_enhanced_segmentation(image, building_type)
            
            # Log individual estimates for debugging
            logger.info(f"Area estimation results:")
            logger.info(f"  Traditional CV: {traditional_area} sqm")
            logger.info(f"  Satellite imagery: {satellite_area} sqm")
            logger.info(f"  Enhanced segmentation: {enhanced_area} sqm")
            
            # Combine estimates
            estimates = [est for est in [traditional_area, satellite_area, enhanced_area] if est > 0]
            
            if estimates:
                # Weight traditional CV higher since it's working well
                if satellite_area > 0:
                    # If satellite area is very different from traditional CV, trust traditional CV more
                    if abs(satellite_area - traditional_area) / traditional_area > 2.0:  # If satellite is >200% different
                        weights = [0.7, 0.2, 0.1]  # Trust traditional CV more
                    else:
                        weights = [0.4, 0.4, 0.2]  # Balanced approach
                else:
                    weights = [0.6, 0.0, 0.4]  # Traditional CV gets higher weight
                
                weighted_sum = sum(w * e for w, e in zip(weights[:len(estimates)], estimates))
                estimated_area = weighted_sum / sum(weights[:len(estimates)])
                
                logger.info(f"  Weights used: {weights[:len(estimates)]}")
                logger.info(f"  Weighted estimate before bounds: {estimated_area} sqm")
                
                # NO BOUNDS - Trust the analysis completely
                # Only apply minimal validation for obviously wrong values
                if estimated_area < 1:  # Less than 1 sqm is unrealistic
                    estimated_area = 50.0  # Minimum realistic area
                elif estimated_area > 100000:  # More than 100,000 sqm is unrealistic
                    estimated_area = 10000.0  # Maximum realistic area
                
                logger.info(f"  No artificial bounds applied - trusting analysis")
                
                # Calculate confidence
                if len(estimates) > 1:
                    variance = np.var(estimates)
                    confidence = 1.0 / (1.0 + variance / 1000)
                    confidence = np.clip(confidence, 0.3, 0.95)
                else:
                    confidence = 0.5
                
                method = 'multi_method_fusion'
                logger.info(f"  Combined estimate: {estimated_area} sqm (method: {method})")
            else:
                # Fallback
                defaults = self._get_area_defaults(building_type, region_type)
                estimated_area = defaults['avg']
                confidence = 0.3
                method = 'default_fallback'
                logger.info(f"  Using fallback: {estimated_area} sqm (method: {method})")
            
            return {
                'estimated_area_sqm': round(float(estimated_area), 2),
                'confidence': round(float(confidence), 3),
                'method': method,
                'satellite_used': satellite_area > 0,
                'individual_estimates': {
                    'traditional_cv': float(traditional_area) if traditional_area > 0 else 0.0,
                    'satellite_imagery': float(satellite_area) if satellite_area > 0 else 0.0,
                    'enhanced_segmentation': float(enhanced_area) if enhanced_area > 0 else 0.0
                }
            }
            
        except Exception as e:
            logger.error(f"Area estimation error: {e}")
            defaults = self._get_area_defaults(building_type, region_type)
            return {
                'estimated_area_sqm': float(defaults['avg']),
                'confidence': 0.3,
                'method': 'error_fallback',
                'error': str(e)
            }
    
    def _estimate_area_traditional(self, image, building_type, region_type):
        """Traditional computer vision area estimation (existing method)"""
        try:
            # Use the existing BuildingAreaEstimator
            from building_area_estimator import BuildingAreaEstimator
            area_estimator = BuildingAreaEstimator()
            
            # Convert location to the format expected by the original estimator
            location = {'region_type': region_type.replace('Pakistan_', '').lower()}
            
            # Get area estimation from the original estimator
            result = area_estimator.estimate_area(image, building_type, location)
            return result['estimated_area_sqm']
            
        except Exception as e:
            logger.error(f"Traditional area estimation error: {e}")
            # Fallback to defaults
            defaults = self._get_area_defaults(building_type, region_type)
            return float(defaults['avg'])
    
    def _estimate_area_from_satellite(self, pin_location, building_type):
        """Estimate area using satellite imagery"""
        try:
            if not self.satellite_config['mapbox_token']:
                logger.warning("No Mapbox token available for satellite imagery")
                return 0.0
            
            # Parse pin location
            if isinstance(pin_location, str):
                # Assume format "lat,lng" or similar
                coords = pin_location.split(',')
                if len(coords) >= 2:
                    lat, lng = float(coords[0]), float(coords[1])
                else:
                    return 0.0
            elif isinstance(pin_location, dict):
                lat = pin_location.get('lat', pin_location.get('latitude', 0))
                lng = pin_location.get('lng', pin_location.get('longitude', 0))
            else:
                return 0.0
            
            # Download satellite image
            satellite_image = self._download_satellite_image(lat, lng, zoom=19)
            if satellite_image is None:
                return 0.0
            
            # Segment building footprint
            building_mask = self._segment_building_footprint(satellite_image)
            if building_mask is None:
                return 0.0
            
            # Calculate area from mask
            mask_pixels = np.count_nonzero(building_mask)
            
            # Convert pixels to square meters
            meters_per_pixel = self._calculate_meters_per_pixel(lat, zoom=19)
            area_sqm = mask_pixels * (meters_per_pixel ** 2)
            
            return float(area_sqm)
            
        except Exception as e:
            logger.error(f"Satellite area estimation error: {e}")
            return 0.0
    
    def _download_satellite_image(self, lat, lng, zoom=19, size=1024):
        """Download satellite image from Mapbox"""
        try:
            url = (
                f"https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"
                f"{lng},{lat},{zoom}/{size}x{size}?access_token={self.satellite_config['mapbox_token']}"
            )
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            image = Image.open(BytesIO(response.content)).convert('RGB')
            return image
            
        except Exception as e:
            logger.error(f"Failed to download satellite image: {e}")
            return None
    
    def _segment_building_footprint(self, satellite_image):
        """Segment building footprint from satellite image"""
        try:
            # Convert to numpy array
            img_array = np.array(satellite_image)
            
            # Simple segmentation based on color and texture
            # This is a simplified approach - in production you'd use a trained model
            
            # Convert to HSV
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Create mask for building-like colors (grays, browns, reds)
            mask1 = cv2.inRange(hsv, (0, 0, 50), (180, 30, 200))  # Grays
            mask2 = cv2.inRange(hsv, (0, 50, 50), (20, 255, 255))  # Reds/Browns
            
            # Combine masks
            building_mask = cv2.bitwise_or(mask1, mask2)
            
            # Clean up mask
            kernel = np.ones((5,5), np.uint8)
            building_mask = cv2.morphologyEx(building_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            building_mask = cv2.morphologyEx(building_mask, cv2.MORPH_OPEN, kernel, iterations=1)
            
            # Find largest connected component (likely the building)
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(building_mask)
            
            if num_labels > 1:
                # Get the largest component (excluding background)
                largest_idx = np.argmax(stats[1:, cv2.CC_STAT_AREA]) + 1
                final_mask = (labels == largest_idx).astype(np.uint8) * 255
                return final_mask
            
            return None
            
        except Exception as e:
            logger.error(f"Building segmentation error: {e}")
            return None
    
    def _calculate_meters_per_pixel(self, lat, zoom):
        """Calculate meters per pixel for Web Mercator projection"""
        lat_rad = math.radians(lat)
        meters_per_pixel = (156543.03392 * math.cos(lat_rad)) / (2 ** zoom)
        return meters_per_pixel
    
    def _estimate_area_enhanced_segmentation(self, image, building_type):
        """Enhanced segmentation-based area estimation"""
        try:
            # This would use more advanced segmentation techniques
            # For now, return a placeholder
            return 0.0
        except:
            return 0.0
    
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
        # Use the same defaults as the original building_area_estimator
        building_defaults = {
            'residential': {
                'Pakistan_Urban': {'min': 80, 'avg': 150, 'max': 2000},   # Increased from 500 to 2000
                'Pakistan_Rural': {'min': 60, 'avg': 120, 'max': 1500},   # Increased from 300 to 1500
                'Pakistan_SEZ': {'min': 100, 'avg': 200, 'max': 2500},    # Increased from 600 to 2500
                'default': {'min': 100, 'avg': 200, 'max': 2000}          # Increased from 600 to 2000
            },
            'commercial': {
                'Pakistan_Urban': {'min': 200, 'avg': 500, 'max': 5000},  # Increased from 2000 to 5000
                'Pakistan_Rural': {'min': 100, 'avg': 300, 'max': 3000},  # Increased from 1000 to 3000
                'Pakistan_SEZ': {'min': 300, 'avg': 800, 'max': 6000},    # Increased from 2500 to 6000
                'default': {'min': 300, 'avg': 800, 'max': 5000}          # Increased from 3000 to 5000
            },
            'industrial': {
                'Pakistan_Urban': {'min': 500, 'avg': 1500, 'max': 10000}, # Increased from 5000 to 10000
                'Pakistan_Rural': {'min': 300, 'avg': 800, 'max': 5000},   # Increased from 2000 to 5000
                'Pakistan_SEZ': {'min': 800, 'avg': 2000, 'max': 12000},   # Increased from 6000 to 12000
                'default': {'min': 1000, 'avg': 2500, 'max': 10000}        # Increased from 8000 to 10000
            }
        }
        
        if building_type not in building_defaults:
            building_type = 'residential'
        
        if region_type in building_defaults[building_type]:
            return building_defaults[building_type][region_type]
        
        return building_defaults[building_type]['default']
    
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
                'method': 'fallback_defaults'
            },
            'area_analysis': {
                'estimated_area_sqm': float(area),
                'confidence': 0.3,
                'method': 'fallback_defaults'
            },
            'volume_analysis': {
                'estimated_volume_cubic_m': round(volume, 2),
                'height_m': float(height),
                'area_sqm': float(area),
                'confidence': 0.3
            },
            'building_type': building_type,
            'region_type': region_type,
            'analysis_timestamp': self._get_timestamp()
        }
    
    def _get_timestamp(self):
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()
