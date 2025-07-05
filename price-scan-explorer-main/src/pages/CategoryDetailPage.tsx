
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { categories } from "@/data/categories";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { scrapedData } from "@/components/product/scrapingCodeData";
import { mockProducts } from "@/data/productUtils";

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the current category details
  const currentCategory = categories.find(cat => cat.slug === slug);
  
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate loading data
    setTimeout(() => {
      let categoryProducts: Product[] = [];
      
      // For the "cooking-oils" category, use the scrapedData (which is focused on oil products)
      if (slug === "cooking-oils") {
        categoryProducts = scrapedData.map(product => ({
          ...product,
          category: "cooking-oils"
        }));
      } else {
        // For other categories, filter from mock products
        categoryProducts = mockProducts.filter(product => 
          product.category === slug
        );
        
        // If no products found for this category, get some random products
        if (categoryProducts.length === 0) {
          categoryProducts = mockProducts.slice(0, 8).map(product => ({
            ...product,
            category: slug || "general"
          }));
        }
      }
      
      setProducts(categoryProducts);
      setIsLoading(false);
      
      toast({
        title: "Category loaded",
        description: `Found ${categoryProducts.length} products in the ${currentCategory?.name || slug} category`,
      });
    }, 500);
  }, [slug, toast, currentCategory?.name]);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="container py-12">
        <SectionHeader
          title={currentCategory?.name || "Category Not Found"}
          description={currentCategory 
            ? `Browse all ${currentCategory.count} products in the ${currentCategory.name} category` 
            : "We couldn't find the category you're looking for"
          }
        />
        
        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-12">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search in ${currentCategory?.name || "products"}...`}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
            ))
          ) : filteredProducts.length > 0 ? (
            // Display products
            filteredProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index} 
              />
            ))
          ) : (
            // No products found
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
