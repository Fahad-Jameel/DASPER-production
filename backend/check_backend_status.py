#!/usr/bin/env python3
"""
Check Backend Server Status
Quick script to check if the backend server is running and accessible
"""

import requests
import sys
import socket
from urllib.parse import urlparse

def check_port(host, port, timeout=3):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def check_backend_status(url):
    """Check backend server status"""
    print(f"🔍 Checking backend server at: {url}")
    
    try:
        parsed = urlparse(url)
        host = parsed.hostname
        port = parsed.port or 5000
        
        # Check if port is open
        print(f"📡 Checking if port {port} is open on {host}...")
        if check_port(host, port):
            print(f"✅ Port {port} is open")
        else:
            print(f"❌ Port {port} is closed or not accessible")
            print(f"💡 The backend server might not be running")
            return False
        
        # Check health endpoint
        print(f"🏥 Checking health endpoint...")
        try:
            response = requests.get(f"{url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Backend server is running and healthy!")
                print(f"   Status: {data.get('status', 'unknown')}")
                print(f"   MongoDB: {'Connected' if data.get('mongodb') else 'Not connected'}")
                return True
            else:
                print(f"⚠️ Backend returned status code: {response.status_code}")
                return False
        except requests.exceptions.Timeout:
            print(f"❌ Backend server timed out")
            return False
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to backend server")
            return False
        except Exception as e:
            print(f"❌ Error checking backend: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    # Check common backend URLs
    urls_to_check = [
        "http://192.168.18.84:5000",
        "http://192.168.18.73:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5000"
    ]
    
    print("=" * 60)
    print("DASPER Backend Server Status Check")
    print("=" * 60)
    print()
    
    found_running = False
    for url in urls_to_check:
        print(f"\n📍 Testing: {url}")
        print("-" * 60)
        if check_backend_status(url):
            found_running = True
            print(f"\n✅ Backend server is running at: {url}")
            break
        print()
    
    if not found_running:
        print("\n" + "=" * 60)
        print("❌ No backend server found running")
        print("=" * 60)
        print("\n💡 To start the backend server:")
        print("   1. Navigate to the backend directory:")
        print("      cd backend")
        print("   2. Activate virtual environment (if using):")
        print("      source venv/bin/activate  # On macOS/Linux")
        print("   3. Start the server:")
        print("      python app.py")
        print("\n📝 Make sure:")
        print("   - MongoDB connection is configured")
        print("   - All required packages are installed")
        print("   - Port 5000 is not being used by another application")
        sys.exit(1)
    else:
        print("\n" + "=" * 60)
        print("✅ Backend server is running!")
        print("=" * 60)
        sys.exit(0)
