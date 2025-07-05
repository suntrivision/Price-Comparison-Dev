
import React from 'react';
import { Store, ShoppingBag, Package } from "lucide-react";

interface MarketplaceIconProps {
  marketplace: string;
}

export const MarketplaceIcon: React.FC<MarketplaceIconProps> = ({ marketplace }) => {
  const getMarketplaceIcon = (marketplace: string) => {
    switch (marketplace?.toLowerCase()) {
      case 'shopee':
        return (
          <img 
            src="/lovable-uploads/8803aef7-198f-4815-a6a2-610076bb44a2.png" 
            alt="Shopee" 
            className="h-5 w-5 object-contain"
          />
        );
      case 'lazada':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'lotus':
      case 'lotuss':
        return (
          <img 
            src="/lovable-uploads/04abc191-1ab5-47e3-91eb-1d7dd3048210.png" 
            alt="Lotus's" 
            className="h-5 w-5 object-contain"
          />
        );
      default:
        return <Store className="h-5 w-5 text-gray-600" />;
    }
  };

  return getMarketplaceIcon(marketplace);
};
