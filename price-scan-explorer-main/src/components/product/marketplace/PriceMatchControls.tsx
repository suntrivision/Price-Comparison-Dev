
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, TrendingUp } from "lucide-react";
import { DatasetType } from "./types";

interface PriceMatchControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedDataset: DatasetType;
  setSelectedDataset: (dataset: DatasetType) => void;
  categories: string[];
  originalCount: number;
  embeddingCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  filteredCount: number;
  totalProducts: number;
}

export function PriceMatchControls({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDataset,
  setSelectedDataset,
  categories,
  originalCount,
  embeddingCount,
  isLoading,
  onRefresh,
  filteredCount,
  totalProducts
}: PriceMatchControlsProps) {
  return (
    <div className="space-y-4">
      {/* Dataset Selection */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedDataset === "both" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDataset("both")}
          className="flex items-center gap-1"
        >
          <TrendingUp className="h-4 w-4" />
          All Datasets
        </Button>
        <Button
          variant={selectedDataset === "original" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDataset("original")}
        >
          Original ({originalCount})
        </Button>
        <Button
          variant={selectedDataset === "embedding" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDataset("embedding")}
        >
          Embedding Match ({embeddingCount})
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search">Search Products</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="category">Filter by Category</Label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "original" ? "Original Dataset" : 
                 category === "embedding_match" ? "Embedding Match" : 
                 category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={onRefresh} 
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} of {totalProducts} products
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedCategory && ` in category "${selectedCategory === "original" ? "Original Dataset" : 
                                                selectedCategory === "embedding_match" ? "Embedding Match" : 
                                                selectedCategory}"`}
      </div>
    </div>
  );
}
