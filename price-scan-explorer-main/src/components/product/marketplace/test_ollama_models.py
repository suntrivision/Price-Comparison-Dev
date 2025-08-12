import requests
import json

# Test Ollama connection and available models
OLLAMA_BASE_URL = "http://localhost:11434"

def test_ollama_connection():
    """Test if Ollama is running and what models are available"""
    try:
        # Test basic connection
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json()
            print("✅ Ollama is running!")
            print("📋 Available models:")
            for model in models.get('models', []):
                print(f"  - {model['name']}")
            return models
        else:
            print(f"❌ Ollama responded with status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return None

def test_embedding_api():
    """Test the embedding API"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={
                "model": "nomic-embed-text",
                "prompt": "test"
            },
            timeout=30
        )
        if response.status_code == 200:
            print("✅ Embedding API works!")
            return True
        else:
            print(f"❌ Embedding API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Embedding API error: {e}")
        return False

def test_generate_api():
    """Test the generate API"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": "phi3:mini",
                "prompt": "Hello",
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            print("✅ Generate API works!")
            return True
        else:
            print(f"❌ Generate API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Generate API error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Ollama connection and APIs...")
    
    # Test connection and models
    models = test_ollama_connection()
    
    if models:
        # Test APIs
        test_embedding_api()
        test_generate_api()
        
        # Check if required models are available
        available_models = [model['name'] for model in models.get('models', [])]
        
        print("\n📊 Model Availability Check:")
        print(f"  nomic-embed-text: {'✅' if 'nomic-embed-text' in available_models else '❌'}")
        print(f"  phi3:mini: {'✅' if 'phi3:mini' in available_models else '❌'}")
        print(f"  llama3.1:8b: {'✅' if 'llama3.1:8b' in available_models else '❌'}")
        
        # Suggest alternatives if models are missing
        if 'phi3:mini' not in available_models:
            print("\n💡 phi3:mini not found. Available alternatives:")
            for model in available_models:
                if 'phi' in model.lower() or 'mini' in model.lower():
                    print(f"  - {model}")
        
        if 'nomic-embed-text' not in available_models:
            print("\n💡 nomic-embed-text not found. Available alternatives:")
            for model in available_models:
                if 'embed' in model.lower():
                    print(f"  - {model}")
    else:
        print("❌ Cannot test APIs without Ollama connection") 