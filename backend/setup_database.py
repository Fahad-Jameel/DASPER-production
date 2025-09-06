# setup_database.py - MongoDB Database Setup and Initialization
import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import json

def setup_database():
    """Setup MongoDB database with proper collections and indexes"""
    
    # Connect to MongoDB
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    try:
        client = MongoClient(mongo_uri)
        db = client['damagenet_db']
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return False
    
    # Create collections and indexes
    
    # 1. Assessments Collection
    print("\n📋 Setting up assessments collection...")
    assessments = db.assessments
    
    # Drop existing indexes and recreate
    try:
        assessments.drop_indexes()
    except:
        pass
    
    # Create indexes for efficient querying
    assessments.create_index([("timestamp", DESCENDING)], name="timestamp_desc")
    assessments.create_index([("building_name", ASCENDING)], name="building_name_asc")
    assessments.create_index([("building_type", ASCENDING)], name="building_type_asc")
    assessments.create_index([("pin_location", ASCENDING)], name="pin_location_asc")
    assessments.create_index([
        ("location_info.city", ASCENDING), 
        ("location_info.country", ASCENDING)
    ], name="location_compound")
    assessments.create_index([("damage_assessment.severity_category", ASCENDING)], name="severity_category")
    assessments.create_index([("damage_assessment.severity_score", DESCENDING)], name="severity_score_desc")
    assessments.create_index([("status", ASCENDING)], name="status_asc")
    assessments.create_index([("has_feedback", ASCENDING)], name="has_feedback_asc")
    
    # Geospatial index for location coordinates
    assessments.create_index([("location_info.coordinates", "2dsphere")], name="location_geo")
    
    # Compound indexes for common queries
    assessments.create_index([
        ("building_type", ASCENDING),
        ("timestamp", DESCENDING)
    ], name="type_timestamp_compound")
    
    assessments.create_index([
        ("damage_assessment.severity_category", ASCENDING),
        ("timestamp", DESCENDING)
    ], name="severity_timestamp_compound")
    
    print("✅ Assessments collection indexes created")
    
    # 2. Feedback Collection
    print("\n💬 Setting up feedback collection...")
    feedback = db.feedback
    
    # Drop existing indexes and recreate
    try:
        feedback.drop_indexes()
    except:
        pass
    
    # Create indexes
    feedback.create_index([("assessment_id", ASCENDING)], name="assessment_id_asc")
    feedback.create_index([("timestamp", DESCENDING)], name="timestamp_desc")
    feedback.create_index([("user_severity_score", DESCENDING)], name="user_severity_desc")
    feedback.create_index([("repair_urgency", ASCENDING)], name="repair_urgency_asc")
    
    print("✅ Feedback collection indexes created")
    
    # 3. Users Collection (for future authentication)
    print("\n👥 Setting up users collection...")
    users = db.users
    
    try:
        users.drop_indexes()
    except:
        pass
    
    # Create indexes
    users.create_index([("email", ASCENDING)], unique=True, name="email_unique")
    users.create_index([("username", ASCENDING)], unique=True, name="username_unique")
    users.create_index([("created_at", DESCENDING)], name="created_at_desc")
    users.create_index([("role", ASCENDING)], name="role_asc")
    
    print("✅ Users collection indexes created")
    
    # 4. Analytics Collection (for storing aggregated data)
    print("\n📊 Setting up analytics collection...")
    analytics = db.analytics
    
    try:
        analytics.drop_indexes()
    except:
        pass
    
    # Create indexes
    analytics.create_index([("date", DESCENDING)], name="date_desc")
    analytics.create_index([("metric_type", ASCENDING)], name="metric_type_asc")
    analytics.create_index([
        ("metric_type", ASCENDING),
        ("date", DESCENDING)
    ], name="metric_date_compound")
    
    print("✅ Analytics collection indexes created")
    
    # Insert sample data for testing
    print("\n🔧 Inserting sample data...")
    
    # Sample assessment data
    sample_assessment = {
        "timestamp": datetime.utcnow(),
        "building_name": "Sample Residential Building",
        "building_type": "residential",
        "pin_location": "40.7128,-74.0060",
        "location_info": {
            "address": "123 Sample Street, New York, NY, USA",
            "city": "New York",
            "country": "USA",
            "coordinates": [40.7128, -74.0060]
        },
        "building_area_sqm": 150.0,
        "region": "USA",
        "damage_assessment": {
            "severity_score": 0.45,
            "severity_category": "moderate",
            "predicted_class": 1,
            "confidence": 0.82,
            "output_type": "regression",
            "class_probabilities": {
                "Minimal": 0.15,
                "Moderate": 0.65,
                "Severe": 0.18,
                "Destructive": 0.02
            }
        },
        "cost_estimation": {
            "total_estimated_cost_usd": 15750.00,
            "base_cost_per_sqm_usd": 85.50,
            "regional_multiplier": 1.0,
            "damage_type_multiplier": 1.0,
            "cost_range_low_usd": 14175.00,
            "cost_range_high_usd": 17325.00
        },
        "ai_analysis": {
            "description": "Moderate structural damage visible in the main building facade",
            "damage_areas": ["facade", "windows"],
            "repair_priorities": ["window replacement", "facade repair"],
            "safety_concerns": ["broken glass"],
            "additional_damage_types": ["water damage"]
        },
        "user_provided_damage_types": ["structural damage"],
        "status": "completed",
        "has_feedback": False
    }
    
    # Insert sample assessment if collection is empty
    if assessments.count_documents({}) == 0:
        result = assessments.insert_one(sample_assessment)
        print(f"✅ Sample assessment inserted with ID: {result.inserted_id}")
    else:
        print("ℹ️ Assessments collection already contains data")
    
    # Sample analytics data
    sample_analytics = {
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "metric_type": "daily_summary",
        "data": {
            "total_assessments": 1,
            "severity_distribution": {
                "minimal": 0,
                "moderate": 1,
                "severe": 0,
                "destructive": 0
            },
            "building_type_distribution": {
                "residential": 1,
                "commercial": 0,
                "industrial": 0
            },
            "average_cost": 15750.00,
            "regions_analyzed": ["USA"]
        }
    }
    
    # Insert sample analytics if collection is empty
    if analytics.count_documents({}) == 0:
        analytics.insert_one(sample_analytics)
        print("✅ Sample analytics data inserted")
    else:
        print("ℹ️ Analytics collection already contains data")
    
    # Create admin user if users collection is empty
    if users.count_documents({}) == 0:
        admin_user = {
            "username": "admin",
            "email": "admin@damagenet.com",
            "role": "admin",
            "created_at": datetime.utcnow(),
            "is_active": True,
            "permissions": ["read", "write", "admin"]
        }
        users.insert_one(admin_user)
        print("✅ Admin user created")
    else:
        print("ℹ️ Users collection already contains data")
    
    # Print collection statistics
    print("\n📈 Collection Statistics:")
    print(f"Assessments: {assessments.count_documents({})} documents")
    print(f"Feedback: {feedback.count_documents({})} documents")
    print(f"Users: {users.count_documents({})} documents")
    print(f"Analytics: {analytics.count_documents({})} documents")
    
    # Print index information
    print("\n🔍 Index Information:")
    for collection_name in ["assessments", "feedback", "users", "analytics"]:
        collection = db[collection_name]
        indexes = list(collection.list_indexes())
        print(f"\n{collection_name} indexes:")
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
    
    print("\n✅ Database setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start your Flask application: python app.py")
    print("2. Test the health endpoint: curl http://localhost:5000/api/health")
    print("3. Upload an image for damage assessment")
    
    client.close()
    return True

def drop_database():
    """Drop the entire database (use with caution!)"""
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    try:
        client = MongoClient(mongo_uri)
        client.drop_database('damagenet_db')
        print("🗑️ Database 'damagenet_db' dropped successfully")
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed to drop database: {e}")
        return False

def show_collections():
    """Show all collections and their document counts"""
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    try:
        client = MongoClient(mongo_uri)
        db = client['damagenet_db']
        
        print("📋 DamageNet Database Collections:")
        for collection_name in db.list_collection_names():
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
        
        client.close()
        return True
    except Exception as e:
        print(f"❌ Failed to show collections: {e}")
        return False

if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "setup":
            setup_database()
        elif command == "drop":
            confirm = input("⚠️ Are you sure you want to drop the entire database? (yes/no): ")
            if confirm.lower() == "yes":
                drop_database()
            else:
                print("Operation cancelled")
        elif command == "show":
            show_collections()
        else:
            print("Usage: python setup_database.py [setup|drop|show]")
    else:
        # Default action
        setup_database()