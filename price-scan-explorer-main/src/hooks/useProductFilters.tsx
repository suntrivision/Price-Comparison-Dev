
import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types';

interface UseProductFiltersProps {
  products: Product[];
}

export function useProductFilters({ products }: UseProductFiltersProps) {
  // Get the last (highest) run number from products
  const lastRunNumber = useMemo(() => {
    if (products.length === 0) return undefined;
    return Math.max(...products.map(p => p.run_number));
  }, [products]);

  // Start with undefined to show all runs by default
  const [runNumber, setRunNumber] = useState<number | undefined>(undefined);
  const [productName, setProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Get available categories from products
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return categories;
  }, [products]);

  // Filter products based on all criteria
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Run number filter - if runNumber is undefined, show all runs
      if (runNumber !== undefined && product.run_number !== runNumber) {
        return false;
      }

      // Product name filter
      if (productName && !product.name.toLowerCase().includes(productName.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Date filters
      if (dateFrom || dateTo) {
        const productDate = new Date(product.timestamp);
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (productDate < fromDate) {
            return false;
          }
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (productDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [products, runNumber, productName, selectedCategory, dateFrom, dateTo]);

  const clearFilters = () => {
    setRunNumber(undefined); // Reset to show all runs
    setProductName('');
    setSelectedCategory('');
    setDateFrom('');
    setDateTo('');
  };

  // Update hasActiveFilters to consider runNumber === undefined as no filter
  const hasActiveFilters = productName !== '' || selectedCategory !== '' || dateFrom !== '' || dateTo !== '' || runNumber !== undefined;

  return {
    runNumber,
    setRunNumber,
    productName,
    setProductName,
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredProducts,
    clearFilters,
    hasActiveFilters
  };
}
