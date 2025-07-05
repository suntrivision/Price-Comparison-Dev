
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, X, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Product } from "@/types";

interface ProductFiltersProps {
  runNumber: number | undefined;
  onRunNumberChange: (value: number | undefined) => void;
  productName: string;
  onProductNameChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  availableCategories: string[];
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
  allProducts?: Product[]; // Add this to get run information
}

export function ProductFilters({
  runNumber,
  onRunNumberChange,
  productName,
  onProductNameChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
  allProducts = []
}: ProductFiltersProps) {
  // Updated to check if runNumber is undefined (meaning "All" is selected)
  const hasActiveFilters = runNumber !== undefined || productName || selectedCategory || dateFrom || dateTo;

  // Get available run numbers with their timestamps
  const availableRuns = React.useMemo(() => {
    const runMap = new Map<number, string>();
    
    allProducts.forEach(product => {
      if (!runMap.has(product.run_number)) {
        runMap.set(product.run_number, product.timestamp);
      }
    });

    return Array.from(runMap.entries())
      .map(([runNum, timestamp]) => ({
        runNumber: runNum,
        timestamp,
        formattedDate: (() => {
          // Special handling for Screen Scrape run
          if (runNum === 999) {
            return 'Screen Scrape Data';
          }
          
          const date = new Date(timestamp);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          const time = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
          return `${day}/${month}/${year} ${time}`;
        })(),
        displayName: runNum === 999 ? 'Screen Scrape' : `Run #${runNum}`
      }))
      .sort((a, b) => {
        // Sort Screen Scrape to the end, then by run number descending
        if (a.runNumber === 999) return 1;
        if (b.runNumber === 999) return -1;
        return b.runNumber - a.runNumber;
      });
  }, [allProducts]);

  const handleRunNumberChange = (value: string) => {
    // When "all" is selected, pass undefined to show all runs
    const numValue = value === 'all' ? undefined : Number(value);
    onRunNumberChange(numValue);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onDateFromChange(date ? date.toISOString().split('T')[0] : '');
  };

  const handleDateToChange = (date: Date | undefined) => {
    onDateToChange(date ? date.toISOString().split('T')[0] : '');
  };

  const handleCategoryChange = (value: string) => {
    // Convert "all" back to empty string for the filter logic
    onCategoryChange(value === "all" ? "" : value);
  };

  const selectedRunInfo = availableRuns.find(run => run.runNumber === runNumber);

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Filter Products</h3>
            {/* Show run info only when a specific run is selected */}
            {selectedRunInfo && runNumber !== undefined && (
              <div className="flex items-center gap-1 text-sm font-medium bg-blue-500 text-white px-3 py-1.5 rounded-md shadow-sm">
                <Clock className="h-3 w-3" />
                <span>{selectedRunInfo.displayName} - {selectedRunInfo.formattedDate}</span>
              </div>
            )}
            {/* Show "All Runs" indicator when runNumber is undefined */}
            {runNumber === undefined && availableRuns.length > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium bg-green-500 text-white px-3 py-1.5 rounded-md shadow-sm">
                <Clock className="h-3 w-3" />
                <span>All Runs ({availableRuns.length} runs)</span>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Product Name Filter */}
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              type="text"
              placeholder="Search by name..."
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Run Number Filter with Date Display - Updated to properly handle "All" and Screen Scrape */}
          <div className="space-y-2">
            <Label>Run Number & Date</Label>
            <Select value={runNumber?.toString() || "all"} onValueChange={handleRunNumberChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select run" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex flex-col">
                    <span className="font-medium">All Runs</span>
                    <span className="text-xs text-muted-foreground">Show all available runs</span>
                  </div>
                </SelectItem>
                {availableRuns.map((run) => (
                  <SelectItem key={run.runNumber} value={run.runNumber.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{run.displayName}</span>
                      <span className="text-xs text-muted-foreground">{run.formattedDate}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <Label>Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(new Date(dateFrom), "dd/MM/yyyy") : "Pick start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom ? new Date(dateFrom) : undefined}
                  onSelect={handleDateFromChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <Label>Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(new Date(dateTo), "dd/MM/yyyy") : "Pick end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo ? new Date(dateTo) : undefined}
                  onSelect={handleDateToChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </Card>
  );
}
