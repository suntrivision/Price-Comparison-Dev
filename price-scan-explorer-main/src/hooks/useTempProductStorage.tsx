
import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { useUploadedProducts } from './useUploadedProducts';
import { toast } from '@/hooks/use-toast';

export function useTempProductStorage() {
  const [tempProducts, setTempProducts] = useState<Product[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<Product>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { products: dbProducts, updateProduct: dbUpdateProduct, refetch } = useUploadedProducts();

  // Initialize temp storage with database products
  useEffect(() => {
    if (dbProducts.length > 0) {
      console.log('🔄 Initializing temp storage with', dbProducts.length, 'database products');
      setTempProducts(dbProducts);
    }
  }, [dbProducts]);

  // Add product to temp storage
  const addTempProduct = (product: Product) => {
    console.log('➕ Adding product to temp storage:', product.name, 'ID:', product.id);
    setTempProducts(prev => [product, ...prev]);
  };

  // Update product in temp storage
  const updateTempProduct = (id: string, updates: Partial<Product>) => {
    console.log('📝 Updating product in temp storage:', id, updates);
    console.log('🔍 Current temp products count:', tempProducts.length);
    console.log('🔍 Looking for product with ID:', id);
    
    // Find the product in temp storage
    const existingProduct = tempProducts.find(p => p.id === id);
    console.log('🔍 Found product in temp storage:', !!existingProduct, existingProduct?.name);
    
    // Update local temp storage immediately
    setTempProducts(prev => {
      const updated = prev.map(product => 
        product.id === id ? { ...product, ...updates } : product
      );
      console.log('📝 Temp storage updated locally for ID:', id);
      return updated;
    });

    // Track pending update
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      const existingUpdates = newMap.get(id) || {};
      const mergedUpdates = { ...existingUpdates, ...updates };
      newMap.set(id, mergedUpdates);
      console.log('📋 Pending updates for', id, ':', mergedUpdates);
      return newMap;
    });

    // Show immediate feedback
    toast({
      title: "Product Updated",
      description: "Changes saved locally. Syncing with database...",
    });

    // Attempt to sync with database in background
    syncPendingUpdate(id, { ...pendingUpdates.get(id), ...updates });
  };

  // Delete product from temp storage
  const deleteTempProduct = (id: string) => {
    console.log('🗑️ Deleting product from temp storage:', id);
    setTempProducts(prev => prev.filter(product => product.id !== id));
  };

  // Sync pending update with database
  const syncPendingUpdate = async (id: string, updates: Partial<Product>) => {
    try {
      console.log('🔄 Attempting to sync with database:', id, updates);
      
      // Find the product in temp storage to get complete data
      const productInTemp = tempProducts.find(p => p.id === id);
      if (!productInTemp) {
        console.warn('⚠️ Product not found in temp storage:', id);
        toast({
          title: "Sync Warning",
          description: "Product not found in local storage",
          variant: "destructive",
        });
        return;
      }

      console.log('📦 Product data from temp storage:', productInTemp);

      // For API products that might not exist in database yet, include full product data
      const fullProductData = {
        ...productInTemp,
        ...updates
      };

      console.log('📦 Full product data for sync:', fullProductData);

      const { error } = await dbUpdateProduct(id, fullProductData);
      
      if (!error) {
        console.log('✅ Database sync successful for:', id);
        // Remove from pending updates on success
        setPendingUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          console.log('📋 Removed from pending updates:', id);
          return newMap;
        });
        
        toast({
          title: "Synced",
          description: "Changes saved to database successfully",
        });
      } else {
        console.error('❌ Database sync failed:', error);
        toast({
          title: "Sync Failed",
          description: `Database error: ${error}. Changes saved locally.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('💥 Sync exception:', err);
      toast({
        title: "Sync Error",
        description: "Network error. Changes saved locally.",
        variant: "destructive",
      });
    }
  };

  // Retry all pending syncs
  const retryPendingSync = async () => {
    if (pendingUpdates.size === 0) {
      toast({
        title: "No Pending Changes",
        description: "All changes are already synced",
      });
      return;
    }

    console.log('🔄 Retrying sync for', pendingUpdates.size, 'pending updates');
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const [id, updates] of pendingUpdates) {
      try {
        console.log(`🔄 Retrying sync for product ${id}:`, updates);
        
        // Get full product data for retry
        const productInTemp = tempProducts.find(p => p.id === id);
        const fullProductData = productInTemp ? { ...productInTemp, ...updates } : updates;
        
        const { error } = await dbUpdateProduct(id, fullProductData);
        if (!error) {
          successCount++;
          setPendingUpdates(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
          console.log(`✅ Retry successful for ${id}`);
        } else {
          failCount++;
          console.error(`❌ Retry failed for ${id}:`, error);
        }
      } catch (err) {
        failCount++;
        console.error(`💥 Retry exception for ${id}:`, err);
      }
    }

    setIsLoading(false);
    
    if (successCount > 0) {
      toast({
        title: "Sync Complete",
        description: `${successCount} changes synced successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });
    } else if (failCount > 0) {
      toast({
        title: "Sync Failed",
        description: `${failCount} changes failed to sync. Check console for details.`,
        variant: "destructive",
      });
    }
  };

  // Force refresh from database
  const refreshFromDatabase = async () => {
    console.log('🔄 Refreshing from database...');
    setIsLoading(true);
    await refetch();
    setPendingUpdates(new Map()); // Clear pending updates
    setIsLoading(false);
    
    toast({
      title: "Refreshed",
      description: "Data refreshed from database",
    });
  };

  return {
    products: tempProducts,
    pendingUpdatesCount: pendingUpdates.size,
    isLoading,
    addProduct: addTempProduct,
    updateProduct: updateTempProduct,
    deleteProduct: deleteTempProduct,
    retryPendingSync,
    refreshFromDatabase,
  };
}
