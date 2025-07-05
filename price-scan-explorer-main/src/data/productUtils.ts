
import { Product } from "@/types";
import { generateRandomPriceHistory } from "@/lib/utils";
import { stores } from "./stores";
import { sampleNames, sampleImages } from "./productConstants";
import { categories } from "./categories";
import { lotusProducts } from "./lotusProducts";

// Generate mock products for Lotus's only
export const generateMockProducts = (count = 24): Product[] => {
  // Only return Lotus's products - no mock products for other stores
  return [...lotusProducts];
};

// Get price history for a product
export const getProductPriceHistory = (productId: string) => {
  return generateRandomPriceHistory();
};

// Get related products
export const getRelatedProducts = (productId: string, count = 4) => {
  return mockProducts
    .filter(p => p.id !== productId)
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
};

// Get trending products
export const getTrendingProducts = (count = 4) => {
  return mockProducts
    .sort(() => 0.5 - Math.random())
    .slice(0, count);
};

// Get products by store - only return products if store is Lotus's
export const getProductsByStore = (storeName: string, count?: number) => {
  // Only allow Lotus's products
  if (storeName !== "Lotus's") {
    return [];
  }
  
  const storeProducts = mockProducts.filter(p => p.store === storeName);
  
  if (count) {
    return storeProducts.slice(0, count);
  }
  
  return storeProducts;
};

// Mock products - only Lotus's products
export const mockProducts = generateMockProducts();
