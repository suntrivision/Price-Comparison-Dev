
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Store, RefreshCw } from "lucide-react";
import { useApiProducts } from "@/hooks/useApiProducts";
import { scrapedData } from "@/components/product/scrapingCodeData";
import { MarketComparisonTab } from "@/components/product/MarketComparisonTab";
import { SmartComparison } from "@/components/SmartComparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { products, isLoading, error, refetch } = useApiProducts();

  return (
    <MainLayout>
      <div className="container py-12">
        <SectionHeader
          title="Price Comparison Dashboard"
          description="Compare prices across different marketplaces and discover the best deals"
        />

        {/* Error handling */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-red-800">Error Loading Data</h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button onClick={refetch} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {isLoading && (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                <span>Loading products...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        {!isLoading && !error && (
          <Tabs defaultValue="smart-compare" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smart-compare">Smart Comparison</TabsTrigger>
              <TabsTrigger value="market-compare">Market Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart-compare" className="space-y-6">
              <SmartComparison />
            </TabsContent>
            
            <TabsContent value="market-compare" className="space-y-6">
        <MarketComparisonTab products={products} />
            </TabsContent>
          </Tabs>
        )}

        {/* Fallback content if no products */}
        {!isLoading && !error && products.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
              <p className="text-muted-foreground mb-4">
                No products are currently available. Please try refreshing the page.
              </p>
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
