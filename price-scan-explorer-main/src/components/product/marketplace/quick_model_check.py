import requests
import json

def check_ollama_models():
    """Quick check of available Ollama models"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json()
            print("✅ Ollama is running!")
            print("📋 Available models:")
            for model in models.get('models', []):
                print(f"  - {model['name']}")
            
            # Check for specific models we need
            available_names = [m['name'] for m in models.get('models', [])]
            print("\n🔍 Model Availability:")
            print(f"  nomic-embed-text: {'✅' if 'nomic-embed-text' in available_names else '❌'}")
            print(f"  llama3.1:8b: {'✅' if 'llama3.1:8b' in available_names else '❌'}")
            print(f"  phi3:mini: {'✅' if 'phi3:mini' in available_names else '❌'}")
            
            return models
        else:
            print(f"❌ Ollama responded with status: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return None

if __name__ == "__main__":
    check_ollama_models() 