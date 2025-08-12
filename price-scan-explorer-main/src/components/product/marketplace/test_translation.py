#!/usr/bin/env python3
"""
Test script to debug translation issues
"""

import requests
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Test Ollama connection
def test_ollama_connection():
    print("🔍 Testing Ollama connection...")
    
    # Try to get config
    try:
        import ollama_config
        OLLAMA_BASE_URL = ollama_config.OLLAMA_BASE_URL
        print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
    except ImportError:
        print("⚠️  No ollama_config.py found, using localhost defaults")
        OLLAMA_BASE_URL = "http://localhost:11434"
        GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
        LLM_MODEL = "llama3.1:8b"
    
    # Test connection
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        print(f"📡 Ollama API response: {response.status_code}")
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"📋 Available models: {[m.get('name', 'unknown') for m in models]}")
        else:
            print(f"❌ Ollama not responding properly: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return False
    
    return True

# Test translation
def test_translation():
    print("\n🔍 Testing translation...")
    
    try:
        import ollama_config
        OLLAMA_BASE_URL = ollama_config.OLLAMA_BASE_URL
        GENERATE_ENDPOINT = ollama_config.GENERATE_ENDPOINT
        LLM_MODEL = ollama_config.LLM_MODEL
    except ImportError:
        OLLAMA_BASE_URL = "http://localhost:11434"
        GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
        LLM_MODEL = "llama3.1:8b"
    
    test_text = "paha ayam sejuk beku 2kg"
    print(f"📝 Testing translation of: '{test_text}'")
    
    prompt = f"""
    Translate this product name to English. Keep brand names unchanged.
    
    Product: {test_text}
    
    Rules:
    - Keep brand names unchanged (Milo, Indomie, Coca Cola)
    - Translate descriptive words to English
    - Keep measurements unchanged (500g, 1L, etc.)
    - Return only the translation, nothing else
    
    Translation:
    """
    
    try:
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
            timeout=120
        )
        
        print(f"📡 Translation API response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            print(f"✅ Translation result: '{result}'")
            return True
        else:
            print(f"❌ Translation failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return False

# Test fast translation
def test_fast_translation():
    print("\n🔍 Testing fast translation...")
    
    try:
        from fast_translation import fast_translate, get_cache_stats
        print("✅ Fast translation system loaded")
        
        test_texts = ["paha ayam sejuk beku 2kg", "ikan siakap m (400gm - 600gm / ekor)"]
        print(f"📝 Testing batch translation of: {test_texts}")
        
        results = fast_translate(test_texts)
        print(f"✅ Fast translation results: {results}")
        
        stats = get_cache_stats()
        print(f"📊 Cache stats: {stats}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Fast translation not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Fast translation error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Translation Debug Test")
    print("=" * 50)
    
    # Test 1: Ollama connection
    ollama_ok = test_ollama_connection()
    
    # Test 2: Basic translation
    if ollama_ok:
        translation_ok = test_translation()
    else:
        translation_ok = False
    
    # Test 3: Fast translation
    fast_ok = test_fast_translation()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Ollama Connection: {'✅ OK' if ollama_ok else '❌ FAILED'}")
    print(f"   Basic Translation: {'✅ OK' if translation_ok else '❌ FAILED'}")
    print(f"   Fast Translation: {'✅ OK' if fast_ok else '❌ FAILED'}")
    
    if not ollama_ok:
        print("\n💡 Troubleshooting:")
        print("   1. Make sure Ollama is running: ollama serve")
        print("   2. Check if models are installed: ollama list")
        print("   3. Install required model: ollama pull llama3.1:8b")
        print("   4. Check Ollama logs for errors") 