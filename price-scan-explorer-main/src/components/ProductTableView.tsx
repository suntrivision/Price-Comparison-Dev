import React, { useState, useEffect } from "react";
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/types";
import { ProductTableRow } from "./product/ProductTableRow";
import { ProductMobileCard } from "./product/ProductMobileCard";
import { TempStorageControls } from "./product/TempStorageControls";
import { handleDownloadCSV } from "./product/productTableUtils";
import { useTempProductStorage } from "@/hooks/useTempProductStorage";
import { calculateDiscount } from "@/lib/utils";
import { extractMarketplaceFromUrl } from "@/lib/marketplaceUtils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type SortField = 'run_number' | 'timestamp' | 'store' | 'category' | 'name' | 'sale_price' | 'original_price' | 'discount' | 'last_modified_at' | 'marketplace';
type SortDirection = 'asc' | 'desc';

interface ProductTableViewProps {
  products: Product[];
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void;
  onSort?: (field: SortField) => void;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 10;

export function ProductTableView({ 
  products: propProducts, 
  onProductUpdate, 
  onSort, 
  sortField, 
  sortDirection,
  onRefresh
}: ProductTableViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use temp storage instead of local state
  const { products: tempProducts, updateProduct: updateTempProduct } = useTempProductStorage();
  const [localProducts, setLocalProducts] = useState<Product[]>(propProducts);

  // Use temp products if available, otherwise fall back to props
  const displayProducts = tempProducts.length > 0 ? tempProducts : localProducts;

  // Update local products when props change (fallback)
  useEffect(() => {
    if (tempProducts.length === 0) {
      setLocalProducts(propProducts);
    }
  }, [propProducts, tempProducts.length]);

  // Pagination calculations
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = displayProducts.slice(startIndex, endIndex);

  const getSortIcon = (field: SortField) => {
    if (!sortField || sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleSort = (field: SortField) => {
    if (onSort) {
      onSort(field);
      setCurrentPage(1);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditedProduct({ ...product });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedProduct(null);
  };

  const handleSave = async (productId: string) => {
    if (editedProduct) {
      try {
        // Use temp storage for immediate update
        updateTempProduct(productId, editedProduct);

        // Call the parent update function if provided
        if (onProductUpdate) {
          onProductUpdate(productId, editedProduct);
        }

        setEditingId(null);
        setEditedProduct(null);
      } catch (err) {
        console.error('Error updating product:', err);
      }
    }
  };

  const handleEditedProductChange = (updates: Partial<Product>) => {
    setEditedProduct(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <div className="space-y-4">
      {/* Temp Storage Controls */}
      <TempStorageControls />
      
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h4 className="font-medium">Products Table</h4>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, displayProducts.length)} of {displayProducts.length} products
              </p>
            )}
          </div>
          <Button onClick={() => handleDownloadCSV(displayProducts)} variant="outline" size="sm" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <Table className="min-w-[1500px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-24 min-w-24 sticky left-0 bg-muted/50 border-r text-xs">Actions</TableHead>
                  <TableHead className="w-16 min-w-16">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('run_number')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Run # {getSortIcon('run_number')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-24">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('timestamp')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Date {getSortIcon('timestamp')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 min-w-20">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('store')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Source {getSortIcon('store')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 min-w-20">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('marketplace')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Marketplace {getSortIcon('marketplace')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-24">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('category')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Category {getSortIcon('category')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 min-w-16 text-xs">ID</TableHead>
                  <TableHead className="w-16 min-w-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-300 font-semibold text-blue-700 text-xs">
                    Image
                  </TableHead>
                  <TableHead className="w-24 min-w-24 text-xs">Brand</TableHead>
                  <TableHead className="w-48 min-w-48 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-blue-300 font-semibold text-blue-700">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold text-blue-700 hover:bg-transparent text-xs"
                    >
                      Product Name {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 min-w-16 text-xs">Size</TableHead>
                  <TableHead className="w-20 min-w-20">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('sale_price')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Sale Price {getSortIcon('sale_price')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-20 min-w-20">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('original_price')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Original {getSortIcon('original_price')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 min-w-16">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('discount')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Discount {getSortIcon('discount')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 min-w-24">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSort('last_modified_at')}
                      className="h-auto p-0 font-medium hover:bg-transparent text-xs"
                    >
                      Modified {getSortIcon('last_modified_at')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    isEditing={editingId === product.id}
                    editedProduct={editedProduct}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    onEditedProductChange={handleEditedProductChange}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Desktop Pagination Controls */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page as number);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 gap-4">
        {currentProducts.map((product) => (
          <ProductMobileCard key={product.id} product={product} />
        ))}
        
        {/* Mobile Pagination Controls */}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page as number);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
