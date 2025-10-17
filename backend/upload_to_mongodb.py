#!/usr/bin/env python3
"""
Upload Regional Cost Data to MongoDB
Uploads regional cost data from SQLite to MongoDB Atlas
"""

import pymongo
import json
import sqlite3
from datetime import datetime
import os

# MongoDB connection string
MONGODB_URI = "mongodb+srv://dasper_user:dasper%40production%402021@dasper.wt1bmvf.mongodb.net/?retryWrites=true&w=majority&appName=dasper"

def upload_to_mongodb():
    """Upload regional cost data to MongoDB"""
    
    try:
        # Connect to MongoDB
        print("🔗 Connecting to MongoDB Atlas...")
        client = pymongo.MongoClient(MONGODB_URI)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Get database and collection
        db = client['dasper']
        collection = db['regional_cost']
        
        # Connect to SQLite database
        print("🔗 Connecting to SQLite database...")
        sqlite_conn = sqlite3.connect('dasper.db')
        sqlite_cursor = sqlite_conn.cursor()
        
        # Get all regional cost data from SQLite
        sqlite_cursor.execute('''
            SELECT * FROM regional_cost 
            ORDER BY region_name, city
        ''')
        
        rows = sqlite_cursor.fetchall()
        print(f"📊 Found {len(rows)} records in SQLite database")
        
        # Clear existing data in MongoDB collection
        print("🗑️ Clearing existing data in MongoDB...")
        collection.delete_many({})
        
        # Upload data to MongoDB
        print("📤 Uploading data to MongoDB...")
        documents = []
        
        for row in rows:
            document = {
                'id': row[0],
                'region_name': row[1],
                'city': row[2],
                'source': row[3],
                'data_type': row[4],
                'material_costs': json.loads(row[5]),
                'labor_costs': json.loads(row[6]),
                'construction_costs': json.loads(row[7]),
                'inflation_factor': row[8],
                'market_volatility': row[9],
                'last_updated': row[10],
                'source_url': row[11],
                'notes': row[12],
                'uploaded_at': datetime.utcnow()
            }
            documents.append(document)
        
        # Insert documents
        result = collection.insert_many(documents)
        print(f"✅ Successfully uploaded {len(result.inserted_ids)} documents to MongoDB!")
        
        # Verify upload
        count = collection.count_documents({})
        print(f"📊 Total documents in MongoDB collection: {count}")
        
        # Show sample data
        sample = collection.find_one()
        if sample:
            print(f"\n📋 Sample document:")
            print(f"   - City: {sample['city']}")
            print(f"   - Region: {sample['region_name']}")
            print(f"   - Source: {sample['source']}")
            print(f"   - Residential Cost: {sample['construction_costs']['residential_per_sqm']} PKR/sqm")
        
        # Close connections
        sqlite_conn.close()
        client.close()
        
        print("\n🎉 Regional cost data successfully uploaded to MongoDB Atlas!")
        print("📚 Data sources included:")
        print("   - Pakistan Bureau of Statistics (PBS)")
        print("   - National Highway Authority (NHA)")
        print("   - Ministry of Housing & Works")
        print("   - Board of Investment (BOI)")
        print("   - Federal Board of Revenue (FBR)")
        
    except Exception as e:
        print(f"❌ Error uploading to MongoDB: {e}")
        return False
    
    return True

if __name__ == "__main__":
    upload_to_mongodb()
