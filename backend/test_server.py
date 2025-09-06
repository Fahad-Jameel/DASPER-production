from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
from pymongo import MongoClient
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULTS_FOLDER'] = 'results'

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULTS_FOLDER'], exist_ok=True)

# MongoDB connection
mongo_client = None
db = None

def init_database():
    """Initialize MongoDB connection"""
    global mongo_client, db
    try:
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        mongo_client = MongoClient(mongo_uri)
        db = mongo_client['dasper_db']
        
        # Test connection
        mongo_client.admin.command('ping')
        logger.info("✅ MongoDB connected successfully")
        
        # Initialize regional indices
        init_regional_indices()
        
        return True
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False

def init_regional_indices():
    """Initialize regional cost indices in database"""
    if db is None:
        return
    
    # Test regional indices
    regional_indices = {
        'Pakistan_Test': {
            'region': 'Pakistan_Test',
            'cities': ['Test'],
            'construction': 0.35,
            'currency': 'PKR',
        }
    }
    
    for region_data in regional_indices.values():
        db.regional_indices.update_one(
            {'region': region_data['region']},
            {'$set': region_data},
            upsert=True
        )
    
    logger.info("✅ Test regional indices initialized")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'mongodb': mongo_client is not None,
        'upload_folder': os.path.exists(app.config['UPLOAD_FOLDER']),
        'results_folder': os.path.exists(app.config['RESULTS_FOLDER'])
    })

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

if __name__ == '__main__':
    print("🚀 Starting Basic Test DASPER Backend...")
    
    # Initialize database
    init_database()
    
    print("✅ Test server initialization complete!")
    print("🌐 API endpoints available at: http://localhost:5000/api/")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🗺️ Regions endpoint: http://localhost:5000/api/regions")
    
    app.run(debug=True, host='0.0.0.0', port=5000) 