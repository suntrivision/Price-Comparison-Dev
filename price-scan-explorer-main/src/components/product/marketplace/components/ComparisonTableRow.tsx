import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Image as ImageIcon, Eye } from "lucide-react";
import { type ComparisonRow } from "../utils/comparisonTableUtils";

interface ComparisonTableRowProps {
  row: ComparisonRow;
  index: number;
  startIndex: number;
  isSelected: boolean;
  formatPrice: (price: number | null) => string;
  formatPercentage: (percentage: number) => string;
  getMarketplaceBadgeColor: (marketplace: string) => string;
  getSimilarityBadgeVariant?: (similarity: number) => "default" | "secondary" | "destructive";
  onViewDetails?: (productName: string) => void;
  onViewInCampbell?: (productName: string) => void;
}

export function ComparisonTableRow({ 
  row, 
  index, 
  startIndex, 
  isSelected, 
  formatPrice, 
  formatPercentage, 
  getMarketplaceBadgeColor,
  getSimilarityBadgeVariant,
  onViewDetails,
  onViewInCampbell
}: ComparisonTableRowProps) {
  const renderMarketplaceCell = (price: number | null, marketplace: string, url: string | null, imageUrl?: string | null, productName?: string | null) => (
    <TableCell>
      <div className="flex flex-col gap-2">
        {price !== null ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatPrice(price)}</span>
            </div>
            {/* Single View Product link */}
            <div className="text-xs">
              {url ? (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline"
                  title={`View on ${marketplace}`}
                >
                  View Product
                </a>
              ) : (
                // Fallback for marketplaces without direct URL
                marketplace.toLowerCase() === 'shopee' || marketplace.toLowerCase() === 'lotuss' || marketplace.toLowerCase() === 'lotus' ? (
                  onViewInCampbell && (
                    <button
                      onClick={() => onViewInCampbell(productName || row.sources[0] || '')}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      title={`View product details for ${marketplace}`}
                    >
                      View Product
                    </button>
                  )
                ) : (
                  onViewDetails && (
                    <button
                      onClick={() => onViewDetails(productName || row.sources[0] || '')}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      title={`View details for ${marketplace}`}
                    >
                      View Details
                    </button>
                  )
                )
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    </TableCell>
  );

  const handleViewDetails = () => {
    if (onViewDetails && row.sources.length > 0) {
      // Use the first source as the product name for navigation
      onViewDetails(row.sources[0]);
    }
  };

  const handleViewInCampbell = () => {
    if (onViewInCampbell && row.sources.length > 0) {
      // Use the first source as the product name for navigation
      onViewInCampbell(row.sources[0]);
    }
  };

  return (
    <TableRow className={isSelected ? "bg-blue-50" : ""}>
      <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
      <TableCell>
        <div className="space-y-1">
          {row.sources.map((source, i) => (
            <div key={i} className="text-sm">
              {source}
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell>
        <span className="font-medium text-green-600">
          {formatPrice(row.lowestSourcePrice)}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-medium text-red-600">
          {formatPrice(row.highestMarketplacePrice)}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {formatPercentage(row.marginPercentage)}
        </Badge>
      </TableCell>
      <TableCell>
        {row.similarityScore !== undefined && getSimilarityBadgeVariant ? (
          <div className="flex items-center gap-2">
            <Badge 
              variant={getSimilarityBadgeVariant(row.similarityScore)}
              className="font-medium"
            >
              {row.similarityScore.toFixed(1)}%
            </Badge>
            {row.similarityScore >= 90 && (
              <span className="text-xs text-green-600 font-medium">Excellent</span>
            )}
            {row.similarityScore >= 70 && row.similarityScore < 90 && (
              <span className="text-xs text-yellow-600 font-medium">Good</span>
            )}
            {row.similarityScore < 70 && (
              <span className="text-xs text-red-600 font-medium">Low</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        )}
      </TableCell>

      {renderMarketplaceCell(row.lotuss, "Lotuss", row.urls?.lotuss, row.imageUrls?.lotuss, row.productNames?.lotuss)}
      {renderMarketplaceCell(row.mydin, "MyDin", row.urls?.mydin, row.imageUrls?.mydin, row.productNames?.mydin)}
      {renderMarketplaceCell(row.econosav, "EconoSav", row.urls?.econosav, row.imageUrls?.econosav, row.productNames?.econosav)}
      {renderMarketplaceCell(row.giants, "Giants", row.urls?.giants, row.imageUrls?.giants, row.productNames?.giants)}
      {renderMarketplaceCell(row.aeon2big, "Aeon2Big", row.urls?.aeon2big, row.imageUrls?.aeon2big, row.productNames?.aeon2big)}
      {renderMarketplaceCell(row.shopee, "Shopee", row.urls?.shopee, row.imageUrls?.shopee, row.productNames?.shopee)}
      {renderMarketplaceCell(row.lazada, "Lazada", row.urls?.lazada, row.imageUrls?.lazada, row.productNames?.lazada)}
      {renderMarketplaceCell(row.tiktok, "TikTok", row.urls?.tiktok, row.imageUrls?.tiktok, row.productNames?.tiktok)}
    </TableRow>
  );
}
