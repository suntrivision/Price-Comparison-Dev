import { extractBrandName } from "../product/marketplace/utils/comparisonTableUtils";

export const extractSize = (productName: string) => {
  const words = productName.trim().split(' ');
  return words[words.length - 1] || '';
};

export const calculateDiscount = (originalPrice?: string, salePrice?: string) => {
  if (!originalPrice || !salePrice) return null;
  
  const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
  const sale = parseFloat(salePrice.replace(/[^0-9.]/g, ''));
  
  if (isNaN(original) || isNaN(sale) || original === 0) return null;
  
  return Math.round(((original - sale) / original) * 100);
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
  return `${day}/${month}/${year} ${time}`;
};

export const handleDownloadProduct = (product: any) => {
  const dataStr = JSON.stringify(product, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `product-${product.id.substring(0, 8)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const handleDownloadCSV = (products: any[]) => {
  const headers = [
    'Run #',
    'Date',
    'Source',
    'Category',
    'ID',
    'Brand Name',
    'Product Name',
    'Size',
    'Sale Price',
    'Original Price',
    'Discount %'
  ];

  const csvData = products.map(product => {
    const brandName = extractBrandName(product.name);
    const size = extractSize(product.name);
    const discount = calculateDiscount(product.original_price, product.sale_price);
    
    return [
      product.run_number || '',
      formatDateTime(product.timestamp),
      product.store || '',
      product.category || 'general',
      product.id,
      brandName,
      product.name,
      size,
      product.sale_price || '',
      product.original_price || '',
      discount ? `${discount}%` : ''
    ];
  });

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-table-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
