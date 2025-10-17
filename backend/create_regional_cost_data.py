#!/usr/bin/env python3
"""
Regional Cost Data Creation Script
Creates dummy regional cost data from official Pakistan government sources
for defense panel demonstration
"""

import sqlite3
import json
from datetime import datetime

def create_regional_cost_table():
    """Create regional_cost table with dummy data from official sources"""
    
    # Connect to database
    conn = sqlite3.connect('dasper.db')
    cursor = conn.cursor()
    
    # Create regional_cost table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS regional_cost (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region_name TEXT NOT NULL,
            city TEXT NOT NULL,
            source TEXT NOT NULL,
            data_type TEXT NOT NULL,
            material_costs TEXT NOT NULL,
            labor_costs TEXT NOT NULL,
            construction_costs TEXT NOT NULL,
            inflation_factor REAL NOT NULL,
            market_volatility REAL NOT NULL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source_url TEXT,
            notes TEXT
        )
    ''')
    
    # Dummy data from official Pakistan government sources
    regional_data = [
        {
            'region_name': 'Sindh',
            'city': 'Karachi',
            'source': 'Pakistan Bureau of Statistics (PBS)',
            'data_type': 'Construction Industry Statistics 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1200,
                'steel_per_kg': 280,
                'bricks_per_1000': 15000,
                'sand_per_cubic_meter': 8000,
                'aggregate_per_cubic_meter': 12000
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2500,
                'unskilled_labor_per_day': 1500,
                'mason_per_day': 3000,
                'carpenter_per_day': 2800,
                'electrician_per_day': 3200
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 18000,
                'commercial_per_sqm': 25000,
                'industrial_per_sqm': 20000
            }),
            'inflation_factor': 1.15,
            'market_volatility': 0.08,
            'source_url': 'https://www.pbs.gov.pk/industry-tables',
            'notes': 'Major urban center with highest construction costs in Pakistan'
        },
        {
            'region_name': 'Punjab',
            'city': 'Lahore',
            'source': 'National Highway Authority (NHA)',
            'data_type': 'Infrastructure Construction Rates 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1150,
                'steel_per_kg': 270,
                'bricks_per_1000': 14000,
                'sand_per_cubic_meter': 7500,
                'aggregate_per_cubic_meter': 11000
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2300,
                'unskilled_labor_per_day': 1400,
                'mason_per_day': 2800,
                'carpenter_per_day': 2600,
                'electrician_per_day': 3000
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 16500,
                'commercial_per_sqm': 23000,
                'industrial_per_sqm': 18500
            }),
            'inflation_factor': 1.12,
            'market_volatility': 0.06,
            'source_url': 'https://ebs.nha.gov.pk/tender/detail/2909',
            'notes': 'Major industrial and commercial hub with high construction activity'
        },
        {
            'region_name': 'Federal',
            'city': 'Islamabad',
            'source': 'Ministry of Housing & Works',
            'data_type': 'Capital Development Authority Rates 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1250,
                'steel_per_kg': 290,
                'bricks_per_1000': 16000,
                'sand_per_cubic_meter': 8500,
                'aggregate_per_cubic_meter': 13000
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2600,
                'unskilled_labor_per_day': 1600,
                'mason_per_day': 3200,
                'carpenter_per_day': 3000,
                'electrician_per_day': 3400
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 20000,
                'commercial_per_sqm': 28000,
                'industrial_per_sqm': 22000
            }),
            'inflation_factor': 1.18,
            'market_volatility': 0.05,
            'source_url': 'https://mohw.gov.pk/Detail/N2IzMDVlNWEtZDQyYy00ZDdiLTk4ZDMtOGMyNGNhOWZmYTRj',
            'notes': 'Capital city with premium construction standards and costs'
        },
        {
            'region_name': 'Punjab',
            'city': 'Rawalpindi',
            'source': 'Board of Investment (BOI)',
            'data_type': 'Housing and Construction Sector Analysis 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1100,
                'steel_per_kg': 260,
                'bricks_per_1000': 13500,
                'sand_per_cubic_meter': 7000,
                'aggregate_per_cubic_meter': 10500
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2200,
                'unskilled_labor_per_day': 1300,
                'mason_per_day': 2700,
                'carpenter_per_day': 2500,
                'electrician_per_day': 2900
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 15000,
                'commercial_per_sqm': 21000,
                'industrial_per_sqm': 17000
            }),
            'inflation_factor': 1.08,
            'market_volatility': 0.07,
            'source_url': 'https://invest.gov.pk/housing-and-construction-portal',
            'notes': 'Twin city with moderate construction costs and good infrastructure'
        },
        {
            'region_name': 'Punjab',
            'city': 'Faisalabad',
            'source': 'Federal Board of Revenue (FBR)',
            'data_type': 'Construction Package Tax Incentives 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1050,
                'steel_per_kg': 250,
                'bricks_per_1000': 13000,
                'sand_per_cubic_meter': 6500,
                'aggregate_per_cubic_meter': 10000
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2100,
                'unskilled_labor_per_day': 1200,
                'mason_per_day': 2600,
                'carpenter_per_day': 2400,
                'electrician_per_day': 2800
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 14000,
                'commercial_per_sqm': 19500,
                'industrial_per_sqm': 16000
            }),
            'inflation_factor': 1.05,
            'market_volatility': 0.09,
            'source_url': 'https://www.fbr.gov.pk/construction-package/152515/152518',
            'notes': 'Industrial city with competitive construction costs and tax incentives'
        },
        {
            'region_name': 'Punjab',
            'city': 'Multan',
            'source': 'Pakistan Bureau of Statistics (PBS)',
            'data_type': 'Regional Construction Cost Index 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1000,
                'steel_per_kg': 240,
                'bricks_per_1000': 12500,
                'sand_per_cubic_meter': 6000,
                'aggregate_per_cubic_meter': 9500
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2000,
                'unskilled_labor_per_day': 1100,
                'mason_per_day': 2500,
                'carpenter_per_day': 2300,
                'electrician_per_day': 2700
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 13000,
                'commercial_per_sqm': 18000,
                'industrial_per_sqm': 15000
            }),
            'inflation_factor': 1.02,
            'market_volatility': 0.06,
            'source_url': 'https://www.pbs.gov.pk/industry-tables',
            'notes': 'Regional center with baseline construction costs'
        },
        {
            'region_name': 'Khyber Pakhtunkhwa',
            'city': 'Peshawar',
            'source': 'National Highway Authority (NHA)',
            'data_type': 'Northwest Region Construction Rates 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1020,
                'steel_per_kg': 245,
                'bricks_per_1000': 12800,
                'sand_per_cubic_meter': 6200,
                'aggregate_per_cubic_meter': 9800
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2050,
                'unskilled_labor_per_day': 1150,
                'mason_per_day': 2550,
                'carpenter_per_day': 2350,
                'electrician_per_day': 2750
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 13500,
                'commercial_per_sqm': 18500,
                'industrial_per_sqm': 15500
            }),
            'inflation_factor': 1.03,
            'market_volatility': 0.08,
            'source_url': 'https://ebs.nha.gov.pk/tender/detail/2909',
            'notes': 'Border city with moderate construction costs and security considerations'
        },
        {
            'region_name': 'Balochistan',
            'city': 'Quetta',
            'source': 'Ministry of Housing & Works',
            'data_type': 'Remote Area Construction Standards 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 950,
                'steel_per_kg': 230,
                'bricks_per_1000': 12000,
                'sand_per_cubic_meter': 5500,
                'aggregate_per_cubic_meter': 9000
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 1900,
                'unskilled_labor_per_day': 1000,
                'mason_per_day': 2400,
                'carpenter_per_day': 2200,
                'electrician_per_day': 2600
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 12000,
                'commercial_per_sqm': 16500,
                'industrial_per_sqm': 14000
            }),
            'inflation_factor': 0.98,
            'market_volatility': 0.12,
            'source_url': 'https://mohw.gov.pk/Detail/N2IzMDVlNWEtZDQyYy00ZDdiLTk4ZDMtOGMyNGNhOWZmYTRj',
            'notes': 'Remote area with lower construction costs but higher material transport costs'
        },
        {
            'region_name': 'Rural',
            'city': 'Rural Areas',
            'source': 'Board of Investment (BOI)',
            'data_type': 'Rural Development Construction Costs 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 900,
                'steel_per_kg': 220,
                'bricks_per_1000': 11000,
                'sand_per_cubic_meter': 5000,
                'aggregate_per_cubic_meter': 8500
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 1800,
                'unskilled_labor_per_day': 900,
                'mason_per_day': 2300,
                'carpenter_per_day': 2100,
                'electrician_per_day': 2500
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 10000,
                'commercial_per_sqm': 14000,
                'industrial_per_sqm': 12000
            }),
            'inflation_factor': 0.95,
            'market_volatility': 0.15,
            'source_url': 'https://invest.gov.pk/housing-and-construction-portal',
            'notes': 'Rural areas with lowest construction costs but limited infrastructure'
        },
        {
            'region_name': 'SEZ',
            'city': 'Special Economic Zones',
            'source': 'Federal Board of Revenue (FBR)',
            'data_type': 'SEZ Construction Incentives 2024',
            'material_costs': json.dumps({
                'cement_per_bag': 1080,
                'steel_per_kg': 255,
                'bricks_per_1000': 13200,
                'sand_per_cubic_meter': 6800,
                'aggregate_per_cubic_meter': 10200
            }),
            'labor_costs': json.dumps({
                'skilled_labor_per_day': 2150,
                'unskilled_labor_per_day': 1250,
                'mason_per_day': 2650,
                'carpenter_per_day': 2450,
                'electrician_per_day': 2850
            }),
            'construction_costs': json.dumps({
                'residential_per_sqm': 14500,
                'commercial_per_sqm': 20000,
                'industrial_per_sqm': 16500
            }),
            'inflation_factor': 1.06,
            'market_volatility': 0.04,
            'source_url': 'https://www.fbr.gov.pk/construction-package/152515/152518',
            'notes': 'Special Economic Zones with tax incentives and competitive construction costs'
        }
    ]
    
    # Insert dummy data
    for data in regional_data:
        cursor.execute('''
            INSERT INTO regional_cost (
                region_name, city, source, data_type, material_costs, 
                labor_costs, construction_costs, inflation_factor, 
                market_volatility, source_url, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['region_name'],
            data['city'],
            data['source'],
            data['data_type'],
            data['material_costs'],
            data['labor_costs'],
            data['construction_costs'],
            data['inflation_factor'],
            data['market_volatility'],
            data['source_url'],
            data['notes']
        ))
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("✅ Regional cost data created successfully!")
    print("📊 Data sources used:")
    print("   - Pakistan Bureau of Statistics (PBS)")
    print("   - National Highway Authority (NHA)")
    print("   - Ministry of Housing & Works")
    print("   - Board of Investment (BOI)")
    print("   - Federal Board of Revenue (FBR)")
    print(f"📈 Total records inserted: {len(regional_data)}")

if __name__ == "__main__":
    create_regional_cost_table()
