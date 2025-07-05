import pandas as pd
import requests

url = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison-2.json"
response = requests.get(url)
data = response.json()

# Get cluster 0 specifically
cluster_0 = data[0]

print(f"🔍 CLUSTER 0 DETAILS:")
print(f"Cluster ID: {cluster_0['cluster_id']}")
print(f"Representative Name: {cluster_0['representative_name']}")
print(f"Lowest Price: {cluster_0['lowest_price']}")
print(f"Lowest Marketplace: {cluster_0['lowest_marketplace']}")
print(f"Lowest URL: {cluster_0['lowest_url']}")
print(f"Cluster Size: {cluster_0['cluster_size']}")

print(f"\n📦 ALL PRODUCTS IN CLUSTER 0:")
all_products = cluster_0['all_products']
print(f"Raw all_products string length: {len(all_products)}")

# Split by semicolon and show each product
products = all_products.split(';')
print(f"\n🍜 Found {len(products)} products in cluster:")

indomie_count = 0
for i, product in enumerate(products[:20]):  # Show first 20 products
    product = product.strip()
    if product:
        is_indomie = 'INDOMIE' in product.upper()
        if is_indomie:
            indomie_count += 1
        print(f"{i+1:2d}. {'🍜' if is_indomie else '  '} {product}")

print(f"\n📊 INDOMIE products in cluster 0: {indomie_count}")

# Test the regex pattern on INDOMIE products
print(f"\n🧪 TESTING REGEX PATTERN:")
import re
pattern = r'^(.+?)\s*-\s*RM([\d.]+)$'

indomie_products = [p.strip() for p in products if 'INDOMIE' in p.upper()]
for product in indomie_products[:5]:  # Test first 5 INDOMIE products
    if product:
        match = re.match(pattern, product)
        if match:
            name, price = match.groups()
            print(f"✅ '{product}' → Name: '{name.strip()}', Price: RM{price}")
        else:
            print(f"❌ '{product}' → REGEX FAILED") 