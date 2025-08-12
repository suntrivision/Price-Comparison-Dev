#!/usr/bin/env python3
"""
Quick fix for Ollama configuration
Updates the config to use the correct models available on your EC2 instance
"""

import os
import sys

def fix_ollama_config():
    """Fix the ollama_config.py file to use correct models"""
    
    config_file = "ollama_config.py"
    
    if not os.path.exists(config_file):
        print(f"❌ {config_file} not found in current directory")
        return False
    
    print("🔧 Fixing Ollama configuration...")
    
    # Read the current config
    with open(config_file, 'r') as f:
        content = f.read()
    
    # Replace the model configurations
    content = content.replace(
        'EMBEDDING_MODEL = "nomic-embed-text"',
        'EMBEDDING_MODEL = "nomic-embed-text:latest"'
    )
    
    content = content.replace(
        'LLM_MODEL = "llama3.1:1b"',
        'LLM_MODEL = "llama3.1:8b"'
    )
    
    # Write the fixed config
    with open(config_file, 'w') as f:
        f.write(content)
    
    print("✅ Configuration updated!")
    print("   - LLM Model: llama3.1:8b")
    print("   - Embedding Model: nomic-embed-text:latest")
    
    return True

def test_fixed_config():
    """Test the fixed configuration"""
    print("\n🧪 Testing fixed configuration...")
    
    try:
        # Import the fixed config
        import ollama_config
        print(f"✅ Loaded fixed config: {ollama_config.OLLAMA_BASE_URL}")
        print(f"📝 LLM Model: {ollama_config.LLM_MODEL}")
        print(f"🔍 Embedding Model: {ollama_config.EMBEDDING_MODEL}")
        
        # Test basic connectivity
        import requests
        response = requests.get(f"{ollama_config.OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get('models', [])
            model_names = [model['name'] for model in models]
            
            if ollama_config.LLM_MODEL in model_names:
                print(f"✅ {ollama_config.LLM_MODEL} is available")
            else:
                print(f"❌ {ollama_config.LLM_MODEL} is NOT available")
                print(f"   Available LLM models: {[m for m in model_names if 'llama' in m.lower()]}")
            
            if ollama_config.EMBEDDING_MODEL in model_names:
                print(f"✅ {ollama_config.EMBEDDING_MODEL} is available")
            else:
                print(f"❌ {ollama_config.EMBEDDING_MODEL} is NOT available")
                print(f"   Available embedding models: {[m for m in model_names if 'embed' in m.lower()]}")
            
            return True
        else:
            print(f"❌ Cannot connect to Ollama: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing config: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Ollama Configuration Fix")
    print("=" * 40)
    
    # Fix the config
    if fix_ollama_config():
        # Test the fixed config
        if test_fixed_config():
            print("\n✅ Configuration fixed and tested successfully!")
            print("You can now run your translation script again.")
        else:
            print("\n❌ Configuration test failed. Please check manually.")
    else:
        print("\n❌ Failed to fix configuration.")

if __name__ == "__main__":
    main() 