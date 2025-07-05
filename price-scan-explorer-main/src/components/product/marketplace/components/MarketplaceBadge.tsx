
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";

interface MarketplaceBadgeProps {
  marketplace: string;
}

export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({ marketplace }) => {
  const getMarketplaceColor = (marketplace: string) => {
    switch (marketplace?.toLowerCase()) {
      case 'shopee':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'lazada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tiktok':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'lotus':
      case 'lotuss':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mydin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'aeon':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'econosav':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'giants':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMarketplaceDisplayName = (marketplace: string) => {
    const displayNames: { [key: string]: string } = {
      'lotus': 'Lotuss',
      'lotuss': 'Lotuss',
      'mydin': 'MyDin',
      'aeon': 'Aeon',
      'econosav': 'EconoSav',
      'giants': 'Giants',
      'shopee': 'Shopee',
      'lazada': 'Lazada',
      'tiktok': 'TikTok'
    };
    return displayNames[marketplace?.toLowerCase()] || marketplace;
  };

  return (
    <Badge className={getMarketplaceColor(marketplace)}>
      <Store className="w-3 h-3 mr-1" />
      {getMarketplaceDisplayName(marketplace)}
    </Badge>
  );
};
