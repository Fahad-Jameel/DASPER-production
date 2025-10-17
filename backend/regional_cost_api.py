#!/usr/bin/env python3
"""
Regional Cost API Endpoints
Provides API endpoints to display regional cost data from official sources
for defense panel demonstration
"""

from flask import Blueprint, jsonify, request
import sqlite3
import json
from datetime import datetime

regional_cost_bp = Blueprint('regional_cost', __name__)

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('dasper.db')
    conn.row_factory = sqlite3.Row
    return conn

@regional_cost_bp.route('/api/regional-costs', methods=['GET'])
def get_regional_costs():
    """Get all regional cost data from official sources"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all regional cost data
        cursor.execute('''
            SELECT * FROM regional_cost 
            ORDER BY region_name, city
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        regional_costs = []
        for row in rows:
            cost_data = {
                'id': row['id'],
                'region_name': row['region_name'],
                'city': row['city'],
                'source': row['source'],
                'data_type': row['data_type'],
                'material_costs': json.loads(row['material_costs']),
                'labor_costs': json.loads(row['labor_costs']),
                'construction_costs': json.loads(row['construction_costs']),
                'inflation_factor': row['inflation_factor'],
                'market_volatility': row['market_volatility'],
                'last_updated': row['last_updated'],
                'source_url': row['source_url'],
                'notes': row['notes']
            }
            regional_costs.append(cost_data)
        
        return jsonify({
            'success': True,
            'data': regional_costs,
            'total_records': len(regional_costs),
            'sources': [
                'Pakistan Bureau of Statistics (PBS)',
                'National Highway Authority (NHA)',
                'Ministry of Housing & Works',
                'Board of Investment (BOI)',
                'Federal Board of Revenue (FBR)'
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@regional_cost_bp.route('/api/regional-costs/<city>', methods=['GET'])
def get_city_cost(city):
    """Get regional cost data for specific city"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get cost data for specific city
        cursor.execute('''
            SELECT * FROM regional_cost 
            WHERE LOWER(city) = LOWER(?)
        ''', (city,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({
                'success': False,
                'error': f'No cost data found for city: {city}'
            }), 404
        
        cost_data = {
            'id': row['id'],
            'region_name': row['region_name'],
            'city': row['city'],
            'source': row['source'],
            'data_type': row['data_type'],
            'material_costs': json.loads(row['material_costs']),
            'labor_costs': json.loads(row['labor_costs']),
            'construction_costs': json.loads(row['construction_costs']),
            'inflation_factor': row['inflation_factor'],
            'market_volatility': row['market_volatility'],
            'last_updated': row['last_updated'],
            'source_url': row['source_url'],
            'notes': row['notes']
        }
        
        return jsonify({
            'success': True,
            'data': cost_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@regional_cost_bp.route('/api/regional-costs/sources', methods=['GET'])
def get_data_sources():
    """Get list of official data sources used"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get unique sources
        cursor.execute('''
            SELECT DISTINCT source, source_url, COUNT(*) as record_count
            FROM regional_cost 
            GROUP BY source, source_url
            ORDER BY source
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        sources = []
        for row in rows:
            sources.append({
                'source': row['source'],
                'source_url': row['source_url'],
                'record_count': row['record_count']
            })
        
        return jsonify({
            'success': True,
            'sources': sources,
            'total_sources': len(sources),
            'description': 'Official Pakistan government sources for construction cost data'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@regional_cost_bp.route('/api/regional-costs/stats', methods=['GET'])
def get_cost_statistics():
    """Get cost statistics summary"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get cost statistics
        cursor.execute('''
            SELECT 
                AVG(inflation_factor) as avg_inflation,
                MIN(inflation_factor) as min_inflation,
                MAX(inflation_factor) as max_inflation,
                AVG(market_volatility) as avg_volatility,
                COUNT(*) as total_cities
            FROM regional_cost
        ''')
        
        stats = cursor.fetchone()
        conn.close()
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_cities': stats['total_cities'],
                'inflation_factor': {
                    'average': round(stats['avg_inflation'], 3),
                    'minimum': round(stats['min_inflation'], 3),
                    'maximum': round(stats['max_inflation'], 3)
                },
                'market_volatility': {
                    'average': round(stats['avg_volatility'], 3)
                }
            },
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
