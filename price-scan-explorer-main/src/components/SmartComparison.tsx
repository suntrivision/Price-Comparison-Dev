import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, TrendingDown, TrendingUp, ExternalLink, Store, Calendar } from 'lucide-react';
import { useMatchedCSVData, MatchedProduct } from '@/components/product/marketplace/hooks/useMatchedCSVData';

export function SmartComparison() {
  const { matchedData, isLoading, error, refetch } = useMatchedCSVData();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'matchScore' | 'priceDiff' | 'name' | 'timestamp'>('matchScore');
  const [filterBy, setFilterBy] = useState<'all' | 'lotusCheaper' | 'shopeeCheaper' | 'samePrice' | 'matched' | 'unmatched'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [matchScoreFilter, setMatchScoreFilter] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Remove duplicates by product name (case-insensitive)
  const uniqueComparisons = matchedData.filter(
    (item, index, self) =>
      index === self.findIndex(
        (t) => t.lotusProduct.toLowerCase() === item.lotusProduct.toLowerCase()
      )
  );

  const filteredAndSortedComparisons = React.useMemo(() => {
    let filtered = uniqueComparisons;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp => 
        comp.lotusProduct.toLowerCase().includes(query) ||
        comp.shopeeProduct.toLowerCase().includes(query)
      );
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(comp => {
        try {
          // Handle yyyy/mm/dd format
          if (/^\d{4}\/\d{2}\/\d{2}$/.test(comp.timestamp)) {
            const [year, month, day] = comp.timestamp.split('/').map(Number);
            const compDate = new Date(year, month - 1, day); // month is 0-indexed
            return compDate.toDateString() === filterDate.toDateString();
          }
          
          // Handle dd/mm/yyyy format
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(comp.timestamp)) {
            const [day, month, year] = comp.timestamp.split('/').map(Number);
            const compDate = new Date(year, month - 1, day); // month is 0-indexed
            return compDate.toDateString() === filterDate.toDateString();
          }
          
          // Try to parse as regular date
          const compDate = new Date(comp.timestamp);
          return compDate.toDateString() === filterDate.toDateString();
        } catch {
          return false;
        }
      });
    }

    // Filter by match score
    if (matchScoreFilter > 0) {
      filtered = filtered.filter(comp => comp.matchScore >= matchScoreFilter);
    }

    // Filter by price comparison or match status
    if (filterBy !== 'all') {
      filtered = filtered.filter(comp => {
        const priceDiff = comp.priceDifference;
        switch (filterBy) {
          case 'lotusCheaper':
            return priceDiff < 0;
          case 'shopeeCheaper':
            return priceDiff > 0;
          case 'samePrice':
            return Math.abs(priceDiff) < 0.01;
          case 'matched':
            return comp.matchStatus === 'Matched';
          case 'unmatched':
            return comp.matchStatus.includes('Unmatched');
          default:
            return true;
        }
      });
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'matchScore':
          return b.matchScore - a.matchScore;
        case 'priceDiff':
          return Math.abs(b.priceDifference) - Math.abs(a.priceDifference);
        case 'name':
          return a.lotusProduct.localeCompare(b.lotusProduct);
        case 'timestamp':
          const parseTimestamp = (timestamp: string) => {
            try {
              // Handle yyyy/mm/dd format
              if (/^\d{4}\/\d{2}\/\d{2}$/.test(timestamp)) {
                const [year, month, day] = timestamp.split('/').map(Number);
                return new Date(year, month - 1, day).getTime(); // month is 0-indexed
              }
              
              // Handle dd/mm/yyyy format
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(timestamp)) {
                const [day, month, year] = timestamp.split('/').map(Number);
                return new Date(year, month - 1, day).getTime(); // month is 0-indexed
              }
              
              // Try to parse as regular date
              return new Date(timestamp).getTime();
            } catch {
              return 0;
            }
          };
          return parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp);
        default:
          return 0;
      }
    });

    return filtered;
  }, [uniqueComparisons, searchQuery, sortBy, filterBy, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedComparisons.length / itemsPerPage);
  const paginatedComparisons = filteredAndSortedComparisons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page if filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterBy, dateFilter, matchScoreFilter, uniqueComparisons]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" />
            <span>Loading smart comparison data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading comparison data: {error}</p>
            <Button onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to build Lotus URL if missing
  function buildLotusUrl(productName: string) {
    const base_url = "https://www.lotuss.com.my/en/search/";
    const query_suffix = "?sort=relevance:DESC";
    const encodedName = encodeURIComponent(productName.replace(/\s+/g, '+'));
    return `${base_url}${encodedName}${query_suffix}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Smart Price Comparison</CardTitle>
              <p className="text-sm text-gray-600">
                AI-matched products between Lotus and Shopee with intelligent price analysis
              </p>
            </div>
            <Button onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matchScore">Match Score</SelectItem>
                <SelectItem value="priceDiff">Price Difference</SelectItem>
                <SelectItem value="name">Product Name</SelectItem>
                <SelectItem value="timestamp">Timestamp</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="matched">Matched Only</SelectItem>
                <SelectItem value="unmatched">Unmatched Only</SelectItem>
                <SelectItem value="lotusCheaper">Lotus Cheaper</SelectItem>
                <SelectItem value="shopeeCheaper">Shopee Cheaper</SelectItem>
                <SelectItem value="samePrice">Same Price</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium">≥</span>
                  <Input
                    type="number"
                    placeholder="Min Score"
                    min="0"
                    max="100"
                    value={matchScoreFilter}
                    onChange={(e) => setMatchScoreFilter(Number(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Match Score Filters */}
          <div className="flex gap-2 mt-4">
            <span className="text-sm text-gray-600 flex items-center">Quick filters:</span>
            <Button
              variant={matchScoreFilter === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setMatchScoreFilter(0)}
            >
              All
            </Button>
            <Button
              variant={matchScoreFilter === 50 ? "default" : "outline"}
              size="sm"
              onClick={() => setMatchScoreFilter(50)}
            >
              ≥50%
            </Button>
            <Button
              variant={matchScoreFilter === 70 ? "default" : "outline"}
              size="sm"
              onClick={() => setMatchScoreFilter(70)}
            >
              ≥70%
            </Button>
            <Button
              variant={matchScoreFilter === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setMatchScoreFilter(90)}
            >
              ≥90%
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredAndSortedComparisons.length}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredAndSortedComparisons.filter(c => c.matchStatus === 'Matched').length}
              </p>
              <p className="text-sm text-gray-600">Matched</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {filteredAndSortedComparisons.filter(c => c.matchStatus.includes('Unmatched')).length}
              </p>
              <p className="text-sm text-gray-600">Unmatched</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {filteredAndSortedComparisons.filter(c => c.matchStatus === 'Matched' && c.priceDifference < 0).length}
              </p>
              <p className="text-sm text-gray-600">Lotus Cheaper</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Comparisons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Price (RM)</TableHead>
                  <TableHead>Lotus's Disc Price</TableHead>
                  <TableHead>Lotus's Per Unit</TableHead>
                  <TableHead>Lotus's Url</TableHead>
                  <TableHead>Shopee Price</TableHead>
                  <TableHead>Shopee Per Unit Price</TableHead>
                  <TableHead>Shopee URL</TableHead>
                  <TableHead>Shopee Shop Name</TableHead>
                  <TableHead>Shopee Shop URL</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComparisons.map((comparison, index) => {
                  const isLotusCheaper = comparison.priceDifference < 0;
                  const isShopeeCheaper = comparison.priceDifference > 0;
                  
                  // Format timestamp - handle yyyy/mm/dd format and convert to dd/mm/yyyy
                  const formatTimestamp = (timestamp: string) => {
                    try {
                      // If it's already in yyyy/mm/dd format, convert to dd/mm/yyyy
                      if (/^\d{4}\/\d{2}\/\d{2}$/.test(timestamp)) {
                        const [year, month, day] = timestamp.split('/');
                        return `${day}/${month}/${year}`;
                      }
                      
                      // Try to parse as Date and format as dd/mm/yyyy
                      const date = new Date(timestamp);
                      if (!isNaN(date.getTime())) {
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      }
                      
                      // Fallback to original timestamp
                      return timestamp;
                    } catch {
                      return timestamp;
                    }
                  };
                  
                  const formattedDate = formatTimestamp(comparison.timestamp);

                  // Calculate per unit price comparison
                  const getPerUnitComparison = () => {
                    const lotusPerUnit = parseFloat(comparison.lotusPerUnitPrice) || 0;
                    const shopeePerUnit = parseFloat(comparison.shopeePerUnitPrice) || 0;
                    
                    if (lotusPerUnit === 0 && shopeePerUnit === 0) return null;
                    if (lotusPerUnit === 0) return { better: 'Shopee', savings: 0 };
                    if (shopeePerUnit === 0) return { better: 'Lotus', savings: 0 };
                    
                    const difference = lotusPerUnit - shopeePerUnit;
                    const savings = Math.abs(difference);
                    
                    if (difference < 0) {
                      return { better: 'Lotus', savings, percentage: (savings / lotusPerUnit) * 100 };
                    } else if (difference > 0) {
                      return { better: 'Shopee', savings, percentage: (savings / shopeePerUnit) * 100 };
                    } else {
                      return { better: 'Same', savings: 0 };
                    }
                  };

                  const perUnitComparison = getPerUnitComparison();

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{comparison.lotusProduct}</span>
                          {comparison.lotusUrl === "https://corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer" && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 rounded px-2 py-0.5 ml-2">Promo</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {comparison.originalPrice > 0 ? `RM${comparison.originalPrice.toFixed(2)}` : 'N/A'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-blue-600" />
                          <p className="font-medium">
                            {comparison.lotusPrice > 0 ? `RM${comparison.lotusPrice.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // Clean product name by removing COD, Shipping, and extra spaces
                          let productName = comparison.lotusProduct.toLowerCase()
                            .replace(/\b(cod|shipping)\b/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                          const price = comparison.lotusPrice;
                          
                          if (price <= 0) return <span>-</span>;
                          
                          // Check for triple X with range patterns (5 X 8 X 80Gm - 85Gm, etc.) - use first number as pack size
                          const tripleXRangeMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|m)\s*-\s*[\d\.]+\s*(kg|g|l|ml|m)/i);
                          if (tripleXRangeMatch) {
                            const packCount = parseInt(tripleXRangeMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for triple X patterns with units (9 X 6 X 58Gm, etc.) - use first number as pack size
                          const tripleXMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|m)/i);
                          if (tripleXMatch) {
                            const packCount = parseInt(tripleXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for triple X patterns without units (5 X 8 X 80, etc.) - use first number as pack size
                          const tripleXNoUnitMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*\d+/i);
                          if (tripleXNoUnitMatch) {
                            const packCount = parseInt(tripleXNoUnitMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for pack patterns (5X85G, 3x16.8g, 80Gx5, Pack 10S, 10S, etc.)
                          const packMatch = productName.match(/(\d+)\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|s|pcs|pack)/);
                          if (packMatch) {
                            const packCount = parseInt(packMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for reverse pack patterns (80Gx5, 100Gx3, etc.)
                          const reversePackMatch = productName.match(/(\d+\.?\d*)\s*(kg|g|l|ml)\s*[x×]\s*(\d+)/i);
                          if (reversePackMatch) {
                            const packCount = parseInt(reversePackMatch[3]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Pack XS patterns (Pack 10S, Pack 5S, etc.)
                          const packXSMatch = productName.match(/pack\s*(\d+)s/i);
                          if (packXSMatch) {
                            const packCount = parseInt(packXSMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for XS patterns (10S, 5S, etc.)
                          const xsMatch = productName.match(/(\d+)s/i);
                          if (xsMatch) {
                            const packCount = parseInt(xsMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for sachet patterns
                          const sachetMatch = productName.match(/(\d+)\s*sachet/i);
                          if (sachetMatch) {
                            const packCount = parseInt(sachetMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} sachet = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Pek patterns (5 Pek, 10 Pek, etc.)
                          const pekMatch = productName.match(/(\d+)\s*pek/i);
                          if (pekMatch) {
                            const packCount = parseInt(pekMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          

                          
                          // Check for complex pack patterns (80G X5'S X8Pack, etc.)
                          const complexPackMatch = productName.match(/[\d\.]+\s*(kg|g|l|ml)\s*[x×]\d+[''s]*\s*[x×]\s*(\d+)\s*pack/i);
                          if (complexPackMatch) {
                            const packCount = parseInt(complexPackMatch[2]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for compact triple X patterns (8X5X80G, etc.)
                          const compactTripleXMatch = productName.match(/(?:[a-z0-9\s\/\-]+?)\/?(\d+)[x×]\d+[x×]?\d*\.?\d*\s?g?\s*(?:pack|packs)?/i);
                          if (compactTripleXMatch) {
                            const packCount = parseInt(compactTripleXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for XPack patterns (X8Pack, X5Pack, etc.)
                          const xPackMatch = productName.match(/[x×]\s*(\d+)\s*pack/i);
                          if (xPackMatch) {
                            const packCount = parseInt(xPackMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Packs X patterns (5 Packs X 85G, etc.)
                          const packsXMatch = productName.match(/(\d+)\s*packs?\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml)/i);
                          if (packsXMatch) {
                            const packCount = parseInt(packsXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Indomie complex patterns
                          const indomieMatch = productName.match(/(?:[a-z0-9\s\-\/]+?)\s*(?:carton|pack)?\s*(\d{2,3})\s?g(?:m)?\s*[x×]\s*\d+\s*[x×]\s*\d+/i);
                          if (indomieMatch) {
                            const packCount = parseInt(indomieMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-blue-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for kg patterns
                          const kgMatch = productName.match(/(\d+\.?\d*)\s*kg/);
                          if (kgMatch) {
                            const kgAmount = parseFloat(kgMatch[1]);
                            const perKgPrice = price / kgAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {kgAmount}kg = <span className="font-bold text-blue-700">RM{perKgPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for litre patterns
                          const litreMatch = productName.match(/(\d+\.?\d*)\s*l/);
                          if (litreMatch) {
                            const litreAmount = parseFloat(litreMatch[1]);
                            const perLitrePrice = price / litreAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {litreAmount}L = <span className="font-bold text-blue-700">RM{perLitrePrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for ml patterns
                          const mlMatch = productName.match(/(\d+\.?\d*)\s*ml/);
                          if (mlMatch) {
                            const mlAmount = parseFloat(mlMatch[1]);
                            const perMlPrice = price / mlAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {mlAmount}ml = <span className="font-bold text-blue-700">RM{perMlPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for g patterns
                          const gMatch = productName.match(/(\d+\.?\d*)\s*g/);
                          if (gMatch) {
                            const gAmount = parseFloat(gMatch[1]);
                            const perGPrice = price / gAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {gAmount}g = <span className="font-bold text-blue-700">RM{perGPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Fallback to original calculation if available
                          return (
                            <span>{comparison.lotusPerUnitPrice ? `RM${comparison.lotusPerUnitPrice}` : '-'}</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <a href={comparison.lotusUrl === "https://corp.lotuss.com.my/promotions/catalogue/new/horeca-flyer" ? comparison.lotusUrl : buildLotusUrl(comparison.lotusProduct)} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center justify-center">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-orange-600" />
                          <p className="font-medium">
                            {comparison.shopeePrice > 0 ? `RM${comparison.shopeePrice.toFixed(2)}` : 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          // Clean product name by removing COD, Shipping, and extra spaces
                          let productName = comparison.shopeeProduct.toLowerCase()
                            .replace(/\b(cod|shipping)\b/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                          const price = comparison.shopeePrice;
                          
                          if (price <= 0) return <span>-</span>;
                          
                          // Check for triple X with range patterns (5 X 8 X 80Gm - 85Gm, etc.) - use first number as pack size
                          const tripleXRangeMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|m)\s*-\s*[\d\.]+\s*(kg|g|l|ml|m)/i);
                          if (tripleXRangeMatch) {
                            const packCount = parseInt(tripleXRangeMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for triple X patterns with units (9 X 6 X 58Gm, etc.) - use first number as pack size
                          const tripleXMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|m)/i);
                          if (tripleXMatch) {
                            const packCount = parseInt(tripleXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for triple X patterns without units (5 X 8 X 80, etc.) - use first number as pack size
                          const tripleXNoUnitMatch = productName.match(/(\d+)\s*[x×]\s*\d+\s*[x×]\s*\d+/i);
                          if (tripleXNoUnitMatch) {
                            const packCount = parseInt(tripleXNoUnitMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for pack patterns (5X85G, 3x16.8g, 80Gx5, Pack 10S, 10S, etc.)
                          const packMatch = productName.match(/(\d+)\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml|s|pcs|pack)/);
                          if (packMatch) {
                            const packCount = parseInt(packMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for reverse pack patterns (80Gx5, 100Gx3, etc.)
                          const reversePackMatch = productName.match(/(\d+\.?\d*)\s*(kg|g|l|ml)\s*[x×]\s*(\d+)/i);
                          if (reversePackMatch) {
                            const packCount = parseInt(reversePackMatch[3]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Pack XS patterns (Pack 10S, Pack 5S, etc.)
                          const packXSMatch = productName.match(/pack\s*(\d+)s/i);
                          if (packXSMatch) {
                            const packCount = parseInt(packXSMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for XS patterns (10S, 5S, etc.)
                          const xsMatch = productName.match(/(\d+)s/i);
                          if (xsMatch) {
                            const packCount = parseInt(xsMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for sachet patterns
                          const sachetMatch = productName.match(/(\d+)\s*sachet/i);
                          if (sachetMatch) {
                            const packCount = parseInt(sachetMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} sachet = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Pek patterns (5 Pek, 10 Pek, etc.)
                          const pekMatch = productName.match(/(\d+)\s*pek/i);
                          if (pekMatch) {
                            const packCount = parseInt(pekMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          

                          
                          // Check for complex pack patterns (80G X5'S X8Pack, etc.)
                          const complexPackMatch = productName.match(/[\d\.]+\s*(kg|g|l|ml)\s*[x×]\d+[''s]*\s*[x×]\s*(\d+)\s*pack/i);
                          if (complexPackMatch) {
                            const packCount = parseInt(complexPackMatch[2]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for compact triple X patterns (8X5X80G, etc.)
                          const compactTripleXMatch = productName.match(/(?:[a-z0-9\s\/\-]+?)\/?(\d+)[x×]\d+[x×]?\d*\.?\d*\s?g?\s*(?:pack|packs)?/i);
                          if (compactTripleXMatch) {
                            const packCount = parseInt(compactTripleXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for XPack patterns (X8Pack, X5Pack, etc.)
                          const xPackMatch = productName.match(/[x×]\s*(\d+)\s*pack/i);
                          if (xPackMatch) {
                            const packCount = parseInt(xPackMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Packs X patterns (5 Packs X 85G, etc.)
                          const packsXMatch = productName.match(/(\d+)\s*packs?\s*[x×]\s*[\d\.]+\s*(kg|g|l|ml)/i);
                          if (packsXMatch) {
                            const packCount = parseInt(packsXMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for Indomie complex patterns
                          const indomieMatch = productName.match(/(?:[a-z0-9\s\-\/]+?)\s*(?:carton|pack)?\s*(\d{2,3})\s?g(?:m)?\s*[x×]\s*\d+\s*[x×]\s*\d+/i);
                          if (indomieMatch) {
                            const packCount = parseInt(indomieMatch[1]);
                            const perPackPrice = price / packCount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {packCount} pack = <span className="font-bold text-orange-700">RM{perPackPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for kg patterns
                          const kgMatch = productName.match(/(\d+\.?\d*)\s*kg/);
                          if (kgMatch) {
                            const kgAmount = parseFloat(kgMatch[1]);
                            const perKgPrice = price / kgAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {kgAmount}kg = <span className="font-bold text-orange-700">RM{perKgPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for litre patterns
                          const litreMatch = productName.match(/(\d+\.?\d*)\s*l/);
                          if (litreMatch) {
                            const litreAmount = parseFloat(litreMatch[1]);
                            const perLitrePrice = price / litreAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {litreAmount}L = <span className="font-bold text-orange-700">RM{perLitrePrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for ml patterns
                          const mlMatch = productName.match(/(\d+\.?\d*)\s*ml/);
                          if (mlMatch) {
                            const mlAmount = parseFloat(mlMatch[1]);
                            const perMlPrice = price / mlAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {mlAmount}ml = <span className="font-bold text-orange-700">RM{perMlPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Check for g patterns
                          const gMatch = productName.match(/(\d+\.?\d*)\s*g/);
                          if (gMatch) {
                            const gAmount = parseFloat(gMatch[1]);
                            const perGPrice = price / gAmount;
                            return (
                              <span>
                                RM{price.toFixed(2)} / {gAmount}g = <span className="font-bold text-orange-700">RM{perGPrice.toFixed(2)}</span>
                              </span>
                            );
                          }
                          
                          // Fallback to original calculation if available
                          return (
                            <span>{comparison.shopeePerUnitPrice ? `RM${comparison.shopeePerUnitPrice}` : '-'}</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {comparison.shopeeUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(comparison.shopeeUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {comparison.shopeeShopName || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {comparison.shopeeShopUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(comparison.shopeeShopUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {comparison.matchScore > 0 ? (
                          <Badge variant={comparison.matchScore >= 90 ? "default" : comparison.matchScore >= 70 ? "secondary" : "outline"}>
                            {comparison.matchScore}%
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-600">{formattedDate}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedComparisons.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found matching your criteria.</p>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 