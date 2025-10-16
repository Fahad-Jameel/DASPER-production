#!/usr/bin/env python3
"""
Password Migration Script for DASPER Backend
This script migrates existing scrypt password hashes to pbkdf2 format
to fix the "unsupported hash type scrypt" error.
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import getpass

def migrate_passwords():
    """Migrate scrypt password hashes to pbkdf2"""
    
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    db = client['dasper_db']
    
    print("🔍 Checking for users with scrypt password hashes...")
    
    # Find users with scrypt hashes
    scrypt_users = list(db.users.find({
        'password_hash': {'$regex': '^scrypt:'}
    }, {'email': 1, 'password_hash': 1}))
    
    if not scrypt_users:
        print("✅ No users with scrypt hashes found. Migration not needed.")
        return
    
    print(f"📊 Found {len(scrypt_users)} users with scrypt hashes:")
    for user in scrypt_users:
        print(f"   - {user['email']}")
    
    print("\n⚠️  WARNING: This migration will require users to reset their passwords.")
    print("   The scrypt hashes cannot be converted directly to pbkdf2.")
    print("   Users will need to use the 'Forgot Password' feature to reset their passwords.")
    
    confirm = input("\nDo you want to proceed with the migration? (yes/no): ").lower().strip()
    
    if confirm != 'yes':
        print("❌ Migration cancelled.")
        return
    
    print("\n🔄 Starting password migration...")
    
    # Update users with scrypt hashes to use a temporary password
    # Users will need to reset their passwords
    temp_password = "TEMP_RESET_REQUIRED_2024"
    temp_hash = generate_password_hash(temp_password, method='pbkdf2:sha256')
    
    migrated_count = 0
    
    for user in scrypt_users:
        try:
            # Update the user's password hash
            result = db.users.update_one(
                {'_id': user['_id']},
                {
                    '$set': {
                        'password_hash': temp_hash,
                        'password_reset_required': True,
                        'migration_note': 'Password migrated from scrypt - reset required'
                    }
                }
            )
            
            if result.modified_count > 0:
                migrated_count += 1
                print(f"✅ Migrated user: {user['email']}")
            else:
                print(f"❌ Failed to migrate user: {user['email']}")
                
        except Exception as e:
            print(f"❌ Error migrating user {user['email']}: {e}")
    
    print(f"\n🎉 Migration completed!")
    print(f"   - {migrated_count} users migrated successfully")
    print(f"   - Users will need to reset their passwords on next login")
    print(f"   - The 'Forgot Password' feature should be used for password reset")

def check_password_compatibility():
    """Check if the current Werkzeug version supports scrypt"""
    try:
        # Try to create a scrypt hash
        test_hash = generate_password_hash("test", method='scrypt')
        print("✅ Current Werkzeug version supports scrypt")
        return True
    except Exception as e:
        print(f"❌ Current Werkzeug version does not support scrypt: {e}")
        return False

def main():
    print("🔐 DASPER Password Migration Tool")
    print("=" * 50)
    
    # Check Werkzeug compatibility
    print("\n1. Checking Werkzeug compatibility...")
    supports_scrypt = check_password_compatibility()
    
    if supports_scrypt:
        print("✅ No migration needed - Werkzeug supports scrypt")
        return
    
    # Run migration
    print("\n2. Running password migration...")
    migrate_passwords()
    
    print("\n3. Testing login functionality...")
    test_login_functionality()

def test_login_functionality():
    """Test if login works after migration"""
    try:
        from pymongo import MongoClient
        from werkzeug.security import check_password_hash
        
        # Connect to database
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        client = MongoClient(mongo_uri)
        db = client['dasper_db']
        
        # Test with a migrated user
        test_user = db.users.find_one({'password_reset_required': True})
        
        if test_user:
            # Test password verification
            temp_password = "TEMP_RESET_REQUIRED_2024"
            is_valid = check_password_hash(test_user['password_hash'], temp_password)
            
            if is_valid:
                print("✅ Password verification works correctly")
            else:
                print("❌ Password verification failed")
        else:
            print("⚠️  No migrated users found for testing")
            
    except Exception as e:
        print(f"❌ Error testing login functionality: {e}")

if __name__ == "__main__":
    main()
