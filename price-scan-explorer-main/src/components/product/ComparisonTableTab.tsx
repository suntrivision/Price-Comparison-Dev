import { useState } from "react";
import { Product } from "@/types";
import { Table, TableBody } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductFilters } from "@/components/ProductFilters";
import { useProductFilters } from "@/hooks/useProductFilters";
import { ComparisonHeader } from "./comparison/ComparisonHeader";
import { ComparisonTableHeader } from "./comparison/ComparisonTableHeader";
import { ComparisonTableRow } from "./comparison/ComparisonTableRow";
import { ComparisonPagination } from "./comparison/ComparisonPagination";
import { 
  processProductComparisons, 
  sortProductComparisons, 
  formatDateTime,
  generateCSVContent,
  downloadCSV,
  getPriceChange,
  type SortField,
  type SortOrder
} from "./comparison/comparisonUtils";
import { extractBrandName } from "./marketplace/utils/comparisonTableUtils";

interface ComparisonTableTabProps {
  products: Product[];
}

const ITEMS_PER_PAGE = 15;

// Helper to build Lotus URL if missing
function buildLotusUrl(productName: string) {
  const base_url = "https://www.lotuss.com.my/en/search/";
  const query_suffix = "?sort=relevance:DESC";
  const encodedName = encodeURIComponent(productName.replace(/\s+/g, '+'));
  return `${base_url}${encodedName}${query_suffix}`;
}

export function ComparisonTableTab({ products }: ComparisonTableTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [runSortOrder, setRunSortOrder] = useState<SortOrder>(null);
  const [productSortField, setProductSortField] = useState<SortField | null>(null);
  const [productSortOrder, setProductSortOrder] = useState<SortOrder>(null);
  const [filterSameBrand, setFilterSameBrand] = useState(true);

  // Use the product filters hook
  const {
    runNumber,
    setRunNumber,
    productName,
    setProductName,
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filteredProducts,
    clearFilters,
    hasActiveFilters
  } = useProductFilters({ products });

  console.log('🚀 ComparisonTableTab received products:', products.length);
  console.log('📊 Filtered products:', filteredProducts.length);
  
  // Get all unique run numbers in the filtered dataset
  const allRunNumbersInData = Array.from(new Set(filteredProducts.map(p => p.run_number).filter(Boolean)))
    .sort((a, b) => a - b);
  
  console.log('📈 All run numbers found in filtered data:', allRunNumbersInData);
  console.log('🔍 Total unique runs available:', allRunNumbersInData.length);

  // Filter products by brand name if the checkbox is checked
  const referenceBrand = filteredProducts.length > 0 ? extractBrandName(filteredProducts[0].name) : "";
  const brandFilteredProducts = filterSameBrand
    ? filteredProducts.filter(p => extractBrandName(p.name) === referenceBrand)
    : filteredProducts;

  // Process product comparisons with filtered data
  const productComparisons = processProductComparisons(brandFilteredProducts);
  console.log('📋 Product comparisons processed:', productComparisons.length);

  // Sort products
  const sortedComparisons = sortProductComparisons(productComparisons, productSortField, productSortOrder);
  
  // Get all unique run numbers with their timestamps, sorted
  const runNumbersWithTimestamps = allRunNumbersInData.map(runNumber => {
    const productWithRun = filteredProducts.find(p => p.run_number === runNumber);
    return {
      runNumber,
      timestamp: productWithRun?.timestamp || ''
    };
  }).sort((a, b) => {
    if (runSortOrder === 'asc') return a.runNumber - b.runNumber;
    if (runSortOrder === 'desc') return b.runNumber - a.runNumber;
    return a.runNumber - b.runNumber;
  });

  console.log('🏃 Run numbers with timestamps for display:', runNumbersWithTimestamps);
  console.log('📊 Total runs available for comparison:', runNumbersWithTimestamps.length);

  const allRunNumbers = runNumbersWithTimestamps.map(item => item.runNumber);

  const handleRunSortToggle = () => {
    if (runSortOrder === null || runSortOrder === 'desc') {
      setRunSortOrder('asc');
    } else {
      setRunSortOrder('desc');
    }
  };

  const handleProductSort = (field: SortField) => {
    if (productSortField === field) {
      setProductSortOrder(productSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setProductSortField(field);
      setProductSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVContent(sortedComparisons, runNumbersWithTimestamps);
    downloadCSV(csvContent);
  };

  // Remove duplicates by product name (case-insensitive)
  const uniqueComparisons = sortedComparisons.filter(
    (item, index, self) =>
      index === self.findIndex(
        (t) => t.name.toLowerCase() === item.name.toLowerCase()
      )
  );
  // Pagination calculations
  const totalPages = Math.ceil(uniqueComparisons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = uniqueComparisons.slice(startIndex, endIndex);

  return (
    <div className="w-full space-y-6">
      {/* Product Filters */}
      <ProductFilters
        runNumber={runNumber}
        onRunNumberChange={setRunNumber}
        productName={productName}
        onProductNameChange={setProductName}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        availableCategories={availableCategories}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onClearFilters={clearFilters}
        allProducts={products}
      />
      {/* Brand Filter Checkbox */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="filter-same-brand"
          checked={filterSameBrand}
          onChange={e => setFilterSameBrand(e.target.checked)}
        />
        <label htmlFor="filter-same-brand" className="text-sm cursor-pointer">
          Show only products with the same brand name ({referenceBrand || 'N/A'})
        </label>
      </div>

      <ComparisonHeader
        allRunNumbers={allRunNumbers}
        comparisonArrayLength={sortedComparisons.length}
        runSortOrder={runSortOrder}
        onRunSortToggle={handleRunSortToggle}
        onDownloadCSV={handleDownloadCSV}
      />

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
          <span>
            Showing {startIndex + 1} to {Math.min(endIndex, uniqueComparisons.length)} of {uniqueComparisons.length} products
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {allRunNumbers.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="relative max-h-[600px] overflow-auto">
            <Table className="relative">
              <ComparisonTableHeader
                runNumbersWithTimestamps={runNumbersWithTimestamps}
                productSortField={productSortField}
                productSortOrder={productSortOrder}
                onProductSort={handleProductSort}
                formatDateTime={formatDateTime}
              />
              <TableBody>
                {currentProducts.map((product, index) => (
                  <ComparisonTableRow
                    key={`${product.name}-${index}`}
                    product={product}
                    index={index}
                    allRunNumbers={allRunNumbers}
                    getPriceChange={getPriceChange}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ComparisonPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
