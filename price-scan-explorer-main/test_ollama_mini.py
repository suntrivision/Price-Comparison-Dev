#!/usr/bin/env python3
"""
Mini test script for Ollama - just 2 products
"""

import requests
import time

print("🧪 Mini Ollama Test (2 products)")
print("=" * 40)

# Test 1: Check Ollama connection
print("🔍 Checking Ollama connection...")
try:
    response = requests.get("http://localhost:11434/api/tags", timeout=5)
    if response.status_code == 200:
        models = response.json().get("models", [])
        print(f"✅ Ollama is running with {len(models)} models")
    else:
        print(f"❌ Ollama connection failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Ollama connection error: {e}")
    exit(1)

# Test 2: Test embedding
print("\n🧪 Testing embedding...")
try:
    response = requests.post(
        "http://localhost:11434/api/embeddings",
        json={
            "model": "nomic-embed-text",
            "prompt": "Coca Cola 330ml"
        },
        timeout=30
    )
    if response.status_code == 200:
        embedding = response.json()["embedding"]
        print(f"✅ Embedding generated ({len(embedding)} dimensions)")
    else:
        print(f"❌ Embedding failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Embedding error: {e}")
    exit(1)

# Test 3: Test LLM preprocessing
print("\n🤖 Testing LLM preprocessing...")
products = ["Coca Cola Original 330ml", "Coke 330ml"]

for i, product in enumerate(products):
    print(f"Processing {i+1}: {product}")
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": f"Standardize this product name: {product}. Return only the standardized name:",
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()["response"].strip()
            print(f"   → {result}")
        else:
            print(f"   ❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    time.sleep(1)

# Test 4: Test similarity analysis
print("\n🔍 Testing similarity analysis...")
try:
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.1:8b",
            "prompt": "Are 'Coca Cola Original 330ml' and 'Coke 330ml' the same product? Answer with just 'Yes' or 'No':",
            "stream": False
        },
        timeout=30
    )
    if response.status_code == 200:
        result = response.json()["response"].strip()
        print(f"Similarity result: {result}")
    else:
        print(f"❌ Similarity analysis failed: {response.status_code}")
except Exception as e:
    print(f"❌ Similarity analysis error: {e}")

print("\n🎉 Mini test completed!")
print("=" * 40) 