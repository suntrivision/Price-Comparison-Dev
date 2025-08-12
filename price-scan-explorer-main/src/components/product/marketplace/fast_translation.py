#!/usr/bin/env python3
"""
Fast Translation Module for EC2
Optimized for performance with caching, batching, and smaller models
"""

import requests
import json
import time
import hashlib
import pickle
import os
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
FAST_MODEL = "phi3:mini"  # 2.2GB - much faster than llama3.1:8b
FALLBACK_MODEL = "phi3:mini"  # Fallback for complex translations
EMBEDDING_MODEL = "nomic-embed-text:latest"

# Performance settings
BATCH_SIZE = 3  # Even smaller batches for better stability
MAX_WORKERS = 1  # Single worker to avoid overwhelming the model
CACHE_FILE = "translation_cache.pkl"
REQUEST_TIMEOUT = 180  # 3 minutes timeout for slower models

# Test mode settings
TEST_MODE = True  # Set to False for full processing
MAX_TEST_PRODUCTS = 20  # Maximum products to process in test mode

# Thread-safe cache
_cache_lock = threading.Lock()
_translation_cache = {}

class FastTranslator:
    """High-performance translation with caching and batching"""
    
    def __init__(self, use_cache=True, batch_size=BATCH_SIZE):
        self.use_cache = use_cache
        self.batch_size = batch_size
        self.cache_file = CACHE_FILE
        self.session = requests.Session()
        # Set session timeout to match REQUEST_TIMEOUT
        self.session.timeout = REQUEST_TIMEOUT
        
        # Load cache if enabled
        if self.use_cache:
            self._load_cache()
    
    def _load_cache(self):
        """Load translation cache from disk"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'rb') as f:
                    with _cache_lock:
                        _translation_cache.update(pickle.load(f))
                print(f"✅ Loaded {len(_translation_cache)} cached translations")
        except Exception as e:
            print(f"⚠️  Could not load cache: {e}")
    
    def _save_cache(self):
        """Save translation cache to disk"""
        try:
            with _cache_lock:
                with open(self.cache_file, 'wb') as f:
                    pickle.dump(_translation_cache, f)
        except Exception as e:
            print(f"⚠️  Could not save cache: {e}")
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    def _is_english(self, text: str) -> bool:
        """Quick check if text is already in English"""
        if len(text) < 3:
            return True
        
        # Common English words in product names
        english_words = {
            'milk', 'bread', 'rice', 'oil', 'sugar', 'salt', 'water', 'juice', 
            'coffee', 'tea', 'cream', 'soup', 'noodles', 'chocolate', 'honey', 
            'powder', 'drink', 'liquid', 'detergent', 'stain', 'buster', 
            'blue', 'red', 'green', 'yellow', 'white', 'black', 'fresh', 
            'organic', 'natural', 'premium', 'quality', 'brand', 'original',
            'kg', 'liter', 'pack', 'piece', 'bottle', 'can', 'box', 'bag'
        }
        
        # Check for non-English characters (Malay/Indonesian)
        malay_indicators = ['ayam', 'susu', 'nasi', 'minyak', 'gula', 'garam', 
                           'air', 'jus', 'kopi', 'teh', 'sejuk', 'beku', 'segar',
                           'putih', 'halus', 'mineral', 'oren', 'hitam', 'hijau']
        
        text_lower = text.lower()
        
        # If text contains Malay words, it's not English
        if any(word in text_lower for word in malay_indicators):
            return False
        
        # If text contains English words, it might be English
        if any(word in text_lower for word in english_words):
            return True
        
        # Default: assume it needs translation
        return False
    
    def _translate_single(self, text: str, model: str = FAST_MODEL) -> str:
        """Translate a single text using specified model with retry logic"""
        if self._is_english(text):
            return text
        
        # Check if model is available
        try:
            response = self.session.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m.get('name', '') for m in models]
                if model not in model_names:
                    print(f"    → Model {model} not available, using fallback")
                    model = FALLBACK_MODEL
        except:
            print(f"    → Cannot check model availability, using {model}")
        
        cache_key = self._get_cache_key(text)
        
        # Check cache first
        with _cache_lock:
            if cache_key in _translation_cache:
                return _translation_cache[cache_key]
        
        # Better prompt for product translation
        prompt = f"Translate this product name to English. Keep brand names unchanged. Product: {text}. Rules: Keep brand names unchanged, translate descriptive words to English, keep measurements unchanged. Return only the translation."
        
        # Retry logic
        for attempt in range(3):
            try:
                response = self.session.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "num_predict": 50,  # Limit response length
                            "temperature": 0.1,  # Lower temperature for consistency
                            "top_p": 0.9,
                            "repeat_penalty": 1.1
                        }
                    },
                    timeout=REQUEST_TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()["response"].strip()
                    if result and result != text:
                        # Cache the result
                        with _cache_lock:
                            _translation_cache[cache_key] = result
                        return result
                    else:
                        # Cache the original if no translation needed
                        with _cache_lock:
                            _translation_cache[cache_key] = text
                        return text
                else:
                    print(f"    → Translation failed (attempt {attempt + 1}): {response.status_code}")
                    if attempt < 2:
                        time.sleep(2)  # Wait before retry
                        continue
                    return text
                    
            except requests.exceptions.Timeout:
                print(f"    → Translation timeout (attempt {attempt + 1}): Model taking too long to respond")
                if attempt < 2:
                    time.sleep(5)  # Longer wait for timeout
                    continue
                return text
            except Exception as e:
                print(f"    → Translation error (attempt {attempt + 1}): {e}")
                if attempt < 2:
                    time.sleep(2)  # Wait before retry
                    continue
                return text
        
        return text
    
    def _translate_batch(self, texts: List[str]) -> List[str]:
        """Translate a batch of texts sequentially for better stability"""
        results = []
        
        for i, text in enumerate(texts):
            try:
                result = self._translate_single(text)
                results.append(result)
                print(f"      → {text[:30]:<30} → {result[:30]}")
                
                # Small delay between translations to prevent overwhelming the model
                if i < len(texts) - 1:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"    → Translation error at index {i}: {e}")
                results.append(text)  # Use original text as fallback
        
        return results
    
    def translate(self, texts: List[str]) -> List[str]:
        """Translate a list of texts with batching and caching"""
        if not texts:
            return []
        
        # Apply test mode limit
        if TEST_MODE and len(texts) > MAX_TEST_PRODUCTS:
            print(f"🧪 TEST MODE: Limiting to {MAX_TEST_PRODUCTS} products (from {len(texts)})")
            texts = texts[:MAX_TEST_PRODUCTS]
        
        print(f"🚀 Translating {len(texts)} texts with FastTranslator...")
        start_time = time.time()
        
        # Process in batches
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            print(f"    Processing batch {i//self.batch_size + 1}/{(len(texts) + self.batch_size - 1)//self.batch_size}")
            
            batch_results = self._translate_batch(batch)
            results.extend(batch_results)
        
        # Save cache periodically
        if self.use_cache and len(_translation_cache) % 100 == 0:
            self._save_cache()
        
        elapsed = time.time() - start_time
        if elapsed > 0:
            print(f"✅ Translation completed in {elapsed:.2f}s ({len(texts)/elapsed:.1f} texts/sec)")
        else:
            print(f"✅ Translation completed in {elapsed:.2f}s (instant)")
        
        return results
    
    def translate_single(self, text: str) -> str:
        """Translate a single text"""
        return self.translate([text])[0]

def create_fast_translator(use_cache=True, batch_size=BATCH_SIZE) -> FastTranslator:
    """Factory function to create a FastTranslator instance"""
    return FastTranslator(use_cache=use_cache, batch_size=batch_size)

# Global translator instance for easy access
_translator = None

def get_translator() -> FastTranslator:
    """Get or create the global translator instance"""
    global _translator
    if _translator is None:
        _translator = create_fast_translator()
    return _translator

def fast_translate(texts: List[str]) -> List[str]:
    """Fast translation function for multiple texts"""
    return get_translator().translate(texts)

def fast_translate_single(text: str) -> str:
    """Fast translation function for single text"""
    return get_translator().translate_single(text)

# Performance monitoring
def get_cache_stats() -> Dict:
    """Get translation cache statistics"""
    with _cache_lock:
        return {
            'cache_size': len(_translation_cache),
            'cache_file': CACHE_FILE,
            'cache_enabled': True
        }

def clear_cache():
    """Clear the translation cache"""
    global _translation_cache
    with _cache_lock:
        _translation_cache.clear()
    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE)
    print("✅ Translation cache cleared")

def set_test_mode(enabled: bool, max_products: int = 20):
    """Set test mode configuration"""
    global TEST_MODE, MAX_TEST_PRODUCTS
    TEST_MODE = enabled
    MAX_TEST_PRODUCTS = max_products
    mode = "TEST" if enabled else "FULL"
    print(f"✅ Fast translation set to {mode} MODE (max {MAX_TEST_PRODUCTS} products)")

# Test function
def test_fast_translation():
    """Test the fast translation system"""
    print("🧪 Testing Fast Translation System")
    print("=" * 50)
    
    # Show test mode configuration
    if TEST_MODE:
        print(f"🧪 TEST MODE: Enabled (max {MAX_TEST_PRODUCTS} products)")
    else:
        print("🚀 FULL MODE: Processing all products")
    print(f"⚙️  Batch size: {BATCH_SIZE}")
    print(f"⏱️  Timeout: {REQUEST_TIMEOUT}s")
    print()
    
    test_products = [
        "paha ayam sejuk beku 2kg",
        "susu segar 1 liter", 
        "nasi putih 5kg",
        "minyak masak 2 liter",
        "gula putih 1kg",
        "garam halus 500g",
        "air mineral 1.5 liter",
        "jus oren 1 liter",
        "kopi hitam 200g",
        "teh hijau 100g"
    ]
    
    translator = create_fast_translator()
    
    print(f"📊 Testing with {len(test_products)} products")
    print(f"🔧 Using model: {FAST_MODEL}")
    print(f"⚡ Batch size: {BATCH_SIZE}")
    print(f"🔄 Max workers: {MAX_WORKERS}")
    print()
    
    # First run (cold start)
    print("🔥 First run (cold start):")
    start_time = time.time()
    results1 = translator.translate(test_products)
    first_run_time = time.time() - start_time
    
    print(f"\n⏱️  First run completed in {first_run_time:.2f}s")
    
    # Second run (with cache)
    print("\n🔥 Second run (with cache):")
    start_time = time.time()
    results2 = translator.translate(test_products)
    second_run_time = time.time() - start_time
    
    print(f"\n⏱️  Second run completed in {second_run_time:.2f}s")
    if second_run_time > 0:
        print(f"🚀 Speed improvement: {first_run_time/second_run_time:.1f}x faster")
    else:
        print(f"🚀 Speed improvement: Instant (cached)")
    
    # Show results
    print("\n📋 Translation Results:")
    for i, (original, translated) in enumerate(zip(test_products, results1)):
        print(f"  {i+1:2d}. {original[:30]:<30} → {translated[:30]}")
    
    # Cache stats
    stats = get_cache_stats()
    print(f"\n📊 Cache Statistics:")
    print(f"  Cache size: {stats['cache_size']} entries")
    print(f"  Cache file: {stats['cache_file']}")
    
    return results1

if __name__ == "__main__":
    test_fast_translation() 