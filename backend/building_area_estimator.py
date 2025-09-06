# building_area_estimator.py - Fixed AI-based building area estimation
import cv2
import numpy as np
from PIL import Image
import torch
import logging
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

class BuildingAreaEstimator:
    """
    Estimates building area from images using computer vision and AI techniques
    """
    
    def __init__(self):
        self.initialized = True
        
        # Building type average areas (sqm) for different regions
        self.building_defaults = {
            'residential': {
                'Pakistan_Urban': {'min': 80, 'avg': 150, 'max': 500},
                'Pakistan_Rural': {'min': 60, 'avg': 120, 'max': 300},
                'Pakistan_SEZ': {'min': 100, 'avg': 200, 'max': 600},
                'default': {'min': 100, 'avg': 200, 'max': 600}
            },
            'commercial': {
                'Pakistan_Urban': {'min': 200, 'avg': 500, 'max': 2000},
                'Pakistan_Rural': {'min': 100, 'avg': 300, 'max': 1000},
                'Pakistan_SEZ': {'min': 300, 'avg': 800, 'max': 2500},
                'default': {'min': 300, 'avg': 800, 'max': 3000}
            },
            'industrial': {
                'Pakistan_Urban': {'min': 500, 'avg': 1500, 'max': 5000},
                'Pakistan_Rural': {'min': 300, 'avg': 800, 'max': 2000},
                'Pakistan_SEZ': {'min': 800, 'avg': 2000, 'max': 6000},
                'default': {'min': 1000, 'avg': 2500, 'max': 8000}
            }
        }
    
    def estimate_area(self, image, building_type='residential', location=None):
        """
        Estimate building area using multiple methods
        """
        try:
            # Convert PIL to numpy array
            img_array = np.array(image)
            
            # Method 1: Edge-based estimation
            edge_area = self._estimate_from_edges(img_array)
            
            # Method 2: Segmentation-based estimation
            segment_area = self._estimate_from_segmentation(img_array)
            
            # Method 3: Feature-based estimation
            feature_area = self._estimate_from_features(img_array, building_type)
            
            # Get region type
            region_type = self._get_region_type(location)
            
            # Get defaults for building type and region
            defaults = self._get_defaults(building_type, region_type)
            
            # Combine estimates
            estimates = [est for est in [edge_area, segment_area, feature_area] if est > 0]
            
            if estimates:
                # Weighted average
                weights = [0.3, 0.4, 0.3]  # edge, segment, feature
                weighted_sum = sum(w * e for w, e in zip(weights[:len(estimates)], estimates))
                estimated_area = weighted_sum / sum(weights[:len(estimates)])
                
                # Apply bounds based on building type
                estimated_area = np.clip(estimated_area, defaults['min'], defaults['max'])
                
                # Calculate confidence
                if len(estimates) > 1:
                    variance = np.var(estimates)
                    confidence = 1.0 / (1.0 + variance / 1000)
                    confidence = np.clip(confidence, 0.3, 0.95)
                else:
                    confidence = 0.5
                
                method = 'multi_method_fusion'
            else:
                # Fallback to defaults
                estimated_area = defaults['avg']
                confidence = 0.3
                method = 'default_fallback'
            
            # Adjust for visible damage
            damage_factor = self._estimate_damage_impact(img_array)
            estimated_area *= (1 + damage_factor * 0.1)  # Slight increase for damaged buildings
            
            return {
                'estimated_area_sqm': round(float(estimated_area), 2),
                'confidence': round(float(confidence), 3),
                'method': method,
                'bounds': {
                    'min': float(defaults['min']),
                    'max': float(defaults['max'])
                },
                'individual_estimates': {
                    'edge_based': float(edge_area) if edge_area > 0 else 0.0,
                    'segmentation_based': float(segment_area) if segment_area > 0 else 0.0,
                    'feature_based': float(feature_area) if feature_area > 0 else 0.0
                }
            }
            
        except Exception as e:
            logger.error(f"Area estimation error: {e}")
            # Return sensible defaults
            defaults = self._get_defaults(building_type, 'default')
            return {
                'estimated_area_sqm': float(defaults['avg']),
                'confidence': 0.3,
                'method': 'error_fallback',
                'error': str(e),
                'bounds': {
                    'min': float(defaults['min']),
                    'max': float(defaults['max'])
                }
            }
    
    def _estimate_from_edges(self, img_array):
        """Estimate building area from edge detection"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply bilateral filter to reduce noise while keeping edges sharp
            filtered = cv2.bilateralFilter(gray, 9, 75, 75)
            
            # Multi-scale edge detection
            edges1 = cv2.Canny(filtered, 50, 150)
            edges2 = cv2.Canny(filtered, 30, 100)
            edges = cv2.bitwise_or(edges1, edges2)
            
            # Morphological operations to connect edges
            kernel = np.ones((3,3), np.uint8)
            edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Find the largest contour (likely the building)
                largest_contour = max(contours, key=cv2.contourArea)
                
                # Approximate the contour to a polygon
                epsilon = 0.02 * cv2.arcLength(largest_contour, True)
                approx = cv2.approxPolyDP(largest_contour, epsilon, True)
                
                # Calculate area in pixels
                pixel_area = cv2.contourArea(approx)
                
                # Estimate real area (assuming standard photo conditions)
                # This is a rough estimation based on typical building photography
                img_height, img_width = img_array.shape[:2]
                img_area = img_height * img_width
                
                # Assume building occupies certain percentage of image
                building_ratio = pixel_area / img_area
                
                # Rough conversion to square meters
                # Assumes typical photo taken from ~20-30m distance
                if building_ratio > 0.6:
                    estimated_area = 200 * building_ratio  # Close-up shot
                elif building_ratio > 0.3:
                    estimated_area = 300 * building_ratio  # Medium shot
                else:
                    estimated_area = 500 * building_ratio  # Wide shot
                
                return float(estimated_area)
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Edge estimation error: {e}")
            return 0.0
    
    def _estimate_from_segmentation(self, img_array):
        """Estimate building area using color segmentation"""
        try:
            # Convert to HSV for better color segmentation
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
            
            # Define range for building colors (browns, grays, whites)
            # Multiple masks for different building materials
            masks = []
            
            # Concrete/gray buildings
            lower_gray = np.array([0, 0, 50])
            upper_gray = np.array([180, 30, 200])
            masks.append(cv2.inRange(hsv, lower_gray, upper_gray))
            
            # Brick/red buildings
            lower_red1 = np.array([0, 50, 50])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([170, 50, 50])
            upper_red2 = np.array([180, 255, 255])
            masks.append(cv2.bitwise_or(
                cv2.inRange(hsv, lower_red1, upper_red1),
                cv2.inRange(hsv, lower_red2, upper_red2)
            ))
            
            # Combine masks
            combined_mask = masks[0]
            for mask in masks[1:]:
                combined_mask = cv2.bitwise_or(combined_mask, mask)
            
            # Clean up mask
            kernel = np.ones((5,5), np.uint8)
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
            combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel, iterations=1)
            
            # Find largest connected component
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(combined_mask)
            
            if num_labels > 1:
                # Get the largest component (excluding background)
                largest_idx = np.argmax(stats[1:, cv2.CC_STAT_AREA]) + 1
                building_pixels = stats[largest_idx, cv2.CC_STAT_AREA]
                
                # Estimate area similar to edge method
                img_height, img_width = img_array.shape[:2]
                img_area = img_height * img_width
                building_ratio = building_pixels / img_area
                
                # Conversion to square meters
                if building_ratio > 0.5:
                    estimated_area = 250 * building_ratio
                elif building_ratio > 0.2:
                    estimated_area = 400 * building_ratio
                else:
                    estimated_area = 600 * building_ratio
                
                return float(estimated_area)
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Segmentation estimation error: {e}")
            return 0.0
    
    def _estimate_from_features(self, img_array, building_type):
        """Estimate area based on architectural features"""
        try:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Detect lines (windows, doors, floors)
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=30, maxLineGap=10)
            
            if lines is not None:
                # Analyze line patterns
                horizontal_lines = []
                vertical_lines = []
                
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                    
                    if angle < 10 or angle > 170:
                        horizontal_lines.append(line[0])
                    elif 80 < angle < 100:
                        vertical_lines.append(line[0])
                
                # Estimate floors from horizontal lines
                floors = 2  # Default assumption
                if horizontal_lines:
                    y_coords = [line[1] for line in horizontal_lines]
                    y_coords.sort()
                    
                    # Cluster y-coordinates to find floors
                    prev_y = y_coords[0]
                    min_floor_height = img_array.shape[0] * 0.05  # 5% of image height
                    
                    for y in y_coords[1:]:
                        if y - prev_y > min_floor_height:
                            floors += 1
                            prev_y = y
                    
                    floors = min(floors, 10)  # Cap at 10 floors
                
                # Estimate building width from vertical lines
                width_ratio = 0.5
                if vertical_lines:
                    x_coords = [line[0] for line in vertical_lines]
                    if x_coords:
                        building_width = max(x_coords) - min(x_coords)
                        width_ratio = building_width / img_array.shape[1]
                
                # Calculate area based on building type and features
                if building_type == 'residential':
                    floor_area = 100 + (floors - 1) * 80
                    estimated_area = floor_area * (1 + width_ratio)
                elif building_type == 'commercial':
                    floor_area = 200 + (floors - 1) * 150
                    estimated_area = floor_area * (1 + width_ratio * 1.5)
                else:  # industrial
                    floor_area = 500 + (floors - 1) * 300
                    estimated_area = floor_area * (1 + width_ratio * 2)
                
                return float(estimated_area)
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Feature estimation error: {e}")
            return 0.0
    
    def _estimate_damage_impact(self, img_array):
        """Estimate how damage affects visible area"""
        try:
            # Look for damage indicators (cracks, debris, etc.)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # High texture areas might indicate damage
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            texture_score = np.var(laplacian) / 1000
            
            # Dark areas might indicate shadows from collapsed portions
            dark_ratio = np.sum(gray < 50) / gray.size
            
            damage_factor = min(texture_score * 0.1 + dark_ratio * 0.2, 0.5)
            return float(damage_factor)
            
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
    
    def _get_defaults(self, building_type, region_type):
        """Get default area values for building type and region"""
        if building_type not in self.building_defaults:
            building_type = 'residential'
        
        if region_type in self.building_defaults[building_type]:
            return self.building_defaults[building_type][region_type]
        
        return self.building_defaults[building_type]['default']