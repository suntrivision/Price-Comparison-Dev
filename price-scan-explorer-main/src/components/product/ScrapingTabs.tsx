
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketComparisonTab } from "./MarketComparisonTab";
import { ComparisonTableTab } from "./ComparisonTableTab";
import { ProductCard } from "@/components/product-card";
import { ProductTableView } from "@/components/ProductTableView";
import { Card } from "@/components/ui/card";
import { Product } from "@/types";

interface ScrapingTabsProps {
  pythonCode: string;
  scrapedData: Product[];
}

export function ScrapingTabs({ pythonCode, scrapedData }: ScrapingTabsProps) {
  const handleProductUpdate = (productId: string, updates: Partial<Product>) => {
    console.log('Product updated:', productId, updates);
  };

  const handleSort = (field: any) => {
    console.log('Sort field:', field);
  };

  return (
    <Tabs defaultValue="market" className="w-full">
      <TabsList className="mx-4 mt-2 bg-muted/50">
        <TabsTrigger 
          value="market"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Market Comparison
        </TabsTrigger>
        <TabsTrigger 
          value="comparison"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Price Comparison
        </TabsTrigger>
        <TabsTrigger 
          value="cards"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Card View
        </TabsTrigger>
        <TabsTrigger 
          value="table"
          className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
        >
          Table View
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="market" className="p-4 space-y-4">
        <MarketComparisonTab products={scrapedData} />
      </TabsContent>
      
      <TabsContent value="comparison" className="p-4 space-y-4">
        <ComparisonTableTab products={scrapedData} />
      </TabsContent>
      
      <TabsContent value="cards" className="space-y-4">
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {scrapedData.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
          {scrapedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found.
            </div>
          )}
        </Card>
      </TabsContent>
      
      <TabsContent value="table" className="space-y-4">
        <Card className="p-6">
          <ProductTableView
            products={scrapedData}
            onProductUpdate={handleProductUpdate}
            onSort={handleSort}
            sortField="timestamp"
            sortDirection="desc"
          />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
