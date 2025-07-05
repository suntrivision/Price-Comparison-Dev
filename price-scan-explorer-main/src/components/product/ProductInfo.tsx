
import { ExternalLink, Store } from "lucide-react";
import { StoreBadge } from "@/components/store-badge";
import { PriceBadge } from "@/components/ui/price-badge";
import { ProductActions } from "./ProductActions";
import { motion } from "framer-motion";
import { Product } from "@/types";

interface ProductInfoProps {
  product: Product;
  discount: number | null;
}

export function ProductInfo({ product, discount }: ProductInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex gap-2 mb-4">
        <StoreBadge store={product.store || "Unknown"} />
        <div className="text-xs text-muted-foreground rounded-full border border-border px-2 py-1">
          {product.category}
        </div>
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{product.name}</h1>
      
      <div className="mt-6 flex items-center gap-4">
        <PriceBadge 
          originalPrice={product.original_price} 
          salePrice={product.sale_price}
          discount={discount}
          size="lg"
        />
        
        {discount && (
          <div className="text-sm text-green-600 font-medium">
            You save {discount}%
          </div>
        )}
      </div>
      
      <div className="mt-8 space-y-6">
        <ProductActions productId={product.id} />
        
        {product.source_url && (
          <a 
            href={product.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Store className="h-4 w-4" />
            <span>View at {product.store}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        
        <div className="pt-4 border-t border-border">
          <h3 className="font-medium mb-2">Product Details</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex justify-between">
              <span>Category:</span>
              <span className="font-medium text-foreground">{product.category}</span>
            </li>
            <li className="flex justify-between">
              <span>Store:</span>
              <span className="font-medium text-foreground">{product.store}</span>
            </li>
            <li className="flex justify-between">
              <span>Last Updated:</span>
              <span className="font-medium text-foreground">
                {new Date(product.timestamp).toLocaleDateString()}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
