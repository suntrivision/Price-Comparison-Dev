import pandas as pd
from difflib import SequenceMatcher

# Load your combined Lotus & Shopee Excel file
file_path = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/lotuss/combined_shopeeLotusFBeCatHORECA4-0.csv"

# Read the CSV file directly from S3 with proper encoding
try:
    df_combined = pd.read_csv(file_path, encoding='utf-8')
except UnicodeDecodeError:
    # Try with different encodings if UTF-8 fails
    try:
        df_combined = pd.read_csv(file_path, encoding='latin-1')
    except:
        df_combined = pd.read_csv(file_path, encoding='cp1252')

# Normalize product name and detect marketplace from URL
df_combined['Product Name Normalized'] = df_combined['Product Name'].astype(str).str.lower().str.strip()
df_combined['Product URL'] = df_combined['Product URL'].astype(str).str.lower().str.strip()

# Use discounted price if available, otherwise use original price
df_combined['Current Price (RM)'] = df_combined['Discounted Price (RM)'].fillna(df_combined['Original Price (RM)'])

# Detect marketplace from Product URL
df_combined['Marketplace'] = df_combined['Product URL'].apply(lambda url: 
    'lotus' if 'lotus' in url else 
    'shopee' if 'shopee' in url else 
    'unknown'
)

# Print data statistics
print(f"📊 Total records loaded: {len(df_combined)}")
print(f"🔍 Marketplace distribution:")
print(df_combined['Marketplace'].value_counts())
print()

# Split data by marketplace based on URL detection
df_lotus = df_combined[df_combined['Marketplace'] == 'lotus'][['Product Name Normalized', 'Current Price (RM)', 'Product URL']].copy()
df_shopee = df_combined[df_combined['Marketplace'] == 'shopee'][['Product Name Normalized', 'Current Price (RM)', 'Product URL']].copy()

print(f"🪷 Lotus products found: {len(df_lotus)}")
print(f"🛍️ Shopee products found: {len(df_shopee)}")
print()

# Rename columns for clarity
df_lotus.columns = ['Lotus Product', 'Lotus Price', 'Lotus URL']
df_shopee.columns = ['Shopee Product', 'Shopee Price', 'Shopee URL']

# Fuzzy match: best match for each Lotus product from Shopee
matched_rows = []
for _, lotus_row in df_lotus.iterrows():
    best_score = 0
    best_row = None
    for _, shopee_row in df_shopee.iterrows():
        score = SequenceMatcher(None, lotus_row['Lotus Product'], shopee_row['Shopee Product']).ratio()
        if score > best_score:
            best_score = score
            best_row = shopee_row
    if best_row is not None:
        matched_rows.append({
            "Lotus Product": lotus_row['Lotus Product'].title(),
            "Lotus URL": lotus_row['Lotus URL'],
            "Lotus Price": lotus_row['Lotus Price'],
            "Shopee Product": best_row['Shopee Product'].title(),
            "Shopee URL": best_row['Shopee URL'],
            "Shopee Price": best_row['Shopee Price'],
            "Match Score": round(best_score * 100, 2)
        })

# Final DataFrame
final_df = pd.DataFrame(matched_rows).sort_values(by="Match Score", ascending=False)

print(f"🎯 Total matches created: {len(final_df)}")
print(f"📈 Best match score: {final_df['Match Score'].max():.2f}%" if len(final_df) > 0 else "No matches found")
print(f"📊 Average match score: {final_df['Match Score'].mean():.2f}%" if len(final_df) > 0 else "")

# Output result
final_df.to_excel("https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_05072025.csv", index=False)
print("✅ Matching complete. Output saved to 'matched_lotus_shopee_output.xlsx'")
