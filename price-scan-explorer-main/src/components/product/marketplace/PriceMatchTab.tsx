import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";
import { PriceComparisonTable } from "./PriceComparisonTable";

import { usePriceMatchData } from "./usePriceMatchData";
import { useS3ComparisonData } from "./hooks/useS3ComparisonData";
import { useLotusCSVData } from "./hooks/useLotusCSVData";
import { useMatchedCSVData } from "./hooks/useMatchedCSVData";
import { type DatasetType } from "./types";

interface PriceMatchTabProps {
  onNavigateToProductDetails?: (productName: string) => void;
  onNavigateToCampbellProducts?: (productName: string) => void;
}

export function PriceMatchTab({ onNavigateToProductDetails, onNavigateToCampbellProducts }: PriceMatchTabProps = {}) {
  const [activeDataset, setActiveDataset] = useState<DatasetType>("both");
  const { 
    priceMatchData, 
    csvData, 
    embeddingMatchData, 
    rawEmbeddingData, 
    isLoading: priceMatchLoading,
    refetchData 
  } = usePriceMatchData();
  
  const { 
    s3Data, 
    isLoading: s3Loading, 
    error: s3Error, 
    refetch: refetchS3 
  } = useS3ComparisonData();

  const {
    csvEmbeddingData,
    rawCSVData,
    isLoading: csvLoading,
    error: csvError,
    refetch: refetchCSV
  } = useLotusCSVData();

  const {
    processedData: matchedCsvData,
    isLoading: matchedCsvLoading,
    error: matchedCsvError,
    refetch: refetchMatchedCsv
  } = useMatchedCSVData();

  const isLoading = priceMatchLoading || s3Loading || csvLoading || matchedCsvLoading;

  // Transform S3 data to match the product details format
  const transformedS3Data = useMemo(() => {
    if (!s3Data) return [];
    
    return s3Data.flatMap(comparison => {
      const products = [];
      
      // Add product 1
      if (comparison.product_1) {
        products.push({
          id: `s3-${comparison.product_1}`,
          cluster_id: "s3",
          representative_name: comparison.product_1,
          name: comparison.product_1,
          price: comparison.product_1_price,
          marketplace: comparison.product_1_marketplace,
          product_url: comparison.product_1_url || '',
          image_url: '',
          source_search_url: '',
          size_info: '',
          similarity_to_best_price: comparison.similarity_score,
          enhanced_with_image: false,
          lowest_price: comparison.cheaper_price,
          lowest_marketplace: comparison.cheaper_marketplace,
          lowest_url: '',
          category: 'S3 Comparison',
          matched_products: [{
            name: comparison.product_2,
            price: comparison.product_2_price,
            marketplace: comparison.product_2_marketplace,
            similarity_score: comparison.similarity_score
          }]
        });
      }
      
      // Add product 2
      if (comparison.product_2) {
        products.push({
          id: `s3-${comparison.product_2}`,
          cluster_id: "s3",
          representative_name: comparison.product_2,
          name: comparison.product_2,
          price: comparison.product_2_price,
          marketplace: comparison.product_2_marketplace,
          product_url: comparison.product_2_url || '',
          image_url: '',
          source_search_url: '',
          size_info: '',
          similarity_to_best_price: comparison.similarity_score,
          enhanced_with_image: false,
          lowest_price: comparison.cheaper_price,
          lowest_marketplace: comparison.cheaper_marketplace,
          lowest_url: '',
          category: 'S3 Comparison',
          matched_products: [{
            name: comparison.product_1,
            price: comparison.product_1_price,
            marketplace: comparison.product_1_marketplace,
            similarity_score: comparison.similarity_score
          }]
        });
      }
      
      return products;
    });
  }, [s3Data]);

  // Combine data based on active dataset
  const combinedData = useMemo(() => {
    switch (activeDataset) {
      case "original":
        return priceMatchData;
      case "embedding":
        return [...embeddingMatchData, ...csvEmbeddingData];
      case "matched":
        return matchedCsvData;
      case "both":
      default:
        return [...priceMatchData, ...embeddingMatchData, ...transformedS3Data, ...csvEmbeddingData, ...matchedCsvData];
    }
  }, [activeDataset, priceMatchData, embeddingMatchData, transformedS3Data, csvEmbeddingData, matchedCsvData]);

  const handleRefreshAll = () => {
    refetchData();
    refetchS3();
    refetchCSV();
    refetchMatchedCsv();
  };

  const handleNavigateToDetails = (productName: string) => {
    console.log('🔗 Navigating to details for product:', productName);
    console.log('🔗 Combined data length:', combinedData.length);
    
    if (onNavigateToProductDetails) {
      // Use parent navigation handler to switch to outer Product Details tab
      console.log('🔗 Using parent navigation handler');
      onNavigateToProductDetails(productName);
    } else {
      // No fallback needed - navigation should always go through parent
      console.log('🔗 No parent navigation handler provided');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading price match data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Price Match Analysis</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare prices across different marketplaces and analyze product matches
              </p>
            </div>
            <Button onClick={handleRefreshAll} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeDataset === "both" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDataset("both")}
            >
              All Data ({priceMatchData.length + embeddingMatchData.length + transformedS3Data.length + csvEmbeddingData.length + matchedCsvData.length})
            </Button>
            <Button
              variant={activeDataset === "original" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDataset("original")}
            >
              Original ({priceMatchData.length})
            </Button>
            <Button
              variant={activeDataset === "embedding" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDataset("embedding")}
            >
              Embedding Matches ({embeddingMatchData.length + csvEmbeddingData.length})
            </Button>
            <Button
              variant={activeDataset === "matched" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDataset("matched")}
            >
              Fuzzy Matched ({matchedCsvData.length})
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{combinedData.length}</div>
              <div className="text-sm text-blue-600">Total Products</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {new Set(combinedData.map(p => p.marketplace)).size}
              </div>
              <div className="text-sm text-green-600">Marketplaces</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {csvEmbeddingData.length}
              </div>
              <div className="text-sm text-purple-600">Lotus CSV Products</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Comparison Table */}
          <PriceComparisonTable 
            onNavigateToDetails={handleNavigateToDetails}
        onNavigateToCampbell={onNavigateToCampbellProducts}
          />
    </div>
  );
}
