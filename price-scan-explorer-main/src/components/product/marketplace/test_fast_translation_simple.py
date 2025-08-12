#!/usr/bin/env python3
"""
Simple test to verify fast translation is working
"""

import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_fast_translation():
    print("🧪 Testing Fast Translation System")
    print("=" * 50)
    
    try:
        from fast_translation import fast_translate, get_cache_stats
        print("✅ Fast translation system loaded successfully")
        
        # Test with your actual product names
        test_products = [
            "paha ayam sejuk beku 2kg",
            "ikan siakap m (400gm - 600gm / ekor)",
            "value ikan sardin dalam sos tomato asli / bercili 24 x 200gm - 425gm",
            "lotus's krimer manis / sejat 48 x 390gm - 500gm"
        ]
        
        print(f"📝 Testing translation of {len(test_products)} products:")
        for i, product in enumerate(test_products, 1):
            print(f"  {i}. {product}")
        
        print("\n🚀 Starting translation...")
        results = fast_translate(test_products)
        
        print("\n✅ Translation Results:")
        for i, (original, translated) in enumerate(zip(test_products, results), 1):
            print(f"  {i}. {original}")
            print(f"     → {translated}")
            print()
        
        # Show cache stats
        stats = get_cache_stats()
        print(f"📊 Cache Statistics:")
        print(f"  Cache size: {stats['cache_size']} entries")
        print(f"  Cache file: {stats['cache_file']}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Fast translation not available: {e}")
        return False
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return False

if __name__ == "__main__":
    success = test_fast_translation()
    if success:
        print("\n🎉 Fast translation is working correctly!")
    else:
        print("\n❌ Fast translation has issues that need to be fixed.") 