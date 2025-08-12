import requests
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
    print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
    print(f"📝 LLM Model: {LLM_MODEL}")
except ImportError:
    print("⚠️  No ollama_config.py found, using localhost defaults")
    OLLAMA_BASE_URL = "http://localhost:11434"
    GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
    LLM_MODEL = "llama3.1:8b"

def test_translation():
    """Test translation with local Ollama"""
    
    # Test product name
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
    
    print(f"🔄 Testing translation for: {test_product}")
    print(f"📡 Using endpoint: {GENERATE_ENDPOINT}")
    print(f"🤖 Using model: {LLM_MODEL}")
    
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
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            print(f"✅ Translation successful!")
            print(f"📝 Original: {test_product}")
            print(f"🌐 Translated: {result}")
            return True
        else:
            print(f"❌ Translation failed with status code: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Ollama Translation API")
    print("=" * 50)
    
    # First check if Ollama is running
    try:
        test_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if test_response.status_code == 200:
            print("✅ Ollama service is running")
        else:
            print("❌ Ollama service not responding")
            exit(1)
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        exit(1)
    
    # Test translation
    success = test_translation()
    
    if success:
        print("\n🎉 Translation test passed! Your Ollama setup is working correctly.")
    else:
        print("\n💥 Translation test failed. Check your Ollama configuration.") 