#!/usr/bin/env python3
"""
Test script that runs the actual matching process with a small sample
This helps verify the complete workflow without processing the full dataset
"""

import pandas as pd
import chromadb
import time
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_small_matching_sample():
    """Test the matching process with a small sample of data"""
    print("🧪 Testing Small Matching Sample")
    print("=" * 50)
    
    try:
        # Load a small sample from the CSV
        file_path = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA12-0.csv"
        
        print("📥 Loading data sample...")
        df_combined = pd.read_csv(file_path, encoding='utf-8')
        
        # Take only first 10 records for testing
        df_sample = df_combined.head(10).copy()
        
        print(f"📊 Sample size: {len(df_sample)} records")
        
        # Process the sample like the main script
        df_sample['Product Name Normalized'] = df_sample['Product Name'].astype(str).str.lower().str.strip()
        df_sample['Product URL Original'] = df_sample['Product URL'].astype(str).str.strip()
        df_sample['Product URL Normalized'] = df_sample['Product URL'].astype(str).str.lower().str.strip()
        df_sample['Current Price (RM)'] = df_sample['Discounted Price (RM)'].fillna(df_sample['Original Price (RM)'])
        
        # Detect marketplace
        df_sample['Marketplace'] = df_sample['Product URL Normalized'].apply(lambda url: 
            'lotus' if 'lotus' in url else 
            'shopee' if 'shopee' in url else 
            'unknown'
        )
        
        print(f"🔍 Marketplace distribution in sample:")
        print(df_sample['Marketplace'].value_counts())
        
        # Split by marketplace
        lotus_sample = df_sample[df_sample['Marketplace'] == 'lotus'].copy()
        shopee_sample = df_sample[df_sample['Marketplace'] == 'shopee'].copy()
        
        print(f"🪷 Lotus products in sample: {len(lotus_sample)}")
        print(f"🛍️ Shopee products in sample: {len(shopee_sample)}")
        
        # Test preprocessing on sample
        from matchfuzzy_ollama_persistent import preprocess_with_llm
        
        print("\n🔍 Testing preprocessing on sample products...")
        
        all_products = []
        if len(lotus_sample) > 0:
            all_products.extend(lotus_sample['Product Name'].tolist())
        if len(shopee_sample) > 0:
            all_products.extend(shopee_sample['Product Name'].tolist())
        
        # Test preprocessing on first 3 products
        test_products = all_products[:3] if len(all_products) >= 3 else all_products
        
        for i, product in enumerate(test_products):
            print(f"\nProcessing product {i+1}: {product}")
            try:
                processed = preprocess_with_llm(product)
                print(f"  → Processed: {processed}")
            except Exception as e:
                print(f"  ❌ Error: {e}")
        
        # Test ChromaDB setup
        print("\n🔍 Testing ChromaDB setup...")
        
        client = chromadb.PersistentClient(path="./chroma_db_ollama")
        
        # Create test collections
        test_collection_name = "test_products_sample"
        
        try:
            # Delete test collection if it exists
            try:
                client.delete_collection(test_collection_name)
                print(f"🗑️  Deleted existing test collection: {test_collection_name}")
            except:
                pass
            
            # Create new test collection
            from matchfuzzy_ollama_persistent import OllamaEmbeddingFunction
            embedding_function = OllamaEmbeddingFunction()
            
            test_collection = client.create_collection(
                name=test_collection_name,
                embedding_function=embedding_function,
                metadata={"hnsw:space": "cosine"}
            )
            print(f"✅ Created test collection: {test_collection_name}")
            
            # Add sample products to test collection
            if len(test_products) > 0:
                print(f"\n📥 Adding {len(test_products)} products to test collection...")
                
                documents = []
                metadatas = []
                ids = []
                
                for i, product in enumerate(test_products):
                    try:
                        processed = preprocess_with_llm(product)
                        
                        documents.append(processed)
                        metadatas.append({
                            'original_name': product,
                            'processed_name': processed,
                            'test_id': i,
                            'marketplace': 'test'
                        })
                        ids.append(f"test_{i}")
                        
                        print(f"  Added: {processed[:50]}...")
                        
                        # Small delay to prevent overwhelming Ollama
                        time.sleep(0.5)
                        
                    except Exception as e:
                        print(f"  ❌ Error processing product {i}: {e}")
                
                if documents:
                    test_collection.add(
                        documents=documents,
                        metadatas=metadatas,
                        ids=ids
                    )
                    print(f"✅ Added {len(documents)} products to test collection")
                    
                    # Test search functionality
                    print("\n🔍 Testing search functionality...")
                    if len(documents) > 0:
                        query = "milo drink"
                        results = test_collection.query(
                            query_texts=[query],
                            n_results=2
                        )
                        
                        print(f"Search query: '{query}'")
                        print("Results:")
                        for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
                            print(f"  {i+1}. {doc}")
                            print(f"     Original: {metadata['original_name']}")
            
            # Clean up test collection
            client.delete_collection(test_collection_name)
            print(f"🗑️  Cleaned up test collection: {test_collection_name}")
            
        except Exception as e:
            print(f"❌ ChromaDB test failed: {e}")
            return False
        
        print("\n✅ Small matching sample test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Small matching sample test failed: {e}")
        return False

def test_config_import():
    """Test if the configuration can be imported correctly"""
    print("🔍 Testing Configuration Import...")
    
    try:
        # Test importing the config
        from matchfuzzy_ollama_persistent import (
            OLLAMA_BASE_URL,
            EMBEDDING_MODEL,
            LLM_MODEL
        )
        
        print(f"✅ Configuration imported successfully:")
        print(f"   Ollama URL: {OLLAMA_BASE_URL}")
        print(f"   Embedding Model: {EMBEDDING_MODEL}")
        print(f"   LLM Model: {LLM_MODEL}")
        
        return True
    except Exception as e:
        print(f"❌ Configuration import failed: {e}")
        return False

def main():
    """Run the small matching test"""
    print("🧪 Testing matchfuzzy_ollama_persistent.py - Small Sample")
    print("=" * 60)
    
    tests = [
        ("Configuration Import", test_config_import),
        ("Small Matching Sample", test_small_matching_sample)
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
    print(f"\n{'='*60}")
    print("📊 SMALL SAMPLE TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The script is ready for full dataset processing.")
        print("\n💡 Next steps:")
        print("1. Run the full script: python3 matchfuzzy_ollama_persistent.py")
        print("2. Monitor the progress and check for any errors")
        print("3. Verify the ChromaDB collections are created successfully")
    else:
        print("❌ Some tests failed. Please fix the issues before running the full script.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 