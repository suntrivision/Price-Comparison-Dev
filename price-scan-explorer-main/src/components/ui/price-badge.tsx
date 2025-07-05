
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PriceBadgeProps {
  originalPrice: string | null;
  salePrice: string | null;
  discount?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceBadge({ 
  originalPrice, 
  salePrice, 
  discount = null, 
  size = "md", 
  className 
}: PriceBadgeProps) {
  const formatPrice = (price: string | null) => {
    if (!price) return "N/A";
    
    // Handle both Thai Baht and Malaysian Ringgit formats
    if (price.includes("฿")) {
      return "฿" + price.replace("฿", "").trim();
    }
    
    if (price.includes("RM")) {
      return "RM" + price.replace("RM", "").trim();
    }
    
    return price;
  };

  // Size-based classes
  const sizeClasses = {
    sm: {
      container: "text-xs p-1.5 max-w-20",
      salePrice: "text-sm font-semibold",
      originalPrice: "text-xs",
      badge: "text-[10px] px-1 py-0.5 -right-0.5 -top-0.5",
    },
    md: {
      container: "text-sm p-2 max-w-24",
      salePrice: "text-base font-semibold",
      originalPrice: "text-xs",
      badge: "text-xs px-1.5 py-0.5 -right-1 -top-1",
    },
    lg: {
      container: "text-base p-3 max-w-28",
      salePrice: "text-lg font-bold",
      originalPrice: "text-sm",
      badge: "text-xs px-2 py-1 -right-1 -top-1",
    }
  };

  const hasDiscount = originalPrice && salePrice && originalPrice !== salePrice;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "price-badge relative rounded-md bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center",
        sizeClasses[size].container,
        className
      )}
    >
      {hasDiscount && discount && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className={cn(
            "absolute rounded-full bg-red-500 text-white font-bold",
            sizeClasses[size].badge
          )}
        >
          -{discount}%
        </motion.div>
      )}
      
      <span className={cn("text-primary", sizeClasses[size].salePrice)}>
        {formatPrice(salePrice)}
      </span>
      
      {hasDiscount && (
        <span 
          className={cn(
            "text-muted-foreground line-through", 
            sizeClasses[size].originalPrice
          )}
        >
          {formatPrice(originalPrice)}
        </span>
      )}
    </motion.div>
  );
}
