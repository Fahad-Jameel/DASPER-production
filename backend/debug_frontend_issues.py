import requests
import json
import time

def test_all_frontend_scenarios():
    """Test all potential frontend connectivity scenarios"""
    base_urls = [
        "http://192.168.18.29:5000",  # Frontend's primary URL
        "http://10.0.2.2:5000",       # Frontend's backup URL (Android emulator)
        "http://localhost:5000",      # Local testing
        "http://127.0.0.1:5000"       # Local testing
    ]
    
    print("🔍 Testing all frontend connectivity scenarios...")
    
    for i, base_url in enumerate(base_urls, 1):
        print(f"\n{i}. Testing URL: {base_url}")
        
        # Test 1: Basic connectivity
        try:
            response = requests.get(f"{base_url}/api/health", timeout=5)
            print(f"   ✅ Health check: {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - server not reachable")
            continue
        except Exception as e:
            print(f"   ❌ Health check error: {e}")
            continue
        
        # Test 2: CORS preflight
        try:
            response = requests.options(f"{base_url}/api/assess", timeout=5)
            print(f"   ✅ CORS preflight: {response.status_code}")
        except Exception as e:
            print(f"   ❌ CORS preflight error: {e}")
        
        # Test 3: Authentication
        try:
            login_data = {
                "email": "test@example.com",
                "password": "testpassword123"
            }
            
            response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
            print(f"   ✅ Authentication: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                token = token_data.get('access_token')
                
                # Test 4: Assessment with auth
                try:
                    # Simple test without image first
                    headers = {
                        'Authorization': f'Bearer {token}',
                        'Content-Type': 'application/json'
                    }
                    
                    # Test if endpoint accepts the request
                    response = requests.post(
                        f"{base_url}/api/assess",
                        headers=headers,
                        timeout=10
                    )
                    print(f"   ✅ Assessment endpoint: {response.status_code}")
                    
                except Exception as e:
                    print(f"   ❌ Assessment endpoint error: {e}")
            else:
                print(f"   ❌ Authentication failed: {response.json()}")
                
        except Exception as e:
            print(f"   ❌ Authentication error: {e}")

def test_network_connectivity():
    """Test network connectivity from different perspectives"""
    print("\n🌐 Testing network connectivity...")
    
    # Test if we can reach the server from this machine
    try:
        response = requests.get("http://192.168.18.29:5000/api/health", timeout=5)
        print(f"✅ Local machine can reach 192.168.18.29:5000")
    except:
        print(f"❌ Local machine cannot reach 192.168.18.29:5000")
    
    # Test localhost
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        print(f"✅ Localhost:5000 is accessible")
    except:
        print(f"❌ Localhost:5000 is not accessible")

def test_authentication_flow():
    """Test the complete authentication flow"""
    print("\n🔐 Testing authentication flow...")
    
    base_url = "http://192.168.18.29:5000"
    
    try:
        # Step 1: Register a new user
        register_data = {
            "email": "frontend_test@example.com",
            "password": "testpassword123",
            "full_name": "Frontend Test User"
        }
        
        response = requests.post(f"{base_url}/api/auth/register", json=register_data, timeout=10)
        print(f"Registration: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ New user registered")
        elif response.status_code == 400 and "already exists" in response.text:
            print("✅ User already exists (expected)")
        else:
            print(f"❌ Registration failed: {response.text}")
        
        # Step 2: Login
        login_data = {
            "email": "frontend_test@example.com",
            "password": "testpassword123"
        }
        
        response = requests.post(f"{base_url}/api/auth/login", json=login_data, timeout=10)
        print(f"Login: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            print(f"✅ Login successful, token: {token[:20]}...")
            
            # Step 3: Test token validity
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get(f"{base_url}/api/auth/profile", headers=headers, timeout=10)
            print(f"Token validation: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ Token is valid")
            else:
                print("❌ Token validation failed")
                
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Authentication flow error: {e}")

if __name__ == "__main__":
    test_network_connectivity()
    test_all_frontend_scenarios()
    test_authentication_flow()
    
    print("\n📋 Summary:")
    print("If you see ❌ for 192.168.18.29:5000, your device cannot reach the server.")
    print("If you see ✅ for localhost:5000 but ❌ for 192.168.18.29:5000, it's a network issue.")
    print("If authentication fails, check if the user exists and credentials are correct.")
    print("If CORS fails, the server might not be configured properly for mobile apps.") 