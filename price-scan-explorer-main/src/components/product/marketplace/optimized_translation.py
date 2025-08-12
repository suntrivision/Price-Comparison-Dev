#!/usr/bin/env python3
"""
Optimized Translation Function
Based on the working EC2 test approach
"""

import requests
import json
import time
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
    print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
    print(f"📝 LLM Model: {LLM_MODEL}")
    print(f"🔍 Embedding Model: {EMBEDDING_MODEL}")
except ImportError:
    print("⚠️  No ollama_config.py found, using localhost defaults")
    OLLAMA_BASE_URL = "http://localhost:11434"
    GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
    EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
    LLM_MODEL = "llama3.1:8b"  # Updated to match available model
    EMBEDDING_MODEL = "nomic-embed-text:latest"  # Updated to match available model
    REQUEST_TIMEOUT = 60
    RETRY_ATTEMPTS = 3
    RETRY_DELAY = 1

def optimized_translate_to_english(text, model=None):
    """
    Optimized translation function based on the working EC2 approach
    """
    if model is None:
        model = LLM_MODEL
    
    # Skip translation if text is already in English or too short
    if len(text) < 3:
        return text
    
    # Simple English word detection
    english_words = ['milk', 'bread', 'rice', 'oil', 'sugar', 'salt', 'water', 'juice', 'coffee', 'tea', 
                    'cream', 'soup', 'noodles', 'chocolate', 'honey', 'powder', 'drink', 'liquid', 
                    'detergent', 'stain', 'buster', 'blue', 'red', 'green', 'yellow', 'white', 'black']
    text_lower = text.lower()
    
    # If text contains English words, assume it's already English
    if any(word in text_lower for word in english_words):
        return text
    
    # Simple, direct prompt (like the working test)
    prompt = f"Translate this to English: {text}"
    
    print(f"    Translating: {text[:50]}...")
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            # Simple request structure (like the working test)
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()["response"].strip()
                # Clean up the response
                if result and len(result) > 0 and result != text:
                    print(f"    → Translated: {result[:50]}")
                    return result
                else:
                    print(f"    → No translation needed, using original")
                    return text
            else:
                print(f"    → Translation API error (attempt {attempt + 1}): {response.status_code}")
                print(f"    → Response: {response.text}")
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                return text
                
        except Exception as e:
            print(f"    → Translation connection error (attempt {attempt + 1}): {e}")
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY)
                continue
            return text
    
    return text

def test_optimized_translation():
    """Test the optimized translation function"""
    print("🧪 Testing Optimized Translation...")
    print("=" * 50)
    
    test_products = [
        "paha ayam sejuk beku 2kg",
        "susu segar 1 liter",
        "nasi putih 5kg",
        "minyak masak 2 liter"
    ]
    
    for product in test_products:
        print(f"\nTesting: {product}")
        translated = optimized_translate_to_english(product)
        print(f"Result: {translated}")
        print("-" * 30)

def compare_approaches():
    """Compare the original vs optimized approach"""
    print("📊 Comparing Translation Approaches")
    print("=" * 50)
    
    test_product = "paha ayam sejuk beku 2kg"
    
    # Original approach (complex prompt)
    original_prompt = f"""
    Translate this product name to English. Keep brand names unchanged.
    
    Product: {test_product}
    
    Rules:
    - Keep brand names unchanged (Milo, Indomie, Coca Cola)
    - Translate descriptive words to English
    - Keep measurements unchanged (500g, 1L, etc.)
    - Return only the translation, nothing else
    
    Translation:
    """
    
    # Optimized approach (simple prompt)
    optimized_prompt = f"Translate this to English: {test_product}"
    
    print("Original prompt length:", len(original_prompt))
    print("Optimized prompt length:", len(optimized_prompt))
    print("Prompt reduction:", f"{((len(original_prompt) - len(optimized_prompt)) / len(original_prompt) * 100):.1f}%")
    
    print("\nOriginal prompt:")
    print(original_prompt)
    
    print("\nOptimized prompt:")
    print(optimized_prompt)

def main():
    """Main function"""
    print("🚀 Optimized Translation Function")
    print("=" * 50)
    
    # Compare approaches
    compare_approaches()
    
    # Test the optimized function
    test_optimized_translation()
    
    print("\n✅ Optimization complete!")

if __name__ == "__main__":
    main() 