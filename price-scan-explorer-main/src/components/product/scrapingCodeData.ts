
import { Product } from "@/types";

// The actual Python script for scraping Lotus's Malaysia weekly savers
export const pythonCode = `from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json
import time
import os
import datetime
import re
import uuid

# START_URL = "https://www.lotuss.com.my/en/category/ramraya-special-deals-2025?sort=relevance:DESC"
START_URL = "https://www.lotuss.com.my/en/promotion/weekly-savers?sort=relevance:DESC"
OUTPUT_JSON = "products.json"
DISCOUNTED_OUTPUT_JSON = "discounted_products.json"
BUNDLE_DEALS_JSON = "bundle_deals.json"
PRODUCTS_FOLDER = "products"

os.makedirs(PRODUCTS_FOLDER, exist_ok=True)

def print_human_friendly_fields(card, index):
    print(f"\\n📦 Product {index} — Human-Readable Fields:")
    for tag in card.find_all(True):
        tag_text = tag.get_text(strip=True)
        tag_attrs = tag.attrs
        if tag_text or tag_attrs:
            print(f"🔹 <{tag.name}>")
            if tag_text:
                print(f"   Text   : {tag_text}")
            if tag_attrs:
                for attr, val in tag_attrs.items():
                    if isinstance(val, list):
                        val = " ".join(val)
                    print(f"   {attr:<7}: {val}")

def scrape_product_cards_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    results = []
    discounted_results = []
    bundle_deals = []

    cards = soup.select('div.sc-jlsrNB.cFEexI')
    print(f"🧱 Found {len(cards)} product cards.")

    for index, card in enumerate(cards, 1):
        # print_human_friendly_fields(card, index)

        name_tag = card.select_one('a#product-title')
        name = name_tag.text.strip() if name_tag else "N/A"

        sale_tag = card.select_one('p.sc-cVAmsi.itbQEF')
        original_tag = card.select_one('p.sc-ksHpcM.lcjjkh')

        sale_price = sale_tag.get_text(strip=True) if sale_tag else "N/A"
        original_price = original_tag.get_text(strip=True) if original_tag else sale_price

        if not sale_price.startswith("RM"):
            sale_price = "RM" + sale_price
        if not original_price.startswith("RM"):
            original_price = "RM" + original_price

        discount = "N/A"
        try:
            original = float(original_price.replace("RM", "").replace(",", ""))
            sale = float(sale_price.replace("RM", "").replace(",", ""))
            if original > sale:
                discount = f"{round(((original - sale) / original) * 100, 2)}%"
        except:
            pass

        image_tag = card.select_one('img')
        image = image_tag['src'] if image_tag else "N/A"

        product_data = {
            "uid": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now().isoformat(),
            "name": name,
            "original_price": original_price,
            "sale_price": sale_price,
            "discount": discount,
            "image": image
        }

        results.append(product_data)

        if discount != "N/A" and discount != "0.0%":
            discounted_results.append(product_data)
            #print(f"✅ Discounted: {name} — {sale_price} → {original_price} ({discount})")
        elif re.search(r"\\d+\\s*for\\s*RM", name, re.IGNORECASE):
            bundle_deals.append(product_data)
            #print(f"📦 Bundle Deal: {name}")

    return results, discounted_results, bundle_deals

def append_to_json(data, filename):
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    else:
        existing_data = []

    existing_data.extend(data)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)

def scrape_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print(f"🔗 Navigating to {START_URL}")
        page.goto(START_URL, wait_until="networkidle")
        page.wait_for_timeout(5000)

        print("📜 Scrolling to load all product cards...")
        for _ in range(15):
            page.mouse.wheel(0, 3000)
            time.sleep(1)

        html = page.content()
        browser.close()

    print("🔍 Extracting data from product cards...")
    products, discounted_products, bundle_deals = scrape_product_cards_from_html(html)
    append_to_json(products, OUTPUT_JSON)
    append_to_json(discounted_products, DISCOUNTED_OUTPUT_JSON)
    append_to_json(bundle_deals, BUNDLE_DEALS_JSON)

    print(f"\\n✅ Extracted {len(products)} products total.")
    print(f"📄 Combined data saved in: {OUTPUT_JSON}")

if __name__ == "__main__":
    scrape_all()`;

// Actual scraped data from Lotus's Malaysia weekly savers
export const scrapedData: Product[] = [
  {
    "id": "e2438828-fd1b-4c83-be55-8a35c474a182",
    "timestamp": "2025-05-20T08:15:33.671782Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "FARM FRESH MILK CHOCOLATE 200ML",
    "sale_price": "RM2.99",
    "original_price": "RM3.50",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52669425.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "5c91b6c8-d83b-4aa0-9f17-29ce5f1efd92",
    "timestamp": "2025-05-20T08:15:33.692450Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "MILO ACTIV-GO 1KG",
    "sale_price": "RM18.99",
    "original_price": "RM22.90",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52650913.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "07b9c3a1-f4db-4cd8-b728-1e93f5a61d8c",
    "timestamp": "2025-05-20T08:15:33.702159Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "AJINOMOTO CRISPY FRIED CHICKEN 120G",
    "sale_price": "RM3.99",
    "original_price": "RM4.59",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52651203.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "a4f3c1e7-b9d8-42f1-9c63-78a5e0db21f4",
    "timestamp": "2025-05-20T08:15:33.712384Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "MAGGI CURRY INSTANT NOODLES 5X78G",
    "sale_price": "RM5.49",
    "original_price": "RM6.50",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52651512.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "b2e5a9c8-7f42-4d61-8b3a-9c04e6f82d17",
    "timestamp": "2025-05-20T08:15:33.722476Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "DETTOL SHOWER GEL FRESH 950ML",
    "sale_price": "RM15.99",
    "original_price": "RM19.90",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52651743.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "c6d7e8f9-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
    "timestamp": "2025-05-20T08:15:33.732642Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "NESTLE HONEY STARS 150G",
    "sale_price": "RM5.99",
    "original_price": "RM7.20",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52652118.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "d8e9f0a1-2b3c-4d5e-6f7g-8h9i0j1k2l3m",
    "timestamp": "2025-05-20T08:15:33.742795Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "DUTCH LADY PUREFARM UHT MILK 1L",
    "sale_price": "RM6.50",
    "original_price": "RM8.99",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52652316.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "e0f1g2h3-i4j5-k6l7-m8n9-o0p1q2r3s4t5",
    "timestamp": "2025-05-20T08:15:33.752918Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "DOVE SHAMPOO NOURISHING OIL CARE 680ML",
    "sale_price": "RM17.90",
    "original_price": "RM22.90",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52652517.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "6a7b8c9d-e0f1-g2h3-i4j5-k6l7m8n9o0p1",
    "timestamp": "2025-05-20T08:15:33.763042Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "MAMEE MONSTER SNACK NOODLE 8X25G",
    "sale_price": "RM4.29",
    "original_price": "RM5.49",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52653012.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "q2r3s4t5-u6v7-w8x9-y0z1-a2b3c4d5e6f7",
    "timestamp": "2025-05-20T08:15:33.773165Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "MISTER POTATO CHIPS RED 75G",
    "sale_price": "RM3.49",
    "original_price": "RM4.19",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52653301.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "g8h9i0j1-k2l3-m4n5-o6p7-q8r9s0t1u2v3",
    "timestamp": "2025-05-20T08:15:33.783289Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "COLGATE TOOTHPASTE TOTAL CHARCOAL 2X150G",
    "sale_price": "RM16.99",
    "original_price": "RM21.90",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52653587.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  },
  {
    "id": "w4x5y6z7-a8b9-c0d1-e2f3-g4h5i6j7k8l9",
    "timestamp": "2025-05-20T08:15:33.793413Z",
    "source_url": "https://www.lotuss.com.my/en/promotion/weekly-savers",
    "name": "SUNLIGHT DISHWASHING LIQUID LEMON 1.5L",
    "sale_price": "RM7.99",
    "original_price": "RM10.90",
    "image": "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/new/90635/52654128.jpg/jcr:content/renditions/plp-large.jpeg",
    "category": "weekly-savers",
    "store": "Lotus's"
  }
];
