# model.py - DamageNet Architecture for Custom JSON Dataset
import torch
import torch.nn as nn
import timm
from torchvision import transforms
import numpy as np

class DamageNet(nn.Module):
    """
    DamageNet: CNN-based architecture for damage severity estimation
    Modified for continuous severity scores (0.0 - 1.0) from JSON dataset
    """
    def __init__(self, output_type='regression', num_classes=4, backbone='efficientnet_b4', pretrained=True, dropout=0.3):
        super(DamageNet, self).__init__()
        
        self.output_type = output_type  # 'regression' or 'classification'
        
        # Load pretrained backbone
        self.backbone = timm.create_model(
            backbone, 
            pretrained=pretrained, 
            num_classes=0,  # Remove final classification layer
            global_pool='avg'
        )
        
        # Get feature dimension from backbone
        self.feature_dim = self.backbone.num_features
        
        # Custom head based on output type
        if output_type == 'regression':
            # Regression head for continuous severity scores (0.0 - 1.0)
            self.head = nn.Sequential(
                nn.Dropout(dropout),
                nn.Linear(self.feature_dim, 512),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
                nn.Linear(512, 256),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout/2),
                nn.Linear(256, 1),
                nn.Sigmoid()  # Output between 0 and 1
            )
        else:
            # Classification head for discrete categories
            self.head = nn.Sequential(
                nn.Dropout(dropout),
                nn.Linear(self.feature_dim, 512),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout),
                nn.Linear(512, 256),
                nn.ReLU(inplace=True),
                nn.Dropout(dropout/2),
                nn.Linear(256, num_classes)
            )
        
    def forward(self, x):
        # Extract features using backbone
        features = self.backbone(x)
        
        # Get output through head
        output = self.head(features)
        return output