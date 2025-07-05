
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = 'name' | 'brand' | 'size' | 'discount';
type SortOrder = 'asc' | 'desc' | null;

interface RunWithTimestamp {
  runNumber: number;
  timestamp: string;
}

interface ComparisonTableHeaderProps {
  runNumbersWithTimestamps: RunWithTimestamp[];
  productSortField: SortField | null;
  productSortOrder: SortOrder;
  onProductSort: (field: SortField) => void;
  formatDateTime: (timestamp: string) => { date: string; time: string };
}

export function ComparisonTableHeader({ 
  runNumbersWithTimestamps, 
  productSortField, 
  productSortOrder, 
  onProductSort, 
  formatDateTime 
}: ComparisonTableHeaderProps) {
  const getProductSortIcon = (field: SortField) => {
    if (productSortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    if (productSortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  return (
    <TableHeader className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-50">
      <TableRow className="bg-gradient-to-r from-blue-100/80 to-indigo-100/80 hover:from-blue-100 hover:to-indigo-100">
        <TableHead className="w-16 sticky left-0 bg-gradient-to-br from-indigo-200 to-blue-200 z-50 font-semibold text-blue-950 shadow-sm text-center">
          Image
        </TableHead>
        <TableHead className="min-w-[250px] sticky left-16 bg-gradient-to-br from-indigo-200 to-blue-200 z-50 font-semibold text-blue-950 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onProductSort('name')}
            className="h-auto p-0 font-semibold text-blue-950 hover:bg-transparent"
          >
            Product Details {getProductSortIcon('name')}
          </Button>
          <div className="text-xs mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span>Brand:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProductSort('brand')}
                className="h-auto p-0 text-xs font-medium text-blue-800 hover:bg-transparent"
              >
                Sort {getProductSortIcon('brand')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span>Size:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProductSort('size')}
                className="h-auto p-0 text-xs font-medium text-blue-800 hover:bg-transparent"
              >
                Sort {getProductSortIcon('size')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span>Max Discount:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProductSort('discount')}
                className="h-auto p-0 text-xs font-medium text-blue-800 hover:bg-transparent"
              >
                Sort {getProductSortIcon('discount')}
              </Button>
            </div>
          </div>
        </TableHead>
        {runNumbersWithTimestamps.map(({ runNumber, timestamp }) => {
          const { date, time } = formatDateTime(timestamp);
          return (
            <TableHead key={runNumber} className="min-w-[160px] text-center bg-gradient-to-r from-blue-100/60 to-indigo-100/60 border-l border-blue-200">
              <div className="font-bold text-blue-900 text-lg">Run #{runNumber}</div>
              <div className="text-xs text-blue-700 font-semibold mt-1">
                <div>{date}</div>
                <div>{time}</div>
              </div>
              <div className="text-xs text-blue-600 mt-1 font-medium">
                Price Data
              </div>
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
