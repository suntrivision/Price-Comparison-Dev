#!/usr/bin/env python3
"""
Performance Comparison: Old vs New Translation Methods
"""

import time
import requests
from fast_translation import fast_translate, clear_cache

def old_translate_method(text):
    """Simulate the old slow translation method"""
    prompt = f"Translate this to English: {text}"
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            return result if result and result != text else text
        else:
            return text
            
    except Exception as e:
        return text

def compare_methods():
    """Compare old vs new translation methods"""
    print("🏁 Performance Comparison: Old vs New Translation Methods")
    print("=" * 60)
    
    test_products = [
        "paha ayam sejuk beku 2kg",
        "susu segar 1 liter",
        "nasi putih 5kg",
        "minyak masak 2 liter",
        "gula putih 1kg"
    ]
    
    print(f"📊 Testing with {len(test_products)} products")
    print()
    
    # Test old method (sequential)
    print("🐌 Old Method (Sequential):")
    print("-" * 30)
    start_time = time.time()
    old_results = []
    for i, product in enumerate(test_products):
        print(f"  {i+1}. Translating: {product[:25]:<25}...")
        result = old_translate_method(product)
        old_results.append(result)
        print(f"     → {result[:30]}")
    
    old_time = time.time() - start_time
    print(f"⏱️  Old method completed in {old_time:.2f}s")
    print()
    
    # Test new method (fast translation)
    print("🚀 New Method (Fast Translation):")
    print("-" * 30)
    clear_cache()  # Clear cache for fair comparison
    
    start_time = time.time()
    new_results = fast_translate(test_products)
    new_time = time.time() - start_time
    
    print(f"⏱️  New method completed in {new_time:.2f}s")
    print()
    
    # Show results comparison
    print("📋 Results Comparison:")
    print("-" * 30)
    for i, (old_result, new_result) in enumerate(zip(old_results, new_results)):
        print(f"  {i+1}. {test_products[i][:20]:<20}")
        print(f"     Old: {old_result[:30]}")
        print(f"     New: {new_result[:30]}")
        print()
    
    # Performance summary
    print("📈 Performance Summary:")
    print("=" * 30)
    print(f"Old Method:  {old_time:.2f}s ({len(test_products)/old_time:.1f} texts/sec)")
    print(f"New Method:  {new_time:.2f}s ({len(test_products)/new_time:.1f} texts/sec)")
    
    if new_time > 0:
        speedup = old_time / new_time
        print(f"🚀 Speed Improvement: {speedup:.1f}x faster")
    
    # Test cache performance
    print("\n🔥 Cache Performance Test:")
    print("-" * 30)
    start_time = time.time()
    cached_results = fast_translate(test_products)  # Should use cache
    cached_time = time.time() - start_time
    
    print(f"⏱️  Cached run completed in {cached_time:.2f}s")
    if cached_time > 0:
        cache_speedup = old_time / cached_time
        print(f"🚀 Cache Speed Improvement: {cache_speedup:.1f}x faster")
    
    # Recommendations
    print("\n💡 Recommendations:")
    print("-" * 30)
    print("✅ Use fast_translate() for batch processing")
    print("✅ Enable caching for repeated translations")
    print("✅ Consider phi3:mini model for even faster processing")
    print("✅ Use concurrent processing for large datasets")

if __name__ == "__main__":
    compare_methods() 