#!/usr/bin/env python3
import requests
import json

def test_translation():
    """Test if translation is working"""
    
    # Test cases
    test_cases = [
        "susu tepung",
        "ikan sardin dalam sos tomato",
        "krimer manis",
        "coklat malt drink"
    ]
    
    print("🔍 Testing Translation...")
    print("=" * 50)
    
    for i, text in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: '{text}'")
        
        # Check if Ollama is running
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code != 200:
                print(f"   ❌ Ollama not responding")
                continue
        except:
            print(f"   ❌ Cannot connect to Ollama")
            continue
        
        # Try translation
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": f"Translate this to English: {text}",
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
                translation = result.get('response', '').strip()
                print(f"   ✅ Translation: '{translation}'")
            else:
                print(f"   ❌ Translation failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Translation error: {e}")

if __name__ == "__main__":
    test_translation() 