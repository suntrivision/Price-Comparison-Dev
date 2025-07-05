
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpDown } from "lucide-react";

interface MatchPair {
  product_1: string;
  product_1_price: number;
  product_1_marketplace: string;
  product_2: string;
  product_2_price: number;
  product_2_marketplace: string;
  similarity_score: number;
  similarity_level: string;
}

interface MatchPairsData {
  match_pairs: MatchPair[];
}

export function MatchPairsTable() {
  const [data, setData] = useState<MatchPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching match pairs data...');
        
        const response = await fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/embedding_matched_price_comparison_shopeeLotus.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData: MatchPairsData = await response.json();
        console.log('Match pairs data received:', jsonData);
        
        if (jsonData.match_pairs && Array.isArray(jsonData.match_pairs)) {
          setData(jsonData.match_pairs);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error fetching match pairs data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return `RM ${price.toFixed(2)}`;
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace?.toLowerCase()) {
      case 'shopee':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'lotus':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSimilarityBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'very similar':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'similar':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'somewhat similar':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof MatchPair];
      let bValue = b[sortConfig.key as keyof MatchPair];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 text-primary" /> : 
      <ArrowUpDown className="h-4 w-4 text-primary rotate-180" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading match pairs data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Error loading data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Match Pairs</span>
          <Badge variant="secondary">{data.length} matches</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('product_1')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Product 1
                    {getSortIcon('product_1')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('product_1_price')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Price 1
                    {getSortIcon('product_1_price')}
                  </Button>
                </TableHead>
                <TableHead>Marketplace 1</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('product_2')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Product 2
                    {getSortIcon('product_2')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('product_2_price')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Price 2
                    {getSortIcon('product_2_price')}
                  </Button>
                </TableHead>
                <TableHead>Marketplace 2</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('similarity_score')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Similarity
                    {getSortIcon('similarity_score')}
                  </Button>
                </TableHead>
                <TableHead>Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((pair, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm line-clamp-2">
                        {pair.product_1}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(pair.product_1_price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMarketplaceBadgeColor(pair.product_1_marketplace)}>
                      {pair.product_1_marketplace}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm line-clamp-2">
                        {pair.product_2}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(pair.product_2_price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMarketplaceBadgeColor(pair.product_2_marketplace)}>
                      {pair.product_2_marketplace}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {pair.similarity_score.toFixed(1)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSimilarityBadgeColor(pair.similarity_level)}>
                      {pair.similarity_level}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
