
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface DatasetSummaryProps {
  originalCount: number;
  embeddingCount: number;
  totalProducts: number;
}

export function DatasetSummary({ originalCount, embeddingCount, totalProducts }: DatasetSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Price Match Analysis
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Original Dataset: {originalCount} products
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Embedding Match: {embeddingCount} products
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Total: {totalProducts} products
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
