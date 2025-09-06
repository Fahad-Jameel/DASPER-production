import requests
import json

def test_auth_endpoints():
    """Test authentication endpoints"""
    base_url = "http://localhost:5000"
    
    # Test health endpoint (no auth required)
    try:
        print("Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test regions endpoint (no auth required)
    try:
        print("\nTesting regions endpoint...")
        response = requests.get(f"{base_url}/api/regions")
        print(f"✅ Regions endpoint: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Regions endpoint failed: {e}")
    
    # Test assess endpoint without auth (should fail)
    try:
        print("\nTesting assess endpoint without auth...")
        response = requests.post(f"{base_url}/api/assess")
        print(f"Expected 401, got: {response.status_code}")
        if response.status_code == 401:
            print("✅ Correctly requires authentication")
        else:
            print("❌ Should require authentication")
    except Exception as e:
        print(f"❌ Assess endpoint test failed: {e}")

if __name__ == "__main__":
    test_auth_endpoints() 