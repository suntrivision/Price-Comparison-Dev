
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

interface ComparisonHeaderProps {
  allRunNumbers: number[];
  comparisonArrayLength: number;
  runSortOrder: 'asc' | 'desc' | null;
  onRunSortToggle: () => void;
  onDownloadCSV: () => void;
}

export function ComparisonHeader({ 
  allRunNumbers, 
  comparisonArrayLength, 
  runSortOrder, 
  onRunSortToggle, 
  onDownloadCSV 
}: ComparisonHeaderProps) {
  const getRunSortIcon = () => {
    if (runSortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (runSortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h4 className="font-medium text-lg">Product Price Comparison Across All Scan Runs</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Comparing prices across <span className="font-bold text-blue-600">{allRunNumbers.length} scan runs</span> for <span className="font-bold text-green-600">{comparisonArrayLength} unique products</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRunSortToggle}
          className="flex items-center gap-2"
        >
          {getRunSortIcon()}
          Sort Run Numbers
        </Button>
      </div>
    </div>
  );
}
