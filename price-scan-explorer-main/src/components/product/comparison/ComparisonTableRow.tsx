
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductComparison {
  name: string;
  image?: string;
  brandName: string;
  size: string;
  productId: string;
  maxDiscount: number;
  runData: {
    [runNumber: number]: {
      salePrice: string;
      originalPrice: string;
      discount: number | null;
      timestamp: string;
    };
  };
  lotusUrl?: string; // Added lotusUrl to the interface
}

interface ComparisonTableRowProps {
  product: ProductComparison;
  index: number;
  allRunNumbers: number[];
  getPriceChange: (product: ProductComparison, currentRun: number, previousRun: number) => number | null;
}

// Helper to build Lotus URL if missing
function buildLotusUrl(productName: string) {
  const base_url = "https://www.lotuss.com.my/en/search/";
  const query_suffix = "?sort=relevance:DESC";
  const encodedName = encodeURIComponent(productName.replace(/\s+/g, '+'));
  return `${base_url}${encodedName}${query_suffix}`;
}

export function ComparisonTableRow({ product, index, allRunNumbers, getPriceChange }: ComparisonTableRowProps) {
  return (
    <TableRow key={`${product.name}-${index}`} className="hover:bg-blue-50/30">
      <TableCell className="sticky left-0 bg-background z-10 bg-gradient-to-r from-blue-50/50 to-white border-r border-blue-100">
        {product.image ? (
          <div className="w-12 h-12 rounded overflow-hidden border border-blue-100 shadow-sm mx-auto">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded bg-gray-100 border border-blue-100 mx-auto flex items-center justify-center">
            <span className="text-xs text-gray-400">No img</span>
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium sticky left-16 bg-background z-10 max-w-[250px] bg-gradient-to-r from-blue-50/30 to-white border-r border-blue-100">
        <div className="space-y-2">
          <div className="truncate font-medium text-sm" title={product.name}>
            {product.name}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><span className="font-medium">ID:</span> {product.productId}</div>
            <div><span className="font-medium">Brand:</span> {product.brandName}</div>
            <div><span className="font-medium">Size:</span> {product.size}</div>
            <div className="font-semibold text-green-600">
              <span className="font-medium">Max Discount:</span> {product.maxDiscount > 0 ? `${product.maxDiscount}%` : 'N/A'}
            </div>
          </div>
        </div>
      </TableCell>
      {allRunNumbers.map((runNumber, runIndex) => {
        const runData = product.runData[runNumber];
        const previousRunNumber = runIndex > 0 ? allRunNumbers[runIndex - 1] : null;
        const priceChange = previousRunNumber ? getPriceChange(product, runNumber, previousRunNumber) : null;
        
        if (!runData) {
          return (
            <TableCell key={runNumber} className="text-center text-muted-foreground border-l border-blue-100 min-w-[160px]">
              <div className="py-4 bg-gray-50 rounded-md mx-1">
                <div className="text-sm text-gray-400 font-medium">No Data</div>
                <div className="text-xs text-gray-300 mt-1">Not scanned</div>
                <div className="text-xs text-gray-300">in this run</div>
              </div>
            </TableCell>
          );
        }
        
        return (
          <TableCell key={runNumber} className="text-center border-l border-blue-100 min-w-[160px]">
            <div className="bg-white rounded-lg border border-blue-100 shadow-sm mx-1 p-3 space-y-3">
              {/* Sale Price with change indicator */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Sale Price</div>
                <div className="font-bold text-primary text-base">
                  {formatCurrency(runData.salePrice)}
                </div>
                {priceChange !== null && (
                  <Badge 
                    variant={priceChange > 0 ? "destructive" : "default"}
                    className={`text-xs mt-1 ${priceChange <= 0 ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
                  >
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                  </Badge>
                )}
              </div>
              
              {/* Original Price */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Original Price</div>
                <div className="text-sm text-muted-foreground line-through">
                  {formatCurrency(runData.originalPrice)}
                </div>
              </div>
              
              {/* Discount Percentage */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground font-medium mb-1">Discount</div>
                <div className="text-sm font-bold text-white bg-green-600 px-2 py-1 rounded-full min-w-[50px]">
                  {runData.discount && runData.discount > 0 ? `-${runData.discount}%` : 'N/A'}
                </div>
              </div>
            </div>
          </TableCell>
        );
      })}
      {/* Add new Lotus URL column */}
      <TableCell>
        <a
          href={product.lotusUrl || buildLotusUrl(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Lotus Link
        </a>
      </TableCell>
    </TableRow>
  );
}
