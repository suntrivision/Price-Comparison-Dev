import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RotateCcw } from "lucide-react";
import { ComparisonTableRow } from "./components/ComparisonTableRow";
import { useEmbeddingClusterData } from "./hooks/useEmbeddingClusterData";
import { 
  transformEmbeddingDataToRows,
  formatPrice, 
  formatPercentage, 
  getMarketplaceBadgeColor,
  generateCSVContent,
  downloadCSV,
  type ComparisonRow,
  extractBrandName
} from "./utils/comparisonTableUtils";

const ITEMS_PER_PAGE = 10;

interface PriceComparisonTableProps {
  onNavigateToDetails?: (productName: string) => void;
  onNavigateToCampbell?: (productName: string) => void;
}

export function PriceComparisonTable({ onNavigateToDetails, onNavigateToCampbell }: PriceComparisonTableProps) {
  const [embeddingVersion, setEmbeddingVersion] = useState<'v2' | 'v3'>('v3');
  const { embeddingData, isLoading: embeddingLoading, error: embeddingError, refetch: refetchEmbedding } = useEmbeddingClusterData(embeddingVersion);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSameBrand, setFilterSameBrand] = useState(false);
  const [minSimilarity, setMinSimilarity] = useState(0);

  // Transform embedding data to comparison rows
  const comparisonRows = useMemo(() => {
    console.log('🔄 PriceComparisonTable: Building comparison rows from HORECA embedding data');
    console.log('🎯 Embedding data:', embeddingData?.length || 0, 'clusters');
    
    // Check if INDOMIE data is present in embedding data
    if (embeddingData && embeddingData.length > 0) {
      const indomieClusters = embeddingData.filter(cluster => 
        cluster.all_products && cluster.all_products.includes('INDOMIE')
      );
      console.log('🍜 INDOMIE clusters found:', indomieClusters.length);
      
      // Log HORECA URLs found
      const horecaClusters = embeddingData.filter(cluster => 
        cluster.lowest_url && cluster.lowest_url.includes('corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer')
      );
      console.log('🏪 HORECA flyer clusters found:', horecaClusters.length);
    }
    
    if (embeddingData && embeddingData.length > 0) {
      const embeddingRows = transformEmbeddingDataToRows(embeddingData);
      console.log('✅ Embedding transformed rows:', embeddingRows.length);
      return embeddingRows;
    }
    
    console.log('🏁 No embedding data available');
    return [];
  }, [embeddingData]);

  // Filter rows by search term with enhanced partial matching
  const filteredRows = useMemo(() => {
    console.log('🔍 Filtering rows - search term:', searchTerm);
    console.log('🔍 Total rows before filtering:', comparisonRows.length);
    
    if (!searchTerm || searchTerm.trim() === '') {
      console.log('🔍 No search term, returning all rows');
      return comparisonRows;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const searchWords = term.split(/\s+/); // Split by whitespace
    
    const filtered = comparisonRows.filter(row => {
      // Search in product sources (names)
      const sourceMatch = row.sources.some(source => {
        const sourceLower = source.toLowerCase();
        // Check if all search words are found in the source (partial matching)
        return searchWords.every(word => sourceLower.includes(word)) ||
               // Or if the entire search term is found
               sourceLower.includes(term);
      });
      
      // Search in marketplaces
      const marketMatch = row.marketplaces.some(market => {
        const marketLower = market.toLowerCase();
        return searchWords.every(word => marketLower.includes(word)) ||
               marketLower.includes(term);
      });
      
      // Search in brand
      const brandMatch = row.brand && row.brand.toLowerCase().includes(term);
      
      // Also search in representative name if available
      const repNameMatch = row.sources.length > 0 && 
        searchWords.every(word => row.sources[0].toLowerCase().includes(word));
      
      return sourceMatch || marketMatch || brandMatch || repNameMatch;
    });
    
    console.log('🔍 Filtered rows count:', filtered.length);
    console.log('🔍 Search words:', searchWords);
    
    return filtered;
  }, [comparisonRows, searchTerm]);

  // Filter by same brand if checkbox is checked
  const referenceBrand = filteredRows.length > 0 ? filteredRows[0].brand : "";
  const brandFilteredRows = filterSameBrand
    ? filteredRows.filter(row => row.brand === referenceBrand)
    : filteredRows;

  // Filter by minimum similarity score
  const similarityFilteredRows = useMemo(() => {
    return brandFilteredRows.filter(row =>
      typeof row.similarityScore === "number" ? row.similarityScore >= minSimilarity : true
    );
  }, [brandFilteredRows, minSimilarity]);

  const getSimilarityBadgeVariant = (similarity: number) => {
    if (similarity >= 90) return "default" as const;
    if (similarity >= 70) return "secondary" as const;
    return "destructive" as const;
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVContent(similarityFilteredRows);
    downloadCSV(csvContent);
  };

  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Handle refresh for embedding data
  const handleRefresh = () => {
    refetchEmbedding();
  };

  // Pagination
  const totalPages = Math.ceil(similarityFilteredRows.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRows = similarityFilteredRows.slice(startIndex, endIndex);

  const isLoading = embeddingLoading;
  const error = embeddingError;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading comparison data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price Comparison Table - Embedding Matched Price Comparison {embeddingVersion.toUpperCase()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {embeddingVersion === 'v2' 
                ? 'Product clustering v2 with 36 clusters including INDOMIE, Campbell, and marketplace data'
                : 'Advanced product clustering v3 with 36 clusters including INDOMIE, Campbell, and enhanced price matching'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        {/* Search Input and Filters */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-md w-full max-w-xs"
          />
          
          {/* Embedding Version Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="embedding-version" className="text-sm whitespace-nowrap">Data Version:</label>
            <select
              id="embedding-version"
              value={embeddingVersion}
              onChange={e => {
                setEmbeddingVersion(e.target.value as 'v2' | 'v3');
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="v2">Embedding v2</option>
              <option value="v3">Embedding v3</option>
            </select>
          </div>

          {/* Similarity Score Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="min-similarity" className="text-sm whitespace-nowrap">Min Similarity:</label>
          <input
            id="min-similarity"
            type="number"
            min={0}
            max={100}
            value={minSimilarity}
            onChange={e => {
              setMinSimilarity(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-20 px-2 py-1 border rounded"
          />
          <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {similarityFilteredRows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comparison data available</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="min-w-[200px]">Product Name</TableHead>
                    <TableHead>Lowest Source Price</TableHead>
                    <TableHead>Highest Marketplace Price</TableHead>
                    <TableHead>Margin%</TableHead>
                    <TableHead>Similarity Score</TableHead>
                    <TableHead>
                      <img
                        src="data:image/png;base64,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"
                        alt="Lotus's Logo"
                        className="h-6 w-6 mx-auto"
                      />
                    </TableHead>
                    <TableHead>MyDin</TableHead>
                    <TableHead>Econosave</TableHead>
                    <TableHead>Giant</TableHead>
                    <TableHead>Aeon2Big</TableHead>
                    <TableHead>Shopee</TableHead>
                    <TableHead>Lazada</TableHead>
                    <TableHead>TikTok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRows.map((row, index) => (
                    <ComparisonTableRow
                      key={row.id}
                      row={row}
                      index={index}
                      startIndex={startIndex}
                      isSelected={selectedRows.has(row.id)}
                      formatPrice={formatPrice}
                      formatPercentage={formatPercentage}
                      getMarketplaceBadgeColor={getMarketplaceBadgeColor}
                      getSimilarityBadgeVariant={getSimilarityBadgeVariant}
                      onViewDetails={undefined}
                      onViewInCampbell={onNavigateToCampbell}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, similarityFilteredRows.length)} of{" "}
                  {similarityFilteredRows.length} entries
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
