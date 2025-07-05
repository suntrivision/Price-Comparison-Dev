import React from "react";
import { Edit2, Save, X, Calendar, Store, Tag, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { extractBrandName } from "./marketplace/utils/comparisonTableUtils";
import { extractSize, calculateDiscount, formatDateTime } from "./productTableUtils";
import { AuditHistory } from "./AuditHistory";

interface ProductTableRowProps {
  product: Product;
  isEditing: boolean;
  editedProduct: Product | null;
  onEdit: (product: Product) => void;
  onCancel: () => void;
  onSave: (productId: string) => void;
  onEditedProductChange: (updates: Partial<Product>) => void;
}

export function ProductTableRow({
  product,
  isEditing,
  editedProduct,
  onEdit,
  onCancel,
  onSave,
  onEditedProductChange
}: ProductTableRowProps) {
  const displayProduct = isEditing && editedProduct ? editedProduct : product;
  const brandName = extractBrandName(displayProduct.name);
  const size = extractSize(displayProduct.name);
  const discount = calculateDiscount(product.original_price, product.sale_price);

  // Temporarily disable edit functionality
  const editDisabled = true;

  const formatLastModified = (timestamp?: string, userId?: string) => {
    if (!timestamp || !userId) return null;
    
    const date = new Date(timestamp);
    const timeAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60)); // minutes ago
    
    let timeString;
    if (timeAgo < 1) {
      timeString = 'just now';
    } else if (timeAgo < 60) {
      timeString = `${timeAgo}m ago`;
    } else if (timeAgo < 1440) {
      timeString = `${Math.floor(timeAgo / 60)}h ago`;
    } else {
      timeString = `${Math.floor(timeAgo / 1440)}d ago`;
    }
    
    return {
      timeString,
      userId: userId.substring(0, 8),
      fullDate: date.toLocaleString()
    };
  };

  const lastModified = formatLastModified(
    displayProduct.last_modified_at,
    displayProduct.last_modified_by
  );

  return (
    <>
      <TableRow className="border-b border-border/50">
        <TableCell className="w-28 min-w-28 sticky left-0 bg-background/95 backdrop-blur-sm border-r">
          <div className="flex items-center gap-1 justify-center">
            {!editDisabled && !isEditing ? (
              <Button 
                size="sm" 
                variant="default" 
                onClick={() => onEdit(product)}
                className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : editDisabled ? (
              <Button 
                size="sm" 
                variant="outline" 
                disabled
                className="h-7 px-2 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed text-xs"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-7 px-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 font-medium text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => onSave(product.id)}
                  className="h-7 px-1 bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm text-xs"
                >
                  <Save className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
        <TableCell className="w-16 min-w-16 font-medium text-xs">
          #{displayProduct.run_number || '-'}
        </TableCell>
        <TableCell className="w-24 min-w-24 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">{formatDateTime(displayProduct.timestamp)}</span>
          </div>
        </TableCell>
        <TableCell className="w-20 min-w-20 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Store className="h-3 w-3" />
            <span className="text-xs truncate">{displayProduct.store || '-'}</span>
          </div>
        </TableCell>
        <TableCell className="w-24 min-w-24">
          <Badge variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {displayProduct.category || 'general'}
          </Badge>
        </TableCell>
        <TableCell className="w-16 min-w-16 text-xs text-muted-foreground">
          <span className="truncate block">{displayProduct.id.substring(0, 8)}...</span>
        </TableCell>
        
        <TableCell className="w-16 min-w-16 bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
          {displayProduct.image && (
            <div className="w-12 h-12 rounded overflow-hidden">
              <img 
                src={displayProduct.image} 
                alt={displayProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </TableCell>
        <TableCell className="w-24 min-w-24 font-medium text-xs">
          <span className="truncate block">{brandName}</span>
        </TableCell>
        <TableCell className="w-48 min-w-48 font-medium bg-gradient-to-r from-blue-50/30 to-indigo-50/30">
          <span className="block text-xs leading-tight">{displayProduct.name}</span>
        </TableCell>
        <TableCell className="w-16 min-w-16 font-medium text-xs">
          <span className="truncate block">{size}</span>
        </TableCell>
        <TableCell className="w-20 min-w-20 font-bold text-xs">
          {formatCurrency(displayProduct.sale_price)}
        </TableCell>
        <TableCell className="w-20 min-w-20 text-muted-foreground text-xs">
          {displayProduct.original_price ? formatCurrency(displayProduct.original_price) : '-'}
        </TableCell>
        <TableCell className="w-16 min-w-16">
          {discount && discount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {discount}% OFF
            </Badge>
          )}
        </TableCell>
        <TableCell className="w-24 min-w-24">
          {lastModified && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1" title={lastModified.fullDate}>
                <User className="h-3 w-3" />
                <span className="truncate">{lastModified.userId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{lastModified.timeString}</span>
              </div>
            </div>
          )}
        </TableCell>
      </TableRow>
      <TableRow className="border-none">
        <TableCell colSpan={14} className="py-0">
          <AuditHistory productId={product.id} />
        </TableCell>
      </TableRow>
    </>
  );
}
