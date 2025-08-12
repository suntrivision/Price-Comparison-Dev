#!/usr/bin/env python3
"""
Manual Translation Test for EC2 Ollama
Run this script to diagnose translation issues on your EC2 instance
"""

import requests
import json
import time
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
    print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
    print(f"📝 LLM Model: {LLM_MODEL}")
    print(f"🔍 Embedding Model: {EMBEDDING_MODEL}")
except ImportError:
    print("⚠️  No ollama_config.py found, using localhost defaults")
    OLLAMA_BASE_URL = "http://localhost:11434"
    GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
    EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
    LLM_MODEL = "llama3.1:8b"
    EMBEDDING_MODEL = "nomic-embed-text"
    REQUEST_TIMEOUT = 60
    RETRY_ATTEMPTS = 3
    RETRY_DELAY = 1

def test_ollama_health():
    """Test if Ollama is running and accessible"""
    print("\n🔍 Testing Ollama Health...")
    print("=" * 50)
    
    try:
        # Test 1: Basic connectivity
        print("1. Testing basic connectivity...")
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            print("   ✅ Ollama is responding")
            models = response.json().get('models', [])
            print(f"   📋 Available models: {len(models)}")
            for model in models:
                print(f"      - {model['name']} ({model.get('size', 'Unknown')} bytes)")
            return True
        else:
            print(f"   ❌ Ollama responded with status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Cannot connect to Ollama: {e}")
        return False

def test_model_availability():
    """Test if the required models are available"""
    print("\n📦 Testing Model Availability...")
    print("=" * 50)
    
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [model['name'] for model in models]
            
            print(f"Required models:")
            print(f"  - LLM Model: {LLM_MODEL}")
            print(f"  - Embedding Model: {EMBEDDING_MODEL}")
            
            if LLM_MODEL in model_names:
                print(f"   ✅ {LLM_MODEL} is available")
            else:
                print(f"   ❌ {LLM_MODEL} is NOT available")
                print(f"   Available LLM models: {[m for m in model_names if 'llama' in m.lower()]}")
            
            if EMBEDDING_MODEL in model_names:
                print(f"   ✅ {EMBEDDING_MODEL} is available")
            else:
                print(f"   ❌ {EMBEDDING_MODEL} is NOT available")
                print(f"   Available embedding models: {[m for m in model_names if 'embed' in m.lower()]}")
            
            return LLM_MODEL in model_names and EMBEDDING_MODEL in model_names
        else:
            print(f"   ❌ Cannot get model list: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error checking models: {e}")
        return False

def test_generate_endpoint():
    """Test the generate endpoint specifically"""
    print("\n🧪 Testing Generate Endpoint...")
    print("=" * 50)
    
    test_prompt = "Hello, this is a test."
    
    print(f"Testing endpoint: {GENERATE_ENDPOINT}")
    print(f"Using model: {LLM_MODEL}")
    print(f"Test prompt: {test_prompt}")
    
    try:
        response = requests.post(
            GENERATE_ENDPOINT,
            json={
                "model": LLM_MODEL,
                "prompt": test_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 20
                }
            },
            timeout=REQUEST_TIMEOUT
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Generate endpoint working")
            print(f"   Response: {result.get('response', 'No response')}")
            return True
        else:
            print(f"   ❌ Generate endpoint failed")
            print(f"   Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Generate endpoint error: {e}")
        return False

def test_translation_specific():
    """Test the specific translation that's failing"""
    print("\n🌐 Testing Specific Translation...")
    print("=" * 50)
    
    test_product = "paha ayam sejuk beku 2kg"
    
    prompt = f"""
    Translate this product name to English. Keep brand names unchanged.
    
    Product: {test_product}
    
    Rules:
    - Keep brand names unchanged (Milo, Indomie, Coca Cola)
    - Translate descriptive words to English
    - Keep measurements unchanged (500g, 1L, etc.)
    - Return only the translation, nothing else
    
    Translation:
    """
    
    print(f"Testing translation for: {test_product}")
    print(f"Using endpoint: {GENERATE_ENDPOINT}")
    print(f"Using model: {LLM_MODEL}")
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            print(f"\nAttempt {attempt + 1}/{RETRY_ATTEMPTS}...")
            
            response = requests.post(
                GENERATE_ENDPOINT,
                json={
                    "model": LLM_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "num_predict": 50
                    }
                },
                timeout=REQUEST_TIMEOUT
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                translation = result.get("response", "").strip()
                print(f"   ✅ Translation successful!")
                print(f"   Original: {test_product}")
                print(f"   Translated: {translation}")
                return True
            else:
                print(f"   ❌ Translation failed (attempt {attempt + 1})")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")
                
                if attempt < RETRY_ATTEMPTS - 1:
                    print(f"   Waiting {RETRY_DELAY} seconds before retry...")
                    time.sleep(RETRY_DELAY)
                    continue
                return False
                
        except Exception as e:
            print(f"   ❌ Translation error (attempt {attempt + 1}): {e}")
            if attempt < RETRY_ATTEMPTS - 1:
                print(f"   Waiting {RETRY_DELAY} seconds before retry...")
                time.sleep(RETRY_DELAY)
                continue
            return False
    
    return False

def test_alternative_endpoints():
    """Test alternative endpoint formats"""
    print("\n🔧 Testing Alternative Endpoints...")
    print("=" * 50)
    
    # Test different endpoint variations
    endpoints_to_test = [
        f"{OLLAMA_BASE_URL}/api/generate",
        f"{OLLAMA_BASE_URL}/api/chat",
        f"{OLLAMA_BASE_URL}/api/embeddings",
        f"{OLLAMA_BASE_URL}/api/tags"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            print(f"Testing: {endpoint}")
            response = requests.get(endpoint, timeout=5)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ Working")
            else:
                print(f"   ❌ Failed")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def main():
    """Run all tests"""
    print("🚀 Manual Translation Test for EC2 Ollama")
    print("=" * 60)
    print(f"Target URL: {OLLAMA_BASE_URL}")
    print(f"LLM Model: {LLM_MODEL}")
    print(f"Embedding Model: {EMBEDDING_MODEL}")
    print("=" * 60)
    
    # Run all tests
    health_ok = test_ollama_health()
    
    if health_ok:
        models_ok = test_model_availability()
        generate_ok = test_generate_endpoint()
        translation_ok = test_translation_specific()
        
        print("\n📊 Test Summary")
        print("=" * 30)
        print(f"Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
        print(f"Model Availability: {'✅ PASS' if models_ok else '❌ FAIL'}")
        print(f"Generate Endpoint: {'✅ PASS' if generate_ok else '❌ FAIL'}")
        print(f"Translation: {'✅ PASS' if translation_ok else '❌ FAIL'}")
        
        if not translation_ok:
            print("\n🔧 Troubleshooting Alternative Endpoints...")
            test_alternative_endpoints()
    else:
        print("\n❌ Ollama is not accessible. Please check:")
        print("   1. Is Ollama installed? (ollama --version)")
        print("   2. Is Ollama running? (systemctl status ollama)")
        print("   3. Is port 11434 open? (netstat -tlnp | grep 11434)")
        print("   4. Check Ollama logs: (journalctl -u ollama -f)")

if __name__ == "__main__":
    main() 