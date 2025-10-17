#!/usr/bin/env python3
"""
Verify Regional Cost Data
Simple script to verify that regional cost data was created correctly
"""

import sqlite3
import json

def verify_regional_data():
    """Verify regional cost data in database"""
    
    # Connect to database
    conn = sqlite3.connect('dasper.db')
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='regional_cost'")
    table_exists = cursor.fetchone()
    
    if not table_exists:
        print("❌ Regional cost table does not exist!")
        return
    
    print("✅ Regional cost table exists")
    
    # Count total records
    cursor.execute("SELECT COUNT(*) FROM regional_cost")
    total_records = cursor.fetchone()[0]
    print(f"📊 Total records: {total_records}")
    
    # Get all cities
    cursor.execute("SELECT city, region_name, source FROM regional_cost ORDER BY city")
    cities = cursor.fetchall()
    
    print("\n🏙️ Cities with cost data:")
    for city, region, source in cities:
        print(f"   - {city} ({region}) - Source: {source}")
    
    # Get data sources
    cursor.execute("SELECT DISTINCT source, COUNT(*) as count FROM regional_cost GROUP BY source")
    sources = cursor.fetchall()
    
    print("\n📚 Data sources:")
    for source, count in sources:
        print(f"   - {source}: {count} records")
    
    # Sample data for one city
    cursor.execute("SELECT * FROM regional_cost WHERE city = 'Karachi' LIMIT 1")
    sample = cursor.fetchone()
    
    if sample:
        print(f"\n📋 Sample data for Karachi:")
        print(f"   - Material costs: {json.loads(sample[5])}")
        print(f"   - Labor costs: {json.loads(sample[6])}")
        print(f"   - Construction costs: {json.loads(sample[7])}")
        print(f"   - Inflation factor: {sample[8]}")
        print(f"   - Market volatility: {sample[9]}")
    
    conn.close()
    print("\n✅ Regional cost data verification complete!")

if __name__ == "__main__":
    verify_regional_data()
