import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@/types";
import { PriceMatchTab } from "./marketplace/PriceMatchTab";
import { ComparisonTableTab } from "./ComparisonTableTab";
import { ProductTableView } from "../ProductTableView";
import { CampbellProductsTab } from "./marketplace/CampbellProductsTab";
import { FuzzyMatchedTable } from "./marketplace/FuzzyMatchedTable";

interface MarketComparisonTabProps {
  products: Product[];
}

export function MarketComparisonTab({ products }: MarketComparisonTabProps) {
  const [priceMatchData, setPriceMatchData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("fuzzy-matched");
  const [campbellSearchTerm, setCampbellSearchTerm] = useState("");



  // Handle navigation from PriceMatchTab to Campbell Products with search prefill
  const handleNavigateToCampbellProducts = (productName: string) => {
    console.log('🔗 MarketComparisonTab: Navigating to Campbell Products for:', productName);
    setCampbellSearchTerm(productName);
    setActiveTab("campbell-products");
  };

  // Transform products data for price match format
  useEffect(() => {
    const transformedData = products.map(product => ({
      id: product.id?.toString() || Math.random().toString(),
      representative_name: product.name,
      name: product.name,
      price: parseFloat(product.sale_price?.toString() || '0'),
      marketplace: product.store || 'Unknown',
      product_url: product.source_url || '',
      image_url: '',
      source_search_url: product.source_url || '',
      size_info: '',
      similarity_to_best_price: 100,
      enhanced_with_image: false
    }));
    setPriceMatchData(transformedData);
  }, [products]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Market & Product Comparison
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare prices across different marketplaces and track product changes over time
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="fuzzy-matched">Smart Compare</TabsTrigger>
              <TabsTrigger value="campbell-products">Product</TabsTrigger>
              <TabsTrigger value="product-comparison">Product Comparison</TabsTrigger>
              <TabsTrigger value="edit-products">Edit Products</TabsTrigger>
            </TabsList>
            <TabsContent value="fuzzy-matched" className="space-y-4">
              <FuzzyMatchedTable />
            </TabsContent>

            <TabsContent value="campbell-products" className="space-y-4">
              <CampbellProductsTab 
                searchTerm={campbellSearchTerm}
                setSearchTerm={setCampbellSearchTerm}
              />
            </TabsContent>
            <TabsContent value="product-comparison" className="space-y-4">
              <ComparisonTableTab products={products} />
            </TabsContent>
            <TabsContent value="edit-products" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Edit Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit product information and manage data
                  </p>
                </div>
                <ProductTableView 
                  products={products}
                  onProductUpdate={(productId, updates) => {
                    console.log('Product updated:', productId, updates);
                    // Handle product updates here
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
