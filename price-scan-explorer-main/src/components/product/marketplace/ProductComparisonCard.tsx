import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Store } from "lucide-react";

interface ProductComparisonCardProps {
  product: {
    cluster_id: number;
    representative_name: string;
    lowest_price: number;
    lowest_marketplace: string;
    lowest_url: string;
    all_products: string;
  };
}

export function ProductComparisonCard({ product }: ProductComparisonCardProps) {
  const formatPrice = (price: number | string | null) => {
    if (price === null || price === undefined || price === '') return "-";
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/[^0-9.-]+/g, '')) : price;
    return numPrice > 0 ? `RM ${numPrice.toFixed(2)}` : "-";
  };

  const getBestPriceBadgeColor = (store: string) => {
    switch (store?.toLowerCase()) {
      case 'lotus':
        return 'bg-blue-100 text-blue-800';
      case 'shopee':
        return 'bg-orange-100 text-orange-800';
      case 'mydin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // Parse other products from the all_products string
  const otherProducts = product.all_products ? 
    product.all_products.split(';').slice(0, 3) : []; // Show max 3 other products

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 mb-2">
              {product.representative_name}
            </h3>
            <Badge variant="outline" className="text-xs">
              #{product.cluster_id}
            </Badge>
          </div>

          {/* Best Price Section */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Best Price
              </span>
              <Badge 
                className={`text-xs ${getBestPriceBadgeColor(product.lowest_marketplace)}`}
              >
                <Store className="w-3 h-3 mr-1" />
                {product.lowest_marketplace}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(product.lowest_price)}
              </span>
              {product.lowest_url && (
                <a 
                  href={product.lowest_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Other Stores Comparison */}
          {otherProducts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Also Available At:
              </h4>
              <div className="space-y-2">
                {otherProducts.map((productInfo, index) => {
                  // Try to extract store and price info from the product string
                  const storeMatch = productInfo.match(/(lotus|shopee|mydin|lazada|grab)/i);
                  const storeName = storeMatch ? storeMatch[1] : `Store ${index + 1}`;
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground truncate flex-1 mr-2">
                        {storeName}
                      </span>
                      <span className="text-muted-foreground">
                        Price varies
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Count */}
          <div className="text-xs text-muted-foreground">
            {otherProducts.length + 1} stores compared
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
