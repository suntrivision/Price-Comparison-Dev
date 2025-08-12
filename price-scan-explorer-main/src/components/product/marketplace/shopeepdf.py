import os
import fitz  # PyMuPDF
import pandas as pd
from datetime import datetime

def extract_lines_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    lines = []
    for page in doc:
        text = page.get_text()
        for line in text.split('\n'):
            lines.append(line.strip())
    return lines

def clean_product_name(product_name):
    """Clean product name by removing COD, Shipping, and extra spaces"""
    import re
    
    # Print original for debugging
    print(f"Original: '{product_name}'")
    
    # Step 1: Remove COD variations (case insensitive)
    cleaned = re.sub(r'\b(cod|C\.O\.D|C\.O\.D\.|cash\s+on\s+delivery)\b', '', product_name, flags=re.IGNORECASE)
    
    # Step 2: Remove Shipping variations (case insensitive)
    cleaned = re.sub(r'\b(shipping|free\s+shipping|free\s+delivery|delivery)\b', '', cleaned, flags=re.IGNORECASE)
    
    # Step 3: Remove common marketplace terms
    cleaned = re.sub(r'\b(shopee|lazada|grab|foodpanda)\b', '', cleaned, flags=re.IGNORECASE)
    
    # Step 4: Remove extra spaces and trim
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Step 5: Remove leading/trailing punctuation
    cleaned = re.sub(r'^[^\w\s]+|[^\w\s]+$', '', cleaned).strip()
    
    # Print cleaned for debugging
    print(f"Cleaned: '{cleaned}'")
    
    return cleaned

def extract_product_data(lines):
    data = []
    for i in range(len(lines)):
        line = lines[i]
        if line.startswith("RM") and i > 0:
            try:
                product_name = lines[i - 1]
                # Clean the product name
                cleaned_product_name = clean_product_name(product_name)
                
                original_price = ""
                discount_price = line
                discount = ""
                
                # Look ahead for discount
                if i + 1 < len(lines) and "%" in lines[i + 1]:
                    discount = lines[i + 1].replace("-", "").strip()

                # Extract size if available
                size = ""
                if "(" in cleaned_product_name and ")" in cleaned_product_name:
                    size = cleaned_product_name.split("(")[-1].split(")")[0]

                data.append({
                    "product_name": cleaned_product_name,
                    "size": size,
                    "original_price": original_price,
                    "discount_price": discount_price,
                    "discount": discount,
                    "image": "https://shopee.com.my/image_not_available.jpg",
                    "timestamp": datetime.now().strftime("%Y/%m/%d")
                })
            except Exception as e:
                print(f"Error processing line {i}: {e}")
    return data

def process_pdfs_in_folder(folder_path, output_csv):
    all_data = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(folder_path, filename)
            lines = extract_lines_from_pdf(pdf_path)
            product_data = extract_product_data(lines)
            all_data.extend(product_data)

    df = pd.DataFrame(all_data)

    if os.path.exists(output_csv):
        df.to_csv(output_csv, mode='a', index=False, header=False)
    else:
        df.to_csv(output_csv, index=False)

    print(f"Appended {len(df)} records to {output_csv}")

# Example usage
folder_with_pdfs = r"C:\shopeepdfs"  # Change to your folder path
output_csv_file = "shopee_products.csv"

process_pdfs_in_folder(folder_with_pdfs, output_csv_file)
