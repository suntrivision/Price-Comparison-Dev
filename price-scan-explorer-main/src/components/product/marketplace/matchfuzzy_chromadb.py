import pandas as pd
import boto3
import io
from datetime import datetime
import re
import chromadb
from chromadb.utils import embedding_functions
import numpy as np
from sentence_transformers import SentenceTransformer
import time

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

# Initialize ChromaDB with sentence transformers for better semantic matching
print("🚀 Initializing ChromaDB with semantic embeddings...")
client = chromadb.PersistentClient(path="./chroma_db")

# Use sentence-transformers for better semantic understanding
embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"  # Good balance of speed and accuracy
)

# Create collections for each marketplace
lotus_collection = client.create_collection(
    name="lotus_products",
    embedding_function=embedding_function,
    metadata={"hnsw:space": "cosine"}
)

shopee_collection = client.create_collection(
    name="shopee_products", 
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

def preprocess_product_name(product_name):
    """Clean and standardize product names for better matching"""
    # Remove common noise words and standardize
    noise_words = ['new', 'original', 'authentic', 'genuine', 'official', 'brand', 'product']
    name_lower = product_name.lower()
    
    # Remove noise words
    for word in noise_words:
        name_lower = name_lower.replace(word, '')
    
    # Standardize common variations
    replacements = {
        'coca cola': 'coke',
        'coca-cola': 'coke',
        'pepsi cola': 'pepsi',
        'pepsi-cola': 'pepsi',
        'nike air': 'nike',
        'adidas originals': 'adidas',
        'samsung galaxy': 'samsung',
        'iphone': 'apple iphone',
        'ipad': 'apple ipad',
        'macbook': 'apple macbook'
    }
    
    for old, new in replacements.items():
        name_lower = name_lower.replace(old, new)
    
    # Clean up extra spaces
    name_lower = ' '.join(name_lower.split())
    
    return name_lower

# Populate ChromaDB collections
print("📥 Populating ChromaDB collections...")

# Add Lotus products
lotus_documents = []
lotus_metadatas = []
lotus_ids = []

for idx, row in df_lotus.iterrows():
    product_name = preprocess_product_name(row['Lotus Product'])
    lotus_documents.append(product_name)
    lotus_metadatas.append({
        'original_name': row['Lotus Product'],
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
    product_name = preprocess_product_name(row['Shopee Product'])
    shopee_documents.append(product_name)
    shopee_metadatas.append({
        'original_name': row['Shopee Product'],
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

# Perform semantic matching
print("🔍 Performing semantic matching...")
start_time = time.time()

matched_rows = []
unmatched_lotus_rows = []
unmatched_shopee_rows = []
matched_lotus_products = set()
matched_shopee_products = set()

# Match Lotus products against Shopee products
for idx, lotus_row in df_lotus.iterrows():
    lotus_product_name = preprocess_product_name(lotus_row['Lotus Product'])
    
    # Query Shopee collection for similar products
    results = shopee_collection.query(
        query_texts=[lotus_product_name],
        n_results=5,  # Get top 5 matches
        include=['metadatas', 'distances']
    )
    
    best_match = None
    best_score = 0
    
    if results['metadatas'] and results['metadatas'][0]:
        for i, metadata in enumerate(results['metadatas'][0]):
            distance = results['distances'][0][i]
            # Convert distance to similarity score (cosine distance to similarity)
            similarity_score = 1 - distance
            
            if similarity_score > best_score and similarity_score > 0.6:  # Higher threshold for semantic matching
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

print(f"⚡ Processing completed in {processing_time:.2f} seconds")
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
    s3_key = 'thunderbitscrape/matched_lotus_shopee_chromadb_output_08072025.csv'
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=csv_buffer.getvalue(),
        ContentType='text/csv'
    )
    
    print(f"✅ ChromaDB matching complete. Output saved to S3: s3://{bucket_name}/{s3_key}")
    print(f"🔗 S3 URL: https://{bucket_name}.s3.ap-southeast-1.amazonaws.com/{s3_key}")
    
except Exception as e:
    print(f"❌ Error uploading to S3: {e}")
    output_file = "matched_lotus_shopee_chromadb_output_08072025.csv"
    final_df.to_csv(output_file, index=False)
    print(f"📁 Saved locally as fallback: {output_file}")

# Clean up ChromaDB collections
print("🧹 Cleaning up ChromaDB collections...")
client.delete_collection("lotus_products")
client.delete_collection("shopee_products")
print("✅ ChromaDB cleanup complete") 