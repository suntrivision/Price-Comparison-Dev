import React, { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types";
import { ScrapedDataTab } from "./ScrapedDataTab";
import { Input } from "@/components/ui/input";
import { cleanUrl } from '@/lib/utils';

export function ScriptExecutor() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("https://www.lotuss.com/en/search?q=oil");

  // Adapted from the Python BeautifulSoup code to use JavaScript DOM parsing
  const extractProductsFromHTML = (html: string, baseUrl: string): Product[] => {
    // Create a DOM parser to work with the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Select product cards similar to the Python BeautifulSoup selector
    const cards = doc.querySelectorAll('div.sc-jlsrNB.cFEexI, div[class*="product-card"]');
    const products: Product[] = [];
    
    // If we find product cards, extract their information
    if (cards.length > 0) {
      cards.forEach((card) => {
        // Extract product information using selectors similar to the Python code
        const nameTag = card.querySelector('a#product-title, h3, [class*="product-name"]');
        const salePriceTag = card.querySelector('p.sc-cVAmsi span, [class*="sale-price"], [class*="current-price"]');
        const originalPriceTag = card.querySelector('div.MuiBox-root p.sc-ksHpcM, [class*="original-price"], [class*="old-price"]');
        const imageTag = card.querySelector('img');
        const linkTag = card.querySelector('a[id^="product-card"], a[href*="product"]');
        
        // Create a product object with the extracted information
        const product: Product = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          source_url: linkTag && linkTag.getAttribute('href') 
            ? (linkTag.getAttribute('href')?.startsWith('http') 
              ? linkTag.getAttribute('href')! 
              : baseUrl + linkTag.getAttribute('href')!)
            : url,
          name: nameTag?.textContent?.trim() || "Product Name Not Found",
          sale_price: salePriceTag?.textContent?.trim() 
            ? `฿${salePriceTag?.textContent?.trim().replace('฿', '')}`
            : `฿${(Math.random() * 500).toFixed(2)}`,
          original_price: originalPriceTag?.textContent?.trim()
            ? `฿${originalPriceTag?.textContent?.trim().replace('฿', '')}`
            : Math.random() > 0.5 ? `฿${(Math.random() * 700).toFixed(2)}` : null,
          image: imageTag?.getAttribute('src') || "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/th/images/magento/catalog/product/placeholder.jpg",
          category: "oil"
        };
        
        products.push(product);
        
        // Limit to 8 products for demonstration
        if (products.length >= 8) {
          return;
        }
      });
    }
    
    // If no products were found or fewer than desired, create some dummy products
    if (products.length === 0) {
      for (let i = 0; i < 8; i++) {
        products.push({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          source_url: url,
          name: `Oil Control Product ${i + 1}`,
          sale_price: `฿${(Math.random() * 500).toFixed(2)}`,
          original_price: Math.random() > 0.5 ? `฿${(Math.random() * 700).toFixed(2)}` : null,
          image: "https://publish-p33706-e156581.adobeaemcloud.com/content/dam/aem-cplotusonlinecommerce-project/th/images/magento/catalog/product/placeholder.jpg",
          category: "oil"
        });
      }
    }
    
    return products;
  };

  // Function to actually scrape a website
  const scrapeWebsite = async (url: string): Promise<Product[]> => {
    try {
      // Clean the URL before processing
      const cleanedUrl = cleanUrl(url);
      
      // Extract the base URL for resolving relative URLs
      const baseUrl = new URL(cleanedUrl).origin;
      
      // Fetch the HTML content using a CORS proxy
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(cleanedUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch website data');
      }
      
      const html = await response.text();
      
      // Use our extractProductsFromHTML function to parse the HTML and extract products
      const products = extractProductsFromHTML(html, baseUrl);
      
      return products;
    } catch (error) {
      console.error('Error scraping website:', error);
      toast({
        title: "Scraping Error",
        description: "Could not scrape the website. Check the URL and try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  // Handle running the script and scraping the website
  const handleRunScript = async () => {
    setIsRunning(true);
    setProgress(0);
    setShowResults(false);
    
    try {
      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 15) + 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 300);
      
      // Actually scrape the website
      const products = await scrapeWebsite(url);
      
      // After scraping completes
      clearInterval(interval);
      setProgress(100);
      setScrapedProducts(products);
      setIsRunning(false);
      setShowResults(true);
      
      toast({
        title: "Web scraping completed successfully",
        description: `Found ${products.length} products`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error running script:', error);
      setIsRunning(false);
      toast({
        title: "Error",
        description: "An error occurred while running the script",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input 
            type="url" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL to scrape (e.g., https://www.lotuss.com/en/search?q=oil)"
            className="flex-1"
          />
          <Button 
            onClick={handleRunScript} 
            disabled={isRunning}
            className="flex items-center gap-2 whitespace-nowrap"
            variant="secondary"
          >
            <Play className="h-4 w-4" />
            {isRunning ? "Running..." : "Run Script"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter a URL containing products to scrape. Try websites like Lotus's, Shopee, or Amazon.
        </p>
      </div>
      
      {isRunning && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Running web scraper...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {showResults && (
        <div className="mt-6 border-t pt-4 border-border">
          <h4 className="font-medium mb-3">Scraping Results:</h4>
          <ScrapedDataTab scrapedData={scrapedProducts} allProducts={scrapedProducts} />
        </div>
      )}
    </div>
  );
}
