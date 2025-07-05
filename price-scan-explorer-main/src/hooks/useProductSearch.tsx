
import { useState, useMemo } from 'react';
import { Product } from '@/types';

export function useProductSearch(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.store && product.store.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        const name = product.name.toLowerCase();
        
        switch (selectedCategory) {
          case 'cleaning':
            return name.includes('powder') || name.includes('detergent') || name.includes('fabric');
          case 'cooking-oil':
            return name.includes('oil') || name.includes('cooking');
          case 'grains':
            return name.includes('rice') || name.includes('grain');
          case 'dairy':
            return name.includes('milk') || name.includes('dairy');
          case 'snacks':
            return name.includes('snack') || name.includes('biscuit') || name.includes('cookie');
          case 'beverages':
            return name.includes('drink') || name.includes('beverage') || name.includes('coffee') || name.includes('tea');
          case 'personal-care':
            return name.includes('soap') || name.includes('shampoo') || name.includes('hygiene');
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredProducts
  };
}
