# volume_based_cost_estimation.py - Enhanced cost estimation using building volume
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class VolumeBasedCostEstimator:
    """
    Enhanced cost estimation based on building volume (height × area)
    Extends the original cost estimation to include volume-based calculations
    """
    
    def __init__(self, db=None):
        self.db = db
        
        # Base costs per cubic meter in USD (following DASPER framework)
        # Adjusted to be more realistic compared to area-based costs
        self.base_volume_costs = {
            'residential': {
                'structural': {'min': 15, 'max': 120},  # per cubic meter (reduced from 50-400)
                'non_structural': {'min': 8, 'max': 60},  # per cubic meter (reduced from 25-200)
                'content': {'min': 5, 'max': 30}  # per cubic meter (reduced from 15-100)
            },
            'commercial': {
                'structural': {'min': 20, 'max': 180},  # per cubic meter (reduced from 75-600)
                'non_structural': {'min': 12, 'max': 90},  # per cubic meter (reduced from 40-300)
                'content': {'min': 6, 'max': 45}  # per cubic meter (reduced from 20-150)
            },
            'industrial': {
                'structural': {'min': 25, 'max': 225},  # per cubic meter (reduced from 100-750)
                'non_structural': {'min': 15, 'max': 112},  # per cubic meter (reduced from 50-375)
                'content': {'min': 9, 'max': 60}  # per cubic meter (reduced from 30-200)
            }
        }
        
        # Traditional area-based costs (for comparison and fallback)
        self.base_area_costs = {
            'residential': {
                'structural': {'min': 100, 'max': 800},
                'non_structural': {'min': 50, 'max': 400},
                'content': {'min': 25, 'max': 200}
            },
            'commercial': {
                'structural': {'min': 150, 'max': 1200},
                'non_structural': {'min': 75, 'max': 600},
                'content': {'min': 40, 'max': 300}
            },
            'industrial': {
                'structural': {'min': 200, 'max': 1500},
                'non_structural': {'min': 100, 'max': 750},
                'content': {'min': 60, 'max': 400}
            }
        }
        
        # Damage type multipliers (same as original)
        self.damage_multipliers = {
            'structural': 1.3,
            'flood': 1.2,
            'fire': 1.4,
            'earthquake': 1.5,
            'wind': 1.1,
            'settlement': 1.15,
            'cracks': 1.05,
            'water': 1.15,
            'collapse': 1.6
        }
        
        # Time factors for repair
        self.repair_time_factors = {
            'minimal': 7,     # days
            'moderate': 30,
            'severe': 90,
            'destructive': 180
        }
    
    def calculate_repair_cost(self, severity_score, damage_ratio, building_area_sqm, 
                            building_type, regional_data, damage_types=None, 
                            confidence_score=1.0, ai_analysis=None, 
                            building_height_m=None, building_volume_cubic_m=None):
        """
        Calculate repair cost using volume-based methodology with area fallback
        
        Args:
            severity_score: Damage severity (0-1)
            damage_ratio: Damage ratio (0-1)
            building_area_sqm: Building area in square meters
            building_type: Type of building
            regional_data: Regional cost factors
            damage_types: List of damage types
            confidence_score: Confidence in assessment (0-1)
            ai_analysis: AI analysis results
            building_height_m: Building height in meters (optional)
            building_volume_cubic_m: Building volume in cubic meters (optional)
        """
        try:
            # Ensure all inputs are proper Python types
            severity_score = float(severity_score) if hasattr(severity_score, 'item') else float(severity_score)
            damage_ratio = float(damage_ratio) if hasattr(damage_ratio, 'item') else float(damage_ratio)
            building_area_sqm = float(building_area_sqm) if hasattr(building_area_sqm, 'item') else float(building_area_sqm)
            confidence_score = float(confidence_score) if hasattr(confidence_score, 'item') else float(confidence_score)
            
            # Ensure building type is valid
            if building_type not in self.base_volume_costs:
                building_type = 'residential'
            
            # Determine if we can use volume-based calculation
            use_volume = False
            if building_volume_cubic_m and building_volume_cubic_m > 0:
                building_volume_cubic_m = float(building_volume_cubic_m)
                use_volume = True
                logger.info(f"Using volume-based calculation: {building_volume_cubic_m} cubic meters")
            elif building_height_m and building_height_m > 0:
                building_height_m = float(building_height_m)
                building_volume_cubic_m = building_area_sqm * building_height_m
                use_volume = True
                logger.info(f"Calculated volume from height: {building_volume_cubic_m} cubic meters")
            else:
                logger.info("Using area-based calculation (no height/volume data)")
            
            # Calculate base costs for each component
            if use_volume:
                structural_cost = self._calculate_volume_component_cost(
                    severity_score, damage_ratio, building_volume_cubic_m,
                    self.base_volume_costs[building_type]['structural']
                )
                
                non_structural_cost = self._calculate_volume_component_cost(
                    severity_score * 0.8, damage_ratio * 0.7, building_volume_cubic_m,
                    self.base_volume_costs[building_type]['non_structural']
                )
                
                content_cost = self._calculate_volume_component_cost(
                    severity_score * 0.6, damage_ratio * 0.5, building_volume_cubic_m,
                    self.base_volume_costs[building_type]['content']
                )
            else:
                # Fallback to area-based calculation
                structural_cost = self._calculate_area_component_cost(
                    severity_score, damage_ratio, building_area_sqm,
                    self.base_area_costs[building_type]['structural']
                )
                
                non_structural_cost = self._calculate_area_component_cost(
                    severity_score * 0.8, damage_ratio * 0.7, building_area_sqm,
                    self.base_area_costs[building_type]['non_structural']
                )
                
                content_cost = self._calculate_area_component_cost(
                    severity_score * 0.6, damage_ratio * 0.5, building_area_sqm,
                    self.base_area_costs[building_type]['content']
                )
            
            # Apply regional factors
            regional_multiplier = self._calculate_regional_multiplier(regional_data)
            
            structural_cost *= regional_multiplier
            non_structural_cost *= regional_multiplier
            content_cost *= regional_multiplier
            
            # Apply damage type multipliers
            damage_multiplier = self._calculate_damage_multiplier(damage_types)
            
            structural_cost *= damage_multiplier
            non_structural_cost *= damage_multiplier * 0.8
            content_cost *= damage_multiplier * 0.6
            
            # Calculate additional costs
            demolition_cost = 0
            if severity_score > 0.75:
                if use_volume:
                    demolition_cost = building_volume_cubic_m * 8 * regional_multiplier  # per cubic meter (reduced from 25)
                else:
                    demolition_cost = building_area_sqm * 50 * regional_multiplier  # per square meter
            
            # Professional fees (architects, engineers, project management)
            base_repair_cost = structural_cost + non_structural_cost + content_cost
            professional_fees = base_repair_cost * 0.15
            
            # Permits and regulatory costs
            permit_costs = base_repair_cost * 0.05
            
            # Emergency response costs
            emergency_cost = 0
            if severity_score > 0.5:
                emergency_cost = base_repair_cost * 0.1
            
            # Labor and material breakdown
            labor_percentage = 0.4  # 40% labor, 60% materials typically
            total_construction_cost = structural_cost + non_structural_cost
            labor_cost = total_construction_cost * labor_percentage
            material_cost = total_construction_cost * (1 - labor_percentage)
            
            # Equipment costs
            equipment_cost = total_construction_cost * 0.1
            
            # Apply confidence adjustment
            uncertainty_factor = (1.0 - confidence_score) * 0.4
            
            # Calculate total
            subtotal = (structural_cost + non_structural_cost + content_cost + 
                       demolition_cost + professional_fees + permit_costs + 
                       emergency_cost + equipment_cost)
            
            # Add contingency based on uncertainty
            contingency = subtotal * (0.1 + uncertainty_factor)
            
            total_cost = subtotal + contingency
            
            # Calculate ranges
            cost_range_low = total_cost * (1 - uncertainty_factor)
            cost_range_high = total_cost * (1 + uncertainty_factor)
            
            # Estimate repair time
            severity_category = self._get_severity_category(severity_score)
            base_repair_days = self.repair_time_factors[severity_category]
            repair_time_days = int(base_repair_days * (1 + damage_multiplier * 0.2))
            
            # Use AI analysis for refinement if available
            if ai_analysis and isinstance(ai_analysis, dict) and 'damage_percentage' in ai_analysis:
                try:
                    ai_damage_factor = float(ai_analysis['damage_percentage']) / 100
                    total_cost *= (1 + (ai_damage_factor - damage_ratio) * 0.3)
                except (ValueError, TypeError):
                    pass  # Ignore if conversion fails
            
            # Prepare result
            result = {
                'structural_cost': round(float(structural_cost), 2),
                'non_structural_cost': round(float(non_structural_cost), 2),
                'content_cost': round(float(content_cost), 2),
                'demolition_cost': round(float(demolition_cost), 2),
                'professional_fees': round(float(professional_fees), 2),
                'permit_costs': round(float(permit_costs), 2),
                'emergency_response_cost': round(float(emergency_cost), 2),
                'labor_cost': round(float(labor_cost), 2),
                'material_cost': round(float(material_cost), 2),
                'equipment_cost': round(float(equipment_cost), 2),
                'contingency': round(float(contingency), 2),
                'total_estimated_cost_usd': round(float(total_cost), 2),
                'cost_range_low_usd': round(float(cost_range_low), 2),
                'cost_range_high_usd': round(float(cost_range_high), 2),
                'repair_time_days': int(repair_time_days),
                'severity_score': float(severity_score),
                'damage_ratio': float(damage_ratio),
                'regional_multiplier': round(float(regional_multiplier), 3),
                'damage_multiplier': round(float(damage_multiplier), 3),
                'confidence_score': float(confidence_score),
                'calculation_method': 'volume_based' if use_volume else 'area_based',
                'building_dimensions': {
                    'area_sqm': float(building_area_sqm),
                    'height_m': float(building_height_m) if building_height_m else None,
                    'volume_cubic_m': float(building_volume_cubic_m) if building_volume_cubic_m else None
                },
                'calculation_timestamp': datetime.utcnow().isoformat()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Volume-based cost calculation error: {e}")
            # Return fallback estimation
            fallback_cost = float(building_area_sqm) * 500 * float(severity_score)
            return {
                'structural_cost': round(fallback_cost * 0.5, 2),
                'non_structural_cost': round(fallback_cost * 0.3, 2),
                'content_cost': round(fallback_cost * 0.1, 2),
                'demolition_cost': 0.0,
                'professional_fees': round(fallback_cost * 0.15, 2),
                'permit_costs': round(fallback_cost * 0.05, 2),
                'emergency_response_cost': round(fallback_cost * 0.1, 2),
                'labor_cost': round(fallback_cost * 0.4, 2),
                'material_cost': round(fallback_cost * 0.6, 2),
                'equipment_cost': round(fallback_cost * 0.1, 2),
                'contingency': round(fallback_cost * 0.2, 2),
                'total_estimated_cost_usd': round(fallback_cost * 1.4, 2),
                'cost_range_low_usd': round(fallback_cost * 1.2, 2),
                'cost_range_high_usd': round(fallback_cost * 1.6, 2),
                'repair_time_days': 60,
                'severity_score': float(severity_score),
                'damage_ratio': float(damage_ratio) if 'damage_ratio' in locals() else float(severity_score) * 0.8,
                'regional_multiplier': 1.0,
                'damage_multiplier': 1.0,
                'confidence_score': 0.5,
                'calculation_method': 'fallback',
                'building_dimensions': {
                    'area_sqm': float(building_area_sqm),
                    'height_m': None,
                    'volume_cubic_m': None
                },
                'error': str(e),
                'fallback_used': True
            }
    
    def _calculate_volume_component_cost(self, severity, damage_ratio, volume, cost_range):
        """Calculate cost for a specific component based on volume"""
        min_cost = float(cost_range['min'])
        max_cost = float(cost_range['max'])
        
        # Ensure inputs are float
        severity = float(severity)
        damage_ratio = float(damage_ratio)
        volume = float(volume)
        
        # Use exponential scaling for more realistic cost distribution
        severity_factor = np.power(severity, 1.5)
        damage_factor = np.power(damage_ratio, 1.3)
        
        # Combine factors
        cost_factor = (severity_factor + damage_factor) / 2
        
        # Interpolate cost per cubic meter
        cost_per_cubic_m = min_cost + (max_cost - min_cost) * cost_factor
        
        return float(cost_per_cubic_m * volume)
    
    def _calculate_area_component_cost(self, severity, damage_ratio, area, cost_range):
        """Calculate cost for a specific component based on area (fallback method)"""
        min_cost = float(cost_range['min'])
        max_cost = float(cost_range['max'])
        
        # Ensure inputs are float
        severity = float(severity)
        damage_ratio = float(damage_ratio)
        area = float(area)
        
        # Use exponential scaling for more realistic cost distribution
        severity_factor = np.power(severity, 1.5)
        damage_factor = np.power(damage_ratio, 1.3)
        
        # Combine factors
        cost_factor = (severity_factor + damage_factor) / 2
        
        # Interpolate cost per square meter
        cost_per_sqm = min_cost + (max_cost - min_cost) * cost_factor
        
        return float(cost_per_sqm * area)
    
    def _calculate_regional_multiplier(self, regional_data):
        """Calculate regional cost multiplier"""
        if not regional_data or not isinstance(regional_data, dict):
            return 1.0
        
        construction = float(regional_data.get('construction', 1.0))
        materials = float(regional_data.get('materials', 1.0))
        labor = float(regional_data.get('labor', 1.0))
        
        # Weighted average
        weights = [0.3, 0.5, 0.2]  # construction, materials, labor
        multiplier = (construction * weights[0] + 
                     materials * weights[1] + 
                     labor * weights[2])
        
        # Apply inflation factor
        inflation = float(regional_data.get('inflation_factor', 1.0))
        multiplier *= inflation
        
        # Apply market volatility
        volatility = float(regional_data.get('market_volatility', 0.0))
        multiplier *= (1 + volatility * 0.5)
        
        return float(multiplier)
    
    def _calculate_damage_multiplier(self, damage_types):
        """Calculate multiplier based on damage types"""
        if not damage_types:
            return 1.0
        
        multiplier = 1.0
        for damage_type in damage_types:
            damage_lower = damage_type.lower()
            for key, value in self.damage_multipliers.items():
                if key in damage_lower:
                    multiplier = max(multiplier, value)
        
        return float(multiplier)
    
    def _get_severity_category(self, severity_score):
        """Convert severity score to category"""
        severity_score = float(severity_score)
        if severity_score <= 0.25:
            return 'minimal'
        elif severity_score <= 0.5:
            return 'moderate'
        elif severity_score <= 0.75:
            return 'severe'
        else:
            return 'destructive'
