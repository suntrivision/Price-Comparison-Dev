
import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductDiscountChart } from "./ProductDiscountChart";

interface ProductImageProps {
  image: string | null;
  alt: string;
  productId?: string;
  productName?: string;
}

export function ProductImage({ image, alt, productId, productName }: ProductImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="relative rounded-2xl overflow-hidden border border-border bg-white dark:bg-gray-800 shadow-sm">
        <div className="aspect-square w-full relative">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-4/5 h-4/5 absolute" />
            </div>
          )}
          
          <img
            src={image || "/placeholder.svg"}
            alt={alt}
            className="w-full h-full object-contain transition-all duration-300 p-6"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true); // Show the fallback image
            }}
          />
        </div>
      </div>
      
      {/* Discount Chart */}
      {productId && productName && (
        <ProductDiscountChart 
          productId={productId} 
          productName={productName}
        />
      )}
    </motion.div>
  );
}
