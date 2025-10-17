#!/usr/bin/env python3
"""
MongoDB Regional Cost API Endpoints
Provides API endpoints to display regional cost data from MongoDB Atlas
for defense panel demonstration
"""

from flask import Blueprint, jsonify, request
import pymongo
from datetime import datetime
import os

# MongoDB connection string
MONGODB_URI = "mongodb+srv://dasper_user:dasper%40production%402021@dasper.wt1bmvf.mongodb.net/?retryWrites=true&w=majority&appName=dasper"

mongodb_regional_bp = Blueprint('mongodb_regional_cost', __name__)

def get_mongodb_connection():
    """Get MongoDB connection"""
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db = client['dasper']
        return db['regional_cost']
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return None

@mongodb_regional_bp.route('/api/mongodb/regional-costs', methods=['GET'])
def get_mongodb_regional_costs():
    """Get all regional cost data from MongoDB Atlas"""
    try:
        collection = get_mongodb_connection()
        if not collection:
            return jsonify({
                'success': False,
                'error': 'MongoDB connection failed'
            }), 500
        
        # Get all regional cost data
        cursor = collection.find({}).sort([('region_name', 1), ('city', 1)])
        
        regional_costs = []
        for doc in cursor:
            # Convert ObjectId to string for JSON serialization
            doc['_id'] = str(doc['_id'])
            regional_costs.append(doc)
        
        return jsonify({
            'success': True,
            'data': regional_costs,
            'total_records': len(regional_costs),
            'database': 'MongoDB Atlas',
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

@mongodb_regional_bp.route('/api/mongodb/regional-costs/<city>', methods=['GET'])
def get_mongodb_city_cost(city):
    """Get regional cost data for specific city from MongoDB"""
    try:
        collection = get_mongodb_connection()
        if not collection:
            return jsonify({
                'success': False,
                'error': 'MongoDB connection failed'
            }), 500
        
        # Get cost data for specific city (case insensitive)
        doc = collection.find_one({'city': {'$regex': f'^{city}$', '$options': 'i'}})
        
        if not doc:
            return jsonify({
                'success': False,
                'error': f'No cost data found for city: {city}'
            }), 404
        
        # Convert ObjectId to string
        doc['_id'] = str(doc['_id'])
        
        return jsonify({
            'success': True,
            'data': doc,
            'database': 'MongoDB Atlas'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mongodb_regional_bp.route('/api/mongodb/regional-costs/sources', methods=['GET'])
def get_mongodb_data_sources():
    """Get list of official data sources from MongoDB"""
    try:
        collection = get_mongodb_connection()
        if not collection:
            return jsonify({
                'success': False,
                'error': 'MongoDB connection failed'
            }), 500
        
        # Get unique sources using aggregation
        pipeline = [
            {
                '$group': {
                    '_id': {'source': '$source', 'source_url': '$source_url'},
                    'record_count': {'$sum': 1}
                }
            },
            {
                '$sort': {'_id.source': 1}
            }
        ]
        
        sources = []
        for doc in collection.aggregate(pipeline):
            sources.append({
                'source': doc['_id']['source'],
                'source_url': doc['_id']['source_url'],
                'record_count': doc['record_count']
            })
        
        return jsonify({
            'success': True,
            'sources': sources,
            'total_sources': len(sources),
            'database': 'MongoDB Atlas',
            'description': 'Official Pakistan government sources for construction cost data'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mongodb_regional_bp.route('/api/mongodb/regional-costs/stats', methods=['GET'])
def get_mongodb_cost_statistics():
    """Get cost statistics summary from MongoDB"""
    try:
        collection = get_mongodb_connection()
        if not collection:
            return jsonify({
                'success': False,
                'error': 'MongoDB connection failed'
            }), 500
        
        # Get cost statistics using aggregation
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'avg_inflation': {'$avg': '$inflation_factor'},
                    'min_inflation': {'$min': '$inflation_factor'},
                    'max_inflation': {'$max': '$inflation_factor'},
                    'avg_volatility': {'$avg': '$market_volatility'},
                    'total_cities': {'$sum': 1}
                }
            }
        ]
        
        result = list(collection.aggregate(pipeline))
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'No data found'
            }), 404
        
        stats = result[0]
        
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
            'database': 'MongoDB Atlas',
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mongodb_regional_bp.route('/api/mongodb/regional-costs/regions', methods=['GET'])
def get_mongodb_regions():
    """Get all regions and cities from MongoDB"""
    try:
        collection = get_mongodb_connection()
        if not collection:
            return jsonify({
                'success': False,
                'error': 'MongoDB connection failed'
            }), 500
        
        # Get unique regions and cities
        pipeline = [
            {
                '$group': {
                    '_id': '$region_name',
                    'cities': {'$push': '$city'},
                    'count': {'$sum': 1}
                }
            },
            {
                '$sort': {'_id': 1}
            }
        ]
        
        regions = []
        for doc in collection.aggregate(pipeline):
            regions.append({
                'region_name': doc['_id'],
                'cities': doc['cities'],
                'city_count': doc['count']
            })
        
        return jsonify({
            'success': True,
            'regions': regions,
            'total_regions': len(regions),
            'database': 'MongoDB Atlas'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
