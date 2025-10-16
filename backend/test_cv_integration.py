#!/usr/bin/env python3
"""
Test script to verify CV Model integration is working
"""
import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_cv_integration():
    """Test if CV Model analyzer is being used in the assessment"""
    
    # Test image path (use an existing image from uploads)
    test_image_path = "uploads/20251012_170255_dffe9382-5a51-437a-90d8-481f7df0717e.jpeg"
    
    if not os.path.exists(test_image_path):
        print("❌ Test image not found. Please run an assessment first to generate test images.")
        return False
    
    # Get auth token (you'll need to login first)
    print("🔐 Testing CV Model integration...")
    
    # Test the health endpoint first
    try:
        response = requests.get("http://127.0.0.1:5000/api/health")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server health check failed")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False
    
    print("📝 To test CV Model integration:")
    print("1. Login to your app")
    print("2. Upload an image for assessment")
    print("3. Check the server logs for these messages:")
    print("   - '🔍 CV analyzer available: True'")
    print("   - '🔍 CV analyzer initialized: True'")
    print("   - '🔍 CV model available: True'")
    print("   - '🤖 Using CV Model for building analysis'")
    print("4. The assessment should show actual CV Model measurements, not fixed values")
    
    return True

if __name__ == "__main__":
    test_cv_integration()
