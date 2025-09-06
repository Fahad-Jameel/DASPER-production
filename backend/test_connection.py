import requests
import time

def test_backend_connection():
    """Test if the backend server is running and accessible"""
    try:
        print("Testing backend connection...")
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        print(f"✅ Backend is running! Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running or not accessible")
        return False
    except Exception as e:
        print(f"❌ Error testing connection: {e}")
        return False

if __name__ == "__main__":
    test_backend_connection() 