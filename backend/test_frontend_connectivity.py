import requests
import json
from PIL import Image
import io

def test_frontend_connectivity():
    """Test the exact request the frontend would make"""
    base_url = "http://192.168.18.146:5000"  # Same URL as frontend
    
    print("Testing frontend connectivity...")
    print(f"Testing URL: {base_url}")
    
    # Test 1: Health check (no auth required)
    try:
        print("\n1. Testing health endpoint...")
        response = requests.get(f"{base_url}/api/health", timeout=10)
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    
    # Test 2: Authentication
    try:
        print("\n2. Testing authentication...")
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            print(f"✅ Login successful, token: {token[:20]}...")
        else:
            print(f"❌ Login failed: {response.json()}")
            return
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return
    
    # Test 3: Assessment submission (simulating frontend request)
    try:
        print("\n3. Testing assessment submission...")
        
        # Create test image
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        # Prepare form data (exactly like frontend)
        files = {
            'image': ('test_image.jpg', img_bytes, 'image/jpeg')
        }
        
        data = {
            'building_name': 'Test Building',
            'building_type': 'residential',
            'pin_location': 'Test Location',
            'damage_types': 'Structural,Fire',
            'is_public': 'false'
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        print("Sending assessment request...")
        response = requests.post(
            f"{base_url}/api/assess",
            files=files,
            data=data,
            headers=headers,
            timeout=60  # Longer timeout for assessment
        )
        
        print(f"Assessment response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Assessment successful!")
            print(f"Assessment ID: {result.get('assessment_id')}")
            print(f"Damage severity: {result.get('damage_severity')}")
            print(f"Estimated cost: {result.get('estimated_cost')}")
        else:
            print(f"❌ Assessment failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Error text: {response.text}")
                
    except Exception as e:
        print(f"❌ Assessment test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_frontend_connectivity() 