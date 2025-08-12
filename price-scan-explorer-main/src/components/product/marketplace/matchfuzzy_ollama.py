import pandas as pd
import boto3
import io
from datetime import datetime
import re
import chromadb
import requests
import json
import time
import numpy as np
import os
import sys

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
    print(f"✅ Loaded Ollama config: {OLLAMA_BASE_URL}")
except ImportError:
    print("⚠️  No ollama_config.py found, using localhost defaults")
    # Fallback to localhost
    OLLAMA_BASE_URL = "http://localhost:11434"
    EMBEDDING_MODEL = "nomic-embed-text"
    LLM_MODEL = "llama3.1:8b"
    REQUEST_TIMEOUT = 60
    RETRY_ATTEMPTS = 3
    RETRY_DELAY = 1

# Load your combined Lotus & Shopee Excel file
file_path = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA12-0.csv"

# Read the CSV file directly from S3 with proper encoding
try:
    df_combined = pd.read_csv(file_path, encoding='utf-8')
except UnicodeDecodeError:
    try:
        df_combined = pd.read_csv(file_path, encoding='latin-1')
    except:
        df_combined = pd.read_csv(file_path, encoding='cp1252')

# Normalize product name for matching
df_combined['Product Name Normalized'] = df_combined['Product Name'].astype(str).str.lower().str.strip()
df_combined['Product URL Original'] = df_combined['Product URL'].astype(str).str.strip()
df_combined['Product URL Normalized'] = df_combined['Product URL'].astype(str).str.lower().str.strip()
df_combined['Current Price (RM)'] = df_combined['Discounted Price (RM)'].fillna(df_combined['Original Price (RM)'])

# Detect marketplace from normalized URL
df_combined['Marketplace'] = df_combined['Product URL Normalized'].apply(lambda url: 
    'lotus' if 'lotus' in url else 
    'shopee' if 'shopee' in url else 
    'unknown'
)

print(f"📊 Total records loaded: {len(df_combined)}")
print(f"🔍 Marketplace distribution:")
print(df_combined['Marketplace'].value_counts())

# Split data by marketplace
lotus_cols = ['Product Name Normalized', 'Current Price (RM)', 'Discounted Price (RM)', 'Original Price (RM)', 'Product URL Original', 'timestamp']
shopee_cols = ['Product Name Normalized', 'Current Price (RM)', 'Discounted Price (RM)', 'Original Price (RM)', 'Product URL Original', 'Shop name', 'Shop url']
df_lotus = df_combined[df_combined['Marketplace'] == 'lotus'][lotus_cols].copy()
df_shopee = df_combined[df_combined['Marketplace'] == 'shopee'][shopee_cols].copy()
df_lotus.columns = ['Lotus Product', 'Lotus Price', 'Lotus Discounted Price', 'Lotus Original Price', 'Lotus URL', 'timestamp']
df_shopee.columns = ['Shopee Product', 'Shopee Price', 'Shopee Discounted Price', 'Shopee Original Price', 'Shopee URL', 'Shopee Shop Name', 'Shopee Shop URL']

print(f"🪷 Lotus products found: {len(df_lotus)}")
print(f"🛍️ Shopee products found: {len(df_shopee)}")

# Ollama API functions
def get_ollama_embedding(text, model=None):
    """Get embedding from Ollama using Nomic Embed model"""
    if model is None:
        model = EMBEDDING_MODEL
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/embeddings",
                json={
                    "model": model,
                    "prompt": text
                },
                timeout=REQUEST_TIMEOUT
            )
            if response.status_code == 200:
                return response.json()["embedding"]
            else:
                print(f"❌ Ollama embedding error (attempt {attempt + 1}): {response.status_code}")
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                return None
        except Exception as e:
            print(f"❌ Ollama connection error (attempt {attempt + 1}): {e}")
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY)
                continue
            return None
    return None

def analyze_product_similarity(product1, product2, model=None):
    """Use Ollama to analyze product similarity and provide reasoning"""
    if model is None:
        model = LLM_MODEL
    
    # First, try to check if the model is available
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json()
            available_models = [m['name'] for m in models.get('models', [])]
            if model not in available_models:
                print(f"    → Model {model} not available, using fallback analysis")
                return f"Score: 75, Reasoning: Model not available, using vector similarity only, Factors: Vector similarity"
    except:
        pass
    
    prompt = f"""
    Analyze if these two products are the same or very similar:
    
    Product 1: {product1}
    Product 2: {product2}
    
    Consider:
    - Brand names and variations
    - Product type and category
    - Size/quantity specifications
    - Flavor/variant differences
    
    Respond with:
    1. Similarity score (0-100)
    2. Brief reasoning
    3. Key matching factors
    
    Format: Score: X, Reasoning: Y, Factors: Z
    """
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
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
                return response.json()["response"]
            else:
                print(f"    → LLM analysis error (attempt {attempt + 1}): {response.status_code}")
                if attempt < RETRY_ATTEMPTS - 1:
                    time.sleep(RETRY_DELAY)
                    continue
                return f"Score: 75, Reasoning: API Error, using vector similarity, Factors: Vector similarity only"
        except Exception as e:
            print(f"    → LLM connection error (attempt {attempt + 1}): {e}")
            if attempt < RETRY_ATTEMPTS - 1:
                time.sleep(RETRY_DELAY)
                continue
            return f"Score: 75, Reasoning: Connection Error, using vector similarity, Factors: Vector similarity only"
    return f"Score: 75, Reasoning: All attempts failed, using vector similarity, Factors: Vector similarity only"

def translate_to_english(text, model=None):
    """Translate product name to English for better matching"""
    if model is None:
        model = LLM_MODEL
    
    # Skip translation if text is already in English or too short
    if len(text) < 3:
        return text
    
    # Simple English word detection - expanded list
    english_words = ['milk', 'bread', 'rice', 'oil', 'sugar', 'salt', 'water', 'juice', 'coffee', 'tea', 
                    'cream', 'soup', 'noodles', 'chocolate', 'honey', 'powder', 'drink', 'liquid', 
                    'detergent', 'stain', 'buster', 'blue', 'red', 'green', 'yellow', 'white', 'black']
    text_lower = text.lower()
    
    # If text contains English words, assume it's already English
    if any(word in text_lower for word in english_words):
        return text
    
    # Check if Ollama is running
    try:
        test_response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if test_response.status_code != 200:
            print(f"    → Ollama not responding, skipping translation")
            return text
    except:
        print(f"    → Cannot connect to Ollama, skipping translation")
        return text
    
    prompt = f"""
    Translate this product name to English. Keep brand names unchanged.
    
    Product: {text}
    
    Rules:
    - Keep brand names unchanged (Milo, Indomie, Coca Cola)
    - Translate descriptive words to English
    - Keep measurements unchanged (500g, 1L, etc.)
    - Return only the translation, nothing else
    
    Translation:
    """
    
    for attempt in range(RETRY_ATTEMPTS):
        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "num_predict": 50
                    }
                },
                timeout=REQUEST_TIMEOUT
            )
            if response.status_code == 200:
                result = response.json()["response"].strip()
                # Clean up the response
                if result and len(result) > 0 and result != text:
                    return result
                else:
                    return text
            else:
                print(f"    → Translation API error (attempt {attempt + 1}): {response.status_code}")
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

def preprocess_with_llm(product_name, model=None):
    """Preprocessing with translation to English and proper capitalization patterns"""
    if model is None:
        model = LLM_MODEL
    
    # Step 1: Try translation, but fallback to original if it fails
    print(f"    Translating: {product_name[:50]}...")
    try:
        english_name = translate_to_english(product_name, model)
        if english_name and english_name != product_name:
            print(f"    → Translated: {english_name[:50]}")
        else:
            print(f"    → No translation needed or failed, using original")
            english_name = product_name
    except Exception as e:
        print(f"    → Translation failed, using original: {e}")
        english_name = product_name
    
    # Step 2: Start with the translated text (or original if translation failed)
    cleaned_name = english_name.strip()
    
    # Step 3: Remove promotional words
    promotional_words = ['halal', 'new', 'original', 'authentic', 'genuine', 'official']
    for word in promotional_words:
        # Only remove if it's a standalone word at the end or beginning
        cleaned_name = re.sub(rf'\b{word}\b(?=\s*$)', '', cleaned_name, flags=re.IGNORECASE)  # End of string
        cleaned_name = re.sub(rf'^(?:\s*)\b{word}\b(?:\s*)', '', cleaned_name, flags=re.IGNORECASE)  # Beginning
    
    # Step 4: Clean up extra spaces but preserve intentional formatting
    cleaned_name = re.sub(r'\s+', ' ', cleaned_name)  # Multiple spaces to single space
    
    # Step 5: Preserve proper capitalization for brand names
    brand_names = ['campbells', 'milo', 'indomie', 'coca cola', 'coke', 'nestle', 'maggi', 'ayam', 'knorr', 'dugro', 'lotus', 'top']
    for brand in brand_names:
        if brand.lower() in cleaned_name.lower():
            # Replace with properly capitalized brand name
            cleaned_name = re.sub(rf'\b{brand}\b', brand.title(), cleaned_name, flags=re.IGNORECASE)
    
    # Step 6: Apply proper capitalization pattern for product names
    words = cleaned_name.split()
    capitalized_words = []
    
    for i, word in enumerate(words):
        # Always capitalize the first word (brand name)
        if i == 0:
            capitalized_words.append(word.title())
        # Capitalize important product words
        elif word.lower() in ['liquid', 'detergent', 'stain', 'buster', 'blue', 'red', 'green', 'yellow', 'white', 'black', 'cream', 'mushroom', 'chowder', 'flavour', 'flavor', 'soup', 'noodles', 'rice', 'oil', 'truffle', 'malt', 'drink', 'milk', 'powder', 'step', 'chocolate', 'honey', 'original']:
            capitalized_words.append(word.title())
        # Keep measurements and numbers as they are
        elif re.match(r'^\d+\.?\d*[xX×]?\d*\.?\d*(kg|g|l|ml|gm|pcs|pack|s)$', word, re.IGNORECASE):
            capitalized_words.append(word)
        # Keep prepositions and articles lowercase
        elif word.lower() in ['of', 'with', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'by', 'from', 'up', 'down', 'out', 'off', 'over', 'under']:
            capitalized_words.append(word.lower())
        # Capitalize other words (product descriptors)
        else:
            capitalized_words.append(word.title())
    
    # Step 7: Rejoin the words
    cleaned_name = ' '.join(capitalized_words)
    
    # Step 8: Clean up trailing/leading punctuation but preserve internal formatting
    cleaned_name = cleaned_name.strip(' ,.-_')
    
    return cleaned_name.strip()

# Initialize ChromaDB with Ollama embeddings
print("🚀 Initializing ChromaDB with Ollama embeddings...")
client = chromadb.PersistentClient(path="./chroma_db_ollama")

# Custom embedding function using Ollama
class OllamaEmbeddingFunction:
    def __init__(self, model=None):
        self.model = model or EMBEDDING_MODEL
    
    def __call__(self, input):
        embeddings = []
        for text in input:
            embedding = get_ollama_embedding(text, self.model)
            if embedding:
                embeddings.append(embedding)
            else:
                # Fallback: create a simple embedding
                embeddings.append([0.0] * 384)  # Default dimension
        return embeddings
    
    def name(self):
        return f"ollama-{self.model}"

embedding_function = OllamaEmbeddingFunction(EMBEDDING_MODEL)

# Create collections (handle existing collections)
try:
    lotus_collection = client.create_collection(
        name="lotus_products_ollama",
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"}
    )
except Exception as e:
    print(f"Using existing lotus collection: {e}")
    lotus_collection = client.get_collection(
        name="lotus_products_ollama",
        embedding_function=embedding_function
    )

try:
    shopee_collection = client.create_collection(
        name="shopee_products_ollama", 
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"}
    )
except Exception as e:
    print(f"Using existing shopee collection: {e}")
    shopee_collection = client.get_collection(
        name="shopee_products_ollama",
        embedding_function=embedding_function
    )

# Helper functions
def format_timestamp_to_yyyymmdd(timestamp_str):
    """Convert timestamp to yyyy/mm/dd format"""
    try:
        if pd.isna(timestamp_str) or timestamp_str == '':
            return datetime.now().strftime('%Y/%m/%d')
        
        if isinstance(timestamp_str, str) and re.match(r'\d{4}/\d{2}/\d{2}', timestamp_str):
            return timestamp_str
        
        if isinstance(timestamp_str, str):
            try:
                dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                return dt.strftime('%Y/%m/%d')
            except:
                pass
            
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    dt = datetime.strptime(timestamp_str, fmt)
                    return dt.strftime('%Y/%m/%d')
                except:
                    continue
        
        return datetime.now().strftime('%Y/%m/%d')
    except:
        return datetime.now().strftime('%Y/%m/%d')

def extract_size(product_name):
    """Extract size/unit information from product name"""
    product_name_lower = product_name.lower()
    
    # Pattern 1: Handle "3×16.8g" or "3x16.8g" format
    match = re.search(r'(\d+)\s*[x×]\s*([\d\.]+)\s*(kg|g|l|ml|s|pcs|pack)', product_name_lower)
    if match:
        quantity = int(match.group(1))
        size = float(match.group(2))
        unit = match.group(3)
        return quantity, f"{quantity} packs"
    
    # Pattern 2: Handle "3.6Kg", "5Kg", "200Ml", etc.
    match = re.search(r'([\d\.]+)\s*(kg|g|l|ml|s|pcs|pack)', product_name_lower)
    if match:
        qty = float(match.group(1))
        unit = match.group(2)
        if unit in ['kg', 'g', 'l', 'ml']:
            return 1, f"1 pack ({qty}{unit})"
        if unit in ['s', 'pcs', 'pack']:
            return qty, f"{qty} packs"
        return qty, f"{qty} packs"
    
    # Pattern 3: Handle "5 x 85g" format with spaces
    match = re.search(r'(\d+)\s*x\s*([\d\.]+)\s*(kg|g|l|ml|s|pcs|pack)', product_name_lower)
    if match:
        quantity = int(match.group(1))
        size = float(match.group(2))
        unit = match.group(3)
        return quantity, f"{quantity} packs"
    
    return None, None

# Check if ChromaDB collections already have data
print("🔍 Checking existing ChromaDB collections...")

lotus_count = lotus_collection.count()
shopee_count = shopee_collection.count()

print(f"📊 Existing data in ChromaDB:")
print(f"  - Lotus collection: {lotus_count} products")
print(f"  - Shopee collection: {shopee_count} products")

if lotus_count > 0 and shopee_count > 0:
    print("✅ ChromaDB collections already populated! Skipping preprocessing step.")
    print("🚀 Proceeding directly to matching phase...")
else:
    print("⚠️  ChromaDB collections are empty. Please run matchfuzzy_ollama_persistent.py first.")
    print("   This script requires pre-populated ChromaDB collections.")
    exit(1)

# Configuration for matching
USE_LLM_ANALYSIS = True  # Set to False to disable LLM analysis and use only vector similarity

# Perform enhanced matching with LLM analysis
if USE_LLM_ANALYSIS:
    print("🔍 Performing Ollama-enhanced matching with LLM analysis...")
else:
    print("🔍 Performing vector-only matching (LLM analysis disabled)...")
start_time = time.time()

matched_rows = []
unmatched_lotus_rows = []
unmatched_shopee_rows = []
matched_lotus_products = set()
matched_shopee_products = set()

# Get all Lotus products from ChromaDB for matching
print("🔍 Retrieving Lotus products from ChromaDB for matching...")
lotus_results = lotus_collection.get(include=['metadatas', 'documents'])

# Match Lotus products against Shopee products
print(f"🔍 Starting matching process for {len(lotus_results['metadatas'])} Lotus products...")
for idx, lotus_metadata in enumerate(lotus_results['metadatas']):
    try:
        lotus_product_name = lotus_metadata['original_name']
        processed_lotus_name = lotus_metadata['processed_name']
        print(f"  Matching {idx+1}/{len(lotus_results['metadatas'])}: {lotus_product_name[:50]}...")
        
        # Query Shopee collection for similar products
        results = shopee_collection.query(
            query_texts=[processed_lotus_name],
            n_results=5,
            include=['metadatas', 'distances']
        )
        
        best_match = None
        best_score = 0
        llm_analysis = ""
        
        if results['metadatas'] and results['metadatas'][0]:
            for i, metadata in enumerate(results['metadatas'][0]):
                distance = results['distances'][0][i]
                similarity_score = 1 - distance
                
                if similarity_score > best_score and similarity_score > 0.5:
                    if USE_LLM_ANALYSIS:
                        # Use LLM to analyze the match quality
                        llm_analysis = analyze_product_similarity(
                            lotus_product_name, 
                            metadata['original_name']
                        )
                        
                        # Extract score from LLM analysis
                        try:
                            llm_score_match = re.search(r'Score:\s*(\d+)', llm_analysis)
                            if llm_score_match:
                                llm_score = int(llm_score_match.group(1))
                                # Combine vector similarity with LLM analysis
                                combined_score = (similarity_score * 0.7) + (llm_score / 100 * 0.3)
                                
                                if combined_score > best_score:
                                    best_score = combined_score
                                    best_match = metadata
                        except:
                            best_score = similarity_score
                            best_match = metadata
                    else:
                        # Use only vector similarity
                        llm_analysis = f"Score: {int(similarity_score * 100)}, Reasoning: Vector similarity only, Factors: Embedding similarity"
                        best_score = similarity_score
                        best_match = metadata
        
        if best_match:
            # Extract size/unit and calculate per unit price
            lotus_qty, lotus_unit = extract_size(lotus_metadata['original_name'])
            shopee_qty, shopee_unit = extract_size(best_match['original_name'])
            
            # Parse prices from metadata
            try:
                lotus_price = float(lotus_metadata['price'])
            except:
                lotus_price = 0
            try:
                lotus_discounted_price = float(lotus_metadata['discounted_price'])
            except:
                lotus_discounted_price = lotus_price
            try:
                shopee_price = float(best_match['price'])
            except:
                shopee_price = 0
            try:
                shopee_discounted_price = float(best_match['discounted_price'])
            except:
                shopee_discounted_price = shopee_price
            
            # Calculate per unit prices
            lotus_per_unit_price = lotus_price / lotus_qty if lotus_qty else None
            lotus_discounted_per_unit_price = lotus_discounted_price / lotus_qty if lotus_qty else None
            shopee_per_unit_price = shopee_price / shopee_qty if shopee_qty else None
            shopee_discounted_per_unit_price = shopee_discounted_price / shopee_qty if shopee_qty else None
            
            # Create calculation formulas
            lotus_calculation = f"RM{lotus_price:.2f} / {lotus_unit} = RM{lotus_per_unit_price:.2f}" if lotus_qty and lotus_per_unit_price and lotus_unit else ""
            shopee_calculation = f"RM{shopee_price:.2f} / {shopee_unit} = RM{shopee_per_unit_price:.2f}" if shopee_qty and shopee_per_unit_price and shopee_unit else ""
            
            matched_rows.append({
                "Lotus Product": lotus_metadata['original_name'].title(),
                "Lotus URL": lotus_metadata['url'],
                "Lotus Price": lotus_metadata['price'],
                "Lotus Per Unit": f"{lotus_qty} {lotus_unit}" if lotus_qty else "",
                "Lotus Per Unit Price": f"{lotus_per_unit_price:.2f}" if lotus_per_unit_price else "",
                "Lotus Per Unit Calculation": lotus_calculation,
                "Lotus Discounted Price": f"{lotus_discounted_price:.2f}" if lotus_discounted_price else "",
                "Lotus Discounted Per Unit Price": f"{lotus_discounted_per_unit_price:.2f}" if lotus_discounted_per_unit_price else "",
                "Original Price (RM)": lotus_metadata['original_price'],
                "Shopee Product": best_match['original_name'].title(),
                "Shopee URL": best_match['url'],
                "Shopee Shop Name": best_match.get('shop_name', ''),
                "Shopee Shop URL": best_match.get('shop_url', ''),
                "Shopee Price": best_match['price'],
                "Shopee Per Unit": f"{shopee_qty} {shopee_unit}" if shopee_qty else "",
                "Shopee Per Unit Price": f"{shopee_per_unit_price:.2f}" if shopee_per_unit_price else "",
                "Shopee Per Unit Calculation": shopee_calculation,
                "Shopee Discounted Price": f"{shopee_discounted_price:.2f}" if shopee_discounted_price else "",
                "Shopee Discounted Per Unit Price": f"{shopee_discounted_per_unit_price:.2f}" if shopee_discounted_per_unit_price else "",
                "Match Score": round(best_score * 100, 2),
                "LLM Analysis": llm_analysis,
                "timestamp": format_timestamp_to_yyyymmdd(lotus_metadata['timestamp']),
                "Match Status": "Matched"
            })
            
            matched_lotus_products.add(lotus_metadata['original_name'].lower())
            matched_shopee_products.add(best_match['original_name'].lower())
        else:
            # Add unmatched Lotus product
            lotus_qty, lotus_unit = extract_size(lotus_metadata['original_name'])
            try:
                lotus_price = float(lotus_metadata['price'])
            except:
                lotus_price = 0
            try:
                lotus_discounted_price = float(lotus_metadata['discounted_price'])
            except:
                lotus_discounted_price = lotus_price
            
            lotus_per_unit_price = lotus_price / lotus_qty if lotus_qty else None
            lotus_discounted_per_unit_price = lotus_discounted_price / lotus_qty if lotus_qty else None
            lotus_calculation = f"RM{lotus_price:.2f} / {lotus_unit} = RM{lotus_per_unit_price:.2f}" if lotus_qty and lotus_per_unit_price and lotus_unit else ""
            
            unmatched_lotus_rows.append({
                "Lotus Product": lotus_metadata['original_name'].title(),
                "Lotus URL": lotus_metadata['url'],
                "Lotus Price": lotus_metadata['price'],
                "Lotus Per Unit": f"{lotus_qty} {lotus_unit}" if lotus_qty else "",
                "Lotus Per Unit Price": f"{lotus_per_unit_price:.2f}" if lotus_per_unit_price else "",
                "Lotus Per Unit Calculation": lotus_calculation,
                "Lotus Discounted Price": f"{lotus_discounted_price:.2f}" if lotus_discounted_price else "",
                "Lotus Discounted Per Unit Price": f"{lotus_discounted_per_unit_price:.2f}" if lotus_discounted_per_unit_price else "",
                "Original Price (RM)": lotus_metadata['original_price'],
                "Shopee Product": "",
                "Shopee URL": "",
                "Shopee Shop Name": "",
                "Shopee Shop URL": "",
                "Shopee Price": "",
                "Shopee Per Unit": "",
                "Shopee Per Unit Price": "",
                "Shopee Per Unit Calculation": "",
                "Shopee Discounted Price": "",
                "Shopee Discounted Per Unit Price": "",
                "Match Score": 0,
                "LLM Analysis": "",
                "timestamp": format_timestamp_to_yyyymmdd(lotus_metadata['timestamp']),
                "Match Status": "Unmatched Lotus"
            })
            
    except Exception as e:
        print(f"  ❌ Error matching Lotus product {idx}: {e}")
        # Add as unmatched product
        unmatched_lotus_rows.append({
            "Lotus Product": lotus_metadata['original_name'].title(),
            "Lotus URL": lotus_metadata['url'],
            "Lotus Price": lotus_metadata['price'],
            "Lotus Per Unit": "",
            "Lotus Per Unit Price": "",
            "Lotus Per Unit Calculation": "",
            "Lotus Discounted Price": "",
            "Lotus Discounted Per Unit Price": "",
            "Original Price (RM)": lotus_metadata['original_price'],
            "Shopee Product": "",
            "Shopee URL": "",
            "Shopee Shop Name": "",
            "Shopee Shop URL": "",
            "Shopee Price": "",
            "Shopee Per Unit": "",
            "Shopee Per Unit Price": "",
            "Shopee Per Unit Calculation": "",
            "Shopee Discounted Price": "",
            "Shopee Discounted Per Unit Price": "",
            "Match Score": 0,
            "LLM Analysis": "",
            "timestamp": format_timestamp_to_yyyymmdd(lotus_metadata['timestamp']),
            "Match Status": "Unmatched Lotus (Error)"
        })

# Add unmatched Shopee products
print("🔍 Retrieving Shopee products from ChromaDB for unmatched check...")
shopee_results = shopee_collection.get(include=['metadatas', 'documents'])

for shopee_metadata in shopee_results['metadatas']:
    if shopee_metadata['original_name'].lower() not in matched_shopee_products:
        shopee_qty, shopee_unit = extract_size(shopee_metadata['original_name'])
        try:
            shopee_price = float(shopee_metadata['price'])
        except:
            shopee_price = 0
        try:
            shopee_discounted_price = float(shopee_metadata['discounted_price'])
        except:
            shopee_discounted_price = shopee_price
        
        shopee_per_unit_price = shopee_price / shopee_qty if shopee_qty else None
        shopee_discounted_per_unit_price = shopee_discounted_price / shopee_qty if shopee_qty else None
        shopee_calculation = f"RM{shopee_price:.2f} / {shopee_unit} = RM{shopee_per_unit_price:.2f}" if shopee_qty and shopee_per_unit_price and shopee_unit else ""
        
        unmatched_shopee_rows.append({
            "Lotus Product": "",
            "Lotus URL": "",
            "Lotus Price": "",
            "Lotus Per Unit": "",
            "Lotus Per Unit Price": "",
            "Lotus Per Unit Calculation": "",
            "Lotus Discounted Price": "",
            "Lotus Discounted Per Unit Price": "",
            "Original Price (RM)": "",
            "Shopee Product": shopee_metadata['original_name'].title(),
            "Shopee URL": shopee_metadata['url'],
            "Shopee Shop Name": shopee_metadata.get('shop_name', ''),
            "Shopee Shop URL": shopee_metadata.get('shop_url', ''),
            "Shopee Price": shopee_metadata['price'],
            "Shopee Per Unit": f"{shopee_qty} {shopee_unit}" if shopee_qty else "",
            "Shopee Per Unit Price": f"{shopee_per_unit_price:.2f}" if shopee_per_unit_price else "",
            "Shopee Per Unit Calculation": shopee_calculation,
            "Shopee Discounted Price": f"{shopee_discounted_price:.2f}" if shopee_discounted_price else "",
            "Shopee Discounted Per Unit Price": f"{shopee_discounted_per_unit_price:.2f}" if shopee_discounted_per_unit_price else "",
            "Match Score": 0,
            "LLM Analysis": "",
            "timestamp": format_timestamp_to_yyyymmdd(datetime.now().isoformat()),
            "Match Status": "Unmatched Shopee"
        })

# Combine all data
all_rows = matched_rows + unmatched_lotus_rows + unmatched_shopee_rows
final_df = pd.DataFrame(all_rows)

if len(final_df) > 0:
    status_order = {'Matched': 0, 'Unmatched Lotus': 1, 'Unmatched Shopee': 2}
    final_df['status_order'] = final_df['Match Status'].map(status_order)
    final_df = final_df.sort_values(by=['status_order', 'Match Score'], ascending=[True, False])
    final_df = final_df.drop('status_order', axis=1)

end_time = time.time()
processing_time = end_time - start_time

print(f"⚡ Ollama processing completed in {processing_time:.2f} seconds")
print(f"🎯 Total matches created: {len(matched_rows)}")
print(f"🪷 Unmatched Lotus products: {len(unmatched_lotus_rows)}")
print(f"🛍️ Unmatched Shopee products: {len(unmatched_shopee_rows)}")
print(f"📊 Total products in output: {len(final_df)}")
print(f"📈 Best match score: {final_df[final_df['Match Score'] > 0]['Match Score'].max():.2f}%" if len(final_df[final_df['Match Score'] > 0]) > 0 else "No matches found")
print(f"📊 Average match score: {final_df[final_df['Match Score'] > 0]['Match Score'].mean():.2f}%" if len(final_df[final_df['Match Score'] > 0]) > 0 else "")

# Save to S3
try:
    s3_client = boto3.client('s3')
    csv_buffer = io.StringIO()
    final_df.to_csv(csv_buffer, index=False)
    
    bucket_name = 'prodpromo'
    s3_key = 'thunderbitscrape/matched_lotus_shopee_ollama_output_08072025.csv'
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=csv_buffer.getvalue(),
        ContentType='text/csv'
    )
    
    print(f"✅ Ollama-enhanced matching complete. Output saved to S3: s3://{bucket_name}/{s3_key}")
    print(f"🔗 S3 URL: https://{bucket_name}.s3.ap-southeast-1.amazonaws.com/{s3_key}")
    
    # Always save locally as well
    output_file = "matched_lotus_shopee_ollama_output_08072025.csv"
    final_df.to_csv(output_file, index=False)
    print(f"📁 Also saved locally: {output_file}")

except Exception as e:
    print(f"❌ Error uploading to S3: {e}")
    output_file = "matched_lotus_shopee_ollama_output_08072025.csv"
    final_df.to_csv(output_file, index=False)
    print(f"📁 Saved locally as fallback: {output_file}")

# Clean up ChromaDB collections
print("🧹 Cleaning up ChromaDB collections...")
client.delete_collection("lotus_products_ollama")
client.delete_collection("shopee_products_ollama")
print("✅ ChromaDB cleanup complete") 