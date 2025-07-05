
import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Store, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PriceBadge } from "@/components/ui/price-badge";
import { Product } from "@/types";
import { calculateDiscount } from "@/lib/utils";
import { extractMarketplaceFromUrl } from "@/lib/marketplaceUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardProps {
  product: Product;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const discount = calculateDiscount(product.original_price, product.sale_price);
  const marketplace = extractMarketplaceFromUrl(product.source_url);
  
  // Enhanced debug logging for specific product
  if (product.name.includes('Samyang Hot Chicken Cream')) {
    console.log('=== DEBUG: Samyang Product ===');
    console.log('Product ID:', product.id);
    console.log('Product name:', product.name);
    console.log('Product source_url:', product.source_url);
    console.log('Extracted marketplace:', marketplace);
    console.log('Product store:', product.store);
    console.log('===========================');
  }
  
  const toggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] 
      }}
    >
      <Link 
        to={`/product/${product.id}`} 
        className="product-card block rounded-xl bg-white dark:bg-gray-800 overflow-hidden border border-border shadow-sm"
      >
        <div className="aspect-square w-full relative overflow-hidden">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <Skeleton className="w-4/5 h-4/5 absolute" />
            </div>
          )}
          
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full glass"
            onClick={toggleLike}
          >
            <Heart 
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
          
          <div className="absolute bottom-2 left-2">
            <PriceBadge 
              originalPrice={product.original_price} 
              salePrice={product.sale_price}
              discount={discount}
            />
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-1">
              <Store className="h-3 w-3" />
              <span>{product.store}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span className="font-medium text-blue-600" title={`Source URL: ${product.source_url || 'No URL'}`}>
                {marketplace}
              </span>
            </div>
          </div>
          
          <h3 className="font-medium text-sm line-clamp-2 h-10">
            {product.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
