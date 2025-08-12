#!/usr/bin/env python3
import requests
import json
import time

def test_ollama_connection():
    """Test Ollama connection and identify issues"""
    base_url = "http://localhost:11434"
    
    print("🔍 Testing Ollama Connection...")
    print("=" * 50)
    
    # Test 1: Basic connectivity
    print("1. Testing basic connectivity...")
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        if response.status_code == 200:
            print("   ✅ Ollama is responding")
            models = response.json().get('models', [])
            print(f"   📋 Available models: {len(models)}")
            for model in models:
                print(f"      - {model['name']}")
        else:
            print(f"   ❌ Ollama responded with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Cannot connect to Ollama: {e}")
        return False
    
    # Test 2: Model availability
    print("\n2. Testing model availability...")
    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": "llama3.1:1b",
                "prompt": "Hello",
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            print("   ✅ Model llama3.1:1b is working")
        else:
            print(f"   ❌ Model test failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Model test failed: {e}")
        return False
    
    # Test 3: Translation test
    print("\n3. Testing translation functionality...")
    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": "llama3.1:1b",
                "prompt": "Translate this to English: susu tepung",
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "num_predict": 50
                }
            },
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print("   ✅ Translation test successful")
            print(f"   Response: {result.get('response', 'No response')}")
        else:
            print(f"   ❌ Translation test failed with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Translation test failed: {e}")
        return False
    
    print("\n✅ All tests passed! Ollama is working correctly.")
    return True

if __name__ == "__main__":
    success = test_ollama_connection()
    if not success:
        print("\n🔧 Troubleshooting steps:")
        print("1. Start Ollama: ollama serve &")
        print("2. Download model: ollama pull llama3.1:1b")
        print("3. Check memory: free -h")
        print("4. Check port: netstat -tlnp | grep 11434") 