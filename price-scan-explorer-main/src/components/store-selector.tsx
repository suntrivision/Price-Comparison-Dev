
import { useState } from "react";
import { Check, Store as StoreIcon, Scan } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StoreBadge } from "@/components/store-badge";
import { stores } from "@/data/stores";
import { useToast } from "@/hooks/use-toast";

interface StoreSelectorProps {
  onSelectStore?: (store: string) => void;
  onScanComplete?: () => void;
  defaultStore?: string;
  className?: string;
  showProductCounts?: boolean;
}

export function StoreSelector({ 
  onSelectStore, 
  onScanComplete,
  defaultStore = "Lotus's",
  className,
  showProductCounts = true
}: StoreSelectorProps) {
  const [selectedStore, setSelectedStore] = useState(defaultStore);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleLotusApiCall = async () => {
    const apiUrl = "https://tmjzouwtwcerwulahtdbpwjbcq0xefso.lambda-url.ap-southeast-1.on.aws/";
    
    try {
      setIsProcessing(true);
      
      // Show processing message
      toast({
        title: "Processing",
        description: "Fetching data from Lotus's...",
      });

      console.log("Starting POST request to Lotus's API...");
      
      // First, send POST request
      const postResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!postResponse.ok) {
        throw new Error(`POST request failed: ${postResponse.status}`);
      }

      console.log("POST request successful, now sending GET request...");

      // Then, send GET request
      const getResponse = await fetch(apiUrl, {
        method: 'GET',
      });

      if (!getResponse.ok) {
        throw new Error(`GET request failed: ${getResponse.status}`);
      }

      const data = await getResponse.json();
      console.log("GET response data:", data);

      toast({
        title: "Success",
        description: "Data successfully fetched from Lotus's!",
      });

      // Notify parent component that scan is complete
      if (onScanComplete) {
        onScanComplete();
      }

    } catch (error) {
      console.error("Error calling Lotus's API:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data from Lotus's. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScreenScrapeApiCall = async () => {
    const apiUrl = "https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/Thunderbit+-+e074e434-54db-45d1-80bd-0ec187fb2f2e.json";
    
    try {
      setIsProcessing(true);
      
      // Show processing message
      toast({
        title: "Processing",
        description: "Fetching data from Screen Scrape...",
      });

      console.log("Starting GET request to Screen Scrape API...");
      
      const response = await fetch(apiUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`GET request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Screen Scrape response data:", data);

      toast({
        title: "Success",
        description: "Data successfully fetched from Screen Scrape!",
      });

      // Notify parent component that scan is complete
      if (onScanComplete) {
        onScanComplete();
      }

    } catch (error) {
      console.error("Error calling Screen Scrape API:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data from Screen Scrape. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStoreChange = (value: string) => {
    setSelectedStore(value);
    
    if (onSelectStore) {
      onSelectStore(value);
    }
  };

  const handleScanClick = async () => {
    if (selectedStore === "Lotus's") {
      await handleLotusApiCall();
    } else if (selectedStore === "Screen Scrape") {
      await handleScreenScrapeApiCall();
    } else {
      // Show processing message for other stores
      setIsProcessing(true);
      toast({
        title: "Processing",
        description: `Scanning ${selectedStore}...`,
      });
      
      // Simulate processing for other stores
      setTimeout(() => {
        setIsProcessing(false);
        toast({
          title: "Complete",
          description: `Scan completed for ${selectedStore}!`,
        });
        
        // Notify parent component that scan is complete
        if (onScanComplete) {
          onScanComplete();
        }
      }, 2000);
    }
  };

  const getStoreLogo = (storeName: string) => {
    if (storeName === "Lotus's") {
      return "/lovable-uploads/d30e2cd8-0431-4a2c-8830-cce6579d7f4c.png";
    }
    const store = stores.find(s => s.name === storeName);
    return store?.logo;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1">
        <Select 
          defaultValue={selectedStore} 
          onValueChange={handleStoreChange}
          disabled={isProcessing}
        >
          <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <SelectValue placeholder="Select a source">
              {selectedStore && (
                <div className="flex items-center gap-2">
                  {getStoreLogo(selectedStore) ? (
                    <img 
                      src={getStoreLogo(selectedStore)} 
                      alt={selectedStore} 
                      className="h-5 w-auto max-w-[24px] object-contain" 
                    />
                  ) : (
                    <StoreIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-medium">{selectedStore}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
            {stores.map((store) => (
              <SelectItem 
                key={store.id} 
                value={store.name}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-100 dark:focus:bg-blue-900/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    {getStoreLogo(store.name) ? (
                      <img 
                        src={getStoreLogo(store.name)} 
                        alt={store.name} 
                        className="h-5 w-auto max-w-[24px] object-contain" 
                      />
                    ) : (
                      <StoreIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-gray-100">{store.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showProductCounts && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {store.productCount} items
                      </span>
                    )}
                    {selectedStore === store.name && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedStore && (
        <Button
          onClick={handleScanClick}
          disabled={isProcessing}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
        >
          <Scan className="h-4 w-4" />
          {isProcessing ? "Processing..." : "Scan"}
        </Button>
      )}
    </div>
  );
}
