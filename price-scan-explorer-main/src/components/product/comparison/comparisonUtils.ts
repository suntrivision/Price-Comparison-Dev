import { Product } from "@/types";
import { calculateDiscount } from "@/lib/utils";
import { extractBrandName } from "../marketplace/utils/comparisonTableUtils";

export interface ProductComparison {
  name: string;
  image?: string;
  brandName: string;
  size: string;
  productId: string;
  maxDiscount: number;
  runData: {
    [runNumber: number]: {
      salePrice: string;
      originalPrice: string;
      discount: number | null;
      timestamp: string;
    };
  };
}

export type SortField = 'name' | 'brand' | 'size' | 'discount';
export type SortOrder = 'asc' | 'desc' | null;

export const extractSize = (productName: string) => {
  const words = productName.trim().split(' ');
  return words[words.length - 1] || '';
};

export const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  return {
    date: `${day}/${month}/${year}`,
    time: time
  };
};

export const formatDateTimeForCSV = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  return `${day}/${month}/${year} ${time}`;
};

export const processProductComparisons = (products: Product[]): ProductComparison[] => {
  console.log('🔍 Processing product comparisons...');
  console.log('📊 Total products received:', products.length);
  
  // Get all unique run numbers and log them (remove filtering to see all runs)
  const allRunNumbers = Array.from(new Set(products.map(p => p.run_number).filter(Boolean)))
    .sort((a, b) => a - b);
  console.log('🏃 All unique run numbers in processProductComparisons:', allRunNumbers);
  
  // Group products by name and collect data for each run
  const productComparisons = products.reduce<{ [productName: string]: ProductComparison }>((acc, product) => {
    // Process all products with run_number (not limiting to 12+)
    if (!product.run_number) {
      return acc;
    }
    
    const key = product.name;
    
    if (!acc[key]) {
      acc[key] = {
        name: product.name,
        image: product.image,
        brandName: extractBrandName(product.name),
        size: extractSize(product.name),
        productId: product.id,
        maxDiscount: 0,
        runData: {}
      };
    }
    
    const discount = calculateDiscount(product.original_price, product.sale_price);
    
    if (discount && discount > acc[key].maxDiscount) {
      acc[key].maxDiscount = discount;
    }
    
    acc[key].runData[product.run_number] = {
      salePrice: product.sale_price || '',
      originalPrice: product.original_price || '',
      discount,
      timestamp: product.timestamp
    };
    
    return acc;
  }, {});

  const comparisons = Object.values(productComparisons);
  console.log('📋 Product comparisons created:', comparisons.length);
  console.log('🔍 Sample product run data keys:', Object.keys(comparisons[0]?.runData || {}));
  console.log('📈 Total runs being processed:', allRunNumbers);
  
  // Log run data distribution
  const runDataDistribution = allRunNumbers.map(runNum => ({
    run: runNum,
    productCount: comparisons.filter(p => p.runData[runNum]).length
  }));
  console.log('📊 Run data distribution:', runDataDistribution);
  
  return comparisons;
};

export const sortProductComparisons = (
  comparisons: ProductComparison[], 
  sortField: SortField | null, 
  sortOrder: SortOrder
): ProductComparison[] => {
  if (!sortField || !sortOrder) return comparisons;

  return [...comparisons].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'brand':
        aValue = a.brandName.toLowerCase();
        bValue = b.brandName.toLowerCase();
        break;
      case 'size':
        aValue = a.size.toLowerCase();
        bValue = b.size.toLowerCase();
        break;
      case 'discount':
        aValue = a.maxDiscount;
        bValue = b.maxDiscount;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

export const getPriceChange = (product: ProductComparison, currentRun: number, previousRun: number) => {
  const currentData = product.runData[currentRun];
  const previousData = product.runData[previousRun];
  
  if (!currentData || !previousData) return null;
  
  const currentPrice = parseFloat(currentData.salePrice?.replace(/[^0-9.-]+/g, '') || '0');
  const previousPrice = parseFloat(previousData.salePrice?.replace(/[^0-9.-]+/g, '') || '0');
  
  if (currentPrice === 0 || previousPrice === 0) return null;
  
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  return change;
};

export const generateCSVContent = (
  comparisons: ProductComparison[], 
  runNumbersWithTimestamps: Array<{ runNumber: number; timestamp: string }>
): string => {
  const headers = ['Product Name', 'Product ID', 'Brand', 'Size', 'Max Discount %'];
  
  runNumbersWithTimestamps.forEach(({ runNumber, timestamp }) => {
    const formattedDateTime = formatDateTimeForCSV(timestamp);
    headers.push(`Run ${runNumber} (${formattedDateTime}) - Sale Price`);
    headers.push(`Run ${runNumber} (${formattedDateTime}) - Original Price`);
    headers.push(`Run ${runNumber} (${formattedDateTime}) - Discount %`);
  });

  const csvRows = [headers.join(',')];
  
  comparisons.forEach(product => {
    const row = [
      `"${product.name.replace(/"/g, '""')}"`,
      `"${product.productId}"`,
      `"${product.brandName}"`,
      `"${product.size}"`,
      product.maxDiscount ? `${product.maxDiscount}%` : 'N/A'
    ];
    
    runNumbersWithTimestamps.forEach(({ runNumber }) => {
      const runData = product.runData[runNumber];
      if (runData) {
        row.push(`"${runData.salePrice}"`);
        row.push(`"${runData.originalPrice}"`);
        row.push(runData.discount ? `${runData.discount}%` : 'N/A');
      } else {
        row.push('N/A');
        row.push('N/A');
        row.push('N/A');
      }
    });
    
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

export const downloadCSV = (csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `product-comparison-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
