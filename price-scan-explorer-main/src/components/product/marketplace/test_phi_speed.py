#!/usr/bin/env python3
"""
Quick test to compare phi3:mini speed
"""

import time
import requests

def test_model_speed(model_name, test_text):
    """Test translation speed for a specific model"""
    print(f"🔧 Testing {model_name}...")
    
    prompt = f"Translate this product name to English. Keep brand names unchanged. Product: {test_text}. Rules: Keep brand names unchanged, translate descriptive words to English, keep measurements unchanged. Return only the translation."
    
    start_time = time.time()
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            elapsed = time.time() - start_time
            print(f"  ✅ Success: {result[:50]}")
            print(f"  ⏱️  Time: {elapsed:.2f}s")
            return elapsed, result
        else:
            print(f"  ❌ Failed: {response.status_code}")
            return None, None
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None, None

def main():
    print("🏁 Phi3:mini Speed Test")
    print("=" * 40)
    
    test_text = "paha ayam sejuk beku 2kg"
    print(f"📝 Test text: {test_text}")
    print()
    
    # Test phi3:mini
    phi_time, phi_result = test_model_speed("phi3:mini", test_text)
    
    print()
    print("📊 Results:")
    print(f"Model: phi3:mini")
    print(f"Size: 2.2GB")
    print(f"Time: {phi_time:.2f}s" if phi_time else "Failed")
    print(f"Result: {phi_result}" if phi_result else "None")
    
    if phi_time:
        texts_per_sec = 1 / phi_time
        print(f"Speed: {texts_per_sec:.1f} texts/sec")
    
    print()
    print("💡 Expected improvements with phi3:mini:")
    print("- 2-3x faster than llama3.1:8b")
    print("- 50% less memory usage")
    print("- Faster model loading")

if __name__ == "__main__":
    main() 