import requests
import json
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

def test_ollama_connection():
    """Test basic Ollama connectivity"""
    print("\n🔌 Testing Ollama Connection...")
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"✅ Ollama is running and accessible")
            print(f"📦 Available models: {len(models)}")
            for model in models:
                print(f"   - {model['name']} ({model['size']} bytes)")
            return models
        else:
            print(f"❌ Ollama responded with status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return None

def test_model_availability(model_name):
    """Test if a specific model is available"""
    print(f"\n🤖 Testing model availability: {model_name}")
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": model_name,
                "prompt": "Hello",
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            print(f"✅ Model {model_name} is working")
            return True
        else:
            print(f"❌ Model {model_name} failed with status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing model {model_name}: {e}")
        return False

def test_embedding_model(model_name):
    """Test embedding model"""
    print(f"\n🔍 Testing embedding model: {model_name}")
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={
                "model": model_name,
                "prompt": "test text"
            },
            timeout=30
        )
        if response.status_code == 200:
            embedding = response.json().get('embedding', [])
            print(f"✅ Embedding model {model_name} is working (dimension: {len(embedding)})")
            return True
        else:
            print(f"❌ Embedding model {model_name} failed with status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing embedding model {model_name}: {e}")
        return False

def test_translation():
    """Test translation functionality"""
    print(f"\n🌐 Testing translation functionality...")
    test_text = "paha ayam sejuk beku 2kg"
    
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
            f"{OLLAMA_BASE_URL}/api/generate",
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
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            print(f"✅ Translation successful!")
            print(f"📝 Original: {test_text}")
            print(f"🌐 Translated: {result}")
            return True
        else:
            print(f"❌ Translation failed with status: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Ollama Diagnostic Tool")
    print("=" * 50)
    
    # Test connection and get available models
    models = test_ollama_connection()
    
    if not models:
        print("\n💥 Cannot connect to Ollama. Please check:")
        print("   1. Is Ollama installed and running?")
        print("   2. Is the service running on localhost:11434?")
        print("   3. Are there any firewall issues?")
        exit(1)
    
    # Check if required models are available
    model_names = [model['name'] for model in models]
    
    print(f"\n📋 Required models:")
    print(f"   - LLM Model: {LLM_MODEL}")
    print(f"   - Embedding Model: {EMBEDDING_MODEL}")
    
    # Test LLM model
    if LLM_MODEL in model_names:
        test_model_availability(LLM_MODEL)
    else:
        print(f"❌ LLM model {LLM_MODEL} not found in available models")
        print(f"   Available LLM models: {[m for m in model_names if 'llama' in m.lower()]}")
    
    # Test embedding model
    if EMBEDDING_MODEL in model_names:
        test_embedding_model(EMBEDDING_MODEL)
    else:
        print(f"❌ Embedding model {EMBEDDING_MODEL} not found in available models")
        print(f"   Available embedding models: {[m for m in model_names if 'embed' in m.lower()]}")
    
    # Test translation
    test_translation()
    
    print("\n" + "=" * 50)
    print("🎯 Diagnostic complete!") 