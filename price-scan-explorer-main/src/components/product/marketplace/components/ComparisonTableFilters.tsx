
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface ProductMatch {
  id: string;
  displayName: string;
  fullName: string;
}

interface ComparisonTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProductMatch: string;
  onProductMatchChange: (value: string) => void;
  productMatches: ProductMatch[];
  totalProducts: number;
}

export function ComparisonTableFilters({
  searchTerm,
  onSearchChange,
  selectedProductMatch,
  onProductMatchChange,
  productMatches,
  totalProducts
}: ComparisonTableFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or marketplaces..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
          />
        </div>
        {searchTerm && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSearchChange("")}
          >
            Clear
          </Button>
        )}
      </div>
      
      {/* Product Match Selection */}
      <div className="flex items-center gap-4">
        <label htmlFor="product-match-select" className="text-sm font-medium">
          Select Product Match (Global):
        </label>
        <Select value={selectedProductMatch} onValueChange={onProductMatchChange}>
          <SelectTrigger className="w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
            <SelectValue placeholder="Select a product match" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 z-50">
            <SelectItem value="all" className="hover:bg-gray-100 dark:hover:bg-gray-700">
              Show All Products ({totalProducts})
            </SelectItem>
            {productMatches.map((match) => (
              <SelectItem 
                key={match.id} 
                value={match.id}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                title={match.fullName}
              >
                {match.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
