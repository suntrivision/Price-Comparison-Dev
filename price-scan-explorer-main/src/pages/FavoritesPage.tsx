import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Database } from "lucide-react";
import { mockProducts } from "@/data/productUtils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user's favorites from Supabase
  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);
  
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) {
        throw error;
      }
      
      // For now, we'll map favorite IDs to mock products
      // In a real app, you'd fetch the actual product data from your API
      if (data) {
        const favoriteProducts = data.map(fav => {
          // Find the product in mock data that matches the favorite product_id
          const product = mockProducts.find(p => p.id === fav.product_id);
          return product ? { ...product, favoriteId: fav.id } : null;
        }).filter(Boolean);
        
        setFavorites(favoriteProducts as any[]);
      }
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load your saved products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Remove a product from favorites
  const removeFromFavorites = async (favoriteId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);
        
      if (error) {
        throw error;
      }
      
      setFavorites(favorites.filter(product => product.favoriteId !== favoriteId));
      
      toast({
        title: "Success",
        description: "Product removed from favorites",
      });
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove product from favorites",
        variant: "destructive",
      });
    }
  };
  
  // Show informational message for unauthenticated users
  if (!user) {
    return (
      <MainLayout>
        <div className="container py-12">
          <SectionHeader
            title="Saved Products"
            description="Your favorite products saved for later"
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-6">
              <Database className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium mb-2">Favorites will show when stored in database</h3>
            <p className="text-muted-foreground mb-6">
              When you save products to your favorites, they will be stored in the database and displayed here.
            </p>
            <Button asChild>
              <a href="/auth">Sign in to save favorites</a>
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-12">
        <SectionHeader
          title="Saved Products"
          description="Your favorite products saved for later"
        />
        
        {favorites.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {favorites.map((product: any, index: number) => (
              <div key={product.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => removeFromFavorites(product.favoriteId, product.id)}
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </Button>
                <ProductCard 
                  product={product}
                  index={index}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground mb-6">
              <Heart className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-medium mb-2">No saved products</h3>
            <p className="text-muted-foreground mb-6">
              Products you save will appear here for easy access
            </p>
            <Button asChild>
              <a href="/">Browse Products</a>
            </Button>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
