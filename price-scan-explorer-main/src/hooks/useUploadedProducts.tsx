
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type UploadedProduct = Database['public']['Tables']['uploaded_products']['Row'];
type AuditRecord = Database['public']['Tables']['uploaded_products_audit']['Row'];

export function useUploadedProducts() {
  const [products, setProducts] = useState<UploadedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('uploaded_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching uploaded products:', error);
      } else {
        console.log('✅ Fetched products from database:', data?.length || 0);
        console.log('📋 Database product IDs:', data?.map(p => ({ id: p.id, name: p.name })));
        setProducts(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditHistory = async (productId: string): Promise<AuditRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('uploaded_products_audit')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching audit history:', err);
      return [];
    }
  };

  const updateProduct = async (id: string, updates: Partial<UploadedProduct>) => {
    console.log('🔄 PRODUCT UPDATE ATTEMPT');
    console.log('Product ID to update:', id);
    console.log('User authenticated:', !!user, user?.id);
    console.log('Updates to apply:', updates);
    
    try {
      // First, let's see what products exist in the database
      console.log('🔍 Checking all products in database...');
      const { data: allProducts, error: listError } = await supabase
        .from('uploaded_products')
        .select('id, name')
        .limit(10);

      if (listError) {
        console.error('❌ Error listing products:', listError);
      } else {
        console.log('📋 All products in database:', allProducts);
      }

      // Now check if the specific product exists
      console.log('🔍 Looking for specific product with ID:', id);
      const { data: existingProduct, error: fetchError } = await supabase
        .from('uploaded_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      console.log('🔍 Product lookup result:', { existingProduct, fetchError });

      if (fetchError) {
        console.error('❌ Error checking product existence:', fetchError);
        return { error: `Failed to check product: ${fetchError.message}` };
      }

      if (!existingProduct) {
        console.error('❌ Product not found in database with ID:', id);
        console.log('💡 This might be an API product that needs to be inserted first');
        
        // Try to create the product first if it doesn't exist
        console.log('🔄 Attempting to create product in database...');
        const insertData = {
          id: id, // Use the provided ID
          name: updates.name || 'Unknown Product',
          user_id: user?.id || '',
          timestamp: updates.timestamp || new Date().toISOString(),
          sale_price: updates.sale_price || null,
          original_price: updates.original_price || null,
          image: updates.image || null,
          category: updates.category || 'general',
          store: updates.store || null,
          source_url: updates.source_url || null,
          run_number: updates.run_number || null,
        };

        console.log('📝 Insert data:', insertData);

        const { data: insertedProduct, error: insertError } = await supabase
          .from('uploaded_products')
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to create product:', insertError);
          return { error: `Failed to create product: ${insertError.message}` };
        }

        console.log('✅ Product created successfully:', insertedProduct);
        
        // Update local state
        setProducts(prev => [insertedProduct, ...prev]);
        return { error: null };
      }

      console.log('✅ Found existing product:', existingProduct.name);

      // Clean the updates - remove system fields and undefined values
      const cleanUpdates: Record<string, any> = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        // Skip system fields
        if (['id', 'created_at', 'updated_at', 'last_modified_at', 'last_modified_by'].includes(key)) {
          return;
        }
        // Skip undefined values
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });

      console.log('🧹 Cleaned updates:', cleanUpdates);

      if (Object.keys(cleanUpdates).length === 0) {
        console.log('ℹ️ No valid fields to update');
        return { error: null };
      }

      // Prepare the final update payload
      const updatePayload: Record<string, any> = {
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString(),
        last_modified_by: user?.id || null
      };

      // If product has no user_id, assign it to current user
      if (!existingProduct.user_id && user?.id) {
        updatePayload.user_id = user.id;
        console.log('👤 Assigning unowned product to current user');
      }

      console.log('💾 Final update payload:', updatePayload);

      // Perform the update
      const { data: updatedData, error: updateError } = await supabase
        .from('uploaded_products')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      console.log('💾 Update response:', { updatedData, updateError });

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        return { error: `Update failed: ${updateError.message}` };
      }

      if (!updatedData) {
        console.error('❌ No data returned from update');
        return { error: 'Update failed: No data returned' };
      }

      console.log('✅ Update successful!');
      
      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? updatedData : product
        )
      );

      return { error: null };
    } catch (err) {
      console.error('💥 Exception during product update:', err);
      return { error: `Failed to update product: ${(err as Error).message}` };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return { error };
      }

      // Update local state
      setProducts(prev => prev.filter(product => product.id !== id));
      return { error: null };
    } catch (err) {
      console.error('Error deleting product:', err);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    updateProduct,
    deleteProduct,
    fetchAuditHistory,
  };
}
