from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time
from datetime import datetime
import re

# Setup Edge in InPrivate mode (no headless)
options = Options()
# options.add_argument("--headless")  # Commented out to show browser window
options.add_argument("--inprivate")  # Edge's incognito mode
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("--window-size=1920,1080")
options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Edge(options=options)
wait = WebDriverWait(driver, 10)

# Initialize products list
all_products = []
timestamp_now = datetime.now().strftime("%Y-%m-%d %H:%M")

print("🚀 Starting Shopee Supermarket scraping")
print("📝 Opening Shopee Supermarket page...")

# Open the specific Shopee URL first
initial_url = "https://shopee.com.my/supermarket/all-products?noCorrection=true&page=1&sortBy=relevancy"
driver.get(initial_url)
print(f"   Opened: {initial_url}")

print("📝 Please log in if needed and navigate to any products page")
print("⏳ Waiting for you to navigate to a products page...")

# Wait for manual navigation
input("Press Enter when you're on a products page and ready to start scraping...")

# Scrape current page (manual navigation)
try:
    print(f"📄 Scraping current page...")
    
    # Get current URL
    current_url = driver.current_url
    print(f"   Current URL: {current_url}")
    
    # Wait a bit for page to fully load
    time.sleep(3)

    # Scroll to load all products on the page
scroll_pause_time = 2
last_height = driver.execute_script("return document.body.scrollHeight")

    print("   Scrolling to load more products...")
    for scroll_attempt in range(3):  # Scroll a few times to load lazy content
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(scroll_pause_time)
    new_height = driver.execute_script("return document.body.scrollHeight")
    if new_height == last_height:
        break
    last_height = new_height

    # Try different selectors for product cards
    product_selectors = [
        'div[data-sqe="item"]',
        '.col-xs-2-4.shopee-search-item-result__item',
        '[data-testid="product-card"]',
        '.shopee-item-card',
        '.product-card',
        '.shopee-search-item-result__item',
        '[data-sqe="link"]',
        '.col-xs-2-4',
        '.shopee-item-card__link',
        'a[href*="shopee.com.my"]',  # Any link to shopee
    ]
    
    product_cards = []
    for selector in product_selectors:
        try:
            product_cards = driver.find_elements(By.CSS_SELECTOR, selector)
            if product_cards:
                print(f"✅ Found {len(product_cards)} products using selector: {selector}")
                break
        except:
            continue
    
    if not product_cards:
        print(f"⚠️ No products found on current page")
        # Debug: Print page title and some page content
        try:
            page_title = driver.title
            print(f"   Page title: {page_title}")
            
            # Try to find any elements that might be products
            all_divs = driver.find_elements(By.TAG_NAME, "div")
            print(f"   Total div elements on page: {len(all_divs)}")
            
            # Look for any elements with "product" in their class
            product_related = driver.find_elements(By.CSS_SELECTOR, "[class*='product']")
            print(f"   Elements with 'product' in class: {len(product_related)}")
            
            # Look for any elements with "item" in their class
            item_related = driver.find_elements(By.CSS_SELECTOR, "[class*='item']")
            print(f"   Elements with 'item' in class: {len(item_related)}")
            
            # Look for any links
            all_links = driver.find_elements(By.TAG_NAME, "a")
            print(f"   Total links on page: {len(all_links)}")
            
        except Exception as e:
            print(f"   Debug error: {str(e)}")
    else:
        # Extract products from current page
        page_products = []
        
        for i, card in enumerate(product_cards[:20]):  # Limit to first 20 products for testing
            try:
                print(f"   Processing product {i+1}/{min(20, len(product_cards))}")
                
                # Try different selectors for product name
                name_selectors = [
                    'div[data-sqe="name"]',
                    '.ie3A\+n.bM\+7UW.Cve6sh',
                    '.Cve6sh',
                    '[data-testid="product-name"]',
                    '.product-name',
                    'img[alt]',  # Try to get name from image alt
                ]
                
                name = ""
                for name_selector in name_selectors:
    try:
                        name_element = card.find_element(By.CSS_SELECTOR, name_selector)
                        name = name_element.text.strip() or name_element.get_attribute("alt") or ""
                        if name:
                            break
                    except:
                        continue
                
                if not name:
                    continue
                
                # Get product link
                link = ""
                try:
                    link_element = card.find_element(By.TAG_NAME, "a")
                    link = link_element.get_attribute("href")
                except:
                    pass
                
                # Try different selectors for price
                price_selectors = [
                    "span._3n5NQx",
                    ".ie3A\+n.bM\+7UW.Cve6sh",
                    ".Cve6sh",
                    "[data-testid='product-price']",
                    ".product-price",
                    "[class*='price']",
                ]
                
                price = ""
                for price_selector in price_selectors:
                    try:
                        price_element = card.find_element(By.CSS_SELECTOR, price_selector)
                        price = price_element.text.strip()
                        if price:
                            break
                    except:
                        continue
                
                # Get product image
                image = ""
                try:
                    img_element = card.find_element(By.TAG_NAME, "img")
                    image = img_element.get_attribute("src")
                except:
                    pass
                
                # Get discount percentage
                discount = ""
                discount_selectors = [
                    "span.percent",
                    ".discount-percentage",
                    "[data-testid='discount-percentage']",
                    "[class*='discount']",
                ]
                
                for discount_selector in discount_selectors:
        try:
                        discount_element = card.find_element(By.CSS_SELECTOR, discount_selector)
                        discount = discount_element.text.strip()
                        if discount:
                            break
        except:
            pass

                # Extract product ID from link
                product_id = ""
                if link and "i." in link:
                    product_id = link.split("i.")[-1].split("?")[0]
                
                # Clean price (remove currency symbols and extra text)
                if price:
                    price = re.sub(r'[^\d.,]', '', price)
                    if price.endswith(','):
                        price = price[:-1]

                product_data = {
            "Product Name": name,
            "Product URL": link,
            "Product Image": image,
            "Original Price (RM)": price,
                    "Discounted Price (RM)": "",
            "Discount Percentage": discount,
            "timestamp": timestamp_now,
                    "Product ID": product_id,
                    "Page": 1
                }
                
                page_products.append(product_data)
                print(f"     ✅ Extracted: {name[:50]}...")
                
            except Exception as e:
                print(f"     ❌ Error extracting product {i+1}: {str(e)}")
        continue

        print(f"✅ Extracted {len(page_products)} products from current page")
        all_products.extend(page_products)

except Exception as e:
    print(f"❌ Error scraping current page: {str(e)}")

# Save results
if all_products:
    df = pd.DataFrame(all_products)
    filename = f"shopee_products_scraped_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(filename, index=False)
    print(f"✅ Successfully scraped {len(all_products)} products")
    print(f"📁 Saved to: {filename}")
    
    # Print summary
    print(f"\n📊 Summary:")
    print(f"   Total products: {len(all_products)}")
    print(f"   Products with prices: {len([p for p in all_products if p['Original Price (RM)']])}")
    print(f"   Products with discounts: {len([p for p in all_products if p['Discount Percentage']])}")
else:
    print("❌ No products were scraped")

try:
    driver.quit()
except:
    pass
