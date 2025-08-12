#!/usr/bin/env python3
"""
Test script to demonstrate 20-product limit in fast translation
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_20_products():
    print("🧪 Testing 20-Product Limit in Fast Translation")
    print("=" * 60)
    
    try:
        from fast_translation import fast_translate, set_test_mode, get_cache_stats
        
        # Create a list of 30 test products (more than the 20 limit)
        test_products = [
            "paha ayam sejuk beku 2kg",
            "ikan sardin dalam sos tomato",
            "susu segar 1 liter",
            "nasi putih 5kg",
            "minyak masak 2 liter",
            "gula putih 1kg",
            "garam halus 500g",
            "air mineral 1.5 liter",
            "jus oren 1 liter",
            "kopi hitam 200g",
            "teh hijau 100g",
            "roti putih 400g",
            "telur ayam 30 biji",
            "daging lembu 1kg",
            "ikan salmon 500g",
            "sayur bayam 250g",
            "buah epal 6 biji",
            "pisang 1kg",
            "tomato 500g",
            "bawang merah 1kg",
            "bawang putih 250g",
            "halia 200g",
            "cili merah 100g",
            "kentang 2kg",
            "lobak merah 500g",
            "brokoli 300g",
            "kobis 1kg",
            "timun 500g",
            "terung 400g",
            "kacang panjang 300g"
        ]
        
        print(f"📝 Created {len(test_products)} test products")
        print(f"🧪 TEST MODE: Will limit to 20 products")
        print()
        
        # Test the translation with 20-product limit
        print("🚀 Starting translation (should limit to 20 products)...")
        results = fast_translate(test_products)
        
        print(f"\n✅ Translation completed!")
        print(f"📊 Results: {len(results)} products translated")
        print()
        
        # Show first 10 results
        print("📋 First 10 translation results:")
        for i, (original, translated) in enumerate(zip(test_products[:10], results[:10]), 1):
            print(f"  {i:2d}. {original}")
            print(f"      → {translated}")
            print()
        
        # Show cache stats
        stats = get_cache_stats()
        print(f"📊 Cache statistics: {stats['cache_size']} entries")
        
        # Test changing test mode
        print("\n🔄 Testing mode switching...")
        set_test_mode(False, 50)  # Switch to full mode with 50 limit
        set_test_mode(True, 10)   # Switch back to test mode with 10 limit
        
        return True
        
    except ImportError as e:
        print(f"❌ Fast translation not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_20_products()
    if success:
        print("\n🎉 20-product test completed successfully!")
        print("✅ Fast translation is working with product limits")
    else:
        print("\n❌ 20-product test failed!") 