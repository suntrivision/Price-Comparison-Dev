import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Store, Tag } from "lucide-react";
import { extractBrandName } from "./marketplace/utils/comparisonTableUtils";

interface ScrapedProductItemProps {
  product: Product;
}

export function ScrapedProductItem({ product }: ScrapedProductItemProps) {
  const extractSize = (productName: string) => {
    const words = productName.trim().split(' ');
    return words[words.length - 1] || '';
  };

  const calculateDiscount = (originalPrice?: string, salePrice?: string) => {
    if (!originalPrice || !salePrice) return null;
    
    const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
    const sale = parseFloat(salePrice.replace(/[^0-9.]/g, ''));
    
    if (isNaN(original) || isNaN(sale) || original === 0) return null;
    
    return Math.round(((original - sale) / original) * 100);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    return `${day}/${month}/${year} ${time}`;
  };

  const discount = calculateDiscount(product.original_price, product.sale_price);
  const brandName = extractBrandName(product.name);
  const size = extractSize(product.name);

  return (
    <Card key={product.id} className="p-3">
      <div className="flex items-center gap-3 text-sm">
        {/* Product Image - Highlighted */}
        {product.image && (
          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-300 p-1">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover rounded"
            />
          </div>
        )}

        {/* ID - moved right after image */}
        <div className="flex-shrink-0 w-24 text-xs text-muted-foreground">
          <span>ID: {product.id.substring(0, 8)}...</span>
        </div>
        
        {/* Run Number */}
        <div className="flex-shrink-0 w-16 text-xs">
          <span className="font-medium">#{product.run_number || '-'}</span>
        </div>

        {/* Date */}
        <div className="flex-shrink-0 w-32 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDateTime(product.timestamp)}</span>
          </div>
        </div>

        {/* Store */}
        <div className="flex-shrink-0 w-20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            <span>{product.store || '-'}</span>
          </div>
        </div>

        {/* Category */}
        <div className="flex-shrink-0 w-24">
          <Badge variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {product.category || 'general'}
          </Badge>
        </div>

        {/* Product Name - Highlighted */}
        <div className="flex-1 min-w-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-300 p-2 rounded">
          <h5 className="font-semibold text-blue-700 text-sm leading-tight truncate">{product.name}</h5>
        </div>

        {/* Brand */}
        <div className="flex-shrink-0 w-20 text-xs text-muted-foreground">
          <span>{brandName}</span>
        </div>

        {/* Size */}
        <div className="flex-shrink-0 w-16 text-xs text-muted-foreground">
          <span>{size}</span>
        </div>

        {/* Pricing */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-primary font-bold text-base">{formatCurrency(product.sale_price)}</span>
          {product.original_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.original_price)}
            </span>
          )}
          {discount && discount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {discount}% OFF
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
