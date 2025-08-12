#!/usr/bin/env python3
"""
Small test script for Ollama product matching
Tests with just a few products to identify issues
"""

import pandas as pd
import requests
import time
import chromadb
from datetime import datetime

print("🧪 Starting Small Ollama Test...")
print("=" * 50)

# Test data - just a few products
test_data = {
    'Product Name': [
        'Coca Cola Original 330ml',
        'Coke 330ml',
        'Milo 1kg',
        'Milo Chocolate Malt Drink 1kg',
        'Indomie Mi Goreng 85g',
        'Indomie Mi Goreng Instant Noodles 85g'
    ],
    'Price': [2.50, 2.30, 15.90, 16.20, 1.20, 1.25],
    'URL': ['lotus_url_1', 'shopee_url_1', 'lotus_url_2', 'shopee_url_2', 'lotus_url_3', 'shopee_url_3'],
    'Marketplace': ['lotus', 'shopee', 'lotus', 'shopee', 'lotus', 'shopee']
}

df = pd.DataFrame(test_data)
print(f"📊 Test data loaded: {len(df)} products")
print(df[['Product Name', 'Marketplace', 'Price']].to_string(index=False))

# Ollama API functions
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

def preprocess_with_llm(product_name, model="llama3.1:8b"):
    """Use LLM to standardize product names"""
    prompt = f"""
    Standardize this product name for better matching:
    
    Original: {product_name}
    
    Rules:
    - Remove promotional words (new, original, authentic, etc.)
    - Standardize brand names (Coca Cola -> Coke)
    - Keep important specifications (size, flavor, etc.)
    - Make it concise but descriptive
    
    Return only the standardized name:
    """
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["response"].strip()
        else:
            print(f"❌ LLM preprocessing error: {response.status_code}")
            return product_name
    except Exception as e:
        print(f"❌ LLM preprocessing error: {e}")
        return product_name

def analyze_product_similarity(product1, product2, model="llama3.1:8b"):
    """Use Ollama to analyze product similarity"""
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

# Test 1: Check Ollama connection
print("\n🔍 Test 1: Checking Ollama connection...")
try:
    response = requests.get("http://localhost:11434/api/tags", timeout=5)
    if response.status_code == 200:
        models = response.json().get("models", [])
        print(f"✅ Ollama is running with {len(models)} models:")
        for model in models:
            print(f"   - {model.get('name', 'Unknown')}")
    else:
        print(f"❌ Ollama connection failed: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Ollama connection error: {e}")
    exit(1)

# Test 2: Test embedding generation
print("\n🧪 Test 2: Testing embedding generation...")
test_text = "Coca Cola 330ml"
embedding = get_ollama_embedding(test_text)
if embedding:
    print(f"✅ Embedding generated successfully (dimensions: {len(embedding)})")
else:
    print("❌ Embedding generation failed")
    exit(1)

# Test 3: Test LLM preprocessing
print("\n🤖 Test 3: Testing LLM preprocessing...")
for i, product in enumerate(df['Product Name'][:3]):
    print(f"Processing product {i+1}: {product}")
    processed = preprocess_with_llm(product)
    print(f"   → {processed}")
    time.sleep(1)  # Small delay between calls

# Test 4: Test similarity analysis
print("\n🔍 Test 4: Testing similarity analysis...")
product1 = "Coca Cola Original 330ml"
product2 = "Coke 330ml"
similarity = analyze_product_similarity(product1, product2)
print(f"Similarity analysis: {similarity}")

# Test 5: Test ChromaDB integration
print("\n🗄️ Test 5: Testing ChromaDB integration...")
try:
    # Initialize ChromaDB
    client = chromadb.PersistentClient(path="./chroma_db_test")
    
    # Custom embedding function
    class OllamaEmbeddingFunction:
        def __init__(self, model="nomic-embed-text"):
            self.model = model
        
        def __call__(self, input):
            embeddings = []
            for text in input:
                embedding = get_ollama_embedding(text, self.model)
                if embedding:
                    embeddings.append(embedding)
                else:
                    embeddings.append([0.0] * 768)
            return embeddings
        
        def name(self):
            return f"ollama-{self.model}"
    
    embedding_function = OllamaEmbeddingFunction("nomic-embed-text")
    
    # Create test collection
    try:
        collection = client.create_collection(
            name="test_products",
            embedding_function=embedding_function,
            metadata={"hnsw:space": "cosine"}
        )
        print("✅ Test collection created successfully")
    except Exception as e:
        print(f"Using existing collection: {e}")
        collection = client.get_collection(
            name="test_products",
            embedding_function=embedding_function
        )
    
    # Add test products
    test_products = df['Product Name'].tolist()
    processed_products = []
    
    print("Processing products for ChromaDB...")
    for product in test_products:
        processed = preprocess_with_llm(product)
        processed_products.append(processed)
        print(f"   {product} → {processed}")
        time.sleep(0.5)
    
    # Add to collection
    collection.add(
        documents=processed_products,
        metadatas=[{"original": p, "processed": proc} for p, proc in zip(test_products, processed_products)],
        ids=[f"test_{i}" for i in range(len(test_products))]
    )
    print(f"✅ Added {len(test_products)} products to ChromaDB")
    
    # Test query
    query_text = "Coca Cola 330ml"
    results = collection.query(
        query_texts=[query_text],
        n_results=3,
        include=['metadatas', 'distances']
    )
    
    print(f"\n🔍 Query results for '{query_text}':")
    for i, (metadata, distance) in enumerate(zip(results['metadatas'][0], results['distances'][0])):
        similarity = 1 - distance
        print(f"   {i+1}. {metadata['original']} (similarity: {similarity:.3f})")
    
    # Clean up
    client.delete_collection("test_products")
    print("✅ Test collection cleaned up")
    
except Exception as e:
    print(f"❌ ChromaDB test failed: {e}")

print("\n🎉 Small test completed!")
print("=" * 50) 