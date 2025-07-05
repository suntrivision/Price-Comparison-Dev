import pandas as pd
import requests

url = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-2.json"
response = requests.get(url)
data = response.json()

print(f"📊 Total clusters received: {len(data)}")
print(f"📋 Sample cluster structure: {list(data[0].keys()) if len(data) > 0 else 'No data'}")

# Convert to DataFrame
df = pd.DataFrame(data)
print(f"📊 DataFrame shape: {df.shape}")
print(f"📊 DataFrame columns: {df.columns.tolist()}")

# Check if 'all_products' column exists and has data
if 'all_products' in df.columns:
    print(f"📦 all_products column has {df['all_products'].notna().sum()} non-null values")
    
    # Look for any INDOMIE products (case insensitive)
    indomie_clusters = df[df['all_products'].str.contains('INDOMIE', case=False, na=False)]
    print(f"🍜 Found {len(indomie_clusters)} clusters containing INDOMIE")
    
    if len(indomie_clusters) > 0:
        print("\n🔍 INDOMIE clusters found:")
        for idx, row in indomie_clusters.iterrows():
            print(f"Cluster {row['cluster_id']}: {row['representative_name']}")
            print(f"All products: {row['all_products'][:200]}...")
            print("---")
    
    # Also search for the specific products you mentioned
    search_products = [
        'INDOMIE MI GORENG ASLI 80GX5',
        'INDOMIE MI GORENG ASLI VALUE PACK 10S', 
        'CP8_INDOMIE MI GORENG ASLI (GSM) 5x80G'
    ]
    
    print(f"\n🎯 Searching for specific products:")
    for product in search_products:
        found = df[df['all_products'].str.contains(product, case=False, na=False)]
        print(f"'{product}': {'FOUND' if len(found) > 0 else 'NOT FOUND'}")
        
else:
    print("❌ 'all_products' column not found in data")
    print(f"Available columns: {df.columns.tolist()}")

# Show first few rows to understand the structure
print(f"\n📋 First cluster sample:")
if len(data) > 0:
    first_cluster = data[0]
    for key, value in first_cluster.items():
        if key == 'all_products':
            print(f"  {key}: {str(value)[:100]}..." if value else f"  {key}: None")
        else:
            print(f"  {key}: {value}")
