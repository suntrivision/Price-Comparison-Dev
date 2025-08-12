
import { Product } from "@/types";

// S3 URLs for the latest data
export const LOTUS_S3_CSV_URL = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv";
export const MATCHED_COMPARISON_CSV_URL = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_output_08072025.csv";

// Interface for matched comparison data
export interface MatchedComparison {
  lotusProduct: string;
  lotusUrl: string;
  lotusPrice: string;
  shopeeProduct: string;
  shopeeUrl: string;
  shopeePrice: string;
  matchScore: number;
}

// Function to fetch matched comparison data from S3 CSV
export async function fetchMatchedComparisonData(): Promise<MatchedComparison[]> {
  try {
    const response = await fetch(MATCHED_COMPARISON_CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV data
    const lines = csvText.split('\n');
    const comparisons: MatchedComparison[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing with proper comma handling
      const values = parseCSVLine(line);
      
      if (values.length >= 7) {
        const comparison: MatchedComparison = {
          lotusProduct: values[0] || '',
          lotusUrl: values[1] || '',
          lotusPrice: values[2] || '',
          shopeeProduct: values[3] || '',
          shopeeUrl: values[4] || '',
          shopeePrice: values[5] || '',
          matchScore: parseFloat(values[6]) || 0
        };
        
        comparisons.push(comparison);
      }
    }
    
    return comparisons;
  } catch (error) {
    console.error('Error fetching matched comparison data:', error);
    return [];
  }
}

// Function to fetch live data from S3 CSV
export async function fetchLotusProductsFromS3(): Promise<Product[]> {
  try {
    const response = await fetch(LOTUS_S3_CSV_URL);
    const csvText = await response.text();
    
    // Parse CSV data
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const products: Product[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing with proper comma handling
      const values = parseCSVLine(line);
      
      if (values.length >= 8) {
        const product: Product = {
          id: values[7] || `lotus-prod-${i}`, // Product ID
          timestamp: values[6] || new Date().toISOString(), // timestamp
          source_url: values[1] || '', // Product URL
          name: values[0] || '', // Product Name
          sale_price: values[4] || '', // Discounted Price (RM)
          original_price: values[3] || null, // Original Price (RM)
          image: values[2] || '', // Product Image
          category: 'lotus-products', // Default category
          store: 'Lotus'
        };
        
        products.push(product);
      }
    }
    
    return products;
  } catch (error) {
    console.error('Error fetching Lotus products from S3:', error);
    return lotusProducts; // Fallback to static data
  }
}

// Helper function to parse CSV line with proper comma handling
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// Real Lotus's product data from S3 CSV (updated with actual data)
export const lotusProducts: Product[] = [
  {
    id: "40865b9f-fc5a-4b57-9b8c-3b4fe8ccd241",
    timestamp: "2025-06-12T12:27:30.543110",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CREAM OF MUSHROOM 290G",
    sale_price: "RM4.49",
    original_price: "RM5.59",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/361/9556191062361/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "dc4f2eaf-781c-4d76-a325-da7f151ff7a4",
    timestamp: "2025-06-12T12:27:30.544110",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CREAM OF MUSH+BEETROOT 290G",
    sale_price: "RM7.79",
    original_price: "RM7.99",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/3/7/37081745543790.jpeg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "cb4bf2c5-2a11-4681-8654-64f494d20038",
    timestamp: "2025-06-12T12:27:30.546111",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CRAB CHOWDER 290G",
    sale_price: "RM7.79",
    original_price: "RM7.99",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/3/7/37071745544003.jpeg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "376ef4e7-d331-4302-a710-a19466ec5505",
    timestamp: "2025-06-12T12:27:30.548110",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CREAM OF CHIC 3X22G",
    sale_price: "RM4.70",
    original_price: "RM4.70",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/418/9556191061418/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "f331c3dc-a518-4760-b9f8-372f25b43c05",
    timestamp: "2025-06-12T12:27:30.550112",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CREAM OF MUSHROOM 3X21.1G",
    sale_price: "RM4.70",
    original_price: "RM4.70",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/401/9556191061401/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "a6e766af-f8d4-4553-9cd6-a6e146121020",
    timestamp: "2025-06-12T12:27:30.552111",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL CREAM OF CHIC 300G",
    sale_price: "RM4.49",
    original_price: "RM5.59",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/378/9556191062378/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "83f1cb9a-f9c3-4c5f-967d-986bfb803b8a",
    timestamp: "2025-06-12T12:27:30.553110",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "MAGGI MUSHROOM CREAM SOUP 1KG",
    sale_price: "RM25.59",
    original_price: "RM25.59",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/7/4/740995821657126134.png/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "f23ce7c7-bb1e-491c-a65a-cafdeb227f74",
    timestamp: "2025-06-12T12:27:30.554116",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "YUM YUM DESSERT POTONG ICE CREAM ASSORTED 6X60ML",
    sale_price: "RM9.70",
    original_price: "RM9.70",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/400/9557941206400/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "ice-cream",
    store: "Lotus"
  },
  {
    id: "55c354d1-383c-4504-acca-f0f90e14c3a3",
    timestamp: "2025-06-12T12:27:30.555517",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL WILD MUSHROOM 3X16.8G",
    sale_price: "RM4.95",
    original_price: "RM4.95",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/064/9556191062064/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "8c375f12-1fe3-443a-8d3c-794a29bf1a8b",
    timestamp: "2025-06-12T12:27:30.556693",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "CAMPBELL MUSHROOM POTAGE 300G",
    sale_price: "RM4.49",
    original_price: "RM5.45",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/608/9300644015608/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "db770992-86d9-4e47-80cd-5d1ab886bd93",
    timestamp: "2025-06-12T12:27:30.557698",
    source_url: "https://www.lotuss.com.my/en/search/CAMPBELL+CREAM+SOUP+290G+ASSORTED?sort=relevance:DESC",
    name: "PREGO CHICKEN MUSHROOM 290G",
    sale_price: "RM4.49",
    original_price: "RM5.20",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/100/9556191072100/ShotType1_540x540.jpg/jcr:content/renditions/plp-large.jpeg",
    category: "soups",
    store: "Lotus"
  },
  {
    id: "07a792ca-9809-4329-986b-46d0e218ba56",
    timestamp: "2025-07-03T16:17:57.014719",
    source_url: "https://www.lotuss.com.my/en/search/Top+Liquid+Detergent+3.6kg+assorted?sort=relevance:DESC",
    name: "TOP LIQUID DETERGENT COLOUR PROTECT PURPLE 3.6KG",
    sale_price: "RM17.99",
    original_price: "RM23.90",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/t/o/top_colour_protect_3.6kg1670371477.png/jcr:content/renditions/plp-large.jpeg",
    category: "detergents",
    store: "Lotus"
  },
  {
    id: "e8c13f02-5618-474a-a69a-25c5a8498a63",
    timestamp: "2025-07-03T16:17:57.015842",
    source_url: "https://www.lotuss.com.my/en/search/Top+Liquid+Detergent+3.6kg+assorted?sort=relevance:DESC",
    name: "TOP LIQUID DETERGENT BRILLIANT CLEAN RED 3.6KG",
    sale_price: "RM17.99",
    original_price: "RM23.90",
    image: "https://publish-p35803-e190640.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/my/images/magento/catalog/product/t/o/top_brilliant_clean_3.8kg1670371595.png/jcr:content/renditions/plp-large.jpeg",
    category: "detergents",
    store: "Lotus"
  }
];

// Export a function to get products (either from S3 or fallback to static data)
export async function getLotusProducts(): Promise<Product[]> {
  try {
    return await fetchLotusProductsFromS3();
  } catch (error) {
    console.warn('Using fallback Lotus products data:', error);
    return lotusProducts;
  }
}

// Export a function to get matched comparison data
export async function getMatchedComparisonData(): Promise<MatchedComparison[]> {
  try {
    return await fetchMatchedComparisonData();
  } catch (error) {
    console.warn('Using fallback matched comparison data:', error);
    return [];
  }
}
