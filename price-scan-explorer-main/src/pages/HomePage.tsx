
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Store } from "lucide-react";
import { useApiProducts } from "@/hooks/useApiProducts";
import { scrapedData } from "@/components/product/scrapingCodeData";
import { MarketComparisonTab } from "@/components/product/MarketComparisonTab";

export default function HomePage() {
  const { products, isLoading, error } = useApiProducts();

  return (
    <MainLayout>
      <div className="container py-12">
        <SectionHeader
          title="Price Comparison Dashboard"
          description="Compare prices across different marketplaces and discover the best deals"
        />

        {/* Market & Product Comparison Section */}
        <MarketComparisonTab products={products} />
      </div>
    </MainLayout>
  );
}
