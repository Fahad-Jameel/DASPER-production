# inference.py - Updated inference pipeline for JSON dataset
import torch
from PIL import Image
import torch.nn.functional as F
import numpy as np
from torchvision import transforms

from model import DamageNet
from enhanced_cost_estimation import EnhancedRegionalCostEstimator as RegionalCostEstimator

class DamageAssessmentPipeline:
    """
    Complete pipeline for damage assessment and cost estimation
    Updated for JSON-based dataset with continuous severity scores
    """
    
    def __init__(self, model_path, device='cuda'):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🔧 Initializing DamageAssessmentPipeline...")
        logger.info(f"📁 Model path: {model_path}")
        
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        logger.info(f"💻 Using device: {self.device}")
        
        # Load model - explicitly set weights_only=False for compatibility with PyTorch 2.6+
        logger.info(f"📂 Loading model checkpoint...")
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        model_config = checkpoint.get('model_config', {})
        logger.info(f"⚙️ Model config: {model_config}")
        
        self.output_type = model_config.get('output_type', 'regression')
        num_classes = model_config.get('num_classes', 1)
        logger.info(f"🎯 Output type: {self.output_type}, Num classes: {num_classes}")
        
        logger.info(f"🏗️ Creating DamageNet model...")
        self.model = DamageNet(
            output_type=self.output_type,
            num_classes=num_classes,
            backbone=model_config.get('backbone', 'efficientnet_b4'),
            pretrained=False
        )
        
        logger.info(f"📥 Loading model weights...")
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"✅ Model loaded and ready for inference!")
        
        # Store model metadata
        self.severity_threshold = checkpoint.get('severity_threshold', [0.25, 0.5, 0.75])
        
        # Initialize cost estimator
        self.cost_estimator = RegionalCostEstimator()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Severity labels for classification
        self.severity_labels = ['Minimal', 'Moderate', 'Severe', 'Destructive']
        
    def _severity_to_category(self, severity_score):
        """Convert continuous severity to category name"""
        if severity_score <= 0.25:
            return 'minimal'
        elif severity_score <= 0.5:
            return 'moderate'
        elif severity_score <= 0.75:
            return 'severe'
        else:
            return 'destructive'
    
    def predict_damage_severity(self, image_path_or_pil):
        """
        Predict damage severity from image
        
        Args:
            image_path_or_pil: Path to image file or PIL Image object
            
        Returns:
            dict: Prediction results
        """
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"🧠 Starting damage severity prediction...")
        logger.info(f"🖼️ Input type: {type(image_path_or_pil)}")
        
        # Load and preprocess image
        if isinstance(image_path_or_pil, str):
            logger.info(f"📂 Loading image from path: {image_path_or_pil}")
            image = Image.open(image_path_or_pil).convert('RGB')
        else:
            logger.info(f"🖼️ Using PIL image object")
            image = image_path_or_pil
        
        logger.info(f"📐 Image size: {image.size}")
        
        # Transform image
        logger.info(f"🔄 Transforming image for model input...")
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        logger.info(f"📊 Input tensor shape: {input_tensor.shape}")
        logger.info(f"💻 Device: {self.device}")
        
        # Predict
        logger.info(f"🤖 Running model inference...")
        with torch.no_grad():
            outputs = self.model(input_tensor)
            logger.info(f"📈 Model outputs shape: {outputs.shape}")
            logger.info(f"📈 Model outputs: {outputs}")
            
            if self.output_type == 'regression':
                # For regression, output is continuous severity score
                severity_score = outputs.squeeze().item()
                logger.info(f"🎯 Raw severity score: {severity_score}")
                severity_score = max(0.0, min(1.0, severity_score))  # Clamp to [0, 1]
                logger.info(f"🎯 Clamped severity score: {severity_score}")
                
                severity_category = self._severity_to_category(severity_score)
                logger.info(f"🏷️ Severity category: {severity_category}")
                confidence = 0.8  # Default confidence for regression
                
                # Create probability-like distribution around the predicted score
                class_probs = np.zeros(4)
                if severity_score <= 0.25:
                    class_probs[0] = 1.0
                elif severity_score <= 0.5:
                    class_probs[1] = 1.0
                elif severity_score <= 0.75:
                    class_probs[2] = 1.0
                else:
                    class_probs[3] = 1.0
                
                predicted_class = np.argmax(class_probs)
                
            else:
                # For classification, output is class probabilities
                probabilities = F.softmax(outputs, dim=1)
                predicted_class = torch.argmax(outputs, dim=1).item()
                confidence = probabilities[0][predicted_class].item()
                class_probs = probabilities[0].cpu().numpy()
                
                # Convert class to continuous severity score
                class_to_severity = {0: 0.125, 1: 0.375, 2: 0.625, 3: 0.875}
                severity_score = class_to_severity[predicted_class]
                severity_category = self.severity_labels[predicted_class].lower()
        
        return {
            'severity_score': severity_score,
            'severity_category': severity_category,
            'predicted_class': predicted_class,
            'predicted_label': self.severity_labels[predicted_class],
            'confidence': confidence,
            'output_type': self.output_type,
            'class_probabilities': {
                label: prob for label, prob in zip(self.severity_labels, class_probs)
            }
        }
    
    def assess_damage_and_cost(self, image_path_or_pil, building_area_sqm, 
                              building_type='residential', region='USA', damage_types=None):
        """
        Complete damage assessment with cost estimation
        
        Args:
            image_path_or_pil: Path to image or PIL Image
            building_area_sqm (float): Building area in square meters
            building_type (str): Building type
            region (str): Geographic region
            damage_types (list): Optional list of damage types
            
        Returns:
            dict: Complete assessment results
        """
        # Predict damage severity
        severity_results = self.predict_damage_severity(image_path_or_pil)
        
        # Estimate costs
        # Use default Pakistan regional data if region is not found
        default_regional_data = {
            'region': region,
            'construction': 0.35,
            'materials': 0.40,
            'labor': 0.25,
            'currency': 'PKR',
            'exchange_rate': 280.0,
            'inflation_factor': 1.15,
            'market_volatility': 0.20,
            'emergency_premium': 1.25
        }
        
        cost_results = self.cost_estimator.calculate_repair_cost(
            severity_score=severity_results['severity_score'],
            damage_ratio=severity_results['severity_score'],  # Use severity as damage ratio
            building_area_sqm=building_area_sqm,
            building_type=building_type,
            regional_data=default_regional_data,
            damage_types=damage_types
        )
        
        # Combine results
        return {
            'damage_assessment': severity_results,
            'cost_estimation': cost_results,
            'summary': {
                'severity_score': f"{severity_results['severity_score']:.3f}",
                'severity_category': severity_results['severity_category'],
                'confidence': f"{severity_results['confidence']:.2%}",
                'estimated_cost_usd': cost_results['total_estimated_cost_usd'],
                'cost_range': f"${cost_results['cost_range_low_usd']:,.2f} - ${cost_results['cost_range_high_usd']:,.2f}",
                'region': region,
                'building_type': building_type,
                'area_sqm': building_area_sqm,
                'damage_types': damage_types or []
            }
        }