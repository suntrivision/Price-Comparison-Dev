
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { 
  mockProducts, 
  getProductPriceHistory, 
  getRelatedProducts 
} from "@/data/productUtils";
import { calculateDiscount } from "@/lib/utils";
import { ProductImage } from "@/components/product/ProductImage";
import { ProductInfo } from "@/components/product/ProductInfo";
import { RelatedProducts } from "@/components/product/RelatedProducts";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(mockProducts.find(p => p.id === id));
  const [relatedProducts, setRelatedProducts] = useState(getRelatedProducts(id || "", 4));
  const [priceHistory, setPriceHistory] = useState(getProductPriceHistory(id || ""));
  
  const discount = calculateDiscount(product?.original_price, product?.sale_price);
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Reset state when id changes
    if (id) {
      setProduct(mockProducts.find(p => p.id === id));
      setRelatedProducts(getRelatedProducts(id, 4));
      setPriceHistory(getProductPriceHistory(id));
    }
  }, [id]);
  
  if (!product) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to products</span>
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image with Discount Chart */}
          <ProductImage 
            image={product.image} 
            alt={product.name}
            productId={product.id}
            productName={product.name}
          />
          
          {/* Product Info */}
          <ProductInfo product={product} discount={discount} />
        </div>
        
        {/* Price History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <PriceHistoryChart data={priceHistory} />
        </motion.div>
        
        {/* Related Products */}
        <RelatedProducts products={relatedProducts} />
      </div>
    </MainLayout>
  );
}
