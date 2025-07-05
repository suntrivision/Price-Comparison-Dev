import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | null): string {
  if (!value) return "N/A";
  
  // Support for both Thai Baht and Malaysian Ringgit
  if (value.includes("฿")) {
    return "฿" + value.replace("฿", "").trim();
  }
  
  if (value.includes("RM")) {
    return "RM" + value.replace("RM", "").trim();
  }
  
  return value;
}

export function calculateDiscount(originalPrice: string | null, salePrice: string | null): number | null {
  if (!originalPrice || !salePrice) return null;

  // Handle different currency formats
  const cleanOriginal = originalPrice.replace("฿", "").replace("RM", "").trim();
  const cleanSale = salePrice.replace("฿", "").replace("RM", "").trim();

  const original = parseFloat(cleanOriginal);
  const sale = parseFloat(cleanSale);

  if (isNaN(original) || isNaN(sale) || original <= 0) return null;

  const discountPercentage = ((original - sale) / original) * 100;
  return Math.round(discountPercentage);
}

/**
 * Clean URL by removing plus signs that appear just before the question mark
 * @param url - The URL to clean
 * @returns The cleaned URL
 */
export function cleanUrl(url: string): string {
  if (!url) return url;
  
  // Remove plus signs that appear just before the question mark
  return url.replace(/\+(?=\?)/g, '');
}

export function generateRandomPriceHistory(weeks = 12) {
  const now = new Date();
  const history = [];
  
  let basePrice = Math.floor(Math.random() * 20) + 50;
  
  for (let i = 0; i < weeks; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7));
    
    // Add some randomness to prices, but with a trend
    const variation = (Math.random() - 0.5) * 10;
    // Slight upward trend over time
    const trend = i * 0.5;
    
    let price = basePrice + variation + trend;
    // Ensure minimum price
    price = Math.max(price, 20);
    
    history.unshift({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
  }
  
  return history;
}
