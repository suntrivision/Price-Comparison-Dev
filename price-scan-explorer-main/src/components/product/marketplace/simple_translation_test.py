#!/usr/bin/env python3
"""
Simple Translation Test with Hardcoded Correct Values
Bypasses any config loading issues
"""

import requests
import json

# Hardcoded correct values for your EC2 instance
OLLAMA_BASE_URL = "http://localhost:11434"
LLM_MODEL = "llama3.1:8b"  # Correct model name
EMBEDDING_MODEL = "nomic-embed-text:latest"  # Correct model name

def simple_translate(text):
    """Simple translation function with correct model names"""
    
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
    
    # Simple, direct prompt
    prompt = f"Translate this to English: {text}"
    
    print(f"    Translating: {text[:50]}...")
    print(f"    Using model: {LLM_MODEL}")
    
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        print(f"    Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()["response"].strip()
            if result and len(result) > 0 and result != text:
                print(f"    → Translated: {result[:50]}")
                return result
            else:
                print(f"    → No translation needed, using original")
                return text
        else:
            print(f"    → Translation failed: {response.status_code}")
            print(f"    → Response: {response.text}")
            return text
            
    except Exception as e:
        print(f"    → Translation error: {e}")
        return text

def main():
    """Test the simple translation function"""
    print("🚀 Simple Translation Test (Hardcoded Values)")
    print("=" * 50)
    print(f"Target URL: {OLLAMA_BASE_URL}")
    print(f"LLM Model: {LLM_MODEL}")
    print(f"Embedding Model: {EMBEDDING_MODEL}")
    print("=" * 50)
    
    test_products = [
        "paha ayam sejuk beku 2kg",
        "susu segar 1 liter",
        "nasi putih 5kg",
        "minyak masak 2 liter"
    ]
    
    for product in test_products:
        print(f"\nTesting: {product}")
        translated = simple_translate(product)
        print(f"Result: {translated}")
        print("-" * 30)
    
    print("\n✅ Simple translation test complete!")

if __name__ == "__main__":
    main() 