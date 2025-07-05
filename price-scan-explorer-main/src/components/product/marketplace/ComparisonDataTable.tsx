
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package } from "lucide-react";
import { PriceMatchProduct } from "./types";

interface ComparisonDataTableProps {
  data: PriceMatchProduct[];
  title: string;
}

export function ComparisonDataTable({ data, title }: ComparisonDataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for {title}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="w-24">Lotus Price</TableHead>
              <TableHead className="w-32">Shopee</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product, index) => (
              <TableRow key={`${product.id}-${index}`}>
                <TableCell>
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {product.image_url && product.image_url.trim() !== '' ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', product.image_url);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                          }
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', product.image_url);
                        }}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {product.name}
                </TableCell>
                <TableCell>
                  RM {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                </TableCell>
                <TableCell>
                  {product.marketplace === 'Shopee' ? (
                    `RM ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}`
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {product.product_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(product.product_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
