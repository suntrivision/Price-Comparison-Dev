#!/usr/bin/env python3
"""
Test script to verify config loading
"""

import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("🔍 Testing config loading...")
print("Current directory:", os.getcwd())
print("Python path:", sys.path)

try:
    import ollama_config
    print("✅ Successfully imported ollama_config")
    print(f"LLM_MODEL: {ollama_config.LLM_MODEL}")
    print(f"EMBEDDING_MODEL: {ollama_config.EMBEDDING_MODEL}")
    print(f"OLLAMA_BASE_URL: {ollama_config.OLLAMA_BASE_URL}")
except ImportError as e:
    print(f"❌ Failed to import ollama_config: {e}")
except Exception as e:
    print(f"❌ Error loading config: {e}")

# Also test direct file reading
print("\n📄 Reading config file directly...")
try:
    with open("ollama_config.py", "r") as f:
        content = f.read()
        print("Config file content:")
        for line in content.split('\n'):
            if 'LLM_MODEL' in line or 'EMBEDDING_MODEL' in line:
                print(f"  {line.strip()}")
except Exception as e:
    print(f"❌ Error reading config file: {e}") 