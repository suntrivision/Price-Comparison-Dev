#!/usr/bin/env python3
"""
Simple script to test Ollama connection and basic functionality
"""

import requests
import json
import time

def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    print("🔍 Testing Ollama Connection...")
    print("=" * 40)
    
    # Test 1: Check if Ollama service is running
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama service is running")
            models = response.json().get("models", [])
            print(f"📦 Available models: {len(models)}")
            for model in models:
                print(f"   - {model.get('name', 'Unknown')}")
        else:
            print(f"❌ Ollama service responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama service")
        print("   Make sure Ollama is installed and running:")
        print("   1. Install Ollama: https://ollama.ai/download")
        print("   2. Start Ollama: ollama serve")
        return False
    except Exception as e:
        print(f"❌ Error connecting to Ollama: {e}")
        return False
    
    # Test 2: Test embedding generation
    print("\n🧪 Testing embedding generation...")
    try:
        embedding_response = requests.post(
            "http://localhost:11434/api/embeddings",
            json={
                "model": "nomic-embed-text",
                "prompt": "test product"
            },
            timeout=30
        )
        
        if embedding_response.status_code == 200:
            embedding = embedding_response.json().get("embedding")
            if embedding and len(embedding) > 0:
                print(f"✅ Embedding generated successfully (dimensions: {len(embedding)})")
            else:
                print("❌ Embedding generation failed - empty response")
                return False
        else:
            print(f"❌ Embedding generation failed with status: {embedding_response.status_code}")
            print("   Make sure 'nomic-embed-text' model is installed:")
            print("   ollama pull nomic-embed-text")
            return False
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return False
    
    # Test 3: Test text generation (if llama3.1:8b is available)
    print("\n🤖 Testing text generation...")
    try:
        # Check if llama3.1:8b is available
        models_response = requests.get("http://localhost:11434/api/tags", timeout=5)
        models = models_response.json().get("models", [])
        llama_available = any("llama3.1:8b" in model.get("name", "") for model in models)
        
        if llama_available:
            generation_response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.1:8b",
                    "prompt": "Hello, this is a test.",
                    "stream": False
                },
                timeout=60
            )
            
            if generation_response.status_code == 200:
                result = generation_response.json()
                print("✅ Text generation successful")
                print(f"   Response: {result.get('response', '')[:100]}...")
            else:
                print(f"❌ Text generation failed with status: {generation_response.status_code}")
        else:
            print("⚠️  llama3.1:8b model not available")
            print("   Install with: ollama pull llama3.1:8b")
    except Exception as e:
        print(f"❌ Error in text generation: {e}")
    
    print("\n🎉 Ollama connection test completed!")
    return True

def get_ollama_embedding(text, model="nomic-embed-text"):
    """Get embedding from Ollama using Nomic Embed model"""
    try:
        response = requests.post(
            "http://localhost:11434/api/embeddings",
            json={
                "model": model,
                "prompt": text
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["embedding"]
        else:
            print(f"❌ Ollama embedding error: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ollama connection error: {e}")
        return None

def analyze_product_similarity(product1, product2, model="llama3.1:8b"):
    """Use Ollama to analyze product similarity and provide reasoning"""
    prompt = f"""
    Analyze if these two products are the same or very similar:
    
    Product 1: {product1}
    Product 2: {product2}
    
    Consider:
    - Brand names and variations
    - Product type and category
    - Size/quantity specifications
    - Flavor/variant differences
    
    Respond with:
    1. Similarity score (0-100)
    2. Brief reasoning
    3. Key matching factors
    
    Format: Score: X, Reasoning: Y, Factors: Z
    """
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        if response.status_code == 200:
            return response.json()["response"]
        else:
            return f"Score: 0, Reasoning: API Error, Factors: None"
    except Exception as e:
        return f"Score: 0, Reasoning: Connection Error, Factors: None"

if __name__ == "__main__":
    print("🚀 Ollama Connection Test")
    print("=" * 50)
    
    # Test basic connection
    if test_ollama_connection():
        print("\n📝 Testing product matching functions...")
        
        # Test embedding function
        test_text = "Coca Cola 330ml"
        embedding = get_ollama_embedding(test_text)
        if embedding:
            print(f"✅ Product embedding generated for: '{test_text}'")
        
        # Test similarity analysis
        product1 = "Coca Cola 330ml"
        product2 = "Coke 330ml"
        similarity = analyze_product_similarity(product1, product2)
        print(f"✅ Similarity analysis completed:")
        print(f"   Product 1: {product1}")
        print(f"   Product 2: {product2}")
        print(f"   Analysis: {similarity}")
        
        print("\n🎯 Ollama is ready for product matching!")
    else:
        print("\n❌ Ollama connection failed. Please check the installation.")
        print("\n📋 Next steps:")
        print("1. Install Ollama: https://ollama.ai/download")
        print("2. Start Ollama: ollama serve")
        print("3. Install models:")
        print("   ollama pull nomic-embed-text")
        print("   ollama pull llama3.1:8b")
        print("4. Run this test again") 