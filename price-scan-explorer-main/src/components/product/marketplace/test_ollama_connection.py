#!/usr/bin/env python3
"""
Test script to verify Ollama cloud connection
Run this before running the main matching script
"""

import requests
import json
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
    print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
except ImportError:
    print("❌ No ollama_config.py found!")
    print("Please create ollama_config.py with your EC2 settings first.")
    sys.exit(1)

def test_connection():
    """Test basic connection to Ollama"""
    print(f"🔗 Testing connection to: {OLLAMA_BASE_URL}")
    
    try:
        # Test basic health check
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            print("✅ Connection successful!")
            models = response.json().get('models', [])
            print(f"📋 Available models: {len(models)}")
            for model in models:
                print(f"  - {model['name']} ({model['size']})")
            return True
        else:
            print(f"❌ Connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_embedding():
    """Test embedding generation"""
    print(f"\n🧠 Testing embedding with model: {EMBEDDING_MODEL}")
    
    try:
        response = requests.post(
            EMBEDDINGS_ENDPOINT,
            json={
                "model": EMBEDDING_MODEL,
                "prompt": "test product"
            },
            timeout=REQUEST_TIMEOUT
        )
        if response.status_code == 200:
            embedding = response.json()["embedding"]
            print(f"✅ Embedding successful! Dimension: {len(embedding)}")
            return True
        else:
            print(f"❌ Embedding failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return False

def test_generation():
    """Test text generation"""
    print(f"\n💬 Testing generation with model: {LLM_MODEL}")
    
    try:
        response = requests.post(
            GENERATE_ENDPOINT,
            json={
                "model": LLM_MODEL,
                "prompt": "Say hello in one word",
                "stream": False
            },
            timeout=REQUEST_TIMEOUT
        )
        if response.status_code == 200:
            result = response.json()["response"]
            print(f"✅ Generation successful! Response: {result}")
            return True
        else:
            print(f"❌ Generation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Generation error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Ollama Cloud Connection Test")
    print("=" * 40)
    
    # Test connection
    if not test_connection():
        print("\n❌ Basic connection failed. Check your EC2 settings.")
        sys.exit(1)
    
    # Test embedding
    if not test_embedding():
        print(f"\n❌ Embedding failed. Make sure {EMBEDDING_MODEL} is installed on your EC2 instance.")
        print("Run: ollama pull nomic-embed-text")
        sys.exit(1)
    
    # Test generation
    if not test_generation():
        print(f"\n❌ Generation failed. Make sure {LLM_MODEL} is installed on your EC2 instance.")
        print("Run: ollama pull llama3.1:8b")
        sys.exit(1)
    
    print("\n🎉 All tests passed! Your Ollama cloud setup is ready.")
    print("You can now run the main matching script.") 