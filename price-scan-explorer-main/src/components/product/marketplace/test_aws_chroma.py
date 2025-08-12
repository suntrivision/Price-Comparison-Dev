#!/usr/bin/env python3
"""
Test script to verify ChromaDB is working on AWS
"""

import requests
import sys
import time

def test_chromadb_connection():
    """Test connection to ChromaDB"""
    print("🔍 Testing ChromaDB connection...")
    
    try:
        # Test heartbeat
        response = requests.get("http://localhost:8000/api/v1/heartbeat", timeout=10)
        if response.status_code == 200:
            print("✅ ChromaDB heartbeat successful")
            return True
        else:
            print(f"❌ ChromaDB heartbeat failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ChromaDB connection failed: {e}")
        return False

def test_chromadb_api():
    """Test ChromaDB API endpoints"""
    print("🔍 Testing ChromaDB API...")
    
    try:
        # Test collections endpoint
        response = requests.get("http://localhost:8000/api/v1/collections", timeout=10)
        if response.status_code == 200:
            collections = response.json()
            print(f"✅ Found {len(collections)} collections")
            return True
        else:
            print(f"❌ Collections API failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_ollama_connection():
    """Test connection to Ollama"""
    print("🔍 Testing Ollama connection...")
    
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json()
            print(f"✅ Ollama is running with {len(models.get('models', []))} models")
            return True
        else:
            print(f"❌ Ollama connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ollama connection failed: {e}")
        return False

def test_public_access():
    """Test if ChromaDB is accessible from public IP"""
    print("🔍 Testing public access...")
    
    try:
        # Get public IP
        response = requests.get("http://169.254.169.254/latest/meta-data/public-ipv4", timeout=5)
        if response.status_code == 200:
            public_ip = response.text.strip()
            print(f"🌐 Public IP: {public_ip}")
            
            # Test public access
            try:
                response = requests.get(f"http://{public_ip}:8000/api/v1/heartbeat", timeout=10)
                if response.status_code == 200:
                    print("✅ ChromaDB is accessible from public IP")
                    return True
                else:
                    print(f"❌ Public access failed: {response.status_code}")
                    return False
            except Exception as e:
                print(f"❌ Public access failed: {e}")
                print("💡 Make sure your security group allows port 8000")
                return False
        else:
            print("❌ Could not get public IP")
            return False
    except Exception as e:
        print(f"❌ Public access test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 AWS ChromaDB Test")
    print("=" * 50)
    
    tests = [
        ("ChromaDB Connection", test_chromadb_connection),
        ("ChromaDB API", test_chromadb_api),
        ("Ollama Connection", test_ollama_connection),
        ("Public Access", test_public_access)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! ChromaDB is ready to use.")
        return True
    else:
        print("⚠️  Some tests failed. Check the configuration.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 