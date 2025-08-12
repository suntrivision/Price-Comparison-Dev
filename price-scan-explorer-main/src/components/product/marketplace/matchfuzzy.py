import pandas as pd
from difflib import SequenceMatcher
import boto3
import io
from datetime import datetime
import re

# Load your combined Lotus & Shopee Excel file
file_path = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA12-0.csv"

# Read the CSV file directly from S3 with proper encoding
try:
    df_combined = pd.read_csv(file_path, encoding='utf-8')
except UnicodeDecodeError:
    # Try with different encodings if UTF-8 fails
    try:
        df_combined = pd.read_csv(file_path, encoding='latin-1')
    except:
        df_combined = pd.read_csv(file_path, encoding='cp1252')

# Normalize product name for matching (lowercase for comparison)
df_combined['Product Name Normalized'] = df_combined['Product Name'].astype(str).str.lower().str.strip()

# Preserve original URL case - only normalize for marketplace detection
df_combined['Product URL Original'] = df_combined['Product URL'].astype(str).str.strip()
df_combined['Product URL Normalized'] = df_combined['Product URL'].astype(str).str.lower().str.strip()

# Use discounted price if available, otherwise use original price
df_combined['Current Price (RM)'] = df_combined['Discounted Price (RM)'].fillna(df_combined['Original Price (RM)'])

# Detect marketplace from normalized URL (for detection only)
df_combined['Marketplace'] = df_combined['Product URL Normalized'].apply(lambda url: 
    'lotus' if 'lotus' in url else 
    'shopee' if 'shopee' in url else 
    'unknown'
)

# Print data statistics
print(f"📊 Total records loaded: {len(df_combined)}")
print(f"🔍 Marketplace distribution:")
print(df_combined['Marketplace'].value_counts())
print(f"📋 Available columns:")
print(df_combined.columns.tolist())
print()

# Split data by marketplace based on URL detection
# When splitting data by marketplace, include discounted price columns if available
lotus_cols = ['Product Name Normalized', 'Current Price (RM)', 'Discounted Price (RM)', 'Original Price (RM)', 'Product URL Original', 'timestamp']
shopee_cols = ['Product Name Normalized', 'Current Price (RM)', 'Discounted Price (RM)', 'Original Price (RM)', 'Product URL Original', 'Shop name', 'Shop url']
df_lotus = df_combined[df_combined['Marketplace'] == 'lotus'][lotus_cols].copy()
df_shopee = df_combined[df_combined['Marketplace'] == 'shopee'][shopee_cols].copy()
df_lotus.columns = ['Lotus Product', 'Lotus Price', 'Lotus Discounted Price', 'Lotus Original Price', 'Lotus URL', 'timestamp']
df_shopee.columns = ['Shopee Product', 'Shopee Price', 'Shopee Discounted Price', 'Shopee Original Price', 'Shopee URL', 'Shopee Shop Name', 'Shopee Shop URL']

print(f"🪷 Lotus products found: {len(df_lotus)}")
print(f"🛍️ Shopee products found: {len(df_shopee)}")
print()

# Rename columns for clarity
# df_lotus.columns = ['Lotus Product', 'Lotus Price', 'Lotus URL', 'timestamp']
# df_shopee.columns = ['Shopee Product', 'Shopee Price', 'Shopee URL']

# Fuzzy match: best match for each Lotus product from Shopee
# Also include unmatched products
matched_rows = []
unmatched_lotus_rows = []
unmatched_shopee_rows = []
current_timestamp = datetime.now().isoformat()

def format_timestamp_to_yyyymmdd(timestamp_str):
    """Convert timestamp to yyyy/mm/dd format"""
    try:
        # Try to parse the timestamp
        if pd.isna(timestamp_str) or timestamp_str == '':
            return datetime.now().strftime('%Y/%m/%d')
        
        # If it's already in yyyy/mm/dd format, return as is
        if isinstance(timestamp_str, str) and re.match(r'\d{4}/\d{2}/\d{2}', timestamp_str):
            return timestamp_str
        
        # Try to parse various timestamp formats
        if isinstance(timestamp_str, str):
            # Try ISO format first
            try:
                dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                return dt.strftime('%Y/%m/%d')
            except:
                pass
            
            # Try other common formats
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    dt = datetime.strptime(timestamp_str, fmt)
                    return dt.strftime('%Y/%m/%d')
                except:
                    continue
        
        # If all parsing fails, return current date
        return datetime.now().strftime('%Y/%m/%d')
    except:
        return datetime.now().strftime('%Y/%m/%d')

def extract_size(product_name):
    """Extract size/unit information from product name with enhanced pattern matching"""
    product_name_lower = product_name.lower()
    
    # Pattern 1: Handle "3×16.8g" or "3x16.8g" format (quantity × size)
    match = re.search(r'(\d+)\s*[x×]\s*([\d\.]+)\s*(kg|g|l|ml|s|pcs|pack)', product_name_lower)
    if match:
        quantity = int(match.group(1))  # Number of units (e.g., 3)
        size = float(match.group(2))    # Size per unit (e.g., 16.8)
        unit = match.group(3)           # Unit (e.g., g)
        
        # Return the quantity (for price division) and the pack description
        return quantity, f"{quantity} packs"
    
    # Pattern 2: Handle "3.6Kg", "5Kg", "200Ml", "85G", "10S", "1L", etc.
    match = re.search(r'([\d\.]+)\s*(kg|g|l|ml|s|pcs|pack)', product_name_lower)
    if match:
        qty = float(match.group(1))
        unit = match.group(2)
        # For single items, treat as 1 pack
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

# Track which products have been matched
matched_lotus_products = set()
matched_shopee_products = set()

for _, lotus_row in df_lotus.iterrows():
    best_score = 0
    best_row = None
    for _, shopee_row in df_shopee.iterrows():
        score = SequenceMatcher(None, lotus_row['Lotus Product'], shopee_row['Shopee Product']).ratio()
        if score > best_score:
            best_score = score
            best_row = shopee_row
    
    if best_row is not None and best_score > 0.3:  # Only consider matches with score > 30%
        # Extract size/unit and calculate per unit price
        lotus_qty, lotus_unit = extract_size(lotus_row['Lotus Product'])
        shopee_qty, shopee_unit = extract_size(best_row['Shopee Product'])
        
        # Use discounted price if available, otherwise original price
        try:
            lotus_price = float(lotus_row['Lotus Price'])
        except:
            lotus_price = 0
        try:
            lotus_discounted_price = float(lotus_row['Lotus Discounted Price']) if pd.notnull(lotus_row['Lotus Discounted Price']) else float(lotus_row['Lotus Original Price'])
        except:
            lotus_discounted_price = lotus_price
        try:
            shopee_price = float(best_row['Shopee Price'])
        except:
            shopee_price = 0
        try:
            shopee_discounted_price = float(best_row['Shopee Discounted Price']) if pd.notnull(best_row['Shopee Discounted Price']) else float(best_row['Shopee Original Price'])
        except:
            shopee_discounted_price = shopee_price
        
        # Calculate per unit prices - lotus_qty is now the quantity for division (pack)
        lotus_per_unit_price = lotus_price / lotus_qty if lotus_qty else None
        lotus_discounted_per_unit_price = lotus_discounted_price / lotus_qty if lotus_qty else None
        shopee_per_unit_price = shopee_price / shopee_qty if shopee_qty else None
        shopee_discounted_per_unit_price = shopee_discounted_price / shopee_qty if shopee_qty else None
        
        # Create calculation formulas for display - show per pack calculation
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
            "Shopee Product": best_row['Shopee Product'].title(),
            "Shopee URL": best_row['Shopee URL'],
            "Shopee Shop Name": best_row['Shopee Shop Name'] if 'Shopee Shop Name' in best_row else "",
            "Shopee Shop URL": best_row['Shopee Shop URL'] if 'Shopee Shop URL' in best_row else "",
            "Shopee Price": best_row['Shopee Price'],
            "Shopee Per Unit": f"{shopee_qty} {shopee_unit}" if shopee_qty else "",
            "Shopee Per Unit Price": f"{shopee_per_unit_price:.2f}" if shopee_per_unit_price else "",
            "Shopee Per Unit Calculation": shopee_calculation,
            "Shopee Discounted Price": f"{shopee_discounted_price:.2f}" if shopee_discounted_price else "",
            "Shopee Discounted Per Unit Price": f"{shopee_discounted_per_unit_price:.2f}" if shopee_discounted_per_unit_price else "",
            "Match Score": round(best_score * 100, 2),
            "timestamp": format_timestamp_to_yyyymmdd(lotus_row['timestamp']),
            "Match Status": "Matched"
        })
        
        # Track matched products
        matched_lotus_products.add(lotus_row['Lotus Product'].lower())
        matched_shopee_products.add(best_row['Shopee Product'].lower())
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
        
        # Calculate per unit prices - lotus_qty is now the quantity for division (pack)
        lotus_per_unit_price = lotus_price / lotus_qty if lotus_qty else None
        lotus_discounted_per_unit_price = lotus_discounted_price / lotus_qty if lotus_qty else None
        
        # Create calculation formula for display - show per pack calculation
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
for _, shopee_row in df_shopee.iterrows():
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
        
        # Calculate per unit prices - shopee_qty is now the quantity for division (pack)
        shopee_per_unit_price = shopee_price / shopee_qty if shopee_qty else None
        shopee_discounted_per_unit_price = shopee_discounted_price / shopee_qty if shopee_qty else None
        
        # Create calculation formula for display - show per pack calculation
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

# Final DataFrame - sort by match status first, then by match score
final_df = pd.DataFrame(all_rows)
if len(final_df) > 0:
    # Create a custom sorting order: Matched first, then Unmatched Lotus, then Unmatched Shopee
    status_order = {'Matched': 0, 'Unmatched Lotus': 1, 'Unmatched Shopee': 2}
    final_df['status_order'] = final_df['Match Status'].map(status_order)
    final_df = final_df.sort_values(by=['status_order', 'Match Score'], ascending=[True, False])
    final_df = final_df.drop('status_order', axis=1)

print(f"🎯 Total matches created: {len(matched_rows)}")
print(f"🪷 Unmatched Lotus products: {len(unmatched_lotus_rows)}")
print(f"🛍️ Unmatched Shopee products: {len(unmatched_shopee_rows)}")
print(f"📊 Total products in output: {len(final_df)}")
print(f"📈 Best match score: {final_df[final_df['Match Score'] > 0]['Match Score'].max():.2f}%" if len(final_df[final_df['Match Score'] > 0]) > 0 else "No matches found")
print(f"📊 Average match score: {final_df[final_df['Match Score'] > 0]['Match Score'].mean():.2f}%" if len(final_df[final_df['Match Score'] > 0]) > 0 else "")
print(f"🕒 Timestamp: {current_timestamp}")

# Save to S3
try:
    # Initialize S3 client
    s3_client = boto3.client('s3')
    
    # Convert DataFrame to CSV string
    csv_buffer = io.StringIO()
    final_df.to_csv(csv_buffer, index=False)
    
    # Upload to S3
    bucket_name = 'prodpromo'
    s3_key = 'thunderbitscrape/matched_lotus_shopee_output_08072025.csv'
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=s3_key,
        Body=csv_buffer.getvalue(),
        ContentType='text/csv'
    )
    
    print(f"✅ Matching complete. Output saved to S3: s3://{bucket_name}/{s3_key}")
    print(f"📊 Total matched products: {len(final_df)}")
    print(f"🔗 S3 URL: https://{bucket_name}.s3.ap-southeast-1.amazonaws.com/{s3_key}")
    
except Exception as e:
    print(f"❌ Error uploading to S3: {e}")
    # Fallback: save locally
    output_file = "matched_lotus_shopee_output_08072025.csv"
    final_df.to_csv(output_file, index=False)
    print(f"📁 Saved locally as fallback: {output_file}")
