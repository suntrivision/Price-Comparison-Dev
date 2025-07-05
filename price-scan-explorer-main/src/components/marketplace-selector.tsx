import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StoreSelector } from "@/components/store-selector";
import { getProductsByStore } from "@/data/productUtils";
import { ProductCard } from "@/components/product-card";
import { InfoIcon, Loader2 } from "lucide-react";
import { Product } from "@/types";
import { scrapedData } from "@/components/product/scrapingCodeData";
import { useApiProducts } from "@/hooks/useApiProducts";
import { ProductFilters } from "@/components/ProductFilters";
import { useProductFilters } from "@/hooks/useProductFilters";
import { ProductTableView } from "@/components/ProductTableView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketplaceSelectorProps {
  showScrapingCode?: boolean;
  selectedStore?: string;
  onStoreSelect?: (store: string) => void;
  hideSelector?: boolean;
  showProductsSection?: boolean;
}

export function MarketplaceSelector({ 
  selectedStore: propSelectedStore,
  onStoreSelect,
  hideSelector = false,
  showProductsSection = true
}: MarketplaceSelectorProps) {
  // Use the prop if provided, otherwise use local state
  const [localSelectedStore, setLocalSelectedStore] = useState("Lotus's");
  const selectedStore = propSelectedStore || localSelectedStore;
  
  // Fetch API products
  const { products: apiProducts, isLoading, error } = useApiProducts();
  
  const handleStoreChange = (store: string) => {
    setLocalSelectedStore(store);
    if (onStoreSelect) {
      onStoreSelect(store);
    }
  };
  
  // Determine which products to show based on store selection
  let products: Product[] = [];
  let showApiData = false;
  
  if (selectedStore === "Lotus's") {
    if (apiProducts.length > 0) {
      products = apiProducts;
      showApiData = true;
    } else {
      // Fallback to scraped data if API fails
      products = scrapedData.filter(product => 
        (product.sale_price?.includes('RM') || product.original_price?.includes('RM')));
    }
  } else {
    // No products for other stores
    products = [];
  }

  // Hide product counts when using live API data
  const shouldShowProductCounts = !showApiData;

  // Use filtering hook for products
  const {
    runNumber,
    setRunNumber,
    productName,
    setProductName,
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredProducts,
    clearFilters,
    hasActiveFilters
  } = useProductFilters({ products });

  return (
    <div className="space-y-6">
      {!hideSelector && (
        <div className="mb-4">
          <StoreSelector 
            defaultStore={selectedStore} 
            onSelectStore={handleStoreChange}
            className="w-full sm:w-48"
            showProductCounts={shouldShowProductCounts}
          />
        </div>
      )}

      {showProductsSection && (
        <>
          {selectedStore === "Lotus's" && (
            <>
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-4 flex items-start gap-3 mb-4">
                <InfoIcon className="text-blue-500 h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">
                    {showApiData ? "Live API Data: Lotus's Malaysia" : "Live Data: Lotus's Malaysia Weekly Savers"}
                  </h3>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    {showApiData 
                      ? "Real-time product data from Lotus's Malaysia API with live pricing and discounts."
                      : "Showing RM currency products scraped from Lotus's Malaysia Weekly Savers using Python with Playwright and BeautifulSoup."
                    }
                  </p>
                </div>
              </Card>

              <ProductFilters
                runNumber={runNumber}
                onRunNumberChange={setRunNumber}
                productName={productName}
                onProductNameChange={setProductName}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                availableCategories={availableCategories}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                onClearFilters={clearFilters}
              />
            </>
          )}

          {selectedStore !== "Lotus's" && (
            <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 p-4 flex items-start gap-3 mb-4">
              <InfoIcon className="text-orange-500 h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-700 dark:text-orange-300">
                  Store Not Available
                </h3>
                <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
                  Products are currently only available for Lotus's Malaysia. Please select Lotus's to view products.
                </p>
              </div>
            </Card>
          )}

          {isLoading && selectedStore === "Lotus's" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading products from API...</span>
            </div>
          )}

          {error && selectedStore === "Lotus's" && (
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">
                Error loading API data: {error}. Showing fallback data instead.
              </p>
            </Card>
          )}

          {selectedStore === "Lotus's" && filteredProducts.length > 0 && (
            <>
              {hasActiveFilters && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                </div>
              )}
              
              <Tabs defaultValue="cards" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger 
                    value="cards" 
                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all hover:bg-green-100 dark:hover:bg-green-900/20"
                  >
                    Card View
                  </TabsTrigger>
                  <TabsTrigger 
                    value="table"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900/20"
                  >
                    Table View
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="cards" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="table" className="mt-6">
                  <ProductTableView products={filteredProducts} />
                </TabsContent>
              </Tabs>
            </>
          )}

          {selectedStore === "Lotus's" && filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {hasActiveFilters ? "No products match your filters." : "No products available at the moment."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
