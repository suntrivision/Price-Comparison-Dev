#!/usr/bin/env python3
"""
Large Dataset Performance Test
Test fast translation with realistic dataset sizes
"""

import time
import random
from fast_translation import fast_translate, clear_cache, get_cache_stats
import requests

def generate_test_dataset(size=100):
    """Generate a realistic test dataset of Malay/Indonesian product names"""
    
    # Common product components
    products = [
        "paha ayam sejuk beku", "susu segar", "nasi putih", "minyak masak", 
        "gula putih", "garam halus", "air mineral", "jus oren", "kopi hitam", 
        "teh hijau", "roti putih", "telur ayam", "daging lembu", "ikan salmon",
        "sayur bayam", "buah epal", "biskut coklat", "gula-gula", "ais krim",
        "sos tomato", "kicap manis", "cuka putih", "serbuk lada", "bawang putih",
        "halia segar", "kunyit", "serai", "daun pandan", "kelapa parut",
        "tepung gandum", "beras basmati", "mi segera", "sardin dalam tin",
        "susu pekat manis", "mentega", "keju cheddar", "yogurt plain",
        "jus epal", "air kelapa", "soda limau", "bir tempatan"
    ]
    
    weights = ["100g", "200g", "250g", "500g", "1kg", "2kg", "5kg"]
    volumes = ["250ml", "500ml", "1 liter", "1.5 liter", "2 liter"]
    
    dataset = []
    for i in range(size):
        product = random.choice(products)
        if "susu" in product or "jus" in product or "air" in product:
            weight_vol = random.choice(volumes)
        else:
            weight_vol = random.choice(weights)
        
        item = f"{product} {weight_vol}"
        dataset.append(item)
    
    return dataset

def test_old_method(dataset):
    """Simulate the old slow translation method"""
    print("🐌 Old Method (Sequential Processing):")
    print("-" * 40)
    
    start_time = time.time()
    results = []
    
    for i, product in enumerate(dataset):
        if i % 10 == 0:  # Progress indicator
            print(f"  Processing {i+1}/{len(dataset)}...")
        
        # Simulate old translation method
        prompt = f"Translate this to English: {product}"
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "phi3:mini",  # Use same model for fair comparison
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()["response"].strip()
                results.append(result if result and result != product else product)
            else:
                results.append(product)
                
        except Exception as e:
            results.append(product)
    
    total_time = time.time() - start_time
    print(f"⏱️  Old method completed in {total_time:.2f}s")
    print(f"📊 Speed: {len(dataset)/total_time:.1f} texts/sec")
    
    return results, total_time

def test_new_method(dataset):
    """Test the new fast translation method"""
    print("\n🚀 New Method (Fast Translation):")
    print("-" * 40)
    
    # Clear cache for fair comparison
    clear_cache()
    
    start_time = time.time()
    results = fast_translate(dataset)
    total_time = time.time() - start_time
    
    print(f"⏱️  New method completed in {total_time:.2f}s")
    print(f"📊 Speed: {len(dataset)/total_time:.1f} texts/sec")
    
    return results, total_time

def test_cached_performance(dataset):
    """Test performance with caching"""
    print("\n🔥 Cached Performance Test:")
    print("-" * 40)
    
    start_time = time.time()
    results = fast_translate(dataset)  # Should use cache
    total_time = time.time() - start_time
    
    print(f"⏱️  Cached run completed in {total_time:.2f}s")
    print(f"📊 Speed: {len(dataset)/total_time:.1f} texts/sec")
    
    return results, total_time

def main():
    print("🏁 Large Dataset Performance Test")
    print("=" * 50)
    
    # Test with different dataset sizes
    dataset_sizes = [50, 100, 200]
    
    for size in dataset_sizes:
        print(f"\n📊 Testing with {size} products")
        print("=" * 30)
        
        # Generate test dataset
        dataset = generate_test_dataset(size)
        
        # Test old method
        old_results, old_time = test_old_method(dataset)
        
        # Test new method
        new_results, new_time = test_new_method(dataset)
        
        # Test cached performance
        cached_results, cached_time = test_cached_performance(dataset)
        
        # Performance comparison
        print(f"\n📈 Performance Summary ({size} products):")
        print("-" * 40)
        print(f"Old Method:     {old_time:.2f}s ({size/old_time:.1f} texts/sec)")
        print(f"New Method:     {new_time:.2f}s ({size/new_time:.1f} texts/sec)")
        print(f"Cached Method:  {cached_time:.2f}s ({size/cached_time:.1f} texts/sec)")
        
        if new_time > 0:
            speedup = old_time / new_time
            print(f"🚀 New method is {speedup:.1f}x faster")
        
        if cached_time > 0:
            cache_speedup = old_time / cached_time
            print(f"🔥 Cached method is {cache_speedup:.1f}x faster")
        
        # Show sample results
        print(f"\n📋 Sample Results:")
        for i in range(min(5, len(dataset))):
            print(f"  {i+1}. {dataset[i][:25]:<25} → {new_results[i][:25]}")
        
        # Cache statistics
        stats = get_cache_stats()
        print(f"\n📊 Cache Statistics:")
        print(f"  Cache size: {stats['cache_size']} entries")
        
        print("\n" + "="*50)

def estimate_real_world_performance():
    """Estimate performance for real-world scenarios"""
    print("\n🌍 Real-World Performance Estimates:")
    print("=" * 40)
    
    scenarios = [
        (1000, "Small dataset"),
        (5000, "Medium dataset"), 
        (10000, "Large dataset"),
        (50000, "Very large dataset")
    ]
    
    for size, description in scenarios:
        print(f"\n📊 {description} ({size:,} products):")
        
        # Estimate times based on observed performance
        old_time_estimate = size / 0.5  # 0.5 texts/sec (observed)
        new_time_estimate = size / 2.0  # 2.0 texts/sec (estimated with phi3:mini)
        cached_time_estimate = size / 1000.0  # 1000 texts/sec (cached)
        
        print(f"  Old method:     {old_time_estimate/60:.1f} minutes")
        print(f"  New method:     {new_time_estimate/60:.1f} minutes")
        print(f"  Cached method:  {cached_time_estimate:.1f} seconds")
        
        speedup = old_time_estimate / new_time_estimate
        print(f"  🚀 Speed improvement: {speedup:.1f}x faster")

if __name__ == "__main__":
    main()
    estimate_real_world_performance() 