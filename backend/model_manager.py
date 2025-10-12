# model_manager.py - Advanced Memory Management for ML Models
import os
import gc
import torch
import psutil
import logging
import threading
import time
import weakref
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from contextlib import contextmanager

from inference import DamageAssessmentPipeline
from enhanced_cost_estimation import EnhancedRegionalCostEstimator
from building_area_estimator import BuildingAreaEstimator
from enhanced_building_analyzer import EnhancedBuildingAnalyzer
from gemini_building_analyzer import GeminiBuildingAnalyzer
from volume_based_cost_estimation import VolumeBasedCostEstimator

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Advanced model management with lazy loading, caching, and memory optimization
    """
    
    def __init__(self, model_path: str = None, max_idle_time: int = 300):
        """
        Initialize ModelManager
        
        Args:
            model_path: Path to the ML model file
            max_idle_time: Time in seconds before unloading idle model (default: 5 minutes)
        """
        self.model_path = model_path or os.getenv('MODEL_PATH', 'damagenet_json_best.pth')
        self.max_idle_time = max_idle_time
        
        # Model instances
        self._pipeline = None
        self._cost_estimator = None
        self._area_estimator = None
        self._building_analyzer = None
        self._gemini_building_analyzer = None
        self._volume_cost_estimator = None
        
        # Model lifecycle tracking
        self._last_used = None
        self._model_lock = threading.RLock()
        self._cleanup_thread = None
        self._is_running = True
        
        # Memory monitoring
        self._memory_threshold = float(os.getenv('MEMORY_THRESHOLD_PERCENT', '80'))  # 80% RAM usage
        self._model_size_estimate = 0
        
        # Performance metrics
        self._load_count = 0
        self._unload_count = 0
        self._inference_count = 0
        
        logger.info(f"🧠 ModelManager initialized with:")
        logger.info(f"   📁 Model path: {self.model_path}")
        logger.info(f"   ⏰ Max idle time: {max_idle_time}s")
        logger.info(f"   🚨 Memory threshold: {self._memory_threshold}%")
        
        # Start cleanup thread
        self._start_cleanup_thread()
    
    def _start_cleanup_thread(self):
        """Start background thread for model cleanup"""
        def cleanup_worker():
            while self._is_running:
                try:
                    time.sleep(30)  # Check every 30 seconds
                    self._check_and_cleanup()
                except Exception as e:
                    logger.error(f"Cleanup thread error: {e}")
        
        self._cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
        self._cleanup_thread.start()
        logger.info("🧹 Model cleanup thread started")
    
    def _check_and_cleanup(self):
        """Check if models should be unloaded due to memory pressure or idle time"""
        with self._model_lock:
            current_time = datetime.now()
            
            # Check memory usage
            memory_percent = psutil.virtual_memory().percent
            if memory_percent > self._memory_threshold:
                logger.warning(f"🚨 High memory usage: {memory_percent:.1f}%")
                if self._pipeline is not None:
                    logger.info("🧹 Force unloading models due to memory pressure")
                    self._unload_models()
                    return
            
            # Check idle time
            if (self._last_used and 
                self._pipeline is not None and 
                (current_time - self._last_used).seconds > self.max_idle_time):
                logger.info(f"🧹 Unloading idle models (idle for {(current_time - self._last_used).seconds}s)")
                self._unload_models()
    
    def _load_models(self):
        """Load all required models with memory optimization"""
        if self._pipeline is not None:
            return  # Already loaded
        
        try:
            start_memory = psutil.virtual_memory().used
            logger.info(f"🚀 Loading models... (Current RAM: {start_memory / 1024**3:.1f}GB)")
            
            # Check if model file exists
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load pipeline with optimized settings
            logger.info("📚 Loading DamageNet pipeline...")
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            
            # Enable memory optimization for PyTorch
            if device == 'cuda':
                torch.cuda.empty_cache()
                torch.backends.cudnn.benchmark = True  # Optimize for consistent input sizes
            
            self._pipeline = DamageAssessmentPipeline(
                model_path=self.model_path,
                device=device
            )
            
            # Load cost estimator (lightweight)
            logger.info("💰 Loading cost estimator...")
            self._cost_estimator = EnhancedRegionalCostEstimator()
            
            # Load area estimator (lightweight)
            logger.info("📐 Loading area estimator...")
            self._area_estimator = BuildingAreaEstimator()
            
            # Load enhanced building analyzer (includes height estimation)
            logger.info("🏗️ Loading enhanced building analyzer...")
            self._building_analyzer = EnhancedBuildingAnalyzer()
            
            # Load Gemini building analyzer for AI-powered analysis
            logger.info("🤖 Loading Gemini building analyzer...")
            self._gemini_building_analyzer = GeminiBuildingAnalyzer()
            
            # Load volume-based cost estimator
            logger.info("💰 Loading volume-based cost estimator...")
            self._volume_cost_estimator = VolumeBasedCostEstimator()
            
            # Calculate memory usage
            end_memory = psutil.virtual_memory().used
            self._model_size_estimate = end_memory - start_memory
            
            self._load_count += 1
            self._last_used = datetime.now()
            
            logger.info(f"✅ Models loaded successfully!")
            logger.info(f"   📊 Memory used: {self._model_size_estimate / 1024**2:.1f}MB")
            logger.info(f"   📈 Total loads: {self._load_count}")
            logger.info(f"   💾 Current RAM: {psutil.virtual_memory().percent:.1f}%")
            
        except Exception as e:
            logger.error(f"❌ Failed to load models: {e}")
            self._unload_models()  # Cleanup on failure
            raise
    
    def _unload_models(self):
        """Unload models and free memory"""
        if self._pipeline is None:
            return  # Already unloaded
        
        try:
            logger.info("🧹 Unloading models...")
            
            # Delete model references
            self._pipeline = None
            self._cost_estimator = None
            self._area_estimator = None
            self._building_analyzer = None
            self._gemini_building_analyzer = None
            self._volume_cost_estimator = None
            
            # Force garbage collection
            gc.collect()
            
            # Clear CUDA cache if available
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                logger.info("🔥 CUDA cache cleared")
            
            self._unload_count += 1
            
            logger.info(f"✅ Models unloaded successfully!")
            logger.info(f"   🗑️ Total unloads: {self._unload_count}")
            logger.info(f"   💾 Current RAM: {psutil.virtual_memory().percent:.1f}%")
            
        except Exception as e:
            logger.error(f"❌ Error during model unload: {e}")
    
    @contextmanager
    def get_pipeline(self):
        """
        Context manager to get pipeline with automatic memory management
        
        Usage:
            with model_manager.get_pipeline() as pipeline:
                result = pipeline.assess_damage_and_cost(...)
        """
        with self._model_lock:
            try:
                # Load models if not already loaded
                if self._pipeline is None:
                    self._load_models()
                
                self._last_used = datetime.now()
                self._inference_count += 1
                
                yield {
                    'pipeline': self._pipeline,
                    'cost_estimator': self._cost_estimator,
                    'area_estimator': self._area_estimator,
                    'building_analyzer': self._building_analyzer,
                    'gemini_building_analyzer': self._gemini_building_analyzer,
                    'volume_cost_estimator': self._volume_cost_estimator
                }
                
            except Exception as e:
                logger.error(f"Pipeline context error: {e}")
                raise
            finally:
                # Update usage time
                self._last_used = datetime.now()
    
    @contextmanager
    def memory_optimized_inference(self):
        """
        Context manager for memory-optimized inference with cleanup
        
        Usage:
            with model_manager.memory_optimized_inference():
                # Your inference code here
                pass
        """
        # Clear any cached tensors before inference
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Force garbage collection
        gc.collect()
        
        initial_memory = psutil.virtual_memory().percent
        logger.debug(f"🔍 Starting inference (RAM: {initial_memory:.1f}%)")
        
        try:
            yield
        finally:
            # Cleanup after inference
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            final_memory = psutil.virtual_memory().percent
            logger.debug(f"🧹 Inference cleanup complete (RAM: {final_memory:.1f}%)")
    
    def get_status(self) -> Dict[str, Any]:
        """Get model manager status and statistics"""
        with self._model_lock:
            current_memory = psutil.virtual_memory()
            
            return {
                'models_loaded': self._pipeline is not None,
                'last_used': self._last_used.isoformat() if self._last_used else None,
                'load_count': self._load_count,
                'unload_count': self._unload_count,
                'inference_count': self._inference_count,
                'memory_usage': {
                    'current_percent': current_memory.percent,
                    'current_gb': current_memory.used / 1024**3,
                    'available_gb': current_memory.available / 1024**3,
                    'model_size_mb': self._model_size_estimate / 1024**2 if self._model_size_estimate else 0
                },
                'configuration': {
                    'model_path': self.model_path,
                    'max_idle_time': self.max_idle_time,
                    'memory_threshold': self._memory_threshold,
                    'device': 'cuda' if torch.cuda.is_available() else 'cpu'
                }
            }
    
    def force_unload(self):
        """Manually force unload models"""
        with self._model_lock:
            logger.info("🔧 Manual model unload requested")
            self._unload_models()
    
    def preload_models(self):
        """Manually preload models"""
        with self._model_lock:
            logger.info("🔧 Manual model preload requested")
            self._load_models()
    
    def shutdown(self):
        """Shutdown model manager and cleanup resources"""
        logger.info("🛑 Shutting down ModelManager...")
        self._is_running = False
        
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=5)
        
        with self._model_lock:
            self._unload_models()
        
        logger.info("✅ ModelManager shutdown complete")

# Global model manager instance
_model_manager = None

def get_model_manager() -> ModelManager:
    """Get global model manager instance"""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager

def shutdown_model_manager():
    """Shutdown global model manager"""
    global _model_manager
    if _model_manager is not None:
        _model_manager.shutdown()
        _model_manager = None
