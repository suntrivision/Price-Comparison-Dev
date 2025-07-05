
import { useMemo } from 'react';
import { useApiProducts } from './useApiProducts';

export function useProductCategories() {
  const { products, isLoading, error } = useApiProducts();

  const categories = useMemo(() => {
    if (!products.length) return [];

    // Extract categories from product names using common patterns
    const categoryMap = new Map<string, number>();

    products.forEach(product => {
      const name = product.name.toLowerCase();
      let category = 'general';

      // Categorize based on product name patterns
      if (name.includes('powder') || name.includes('detergent') || name.includes('fabric')) {
        category = 'cleaning';
      } else if (name.includes('oil') || name.includes('cooking')) {
        category = 'cooking-oil';
      } else if (name.includes('rice') || name.includes('grain')) {
        category = 'grains';
      } else if (name.includes('milk') || name.includes('dairy')) {
        category = 'dairy';
      } else if (name.includes('snack') || name.includes('biscuit') || name.includes('cookie')) {
        category = 'snacks';
      } else if (name.includes('drink') || name.includes('beverage') || name.includes('coffee') || name.includes('tea')) {
        category = 'beverages';
      } else if (name.includes('soap') || name.includes('shampoo') || name.includes('hygiene')) {
        category = 'personal-care';
      }

      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Convert to category objects
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name,
      name: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      slug: name,
      icon: getCategoryIcon(name),
      count
    }));
  }, [products]);

  return { categories, isLoading, error };
}

function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'cleaning': 'droplet',
    'cooking-oil': 'droplet',
    'grains': 'grain',
    'dairy': 'milk',
    'snacks': 'cookie',
    'beverages': 'coffee',
    'personal-care': 'package',
    'general': 'package'
  };
  return iconMap[category] || 'package';
}
