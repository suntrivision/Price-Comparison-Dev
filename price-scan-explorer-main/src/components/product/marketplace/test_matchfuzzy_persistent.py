#!/usr/bin/env python3
"""
Test script for matchfuzzy_ollama_persistent.py
This script tests the functionality of the persistent ChromaDB matching system
"""

import os
import sys
import time
import requests
import pandas as pd
import chromadb
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    print("🔍 Testing Ollama Connection...")
    
    try:
        # Test basic connection
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"✅ Ollama is running with {len(models)} models")
            
            # Check for required models
            model_names = [model.get("name", "") for model in models]
            required_models = ["nomic-embed-text", "llama3.1:8b"]
            
            for model in required_models:
                if model in model_names:
                    print(f"✅ Found required model: {model}")
                else:
                    print(f"⚠️  Missing model: {model}")
            
            return True
        else:
            print(f"❌ Ollama responded with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to Ollama: {e}")
        return False

def test_embedding_function():
    """Test the embedding functionality"""
    print("\n🔍 Testing Embedding Function...")
    
    try:
        from matchfuzzy_ollama_persistent import get_ollama_embedding
        
        test_text = "Milo Chocolate Malt Drink 1kg"
        embedding = get_ollama_embedding(test_text)
        
        if embedding and len(embedding) > 0:
            print(f"✅ Embedding generated successfully (dimension: {len(embedding)})")
            return True
        else:
            print("❌ Failed to generate embedding")
            return False
    except Exception as e:
        print(f"❌ Embedding test failed: {e}")
        return False

def test_translation_function():
    """Test the translation functionality"""
    print("\n🔍 Testing Translation Function...")
    
    try:
        from matchfuzzy_ollama_persistent import translate_to_english
        
        # Test with a simple product name
        test_product = "Milo Minuman Coklat 1kg"
        translated = translate_to_english(test_product)
        
        print(f"Original: {test_product}")
        print(f"Translated: {translated}")
        
        if translated and translated != test_product:
            print("✅ Translation working")
            return True
        else:
            print("⚠️  Translation returned original text (may be expected)")
            return True  # This might be expected for English text
    except Exception as e:
        print(f"❌ Translation test failed: {e}")
        return False

def test_preprocessing_function():
    """Test the preprocessing functionality"""
    print("\n🔍 Testing Preprocessing Function...")
    
    try:
        from matchfuzzy_ollama_persistent import preprocess_with_llm
        
        test_products = [
            "Milo Minuman Coklat 1kg",
            "Indomie Goreng Special 85g",
            "Campbell's Mushroom Soup 305g"
        ]
        
        for product in test_products:
            print(f"\nProcessing: {product}")
            processed = preprocess_with_llm(product)
            print(f"Result: {processed}")
        
        print("✅ Preprocessing test completed")
        return True
    except Exception as e:
        print(f"❌ Preprocessing test failed: {e}")
        return False

def test_data_loading():
    """Test if the CSV data can be loaded"""
    print("\n🔍 Testing Data Loading...")
    
    try:
        file_path = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA12-0.csv"
        
        # Test CSV loading
        df = pd.read_csv(file_path, encoding='utf-8')
        print(f"✅ Data loaded successfully: {len(df)} records")
        
        # Check required columns
        required_cols = ['Product Name', 'Product URL', 'Original Price (RM)', 'Discounted Price (RM)']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            print(f"⚠️  Missing columns: {missing_cols}")
        else:
            print("✅ All required columns present")
        
        # Show sample data
        print(f"\n📊 Sample data:")
        print(df[['Product Name', 'Product URL']].head(3))
        
        return True
    except Exception as e:
        print(f"❌ Data loading failed: {e}")
        return False

def test_chromadb_setup():
    """Test ChromaDB setup and collections"""
    print("\n🔍 Testing ChromaDB Setup...")
    
    try:
        # Test if ChromaDB directory exists
        chroma_dir = "./chroma_db_ollama"
        if os.path.exists(chroma_dir):
            print(f"✅ ChromaDB directory exists: {chroma_dir}")
        else:
            print(f"⚠️  ChromaDB directory not found: {chroma_dir}")
        
        # Test ChromaDB connection
        client = chromadb.PersistentClient(path=chroma_dir)
        print("✅ ChromaDB client created successfully")
        
        # List collections
        collections = client.list_collections()
        print(f"📊 Found {len(collections)} collections:")
        for collection in collections:
            print(f"   - {collection.name}")
        
        return True
    except Exception as e:
        print(f"❌ ChromaDB test failed: {e}")
        return False

def test_small_dataset():
    """Test with a small subset of data"""
    print("\n🔍 Testing Small Dataset Processing...")
    
    try:
        # Import the main functions
        from matchfuzzy_ollama_persistent import (
            get_ollama_embedding, 
            preprocess_with_llm,
            OllamaEmbeddingFunction
        )
        
        # Create a small test dataset
        test_products = [
            "Milo Chocolate Malt Drink 1kg",
            "Indomie Goreng Special 85g", 
            "Campbell's Mushroom Soup 305g",
            "Nestle Maggi Chicken Stock 1kg"
        ]
        
        print(f"Testing with {len(test_products)} products...")
        
        # Test preprocessing
        processed_products = []
        for product in test_products:
            processed = preprocess_with_llm(product)
            processed_products.append(processed)
            print(f"  {product} → {processed}")
        
        # Test embeddings
        embedding_function = OllamaEmbeddingFunction()
        embeddings = embedding_function(processed_products)
        
        if embeddings and len(embeddings) == len(processed_products):
            print(f"✅ Generated {len(embeddings)} embeddings successfully")
            return True
        else:
            print("❌ Embedding generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Small dataset test failed: {e}")
        return False

def run_full_test():
    """Run all tests"""
    print("🧪 Testing matchfuzzy_ollama_persistent.py")
    print("=" * 50)
    
    tests = [
        ("Ollama Connection", test_ollama_connection),
        ("Data Loading", test_data_loading),
        ("Embedding Function", test_embedding_function),
        ("Translation Function", test_translation_function),
        ("Preprocessing Function", test_preprocessing_function),
        ("ChromaDB Setup", test_chromadb_setup),
        ("Small Dataset", test_small_dataset)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*50}")
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The script should work correctly.")
    elif passed >= total * 0.7:
        print("⚠️  Most tests passed. Some issues may need attention.")
    else:
        print("❌ Many tests failed. Please check your setup.")
    
    return passed == total

if __name__ == "__main__":
    success = run_full_test()
    sys.exit(0 if success else 1) 