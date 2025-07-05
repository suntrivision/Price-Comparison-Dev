
import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ProductTableView } from "@/components/ProductTableView";
import { ComparisonTableTab } from "./ComparisonTableTab";
import { ProductCard } from "@/components/product-card";
import { Product } from "@/types";
import { useTempProductStorage } from "@/hooks/useTempProductStorage";
import { calculateDiscount } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SortField = 'run_number' | 'timestamp' | 'store' | 'category' | 'name' | 'sale_price' | 'original_price' | 'discount' | 'last_modified_at';
type SortDirection = 'asc' | 'desc';

interface ScrapedDataTabProps {
  scrapedData: Product[];
  allProducts: Product[];
}

export function ScrapedDataTab({ scrapedData, allProducts }: ScrapedDataTabProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Use temp storage
  const { products: tempProducts, refreshFromDatabase } = useTempProductStorage();
  
  // Use temp products if available, otherwise use scraped data
  const displayProducts = tempProducts.length > 0 ? tempProducts : scrapedData;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProducts = useMemo(() => {
    return [...displayProducts].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle different data types
      if (sortField === 'timestamp' || sortField === 'last_modified_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (sortField === 'sale_price' || sortField === 'original_price') {
        aValue = parseFloat(aValue?.replace(/[^0-9.-]+/g, '') || '0');
        bValue = parseFloat(bValue?.replace(/[^0-9.-]+/g, '') || '0');
      } else if (sortField === 'run_number') {
        aValue = parseInt(aValue || '0');
        bValue = parseInt(bValue || '0');
      } else if (sortField === 'discount') {
        // Calculate discount percentage for sorting
        aValue = calculateDiscount(a.original_price, a.sale_price) || 0;
        bValue = calculateDiscount(b.original_price, b.sale_price) || 0;
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [displayProducts, sortField, sortDirection]);

  const handleProductUpdate = (productId: string, updates: Partial<Product>) => {
    console.log('Product updated:', productId, updates);
    // Temp storage handles the update automatically
  };

  const handleRefresh = () => {
    // Use temp storage refresh
    refreshFromDatabase();
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Price Comparison</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="space-y-4">
          <Card className="p-6">
            <ComparisonTableTab products={allProducts} />
          </Card>
        </TabsContent>
        
        <TabsContent value="cards" className="space-y-4">
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
            {sortedProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found.
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4">
          <Card className="p-6">
            <ProductTableView
              products={sortedProducts}
              onProductUpdate={handleProductUpdate}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              onRefresh={handleRefresh}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
