# app.py - Enhanced DASPER Backend with Authentication and New Features
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import os
import io
import base64
import json
from datetime import datetime, timedelta
from PIL import Image, ImageDraw
import torch
import numpy as np
import cv2
from dotenv import load_dotenv
import google.generativeai as genai
from pymongo import MongoClient
from bson import ObjectId
import requests
from werkzeug.utils import secure_filename
import logging
import warnings
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import firebase_admin
from firebase_admin import credentials, auth
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import matplotlib.pyplot as plt
import seaborn as sns
from textblob import TextBlob

def convert_numpy_types(obj):
    """Convert numpy types to Python native types for BSON compatibility"""
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif hasattr(obj, 'item'):  # Handle numpy scalars
        return obj.item()
    else:
        return obj

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import feedparser
import uuid
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Import your existing modules
try:
    from inference import DamageAssessmentPipeline
    from enhanced_cost_estimation import EnhancedRegionalCostEstimator
    from building_area_estimator import BuildingAreaEstimator
except ImportError as e:
    print(f"Warning: Could not import modules: {e}")
    DamageAssessmentPipeline = None
    EnhancedRegionalCostEstimator = None
    BuildingAreaEstimator = None

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'])

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'
app.config['REPORTS_FOLDER'] = 'reports'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT
jwt = JWTManager(app)

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)
os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize global variables
mongo_client = None
db = None

# Import model manager for improved memory management
from model_manager import get_model_manager, shutdown_model_manager

# Global model manager instance
model_manager = None

# Initialize Firebase Admin (optional)
try:
    firebase_config = os.getenv('FIREBASE_CONFIG')
    if firebase_config:
        cred = credentials.Certificate(json.loads(firebase_config))
        firebase_admin.initialize_app(cred)
        logger.info("✅ Firebase Admin initialized")
except Exception as e:
    logger.warning(f"⚠️ Firebase Admin not initialized: {e}")

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for ObjectId, datetime, and numpy types"""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

app.json_encoder = JSONEncoder

def init_database():
    """Initialize MongoDB connection with improved error handling"""
    global mongo_client, db
    try:
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        mongo_client = MongoClient(mongo_uri)
        db = mongo_client['dasper_db']
        
        # Test connection
        mongo_client.admin.command('ping')
        logger.info("✅ MongoDB connected successfully")
        
        # Create collections with indexes
        collections = ['users', 'assessments', 'feedback', 'cost_data', 'regional_indices', 'disaster_alerts', 'reports']
        for collection_name in collections:
            collection = db[collection_name]
            try:
                collection.drop_indexes()
                logger.info(f"Dropped existing indexes for {collection_name}")
            except Exception as e:
                logger.warning(f"Could not drop indexes for {collection_name}: {e}")
        
        # Create new indexes
        db.users.create_index([("email", 1)], unique=True)
        db.users.create_index([("firebase_uid", 1)])
        db.assessments.create_index([("timestamp", -1)])
        db.assessments.create_index([("user_id", 1)])
        db.assessments.create_index([("building_name", 1)])
        db.assessments.create_index([("pin_location", 1)])
        db.assessments.create_index([("is_public", 1)])
        db.feedback.create_index([("assessment_id", 1)])
        db.cost_data.create_index([("region", 1)])
        db.regional_indices.create_index([("region", 1)])
        db.disaster_alerts.create_index([("timestamp", -1)])
        db.disaster_alerts.create_index([("location", 1)])
        db.reports.create_index([("user_id", 1)])
        db.reports.create_index([("created_at", -1)])
        
        logger.info("✅ Database indexes created successfully")
        
        # Initialize regional indices if not exists
        init_regional_indices()
        
        return True
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False

def init_regional_indices():
    """Initialize regional cost indices in database"""
    if db is None:
        return
    
    # Enhanced regional indices including Pakistan regions
    regional_indices = {
        'Pakistan_Urban': {
            'region': 'Pakistan_Urban',
            'cities': ['Islamabad', 'Karachi', 'Lahore', 'Rawalpindi'],
            'construction': 0.35,
            'materials': 0.40,
            'labor': 0.25,
            'currency': 'PKR',
            'exchange_rate': 280.0,
            'inflation_factor': 1.15,
            'market_volatility': 0.20,
            'emergency_premium': 1.25
        },
        'Pakistan_Rural': {
            'region': 'Pakistan_Rural',
            'construction': 0.25,
            'materials': 0.30,
            'labor': 0.15,
            'currency': 'PKR',
            'exchange_rate': 280.0,
            'inflation_factor': 1.12,
            'market_volatility': 0.25,
            'emergency_premium': 1.30
        },
        'Pakistan_SEZ': {
            'region': 'Pakistan_SEZ',
            'construction': 0.45,
            'materials': 0.50,
            'labor': 0.35,
            'currency': 'PKR',
            'exchange_rate': 280.0,
            'inflation_factor': 1.10,
            'market_volatility': 0.15,
            'emergency_premium': 1.20
        }
    }
    
    for region_data in regional_indices.values():
        db.regional_indices.update_one(
            {'region': region_data['region']},
            {'$set': region_data},
            upsert=True
        )
    
    logger.info("✅ Regional indices initialized")

def init_gemini():
    """Initialize Gemini AI"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
            return False
        
        genai.configure(api_key=api_key)
        logger.info("✅ Gemini AI configured successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Gemini AI initialization failed: {e}")
        return False

# [Previous pipeline initialization code remains the same]
def init_model_manager():
    """Initialize model manager with lazy loading and memory optimization"""
    global model_manager
    
    try:
        # Get model path from environment or use default
        model_path = os.getenv('MODEL_PATH', 'damagenet_json_best.pth')
        
        if not os.path.exists(model_path):
            logger.error(f"❌ Model file not found: {model_path}")
            logger.info("💡 The model will be loaded on first assessment request")
            return False
        
        # Initialize model manager (models loaded lazily)
        model_manager = get_model_manager()
        logger.info("✅ Model manager initialized with lazy loading")
        logger.info(f"   📁 Model path: {model_path}")
        logger.info(f"   🧠 Models will be loaded on first use")
        logger.info(f"   💾 Current RAM usage: {model_manager.get_status()['memory_usage']['current_percent']:.1f}%")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Model manager initialization failed: {e}")
        return False

def generate_enhanced_heatmap(image_path, assessment_result):
    """Generate enhanced heatmap visualization"""
    try:
        # Create results directory if it doesn't exist
        os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)
        
        # Generate heatmap filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        heatmap_filename = f"heatmap_{timestamp}_{uuid.uuid4().hex[:8]}.jpeg"
        heatmap_path = os.path.join(app.config['RESULTS_FOLDER'], heatmap_filename)
        
        # Load image
        image = Image.open(image_path).convert('RGB')
        
        # Create figure with subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7))
        
        # Original image
        ax1.imshow(image)
        ax1.set_title('Original Image', fontsize=14, fontweight='bold')
        ax1.axis('off')
        
        # Damage heatmap (simplified visualization)
        damage_percentage = assessment_result.get('damage_percentage', 0)
        severity = assessment_result.get('damage_severity', 'Unknown')
        
        # Create a simple heatmap overlay
        img_array = np.array(image)
        height, width = img_array.shape[:2]
        
        # Create damage overlay (red channel for damage visualization)
        damage_overlay = np.zeros((height, width, 4))
        damage_overlay[:, :, 0] = damage_percentage / 100.0  # Red channel
        damage_overlay[:, :, 3] = 0.3  # Alpha channel for transparency
        
        # Display heatmap
        ax2.imshow(image)
        ax2.imshow(damage_overlay, alpha=0.5, cmap='Reds')
        ax2.set_title(f'Damage Heatmap\nSeverity: {severity} ({damage_percentage:.1f}%)', 
                     fontsize=14, fontweight='bold')
        ax2.axis('off')
        
        # Add colorbar
        sm = plt.cm.ScalarMappable(cmap='Reds', norm=plt.Normalize(0, 100))
        cbar = plt.colorbar(sm, ax=ax2, shrink=0.8)
        cbar.set_label('Damage Percentage (%)', fontsize=12)
        
        # Add assessment info
        info_text = f"""
        Building Area: {assessment_result.get('building_area_sqm', 0):.1f} sqm
        Estimated Cost: ${assessment_result.get('estimated_cost', 0):,.0f}
        Confidence: {assessment_result.get('confidence_score', 0):.1f}%
        """
        
        fig.text(0.02, 0.02, info_text, fontsize=10, 
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.8))
        
        plt.tight_layout()
        plt.savefig(heatmap_path, dpi=300, bbox_inches='tight', facecolor='white')
        plt.close()
        
        logger.info(f"✅ Enhanced heatmap generated: {heatmap_path}")
        return heatmap_path
        
    except Exception as e:
        logger.error(f"❌ Heatmap generation failed: {e}")
        return None

# [Include all previous helper functions: create_enhanced_pipeline, generate_enhanced_heatmap, etc.]

# NEW AUTHENTICATION ENDPOINTS

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        required_fields = ['email', 'password', 'full_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        email = data['email'].lower()
        password = data['password']
        full_name = data['full_name']
        
        # Check if user already exists
        if db.users.find_one({'email': email}):
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        # Create user
        user_data = {
            'email': email,
            'password_hash': password_hash,
            'full_name': full_name,
            'profile_picture': data.get('profile_picture', ''),
            'phone': data.get('phone', ''),
            'organization': data.get('organization', ''),
            'role': data.get('role', 'user'),
            'created_at': datetime.utcnow(),
            'last_login': None,
            'is_active': True,
            'email_verified': False,
            'preferences': {
                'notifications': True,
                'public_reports': False,
                'theme': 'dark'
            }
        }
        
        result = db.users.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        # Remove password hash from response
        user_data.pop('password_hash')
        user_data['_id'] = user_id
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user_data
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = db.users.find_one({'email': email})
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account deactivated'}), 401
        
        # Update last login
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        
        # Create access token
        access_token = create_access_token(identity=str(user['_id']))
        
        # Remove password hash from response
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        user_data['_id'] = str(user['_id'])
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/firebase-login', methods=['POST'])
def firebase_login():
    """Login with Firebase token"""
    try:
        data = request.get_json()
        firebase_token = data.get('firebase_token')
        
        if not firebase_token:
            return jsonify({'error': 'Firebase token required'}), 400
        
        logger.info(f"Received Firebase token for authentication: {firebase_token[:20]}...")
        
        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(firebase_token)
            logger.info(f"Firebase token verified successfully")
            
            firebase_uid = decoded_token['uid']
            email = decoded_token.get('email', '').lower()
            name = decoded_token.get('name', '')
            picture = decoded_token.get('picture', '')
            
            logger.info(f"Firebase user details: UID={firebase_uid}, Email={email}")
        except Exception as verify_error:
            logger.error(f"Firebase token verification failed: {verify_error}")
            return jsonify({'error': f'Invalid Firebase token: {str(verify_error)}'}), 401
        
        # Find or create user
        user = db.users.find_one({'firebase_uid': firebase_uid})
        
        if not user:
            # Create new user
            user_data = {
                'email': email,
                'firebase_uid': firebase_uid,
                'full_name': name,
                'profile_picture': picture,
                'phone': '',
                'organization': '',
                'role': 'user',
                'created_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                'is_active': True,
                'email_verified': True,
                'auth_provider': 'firebase',
                'preferences': {
                    'notifications': True,
                    'public_reports': False,
                    'theme': 'dark'
                }
            }
            
            result = db.users.insert_one(user_data)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user['_id'])
            # Update last login
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'last_login': datetime.utcnow()}}
            )
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        # Get updated user data
        user_data = db.users.find_one({'_id': ObjectId(user_id)})
        user_data['_id'] = str(user_data['_id'])
        user_data.pop('password_hash', None)
        
        return jsonify({
            'message': 'Firebase login successful',
            'access_token': access_token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Firebase login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        user_data['_id'] = str(user['_id'])
        
        return jsonify({'user': user_data})
        
    except Exception as e:
        logger.error(f"Profile error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Fields that can be updated
        allowed_fields = ['full_name', 'phone', 'organization', 'profile_picture', 'preferences']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.utcnow()
        
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        return jsonify({'message': 'Profile updated successfully'})
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        return jsonify({'error': str(e)}), 500

# DISASTER ALERTS ENDPOINTS

@app.route('/api/disaster-alerts', methods=['GET'])
@jwt_required()
def get_disaster_alerts():
    """Get disaster alerts with automatic live data fetching"""
    try:
        # Check if we need to fetch fresh data (if no recent fetches)
        recent_fetch = db.disaster_alerts.find_one({
            'fetched_at': {'$gte': datetime.utcnow() - timedelta(hours=1)}
        })
        
        if not recent_fetch:
            logger.info("🔄 No recent external data, triggering live fetch...")
            try:
                fetch_and_store_live_alerts()
            except Exception as e:
                logger.warning(f"Live fetch failed during alerts request: {e}")
        
        # Fetch from database
        alerts = list(db.disaster_alerts.find({'active': True}).sort('timestamp', -1).limit(50))
        logger.info(f"📊 Found {len(alerts)} active alerts in database")
        
        # Convert ObjectId to string for JSON serialization
        for alert in alerts:
            if '_id' in alert:
                alert['_id'] = str(alert['_id'])
        
        logger.info(f"✅ Returning {len(alerts[:20])} total alerts")
        return jsonify({'alerts': alerts[:20]})
        
    except Exception as e:
        logger.error(f"Disaster alerts error: {e}")
        return jsonify({'error': str(e)}), 500

def fetch_and_store_live_alerts():
    """Fetch live disaster alerts from external APIs and store in database"""
    try:
        stored_count = 0
        logger.info("🌐 Starting live alerts fetch from external APIs...")
        
        # USGS Earthquake API - Enhanced
        stored_count += fetch_usgs_earthquakes()
        
        # OpenWeatherMap API
        stored_count += fetch_weather_alerts()
        
        # NASA Natural Disasters API
        stored_count += fetch_nasa_disasters()
        
        # Global Disaster Alert and Coordination System (GDACS)
        stored_count += fetch_gdacs_alerts()
        
        logger.info(f"✅ Total {stored_count} new alerts stored in database")
        return stored_count
        
    except Exception as e:
        logger.error(f"Live alerts fetch error: {e}")
        return 0

def fetch_usgs_earthquakes():
    """Fetch earthquake data from USGS and store in database"""
    try:
        stored_count = 0
        
        # Multiple USGS feeds for better coverage
        feeds = [
            ("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.geojson", "significant"),
            ("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson", "4.5+"),
            ("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson", "2.5+")
        ]
        
        for feed_url, feed_type in feeds:
            try:
                response = requests.get(feed_url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"📡 USGS {feed_type}: Found {len(data.get('features', []))} earthquakes")
                    
                    for feature in data.get('features', []):
                        props = feature.get('properties', {})
                        coords = feature.get('geometry', {}).get('coordinates', [])
                        
                        # Skip low magnitude earthquakes for significant feed
                        magnitude = props.get('mag', 0)
                        if feed_type == "significant" and magnitude < 4.0:
                            continue
                        
                        alert_id = props.get('ids', '').split(',')[0] if props.get('ids') else f"usgs_{props.get('time', 0)}"
                        
                        # Check if alert already exists
                        if db.disaster_alerts.find_one({'external_id': alert_id}):
                            continue
                        
                        # Determine severity based on magnitude
                        if magnitude >= 7.0:
                            severity = 'high'
                        elif magnitude >= 5.0:
                            severity = 'medium'
                        else:
                            severity = 'low'
                        
                        alert = {
                            'external_id': alert_id,
                            'title': props.get('title', f'M{magnitude} Earthquake'),
                            'description': f"{props.get('place', 'Unknown location')} - Magnitude {magnitude}",
                            'severity': severity,
                            'type': 'earthquake',
                            'magnitude': magnitude,
                            'location': {
                                'lat': coords[1] if len(coords) > 1 else 0,
                                'lng': coords[0] if len(coords) > 0 else 0
                            },
                            'timestamp': datetime.fromtimestamp(props.get('time', 0) / 1000),
                            'source': 'USGS',
                            'url': props.get('url', ''),
                            'active': True,
                            'fetched_at': datetime.utcnow()
                        }
                        
                        # Store in database
                        db.disaster_alerts.insert_one(alert)
                        stored_count += 1
                        logger.info(f"  ✅ Stored: {alert['title']}")
                        
            except Exception as e:
                logger.error(f"USGS {feed_type} API error: {e}")
        
        return stored_count
        
    except Exception as e:
        logger.error(f"USGS earthquakes error: {e}")
        return 0

def fetch_weather_alerts():
    """Fetch weather alerts from OpenWeatherMap and store in database"""
    try:
        stored_count = 0
        weather_api_key = os.getenv('OPENWEATHER_API_KEY')
        
        if not weather_api_key:
            logger.warning("⚠️ OPENWEATHER_API_KEY not configured")
            return 0
        
        # Pakistan major cities
        cities = [
            {'name': 'Islamabad', 'lat': 33.6844, 'lon': 73.0479},
            {'name': 'Karachi', 'lat': 24.8607, 'lon': 67.0011},
            {'name': 'Lahore', 'lat': 31.5204, 'lon': 74.3587},
            {'name': 'Peshawar', 'lat': 34.0151, 'lon': 71.5249},
            {'name': 'Quetta', 'lat': 30.1798, 'lon': 66.9750}
        ]
        
        for city in cities:
            try:
                weather_url = f"http://api.openweathermap.org/data/2.5/onecall?lat={city['lat']}&lon={city['lon']}&appid={weather_api_key}&exclude=minutely,hourly"
                response = requests.get(weather_url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    alerts_data = data.get('alerts', [])
                    logger.info(f"📡 Weather {city['name']}: Found {len(alerts_data)} alerts")
                    
                    for alert_data in alerts_data:
                        alert_id = f"weather_{city['name']}_{alert_data.get('start', 0)}"
                        
                        # Check if alert already exists
                        if db.disaster_alerts.find_one({'external_id': alert_id}):
                            continue
                        
                        alert = {
                            'external_id': alert_id,
                            'title': f"{alert_data.get('event', 'Weather Alert')} - {city['name']}",
                            'description': alert_data.get('description', 'Weather warning issued'),
                            'severity': 'high',
                            'type': 'weather',
                            'location': {'lat': city['lat'], 'lng': city['lon']},
                            'timestamp': datetime.fromtimestamp(alert_data.get('start', 0)),
                            'source': 'OpenWeatherMap',
                            'url': f"https://openweathermap.org/city/{city['name']}",
                            'active': True,
                            'fetched_at': datetime.utcnow()
                        }
                        
                        db.disaster_alerts.insert_one(alert)
                        stored_count += 1
                        logger.info(f"  ✅ Stored: {alert['title']}")
                        
            except Exception as e:
                logger.error(f"Weather API {city['name']} error: {e}")
        
        return stored_count
        
    except Exception as e:
        logger.error(f"Weather alerts error: {e}")
        return 0

def fetch_nasa_disasters():
    """Fetch natural disasters from NASA EONET API"""
    try:
        stored_count = 0
        nasa_url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50"
        
        response = requests.get(nasa_url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            events = data.get('events', [])
            logger.info(f"📡 NASA EONET: Found {len(events)} active events")
            
            for event in events:
                event_id = f"nasa_{event.get('id', '')}"
                
                # Check if alert already exists
                if db.disaster_alerts.find_one({'external_id': event_id}):
                    continue
                
                # Get latest geometry for location
                geometries = event.get('geometry', [])
                location = {'lat': 0, 'lng': 0}
                if geometries:
                    latest_geom = geometries[-1]
                    coords = latest_geom.get('coordinates', [0, 0])
                    location = {'lat': coords[1] if len(coords) > 1 else 0, 'lng': coords[0]}
                
                # Map NASA categories to our types
                category_map = {
                    'wildfires': 'wildfire',
                    'floods': 'flood',
                    'storms': 'storm',
                    'volcanoes': 'volcanic',
                    'drought': 'drought',
                    'dustHaze': 'dust_storm',
                    'landslides': 'landslide',
                    'manmade': 'industrial'
                }
                
                categories = event.get('categories', [])
                alert_type = 'disaster'
                if categories:
                    nasa_cat = categories[0].get('id', '')
                    alert_type = category_map.get(nasa_cat, 'disaster')
                
                alert = {
                    'external_id': event_id,
                    'title': event.get('title', 'Natural Disaster'),
                    'description': f"NASA EONET tracked event - {event.get('description', '')}",
                    'severity': 'medium',
                    'type': alert_type,
                    'location': location,
                    'timestamp': datetime.fromisoformat(event.get('geometry', [{}])[-1].get('date', '2023-01-01T00:00:00Z').replace('Z', '+00:00')),
                    'source': 'NASA EONET',
                    'url': event.get('link', ''),
                    'active': True,
                    'fetched_at': datetime.utcnow()
                }
                
                db.disaster_alerts.insert_one(alert)
                stored_count += 1
                logger.info(f"  ✅ Stored: {alert['title']}")
        
        return stored_count
        
    except Exception as e:
        logger.error(f"NASA disasters error: {e}")
        return 0

def fetch_gdacs_alerts():
    """Fetch alerts from Global Disaster Alert and Coordination System"""
    try:
        stored_count = 0
        gdacs_url = "https://www.gdacs.org/xml/rss.xml"
        
        response = requests.get(gdacs_url, timeout=10)
        if response.status_code == 200:
            # Parse RSS XML
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.content)
            
            items = root.findall('.//item')
            logger.info(f"📡 GDACS: Found {len(items)} alerts")
            
            for item in items:
                title = item.find('title').text if item.find('title') is not None else 'GDACS Alert'
                link = item.find('link').text if item.find('link') is not None else ''
                description = item.find('description').text if item.find('description') is not None else ''
                pub_date = item.find('pubDate').text if item.find('pubDate') is not None else ''
                
                # Extract coordinates from georss if available
                location = {'lat': 0, 'lng': 0}
                georss_point = item.find('{http://www.georss.org/georss}point')
                if georss_point is not None:
                    coords = georss_point.text.split()
                    if len(coords) == 2:
                        location = {'lat': float(coords[0]), 'lng': float(coords[1])}
                
                alert_id = f"gdacs_{hash(link)}"
                
                # Check if alert already exists
                if db.disaster_alerts.find_one({'external_id': alert_id}):
                    continue
                
                # Determine type and severity from title
                title_lower = title.lower()
                alert_type = 'disaster'
                severity = 'medium'
                
                if 'earthquake' in title_lower:
                    alert_type = 'earthquake'
                    severity = 'high'
                elif 'flood' in title_lower:
                    alert_type = 'flood'
                    severity = 'high'
                elif 'cyclone' in title_lower or 'hurricane' in title_lower:
                    alert_type = 'cyclone'
                    severity = 'high'
                elif 'volcano' in title_lower:
                    alert_type = 'volcanic'
                    severity = 'medium'
                
                alert = {
                    'external_id': alert_id,
                    'title': title,
                    'description': description[:500],  # Limit description length
                    'severity': severity,
                    'type': alert_type,
                    'location': location,
                    'timestamp': datetime.utcnow(),  # Use current time as fallback
                    'source': 'GDACS',
                    'url': link,
                    'active': True,
                    'fetched_at': datetime.utcnow()
                }
                
                db.disaster_alerts.insert_one(alert)
                stored_count += 1
                logger.info(f"  ✅ Stored: {alert['title'][:50]}...")
        
        return stored_count
        
    except Exception as e:
        logger.error(f"GDACS alerts error: {e}")
        return 0

def fetch_live_disaster_alerts():
    """Get live alerts (for backward compatibility) - returns from database now"""
    try:
        # Return recent alerts from database that were fetched from external APIs
        alerts = list(db.disaster_alerts.find({
            'fetched_at': {'$exists': True},  # Only externally fetched alerts
            'active': True
        }).sort('fetched_at', -1).limit(10))
        
        # Convert ObjectId to string for JSON serialization
        for alert in alerts:
            if '_id' in alert:
                alert['_id'] = str(alert['_id'])
        
        return alerts
        
    except Exception as e:
        logger.error(f"Live alerts fetch error: {e}")
        return []

# EXTERNAL API MANAGEMENT ENDPOINTS

@app.route('/api/alerts/fetch-live', methods=['POST'])
@jwt_required()
def trigger_live_alerts_fetch():
    """Manually trigger live alerts fetch from external APIs"""
    try:
        logger.info("🚀 Manual live alerts fetch triggered")
        stored_count = fetch_and_store_live_alerts()
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched and stored {stored_count} new alerts',
            'stored_count': stored_count
        })
        
    except Exception as e:
        logger.error(f"Manual alerts fetch error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/cleanup', methods=['POST'])
@jwt_required()
def cleanup_old_alerts():
    """Remove old/inactive alerts from database"""
    try:
        # Remove alerts older than 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        result = db.disaster_alerts.delete_many({
            'timestamp': {'$lt': cutoff_date}
        })
        
        # Deactivate alerts older than 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        deactivate_result = db.disaster_alerts.update_many(
            {'timestamp': {'$lt': week_ago}, 'active': True},
            {'$set': {'active': False}}
        )
        
        logger.info(f"🧹 Cleaned up {result.deleted_count} old alerts, deactivated {deactivate_result.modified_count}")
        
        return jsonify({
            'success': True,
            'deleted_count': result.deleted_count,
            'deactivated_count': deactivate_result.modified_count
        })
        
    except Exception as e:
        logger.error(f"Alerts cleanup error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/status', methods=['GET'])
@jwt_required()
def get_alerts_status():
    """Get status of alerts system and external APIs"""
    try:
        # Count alerts by source
        sources_stats = {}
        for source in ['USGS', 'OpenWeatherMap', 'NASA EONET', 'GDACS', 'Manual']:
            count = db.disaster_alerts.count_documents({'source': source, 'active': True})
            sources_stats[source] = count
        
        # Recent fetch stats
        recent_fetches = db.disaster_alerts.count_documents({
            'fetched_at': {'$gte': datetime.utcnow() - timedelta(hours=24)}
        })
        
        # API keys status
        api_keys_status = {
            'openweather': bool(os.getenv('OPENWEATHER_API_KEY')),
            'nasa': True,  # NASA EONET is free
            'usgs': True,  # USGS is free
            'gdacs': True  # GDACS is free
        }
        
        return jsonify({
            'sources_stats': sources_stats,
            'recent_fetches_24h': recent_fetches,
            'api_keys_configured': api_keys_status,
            'total_active_alerts': sum(sources_stats.values())
        })
        
    except Exception as e:
        logger.error(f"Alerts status error: {e}")
        return jsonify({'error': str(e)}), 500

# ENHANCED ASSESSMENT ENDPOINTS

@app.route('/api/assess', methods=['POST'])
@jwt_required()
def assess_damage():
    """Enhanced endpoint for damage assessment with user authentication and memory optimization"""
    try:
        logger.info("🔍 Assessment request received")
        user_id = get_jwt_identity()
        logger.info(f"👤 User ID: {user_id}")
        
        # Check model manager availability
        if model_manager is None:
            logger.error("❌ Model manager not initialized")
            return jsonify({'error': 'Model manager not available. Please check server configuration.'}), 500
        
        # Get form data
        building_name = request.form.get('building_name', '')
        building_type = request.form.get('building_type', 'residential')
        pin_location = request.form.get('pin_location', '')
        damage_types_str = request.form.get('damage_types', '')
        is_public = request.form.get('is_public', 'false').lower() == 'true'
        
        logger.info(f"Form data: building_name={building_name}, building_type={building_type}, pin_location={pin_location}")
        
        damage_types = [dt.strip() for dt in damage_types_str.split(',') if dt.strip()] if damage_types_str else []
        
        if 'image' not in request.files:
            logger.error("No image in request.files")
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({'error': 'No image selected'}), 400
        
        logger.info(f"Image file: {file.filename}")
        
        # Save uploaded image
        filename = secure_filename(f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}")
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(image_path)
        logger.info(f"Image saved to: {image_path}")
        
        # Load and process image
        image = Image.open(image_path).convert('RGB')
        logger.info(f"Image loaded: {image.size}")
        
        # Perform damage assessment with memory optimization
        try:
            logger.info("🧠 Starting AI-powered assessment with memory optimization")
            
            # Use model manager for memory-optimized inference
            with model_manager.memory_optimized_inference():
                with model_manager.get_pipeline() as models:
                    pipeline = models['pipeline']
                    cost_estimator = models['cost_estimator'] 
                    area_estimator = models['area_estimator']
                    
                    logger.info("📐 Starting building area estimation")
                    # Estimate building area - pass PIL image object, not path
                    building_area_result = area_estimator.estimate_area(image, building_type, pin_location)
                    building_area = building_area_result['estimated_area_sqm']  # Extract the float value
                    logger.info(f"📏 Building area estimated: {building_area} sqm")
                    
                    logger.info("🔍 Starting damage assessment")
                    # Perform damage assessment and cost estimation
                    assessment_result = pipeline.assess_damage_and_cost(
                        image_path, 
                        building_area, 
                        building_type, 
                        pin_location
                    )
                    logger.info(f"✅ Assessment completed successfully")
                    
                    # Clean up image from memory immediately after processing
                    image.close()
                    del image
            
            logger.info("Generating heatmap")
            # Generate heatmap
            heatmap_path = generate_enhanced_heatmap(image_path, assessment_result)
            logger.info(f"Heatmap generated: {heatmap_path}")
            
            # Extract data from the correct nested structure for database storage
            damage_assessment = assessment_result.get('damage_assessment', {})
            cost_estimation = assessment_result.get('cost_estimation', {})
            summary = assessment_result.get('summary', {})
            
            # Prepare comprehensive assessment data
            assessment_data = {
                'user_id': ObjectId(user_id),
                'timestamp': datetime.utcnow(),
                'building_name': building_name,
                'building_type': building_type,
                'pin_location': pin_location,
                'is_public': is_public,
                'damage_types': damage_types,
                'image_path': filename,
                'heatmap_path': os.path.basename(heatmap_path) if heatmap_path else None,
                'building_area_sqm': building_area,
                'damage_severity': damage_assessment.get('severity_category', summary.get('severity_category', 'Unknown')),
                'damage_percentage': round(damage_assessment.get('severity_score', 0) * 100, 1),
                'estimated_cost': cost_estimation.get('total_estimated_cost_usd', summary.get('estimated_cost_usd', 0)),
                'confidence_score': damage_assessment.get('confidence', 0),
                'assessment_details': {
                    'damage_assessment': damage_assessment,
                    'cost_estimation': cost_estimation,
                    'summary': summary
                },
                'cost_breakdown': {
                    'structural_cost': cost_estimation.get('structural_cost', 0),
                    'non_structural_cost': cost_estimation.get('non_structural_cost', 0),
                    'content_cost': cost_estimation.get('content_cost', 0),
                    'total_cost_usd': cost_estimation.get('total_estimated_cost_usd', 0)
                },
                'recommendations': assessment_result.get('recommendations', [])
            }
            
            logger.info("Saving to database")
            # Convert numpy types to Python types for BSON compatibility
            assessment_data_clean = convert_numpy_types(assessment_data)
            
            # Save to database
            result = db.assessments.insert_one(assessment_data_clean)
            assessment_id = str(result.inserted_id)
            logger.info(f"Assessment saved with ID: {assessment_id}")
            
            # Prepare response data - using the already extracted structures
            
            response_data = {
                'success': True,
                'assessment_id': assessment_id,
                'message': 'Damage assessment completed successfully',
                'damage_severity': damage_assessment.get('severity_category', summary.get('severity_category', 'Unknown')),
                'damage_percentage': round(damage_assessment.get('severity_score', 0) * 100, 1),
                'estimated_cost': cost_estimation.get('total_estimated_cost_usd', summary.get('estimated_cost_usd', 0)),
                'building_area_sqm': building_area,
                'heatmap_url': f'/api/results/{os.path.basename(heatmap_path)}' if heatmap_path else None,
                'recommendations': assessment_result.get('recommendations', []),
                # Additional detailed data
                'confidence': damage_assessment.get('confidence', 0),
                'severity_score': damage_assessment.get('severity_score', 0),
                'cost_breakdown': {
                    'structural_cost': cost_estimation.get('structural_cost', 0),
                    'non_structural_cost': cost_estimation.get('non_structural_cost', 0),
                    'content_cost': cost_estimation.get('content_cost', 0),
                    'total_cost_usd': cost_estimation.get('total_estimated_cost_usd', 0)
                }
            }
            
            logger.info("Assessment completed successfully")
            return jsonify(response_data)
            
        except Exception as assessment_error:
            logger.error(f"Assessment processing error: {assessment_error}")
            logger.error(f"Error type: {type(assessment_error)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': f'Assessment processing failed: {str(assessment_error)}'}), 500
        
    except Exception as e:
        logger.error(f"Assessment error: {e}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments', methods=['GET'])
@jwt_required()
def get_user_assessments():
    """Get user's assessments"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        skip = (page - 1) * limit
        
        assessments_raw = list(db.assessments.find(
            {'user_id': ObjectId(user_id)}
        ).sort('timestamp', -1).skip(skip).limit(limit))
        
        # Convert ObjectIds to strings for JSON serialization
        assessments = []
        for assessment in assessments_raw:
            assessment['_id'] = str(assessment['_id'])
            assessment['user_id'] = str(assessment['user_id'])
            assessments.append(assessment)
        
        total = db.assessments.count_documents({'user_id': ObjectId(user_id)})
        
        return jsonify({
            'assessments': assessments,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        })
        
    except Exception as e:
        logger.error(f"Get assessments error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/assessments/public', methods=['GET'])
@jwt_required()
def get_public_assessments():
    """Get public assessments"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        skip = (page - 1) * limit
        
        pipeline_query = [
            {'$match': {'is_public': True}},
            {'$lookup': {
                'from': 'users',
                'localField': 'user_id',
                'foreignField': '_id',
                'as': 'user_info'
            }},
            {'$addFields': {
                'user_name': {'$arrayElemAt': ['$user_info.full_name', 0]}
            }},
            {'$project': {'user_info': 0}},
            {'$sort': {'timestamp': -1}},
            {'$skip': skip},
            {'$limit': limit}
        ]
        
        assessments_raw = list(db.assessments.aggregate(pipeline_query))
        
        # Convert ObjectIds to strings for JSON serialization
        assessments = []
        for assessment in assessments_raw:
            assessment['_id'] = str(assessment['_id'])
            assessment['user_id'] = str(assessment['user_id'])
            assessments.append(assessment)
        
        total = db.assessments.count_documents({'is_public': True})
        
        return jsonify({
            'assessments': assessments,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        })
        
    except Exception as e:
        logger.error(f"Get public assessments error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/generate', methods=['POST'])
@jwt_required()
def generate_pdf_report():
    """Generate PDF report for assessment"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        assessment_id = data.get('assessment_id')
        
        if not assessment_id:
            return jsonify({'error': 'Assessment ID required'}), 400
        
        # Get assessment data
        assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        # Check if user owns assessment or it's public
        if str(assessment['user_id']) != user_id and not assessment.get('is_public', False):
            return jsonify({'error': 'Access denied'}), 403
        
        # Generate PDF
        pdf_path = generate_assessment_pdf(assessment)
        
        # Save report record
        report_data = {
            'user_id': ObjectId(user_id),
            'assessment_id': ObjectId(assessment_id),
            'pdf_path': pdf_path,
            'created_at': datetime.utcnow(),
            'file_size': os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
        }
        
        result = db.reports.insert_one(report_data)
        report_id = str(result.inserted_id)
        
        return jsonify({
            'report_id': report_id,
            'download_url': f'/api/reports/download/{report_id}',
            'message': 'Report generated successfully'
        })
        
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        return jsonify({'error': str(e)}), 500

def generate_assessment_pdf(assessment):
    """Generate PDF report for assessment"""
    try:
        # Create filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        pdf_filename = f"dasper_report_{assessment['_id']}_{timestamp}.pdf"
        pdf_path = os.path.join(app.config['REPORTS_FOLDER'], pdf_filename)
        
        # Create PDF
        doc = SimpleDocTemplate(pdf_path, pagesize=A4)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1a237e')
        )
        story.append(Paragraph("DASPER - Damage Assessment Report", title_style))
        story.append(Spacer(1, 20))
        
        # Building Information
        story.append(Paragraph("Building Information", styles['Heading2']))
        building_info = [
            ['Building Name:', assessment.get('building_name', 'N/A')],
            ['Building Type:', assessment.get('building_type', 'N/A')],
            ['Location:', assessment.get('pin_location', 'N/A')],
            ['Assessment Date:', assessment.get('timestamp', datetime.now()).strftime('%Y-%m-%d %H:%M:%S')],
            ['Estimated Area:', f"{assessment.get('estimated_building_area_sqm', 0):.2f} sq.m"]
        ]
        
        table = Table(building_info, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Damage Assessment Results
        story.append(Paragraph("Damage Assessment Results", styles['Heading2']))
        damage_results = assessment.get('damage_assessment', {})
        
        damage_info = [
            ['Severity Score:', f"{damage_results.get('severity_score', 0):.3f}"],
            ['Severity Category:', damage_results.get('severity_category', 'N/A').title()],
            ['Damage Ratio:', f"{damage_results.get('damage_ratio', 0):.3f}"],
            ['Confidence:', f"{damage_results.get('confidence', 0):.2%}"],
            ['Predicted Class:', damage_results.get('predicted_label', 'N/A')]
        ]
        
        table = Table(damage_info, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))
        
        # Cost Estimation
        story.append(Paragraph("Cost Estimation", styles['Heading2']))
        cost_results = assessment.get('cost_estimation', {})
        regional_data = assessment.get('regional_data', {})
        currency = regional_data.get('currency', 'USD')
        
        cost_info = [
            ['Structural Cost:', f"{cost_results.get('structural_cost', 0):,.2f} {currency}"],
            ['Non-Structural Cost:', f"{cost_results.get('non_structural_cost', 0):,.2f} {currency}"],
            ['Content Cost:', f"{cost_results.get('content_cost', 0):,.2f} {currency}"],
            ['Professional Fees:', f"{cost_results.get('professional_fees', 0):,.2f} {currency}"],
            ['Total Estimated Cost:', f"{cost_results.get('total_estimated_cost_usd', 0):,.2f} USD"],
            ['Repair Time Estimate:', f"{cost_results.get('repair_time_days', 0)} days"]
        ]
        
        table = Table(cost_info, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))
        
        # AI Analysis
        ai_analysis = assessment.get('ai_analysis', {})
        if ai_analysis.get('description'):
            story.append(Paragraph("AI Analysis", styles['Heading2']))
            story.append(Paragraph(ai_analysis.get('description', ''), styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        
        return pdf_path
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise

@app.route('/api/reports/download/<report_id>', methods=['GET'])
@jwt_required()
def download_report(report_id):
    """Download PDF report"""
    try:
        user_id = get_jwt_identity()
        
        # Get report
        report = db.reports.find_one({'_id': ObjectId(report_id)})
        if not report:
            return jsonify({'error': 'Report not found'}), 404
        
        # Check access
        if str(report['user_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        if not os.path.exists(report['pdf_path']):
            return jsonify({'error': 'Report file not found'}), 404
        
        return send_file(
            report['pdf_path'],
            as_attachment=True,
            download_name=f"dasper_report_{report_id}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"Download report error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback/sentiment', methods=['POST'])
@jwt_required()
def analyze_feedback_sentiment():
    """Analyze sentiment of feedback using NLP"""
    try:
        data = request.get_json()
        feedback_text = data.get('feedback_text', '')
        
        if not feedback_text:
            return jsonify({'error': 'Feedback text required'}), 400
        
        # Use TextBlob for sentiment analysis
        blob = TextBlob(feedback_text)
        
        sentiment_score = blob.sentiment.polarity  # -1 to 1
        subjectivity = blob.sentiment.subjectivity  # 0 to 1
        
        # Categorize sentiment
        if sentiment_score > 0.1:
            sentiment_label = 'positive'
        elif sentiment_score < -0.1:
            sentiment_label = 'negative'
        else:
            sentiment_label = 'neutral'
        
        # Get key phrases
        noun_phrases = list(blob.noun_phrases)
        
        return jsonify({
            'sentiment_score': round(sentiment_score, 3),
            'sentiment_label': sentiment_label,
            'subjectivity': round(subjectivity, 3),
            'key_phrases': noun_phrases[:5],  # Top 5 phrases
            'word_count': len(feedback_text.split())
        })
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics for user"""
    try:
        user_id = get_jwt_identity()
        
        # User's assessments count
        user_assessments = db.assessments.count_documents({'user_id': ObjectId(user_id)})
        
        # User's total estimated costs
        pipeline = [
            {'$match': {'user_id': ObjectId(user_id)}},
            {'$group': {
                '_id': None,
                'total_cost': {'$sum': '$estimated_cost'},
                'avg_severity': {'$avg': {'$divide': ['$damage_percentage', 100]}}  # Convert percentage back to score
            }}
        ]
        
        cost_stats = list(db.assessments.aggregate(pipeline))
        total_cost = cost_stats[0]['total_cost'] if cost_stats and cost_stats[0]['total_cost'] is not None else 0
        avg_severity = cost_stats[0]['avg_severity'] if cost_stats and cost_stats[0]['avg_severity'] is not None else 0
        
        # Recent assessments - convert ObjectIds to strings
        recent_assessments_raw = list(db.assessments.find(
            {'user_id': ObjectId(user_id)}
        ).sort('timestamp', -1).limit(5))
        
        # Convert ObjectIds to strings for JSON serialization
        recent_assessments = []
        for assessment in recent_assessments_raw:
            assessment['_id'] = str(assessment['_id'])
            assessment['user_id'] = str(assessment['user_id'])
            recent_assessments.append(assessment)
        
        # Severity distribution
        severity_pipeline = [
            {'$match': {'user_id': ObjectId(user_id)}},
            {'$group': {
                '_id': '$damage_severity',
                'count': {'$sum': 1}
            }}
        ]
        
        severity_distribution_raw = list(db.assessments.aggregate(severity_pipeline))
        # Convert _id to string if needed
        severity_distribution = []
        for item in severity_distribution_raw:
            item['_id'] = str(item['_id']) if item['_id'] else 'Unknown'
            severity_distribution.append(item)
        
        # Building type distribution
        building_pipeline = [
            {'$match': {'user_id': ObjectId(user_id)}},
            {'$group': {
                '_id': '$building_type',
                'count': {'$sum': 1}
            }}
        ]
        
        building_distribution_raw = list(db.assessments.aggregate(building_pipeline))
        # Convert _id to string if needed
        building_distribution = []
        for item in building_distribution_raw:
            item['_id'] = str(item['_id']) if item['_id'] else 'Unknown'
            building_distribution.append(item)
        
        return jsonify({
            'user_assessments': user_assessments,
            'total_estimated_cost': round(total_cost, 2),
            'average_severity': round(avg_severity, 3),
            'recent_assessments': recent_assessments,
            'severity_distribution': severity_distribution,
            'building_distribution': building_distribution
        })
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/global-stats', methods=['GET'])
@jwt_required()
def get_global_dashboard_stats():
    """Get global dashboard statistics"""
    try:
        # Total public assessments
        total_assessments = db.assessments.count_documents({'is_public': True})
        
        # Global cost statistics
        global_pipeline = [
            {'$match': {'is_public': True}},
            {'$group': {
                '_id': None,
                'total_cost': {'$sum': '$estimated_cost'},
                'avg_severity': {'$avg': {'$divide': ['$damage_percentage', 100]}},  # Convert percentage back to score
                'max_severity': {'$max': {'$divide': ['$damage_percentage', 100]}}
            }}
        ]
        
        global_stats = list(db.assessments.aggregate(global_pipeline))
        
        # Location-based statistics
        location_pipeline = [
            {'$match': {'is_public': True}},
            {'$group': {
                '_id': '$pin_location',
                'count': {'$sum': 1},
                'avg_cost': {'$avg': '$estimated_cost'}
            }},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        
        location_stats_raw = list(db.assessments.aggregate(location_pipeline))
        
        # Convert ObjectIds to strings for JSON serialization
        location_stats = []
        for item in location_stats_raw:
            item['_id'] = str(item['_id']) if item['_id'] else 'Unknown'
            location_stats.append(item)
        
        # Recent disaster alerts count
        recent_alerts = db.disaster_alerts.count_documents({
            'timestamp': {'$gte': datetime.utcnow() - timedelta(days=7)}
        })
        
        return jsonify({
            'total_public_assessments': total_assessments,
            'global_cost_statistics': global_stats[0] if global_stats else {},
            'top_locations': location_stats,
            'recent_alerts': recent_alerts
        })
        
    except Exception as e:
        logger.error(f"Global dashboard stats error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications/send', methods=['POST'])
@jwt_required()
def send_notification():
    """Send notification to user"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        notification_data = {
            'user_id': ObjectId(user_id),
            'title': data.get('title', ''),
            'message': data.get('message', ''),
            'type': data.get('type', 'info'),  # info, warning, error, success
            'is_read': False,
            'created_at': datetime.utcnow()
        }
        
        result = db.notifications.insert_one(notification_data)
        
        return jsonify({
            'notification_id': str(result.inserted_id),
            'message': 'Notification sent successfully'
        })
        
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get user notifications"""
    try:
        user_id = get_jwt_identity()
        
        notifications = list(db.notifications.find(
            {'user_id': ObjectId(user_id)}
        ).sort('created_at', -1).limit(20))
        
        unread_count = db.notifications.count_documents({
            'user_id': ObjectId(user_id),
            'is_read': False
        })
        
        return jsonify({
            'notifications': notifications,
            'unread_count': unread_count
        })
        
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/data', methods=['GET'])
@jwt_required()
def export_user_data():
    """Export user's data"""
    try:
        user_id = get_jwt_identity()
        
        # Get user data
        user = db.users.find_one({'_id': ObjectId(user_id)})
        assessments = list(db.assessments.find({'user_id': ObjectId(user_id)}))
        reports = list(db.reports.find({'user_id': ObjectId(user_id)}))
        
        # Remove sensitive data
        if user:
            user.pop('password_hash', None)
        
        export_data = {
            'user_profile': user,
            'assessments': assessments,
            'reports': reports,
            'export_date': datetime.utcnow().isoformat()
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        logger.error(f"Export data error: {e}")
        return jsonify({'error': str(e)}), 500

# Include all previous helper functions and endpoints...
# [Previous code: init_pipeline, create_enhanced_pipeline, generate_enhanced_heatmap, etc.]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint with model manager status"""
    model_status = {}
    if model_manager:
        model_status = model_manager.get_status()
    
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb': mongo_client is not None,
        'model_manager': model_manager is not None,
        'model_status': model_status,
        'folders': {
            'upload_folder': os.path.exists(app.config['UPLOAD_FOLDER']),
            'results_folder': os.path.exists(app.config['RESULTS_FOLDER']),
            'reports_folder': os.path.exists(app.config['REPORTS_FOLDER'])
        }
    })

@app.route('/api/model/status', methods=['GET'])
@jwt_required()
def get_model_status():
    """Get detailed model manager status"""
    try:
        if model_manager is None:
            return jsonify({'error': 'Model manager not available'}), 503
        
        status = model_manager.get_status()
        return jsonify({
            'success': True,
            'data': status
        })
    except Exception as e:
        logger.error(f"Model status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/model/preload', methods=['POST'])
@jwt_required()
def preload_models():
    """Manually preload models"""
    try:
        if model_manager is None:
            return jsonify({'error': 'Model manager not available'}), 503
        
        logger.info("🚀 Manual model preload requested")
        model_manager.preload_models()
        
        return jsonify({
            'success': True,
            'message': 'Models preloaded successfully',
            'status': model_manager.get_status()
        })
    except Exception as e:
        logger.error(f"Model preload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/model/unload', methods=['POST'])
@jwt_required()
def unload_models():
    """Manually unload models to free memory"""
    try:
        if model_manager is None:
            return jsonify({'error': 'Model manager not available'}), 503
        
        logger.info("🗑️ Manual model unload requested")
        model_manager.force_unload()
        
        return jsonify({
            'success': True,
            'message': 'Models unloaded successfully',
            'status': model_manager.get_status()
        })
    except Exception as e:
        logger.error(f"Model unload error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/regions', methods=['GET'])
def get_regions():
    """Get available regions with cost indices"""
    try:
        if db:
            regions = list(db.regional_indices.find({}, {'_id': 0}))
            return jsonify({'regions': regions})
        else:
            return jsonify({'error': 'Database not connected'}), 500
    except Exception as e:
        logger.error(f"Get regions error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/results/<filename>', methods=['GET'])
def get_result_image(filename):
    """Serve result images (heatmaps)"""
    try:
        return send_file(
            os.path.join(app.config['RESULTS_FOLDER'], filename),
            mimetype='image/jpeg'
        )
    except Exception as e:
        logger.error(f"Get result image error: {e}")
        return jsonify({'error': 'Image not found'}), 404

@app.route('/api/assessments/<assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment_detail(assessment_id):
    """Get detailed information about a specific assessment"""
    try:
        user_id = get_jwt_identity()
        assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
        
        # Check if user has access (owner or public)
        if str(assessment.get('user_id')) != user_id and not assessment.get('is_public', False):
            return jsonify({'error': 'Unauthorized access to assessment'}), 403
            
        # Convert ObjectIds to strings for JSON serialization
        assessment['_id'] = str(assessment['_id'])
        assessment['user_id'] = str(assessment['user_id'])
            
        # Include image paths
        if 'image_path' in assessment:
            assessment['image_url'] = f"/uploads/{os.path.basename(assessment['image_path'])}"
        if 'result_path' in assessment:
            assessment['result_url'] = f"/results/{os.path.basename(assessment['result_path'])}"
            
        return jsonify(assessment)
    except Exception as e:
        logger.error(f"Get assessment detail error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cost-breakdown/<assessment_id>', methods=['GET'])
@jwt_required()
def get_cost_breakdown(assessment_id):
    """Get detailed cost breakdown for an assessment"""
    try:
        user_id = get_jwt_identity()
        assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
            
        # Check if user has access (owner or public)
        if str(assessment.get('user_id')) != user_id and not assessment.get('is_public', False):
            return jsonify({'error': 'Unauthorized access to assessment'}), 403
            
        # Get cost breakdown from assessment
        cost_data = assessment.get('cost_estimation', {})
        if not cost_data:
            return jsonify({'error': 'No cost data available for this assessment'}), 404
            
        # Enhance with more detailed breakdown
        detailed_breakdown = {
            'summary': {
                'total_cost': cost_data.get('total_cost'),
                'formatted_cost': cost_data.get('formatted_cost'),
                'currency': cost_data.get('currency', 'PKR'),
                'area': assessment.get('building_info', {}).get('estimated_area_sqm'),
                'cost_per_sqm': cost_data.get('cost_per_sqm'),
            },
            'components': cost_data.get('component_costs', {}),
            'labor': cost_data.get('labor_costs', {}),
            'materials': cost_data.get('material_costs', {}),
            'region': cost_data.get('region', 'Unknown'),
            'factors': cost_data.get('adjustment_factors', {}),
        }
            
        return jsonify(detailed_breakdown)
    except Exception as e:
        logger.error(f"Get cost breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
@jwt_required()
def submit_feedback():
    """Submit user feedback on assessment"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        if not data or 'assessment_id' not in data:
            return jsonify({'error': 'Assessment ID is required'}), 400
            
        assessment_id = data['assessment_id']
        assessment = db.assessments.find_one({'_id': ObjectId(assessment_id)})
        
        if not assessment:
            return jsonify({'error': 'Assessment not found'}), 404
            
        # Check if user has access
        if str(assessment.get('user_id')) != user_id:
            return jsonify({'error': 'Unauthorized access to assessment'}), 403
            
        # Create feedback document
        feedback = {
            'assessment_id': ObjectId(assessment_id),
            'user_id': user_id,
            'user_severity_score': data.get('user_severity_score'),
            'user_damage_types': data.get('user_damage_types', []),
            'user_comments': data.get('user_comments', ''),
            'user_estimated_cost': data.get('user_estimated_cost'),
            'user_area_estimate': data.get('user_area_estimate'),
            'repair_urgency': data.get('repair_urgency', 'medium'),
            'additional_notes': data.get('additional_notes', ''),
            'timestamp': datetime.utcnow()
        }
        
        # Save to database
        result = db.feedback.insert_one(feedback)
        feedback['_id'] = str(result.inserted_id)
        
        # Update assessment with feedback reference
        db.assessments.update_one(
            {'_id': ObjectId(assessment_id)},
            {'$set': {'has_feedback': True}}
        )
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'feedback_id': str(result.inserted_id)
        })
    except Exception as e:
        logger.error(f"Submit feedback error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get user statistics"""
    try:
        user_id = get_jwt_identity()
        
        # Count assessments by user
        total_assessments = db.assessments.count_documents({'user_id': user_id})
        
        # Get assessment severity distribution
        severity_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$group': {
                '_id': '$damage_assessment.severity_level',
                'count': {'$sum': 1}
            }}
        ]
        severity_results = list(db.assessments.aggregate(severity_pipeline))
        severity_distribution = {item['_id']: item['count'] for item in severity_results}
        
        # Get building type distribution
        building_pipeline = [
            {'$match': {'user_id': user_id}},
            {'$group': {
                '_id': '$building_info.building_type',
                'count': {'$sum': 1}
            }}
        ]
        building_results = list(db.assessments.aggregate(building_pipeline))
        building_distribution = {item['_id']: item['count'] for item in building_results}
        
        # Get recent assessments
        recent_assessments = list(db.assessments
            .find({'user_id': user_id})
            .sort('timestamp', -1)
            .limit(5))
        
        for assessment in recent_assessments:
            assessment['_id'] = str(assessment['_id'])
            if 'image_path' in assessment:
                assessment['image_url'] = f"/uploads/{os.path.basename(assessment['image_path'])}"
            if 'result_path' in assessment:
                assessment['result_url'] = f"/results/{os.path.basename(assessment['result_path'])}"
        
        stats = {
            'total_assessments': total_assessments,
            'severity_distribution': severity_distribution,
            'building_distribution': building_distribution,
            'recent_assessments': recent_assessments
        }
        
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Enhanced DASPER Backend...")
    
    # Initialize components
    print("📊 Initializing database...")
    init_database()
    
    print("🤖 Initializing Gemini AI...")
    init_gemini()
    
    print("🧠 Initializing model manager with lazy loading...")
    if not init_model_manager():
        print("⚠️ Model manager initialization incomplete.")
        print("💡 Models will be loaded on first assessment request.")
    
    print("✅ Server initialization complete!")
    
    # Get server configuration from environment
    server_host = os.getenv('SERVER_HOST', '0.0.0.0')
    server_port = int(os.getenv('SERVER_PORT', 5000))
    
    print(f"🌐 API endpoints available at: http://{server_host}:{server_port}/api/")
    print(f"📊 Health check: http://{server_host}:{server_port}/api/health")
    print(f"🔐 Authentication: http://{server_host}:{server_port}/api/auth/")
    print(f"🏗️ Assessment endpoint: http://{server_host}:{server_port}/api/assess")
    
    # Initialize external disaster alerts
    try:
        print("🌐 Fetching initial disaster alerts from external APIs...")
        stored_count = fetch_and_store_live_alerts()
        print(f"✅ Stored {stored_count} initial disaster alerts")
    except Exception as e:
        print(f"⚠️ Initial alerts fetch failed: {e}")
    
    try:
        # Start the Flask application
        app.run(debug=False, host=server_host, port=server_port)
    except KeyboardInterrupt:
        print("\n🛑 Server shutdown requested...")
    finally:
        # Graceful shutdown
        print("🧹 Cleaning up resources...")
        if model_manager:
            shutdown_model_manager()
        print("✅ Server shutdown complete!")