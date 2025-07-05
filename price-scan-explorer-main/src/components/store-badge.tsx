
import { Store } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { stores } from "@/data/stores";

interface StoreBadgeProps {
  store: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  withIcon?: boolean;
  withLogo?: boolean;
}

export function StoreBadge({ 
  store, 
  className, 
  size = "md", 
  withIcon = true,
  withLogo = false
}: StoreBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2.5",
    lg: "text-base py-1.5 px-3"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };

  const logoSizes = {
    sm: "h-3 w-auto",
    md: "h-4 w-auto",
    lg: "h-5 w-auto"
  };
  
  const storeInfo = stores.find(s => s.name === store);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      {withLogo && storeInfo?.logo ? (
        <img 
          src={storeInfo.logo} 
          alt={store} 
          className={cn(logoSizes[size], "max-w-[20px]")} 
        />
      ) : withIcon ? (
        <Store className={iconSizes[size]} />
      ) : null}
      <span>{store}</span>
    </motion.div>
  );
}
