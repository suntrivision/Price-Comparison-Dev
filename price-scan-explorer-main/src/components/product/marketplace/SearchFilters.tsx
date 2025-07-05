
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Download } from "lucide-react";

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  selectedRun?: string;
  onRunChange?: (run: string) => void;
  availableRuns?: Array<{ id: string; timestamp: string; label: string }>;
  onDownload?: () => void;
}

export function SearchFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedRun,
  onRunChange,
  availableRuns = [],
  onDownload
}: SearchFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Price Comparison Run Selector */}
      {availableRuns.length > 0 && onRunChange && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Price Comparison Run:</span>
          <Select value={selectedRun} onValueChange={onRunChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a price comparison run" />
            </SelectTrigger>
            <SelectContent>
              {availableRuns.map((run) => (
                <SelectItem key={run.id} value={run.id}>
                  {run.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onDownload && (
            <Button onClick={onDownload} variant="outline" size="sm" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          )}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange("all")}
          >
            All Categories
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
