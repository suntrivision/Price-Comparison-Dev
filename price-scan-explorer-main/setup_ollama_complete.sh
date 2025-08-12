#!/bin/bash
# Complete Ollama Setup Script for EC2 Product Matching
# This script installs everything needed for Ollama-based product matching

set -e  # Exit on any error

echo "🚀 Starting Complete Ollama Setup for Product Matching..."
echo "========================================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    tree

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Add Ollama to PATH
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /home/ubuntu/price-scanner
cd /home/ubuntu/price-scanner

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install pandas boto3 chromadb requests numpy sentence-transformers

# Create requirements file
cat > requirements_ollama.txt << EOF
pandas>=1.5.0
boto3>=1.26.0
chromadb>=0.4.0
requests>=2.28.0
numpy>=1.21.0
sentence-transformers>=2.2.0
EOF

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 30

# Pull required models
echo "📥 Pulling Ollama models..."
echo "Downloading nomic-embed-text (1.5GB)..."
ollama pull nomic-embed-text

echo "Downloading llama3.1:8b (8GB)..."
ollama pull llama3.1:8b

# Verify installation
echo "✅ Verifying installation..."
ollama list

# Test Ollama API
echo "🧪 Testing Ollama API..."
curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama API is working" || echo "❌ Ollama API test failed"

# Create systemd service for Ollama
echo "🔧 Creating systemd service for Ollama..."
sudo tee /etc/systemd/system/ollama.service > /dev/null << EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > /home/ubuntu/monitor_ollama.sh << 'EOF'
#!/bin/bash
echo "=== Ollama Status ==="
systemctl status ollama --no-pager -l
echo ""
echo "=== Available Models ==="
ollama list
echo ""
echo "=== System Resources ==="
free -h
echo ""
df -h
echo ""
echo "=== Ollama API Test ==="
curl -s http://localhost:11434/api/tags | head -20
EOF

chmod +x /home/ubuntu/monitor_ollama.sh

# Create health check script
echo "🏥 Creating health check script..."
cat > /home/ubuntu/health_check.sh << 'EOF'
#!/bin/bash
# Health check for Ollama service

# Check if Ollama service is running
if ! systemctl is-active --quiet ollama; then
    echo "❌ Ollama service is not running"
    exit 1
fi

# Check if API is responding
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama API is not responding"
    exit 1
fi

# Check if models are available
if ! ollama list | grep -q "nomic-embed-text"; then
    echo "❌ nomic-embed-text model not found"
    exit 1
fi

if ! ollama list | grep -q "llama3.1:8b"; then
    echo "❌ llama3.1:8b model not found"
    exit 1
fi

echo "✅ All health checks passed"
exit 0
EOF

chmod +x /home/ubuntu/health_check.sh

# Create the Ollama-enhanced product matching script
echo "📝 Creating Ollama-enhanced product matching script..."
cat > /home/ubuntu/matchfuzzy_ollama.py << 'EOF'
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
def get_ollama_embedding(text, model="nomic-embed-text"):
    """Get embedding from Ollama using Nomic Embed model"""
    try:
        response = requests.post(
            "http://localhost:11434/api/embeddings",
            json={
                "model": model,
                "prompt": text
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["embedding"]
        else:
            print(f"❌ Ollama embedding error: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ollama connection error: {e}")
        return None

def analyze_product_similarity(product1, product2, model="llama3.1:8b"):
    """Use Ollama to analyze product similarity and provide reasoning"""
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
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        if response.status_code == 200:
            return response.json()["response"]
        else:
            return f"Score: 0, Reasoning: API Error, Factors: None"
    except Exception as e:
        return f"Score: 0, Reasoning: Connection Error, Factors: None"

def preprocess_with_llm(product_name, model="llama3.1:8b"):
    """Use LLM to standardize product names"""
    prompt = f"""
    Standardize this product name for better matching:
    
    Original: {product_name}
    
    Rules:
    - Remove promotional words (new, original, authentic, etc.)
    - Standardize brand names (Coca Cola -> Coke)
    - Keep important specifications (size, flavor, etc.)
    - Make it concise but descriptive
    
    Return only the standardized name:
    """
    
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["response"].strip()
        else:
            return product_name
    except Exception as e:
        return product_name

# Initialize ChromaDB with Ollama embeddings
print("🚀 Initializing ChromaDB with Ollama embeddings...")
client = chromadb.PersistentClient(path="./chroma_db_ollama")

# Custom embedding function using Ollama
class OllamaEmbeddingFunction:
    def __init__(self, model="nomic-embed-text"):
        self.model = model
    
    def __call__(self, texts):
        embeddings = []
        for text in texts:
            embedding = get_ollama_embedding(text, self.model)
            if embedding:
                embeddings.append(embedding)
            else:
                # Fallback: create a simple embedding
                embeddings.append([0.0] * 384)  # Default dimension
        return embeddings

embedding_function = OllamaEmbeddingFunction("nomic-embed-text")

# Create collections
lotus_collection = client.create_collection(
    name="lotus_products_ollama",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"}
)

shopee_collection = client.create_collection(
    name="shopee_products_ollama", 
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"}
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

# Populate ChromaDB collections with LLM-enhanced preprocessing
print("📥 Populating ChromaDB collections with Ollama preprocessing...")

# Add Lotus products
lotus_documents = []
lotus_metadatas = []
lotus_ids = []

for idx, row in df_lotus.iterrows():
    # Use LLM to preprocess product name
    original_name = row['Lotus Product']
    processed_name = preprocess_with_llm(original_name)
    
    lotus_documents.append(processed_name)
    lotus_metadatas.append({
        'original_name': original_name,
        'processed_name': processed_name,
        'price': str(row['Lotus Price']),
        'discounted_price': str(row['Lotus Discounted Price']) if pd.notnull(row['Lotus Discounted Price']) else str(row['Lotus Original Price']),
        'original_price': str(row['Lotus Original Price']),
        'url': row['Lotus URL'],
        'timestamp': str(row['timestamp']),
        'marketplace': 'lotus'
    })
    lotus_ids.append(f"lotus_{idx}")

if lotus_documents:
    lotus_collection.add(
        documents=lotus_documents,
        metadatas=lotus_metadatas,
        ids=lotus_ids
    )

# Add Shopee products
shopee_documents = []
shopee_metadatas = []
shopee_ids = []

for idx, row in df_shopee.iterrows():
    # Use LLM to preprocess product name
    original_name = row['Shopee Product']
    processed_name = preprocess_with_llm(original_name)
    
    shopee_documents.append(processed_name)
    shopee_metadatas.append({
        'original_name': original_name,
        'processed_name': processed_name,
        'price': str(row['Shopee Price']),
        'discounted_price': str(row['Shopee Discounted Price']) if pd.notnull(row['Shopee Discounted Price']) else str(row['Shopee Original Price']),
        'original_price': str(row['Shopee Original Price']),
        'url': row['Shopee URL'],
        'shop_name': str(row['Shopee Shop Name']) if 'Shopee Shop Name' in row else '',
        'shop_url': str(row['Shopee Shop URL']) if 'Shopee Shop URL' in row else '',
        'marketplace': 'shopee'
    })
    shopee_ids.append(f"shopee_{idx}")

if shopee_documents:
    shopee_collection.add(
        documents=shopee_documents,
        metadatas=shopee_metadatas,
        ids=shopee_ids
    )

print(f"✅ Added {len(lotus_documents)} Lotus products to ChromaDB")
print(f"✅ Added {len(shopee_documents)} Shopee products to ChromaDB")

# Perform enhanced matching with LLM analysis
print("🔍 Performing Ollama-enhanced matching...")
start_time = time.time()

matched_rows = []
unmatched_lotus_rows = []
unmatched_shopee_rows = []
matched_lotus_products = set()
matched_shopee_products = set()

# Match Lotus products against Shopee products
for idx, lotus_row in df_lotus.iterrows():
    lotus_product_name = lotus_row['Lotus Product']
    processed_lotus_name = preprocess_with_llm(lotus_product_name)
    
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
    
    if best_match:
        # Extract size/unit and calculate per unit price
        lotus_qty, lotus_unit = extract_size(lotus_row['Lotus Product'])
        shopee_qty, shopee_unit = extract_size(best_match['original_name'])
        
        # Parse prices
        try:
            lotus_price = float(lotus_row['Lotus Price'])
        except:
            lotus_price = 0
        try:
            lotus_discounted_price = float(lotus_row['Lotus Discounted Price']) if pd.notnull(lotus_row['Lotus Discounted Price']) else float(lotus_row['Lotus Original Price'])
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
            "Lotus Product": lotus_row['Lotus Product'].title(),
            "Lotus URL": lotus_row['Lotus URL'],
            "Lotus Price": lotus_row['Lotus Price'],
            "Lotus Per Unit": f"{lotus_qty} {lotus_unit}" if lotus_qty else "",
            "Lotus Per Unit Price": f"{lotus_per_unit_price:.2f}" if lotus_per_unit_price else "",
            "Lotus Per Unit Calculation": lotus_calculation,
            "Lotus Discounted Price": f"{lotus_discounted_price:.2f}" if lotus_discounted_price else "",
            "Lotus Discounted Per Unit Price": f"{lotus_discounted_per_unit_price:.2f}" if lotus_discounted_per_unit_price else "",
            "Original Price (RM)": lotus_row['Lotus Original Price'],
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
            "timestamp": format_timestamp_to_yyyymmdd(lotus_row['timestamp']),
            "Match Status": "Matched"
        })
        
        matched_lotus_products.add(lotus_row['Lotus Product'].lower())
        matched_shopee_products.add(best_match['original_name'].lower())
    else:
        # Add unmatched Lotus product
        lotus_qty, lotus_unit = extract_size(lotus_row['Lotus Product'])
        try:
            lotus_price = float(lotus_row['Lotus Price'])
        except:
            lotus_price = 0
        try:
            lotus_discounted_price = float(lotus_row['Lotus Discounted Price']) if pd.notnull(lotus_row['Lotus Discounted Price']) else float(lotus_row['Lotus Original Price'])
        except:
            lotus_discounted_price = lotus_price
        
        lotus_per_unit_price = lotus_price / lotus_qty if lotus_qty else None
        lotus_discounted_per_unit_price = lotus_discounted_price / lotus_qty if lotus_qty else None
        lotus_calculation = f"RM{lotus_price:.2f} / {lotus_unit} = RM{lotus_per_unit_price:.2f}" if lotus_qty and lotus_per_unit_price and lotus_unit else ""
        
        unmatched_lotus_rows.append({
            "Lotus Product": lotus_row['Lotus Product'].title(),
            "Lotus URL": lotus_row['Lotus URL'],
            "Lotus Price": lotus_row['Lotus Price'],
            "Lotus Per Unit": f"{lotus_qty} {lotus_unit}" if lotus_qty else "",
            "Lotus Per Unit Price": f"{lotus_per_unit_price:.2f}" if lotus_per_unit_price else "",
            "Lotus Per Unit Calculation": lotus_calculation,
            "Lotus Discounted Price": f"{lotus_discounted_price:.2f}" if lotus_discounted_price else "",
            "Lotus Discounted Per Unit Price": f"{lotus_discounted_per_unit_price:.2f}" if lotus_discounted_per_unit_price else "",
            "Original Price (RM)": lotus_row['Lotus Original Price'],
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
            "timestamp": format_timestamp_to_yyyymmdd(lotus_row['timestamp']),
            "Match Status": "Unmatched Lotus"
        })

# Add unmatched Shopee products
for idx, shopee_row in df_shopee.iterrows():
    if shopee_row['Shopee Product'].lower() not in matched_shopee_products:
        shopee_qty, shopee_unit = extract_size(shopee_row['Shopee Product'])
        try:
            shopee_price = float(shopee_row['Shopee Price'])
        except:
            shopee_price = 0
        try:
            shopee_discounted_price = float(shopee_row['Shopee Discounted Price']) if pd.notnull(shopee_row['Shopee Discounted Price']) else float(shopee_row['Shopee Original Price'])
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
            "Shopee Product": shopee_row['Shopee Product'].title(),
            "Shopee URL": shopee_row['Shopee URL'],
            "Shopee Shop Name": shopee_row['Shopee Shop Name'] if 'Shopee Shop Name' in shopee_row else "",
            "Shopee Shop URL": shopee_row['Shopee Shop URL'] if 'Shopee Shop URL' in shopee_row else "",
            "Shopee Price": shopee_row['Shopee Price'],
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
EOF

chmod +x /home/ubuntu/matchfuzzy_ollama.py

# Create startup script
echo "🚀 Creating startup script..."
cat > /home/ubuntu/start_product_matching.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/price-scanner

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Starting Ollama service..."
    sudo systemctl start ollama
    sleep 30
fi

# Run the product matching script
echo "Starting Ollama-enhanced product matching..."
python3 matchfuzzy_ollama.py
EOF

chmod +x /home/ubuntu/start_product_matching.sh

# Set permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/price-scanner
sudo chown -R ubuntu:ubuntu /home/ubuntu/.ollama

# Run health check
echo "🏥 Running health check..."
/home/ubuntu/health_check.sh

# Display final status
echo ""
echo "🎉 Complete Ollama Setup for Product Matching!"
echo "=============================================="
echo ""
echo "📊 System Information:"
echo "   - Ollama Version: $(ollama --version)"
echo "   - Python Version: $(python3 --version)"
echo "   - Available Models:"
ollama list
echo ""
echo "📁 Directory Structure:"
echo "   - Application: /home/ubuntu/price-scanner/"
echo "   - Ollama Models: /home/ubuntu/.ollama/models/"
echo "   - Scripts: /home/ubuntu/"
echo ""
echo "🚀 Quick Start Commands:"
echo "   - Monitor: /home/ubuntu/monitor_ollama.sh"
echo "   - Health Check: /home/ubuntu/health_check.sh"
echo "   - Start Matching: /home/ubuntu/start_product_matching.sh"
echo ""
echo "🔧 Service Management:"
echo "   - Start: sudo systemctl start ollama"
echo "   - Stop: sudo systemctl stop ollama"
echo "   - Status: sudo systemctl status ollama"
echo "   - Logs: sudo journalctl -u ollama -f"
echo ""
echo "📈 Monitoring:"
echo "   - CPU: htop"
echo "   - Memory: free -h"
echo "   - Disk: df -h"
echo "   - Ollama API: curl http://localhost:11434/api/tags"
echo ""

# Save setup completion timestamp
echo "$(date): Complete Ollama setup completed successfully" >> /home/ubuntu/setup.log

echo "✅ Setup completed successfully!" 