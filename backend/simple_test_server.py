from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Simple test server is running',
        'timestamp': '2024-01-01T00:00:00Z'
    })

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint"""
    return jsonify({
        'message': 'Test endpoint working',
        'data': {'test': 'value'}
    })

if __name__ == '__main__':
    print("🚀 Starting Simple Test Server...")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📊 Health check: http://localhost:5000/api/health")
    print("🧪 Test endpoint: http://localhost:5000/api/test")
    
    app.run(debug=False, host='0.0.0.0', port=5000) 