#!/usr/bin/env python3
"""
Test script to diagnose translation timeout issues
"""

import requests
import time
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_ollama_models():
    """Test which models are available and their response times"""
    print("🔍 Testing Ollama Models and Response Times")
    print("=" * 50)
    
    try:
        # Check available models
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"✅ Found {len(models)} models:")
            for model in models:
                name = model.get('name', 'Unknown')
                size = model.get('size', 0)
                size_gb = size / (1024**3) if size > 0 else 0
                print(f"   - {name} ({size_gb:.1f}GB)")
        else:
            print(f"❌ Failed to get models: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return False
    
    return True

def test_model_response_time(model_name, test_prompt):
    """Test response time for a specific model"""
    print(f"\n⏱️  Testing {model_name} response time...")
    
    start_time = time.time()
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": test_prompt,
                "stream": False,
                "options": {
                    "num_predict": 50,
                    "temperature": 0.1
                }
            },
            timeout=300  # 5 minutes timeout
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {model_name} responded in {elapsed:.2f}s")
            print(f"   Response: {result.get('response', '')[:100]}...")
            return elapsed
        else:
            print(f"❌ {model_name} failed with status: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"❌ {model_name} timed out after {time.time() - start_time:.2f}s")
        return None
    except Exception as e:
        print(f"❌ {model_name} error: {e}")
        return None

def test_translation_specific():
    """Test translation-specific prompts"""
    print("\n🌍 Testing Translation Performance")
    print("=" * 40)
    
    test_products = [
        "paha ayam sejuk beku 2kg",
        "ikan sardin dalam sos tomato",
        "susu segar 1 liter"
    ]
    
    models_to_test = ["phi3:mini", "llama3.1:8b"]
    
    for model in models_to_test:
        print(f"\n🧪 Testing {model} for translation...")
        
        for i, product in enumerate(test_products):
            prompt = f"Translate this product name to English. Keep brand names unchanged. Product: {product}. Rules: Keep brand names unchanged, translate descriptive words to English, keep measurements unchanged. Return only the translation."
            
            start_time = time.time()
            try:
                response = requests.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "num_predict": 50,
                            "temperature": 0.1
                        }
                    },
                    timeout=180  # 3 minutes
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code == 200:
                    result = response.json().get('response', '').strip()
                    print(f"  {i+1}. {product[:30]:<30} → {result[:30]} ({elapsed:.1f}s)")
                else:
                    print(f"  {i+1}. {product[:30]:<30} → FAILED ({response.status_code})")
                    
            except requests.exceptions.Timeout:
                print(f"  {i+1}. {product[:30]:<30} → TIMEOUT")
            except Exception as e:
                print(f"  {i+1}. {product[:30]:<30} → ERROR: {e}")

def main():
    print("🚀 Translation Timeout Diagnostic Tool")
    print("=" * 50)
    
    # Test 1: Check available models
    if not test_ollama_models():
        print("\n❌ Cannot proceed without Ollama connection")
        return
    
    # Test 2: Test basic response times
    print("\n⏱️  Testing Basic Response Times")
    print("=" * 40)
    
    test_prompt = "Hello, this is a test message."
    models_to_test = ["phi3:mini", "llama3.1:8b"]
    
    for model in models_to_test:
        test_model_response_time(model, test_prompt)
    
    # Test 3: Test translation-specific performance
    test_translation_specific()
    
    print("\n" + "=" * 50)
    print("📊 Diagnostic Summary:")
    print("   - Check if phi3:mini is faster than llama3.1:8b")
    print("   - Look for timeout patterns")
    print("   - Verify model availability")
    print("\n💡 Recommendations:")
    print("   - Use phi3:mini for translation (faster)")
    print("   - Increase timeout if needed")
    print("   - Reduce batch size for stability")

if __name__ == "__main__":
    main() 