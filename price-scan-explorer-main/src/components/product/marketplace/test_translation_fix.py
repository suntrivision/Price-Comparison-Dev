#!/usr/bin/env python3
"""
Test script to verify translation is working with phi3:mini model
"""

import sys
import os
import time

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_translation_fix():
    print("🧪 Testing Translation Fix with phi3:mini")
    print("=" * 50)
    
    try:
        # Test 1: Check if fast translation is available
        from fast_translation import fast_translate, get_cache_stats
        print("✅ Fast translation system loaded")
        
        # Test 2: Check Ollama connection
        import requests
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                print(f"✅ Ollama is running")
                print(f"📦 Available models: {model_names}")
                
                if 'phi3:mini' in model_names:
                    print("✅ phi3:mini model is available")
                else:
                    print("⚠️  phi3:mini model not found, available models:")
                    for model in model_names:
                        print(f"   - {model}")
                    return False
            else:
                print(f"❌ Ollama not responding: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to Ollama: {e}")
            return False
        
        # Test 3: Test translation with timeout handling
        test_products = [
            "paha ayam sejuk beku 2kg",
            "ikan sardin dalam sos tomato",
            "susu segar 1 liter"
        ]
        
        print(f"\n🚀 Testing translation of {len(test_products)} products...")
        start_time = time.time()
        
        try:
            results = fast_translate(test_products)
            elapsed = time.time() - start_time
            
            print(f"\n✅ Translation completed in {elapsed:.2f}s")
            print(f"📊 Results:")
            
            for i, (original, translated) in enumerate(zip(test_products, results), 1):
                print(f"  {i}. {original}")
                print(f"     → {translated}")
                print()
            
            # Show cache stats
            stats = get_cache_stats()
            print(f"📊 Cache statistics: {stats['cache_size']} entries")
            
            return True
            
        except Exception as e:
            print(f"❌ Translation failed: {e}")
            return False
        
    except ImportError as e:
        print(f"❌ Fast translation not available: {e}")
        return False

if __name__ == "__main__":
    success = test_translation_fix()
    if success:
        print("\n🎉 Translation fix test passed!")
        print("✅ phi3:mini model is working properly")
        print("✅ Timeout issues should be resolved")
    else:
        print("\n❌ Translation fix test failed!")
        print("💡 Make sure:")
        print("   1. Ollama is running: ollama serve")
        print("   2. phi3:mini model is installed: ollama pull phi3:mini")
        print("   3. Check Ollama logs for errors") 