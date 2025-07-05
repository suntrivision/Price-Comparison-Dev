
import { useState, useEffect } from "react";
import { Heart, Share2, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface ProductActionsProps {
  initialIsLiked?: boolean;
  productId: string;
}

export function ProductActions({ initialIsLiked = false, productId }: ProductActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Check if the current product is in user's favorites
  useEffect(() => {
    if (user && productId) {
      checkFavoriteStatus();
    }
  }, [user, productId]);
  
  const checkFavoriteStatus = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setIsLiked(true);
        setFavoriteId(data.id);
      } else {
        setIsLiked(false);
        setFavoriteId(null);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleFavorite = async () => {
    if (!user) {
      // Redirect to auth page if not logged in
      toast({
        title: "Authentication required",
        description: "Please sign in to save products",
      });
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isLiked && favoriteId) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', favoriteId);
          
        if (error) throw error;
        
        setIsLiked(false);
        setFavoriteId(null);
        
        toast({
          title: "Product removed",
          description: "Product removed from your favorites",
        });
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setIsLiked(true);
        setFavoriteId(data.id);
        
        toast({
          title: "Product saved",
          description: "Product added to your favorites",
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-3">
      <Button className="gap-2">
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </Button>
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={toggleFavorite}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
        )}
        <span>{isLiked ? 'Saved' : 'Save'}</span>
      </Button>
      <Button variant="secondary" className="gap-2">
        <Bell className="h-4 w-4" />
        <span>Price Alert</span>
      </Button>
    </div>
  );
}
