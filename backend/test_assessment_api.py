import requests
import json
import os
from PIL import Image
import io

def create_test_image():
    """Create a simple test image"""
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_assessment_api():
    """Test the assessment API endpoint"""
    base_url = "http://localhost:5000"
    
    # First, let's test if we can get a token by registering/login
    print("Testing authentication...")
    
    # Test registration
    try:
        register_data = {
            "email": "test@example.com",
            "password": "testpassword123",
            "full_name": "Test User"
        }
        
        response = requests.post(f"{base_url}/api/auth/register", json=register_data)
        print(f"Registration status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Registration successful")
            token_data = response.json()
            token = token_data.get('access_token')
        else:
            print(f"Registration response: {response.json()}")
            # Try login instead
            login_data = {
                "email": "test@example.com",
                "password": "testpassword123"
            }
            
            response = requests.post(f"{base_url}/api/auth/login", json=login_data)
            print(f"Login status: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Login successful")
                token_data = response.json()
                token = token_data.get('access_token')
            else:
                print(f"Login failed: {response.json()}")
                return
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")
        return
    
    if not token:
        print("❌ No token received")
        return
    
    print(f"✅ Token received: {token[:20]}...")
    
    # Now test the assessment API
    print("\nTesting assessment API...")
    
    try:
        # Create test image
        test_image = create_test_image()
        
        # Prepare form data
        files = {
            'image': ('test_image.jpg', test_image, 'image/jpeg')
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
            headers=headers
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

if __name__ == "__main__":
    test_assessment_api() 