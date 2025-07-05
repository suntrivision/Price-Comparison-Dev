
import { Code } from "lucide-react";
import { motion } from "framer-motion";
import { ScrapingTabs } from "./ScrapingTabs";
import { pythonCode, scrapedData } from "./scrapingCodeData";

export function ScrapingCodeExample() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 border border-border rounded-xl overflow-hidden bg-card shadow-sm"
    >
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Lotus's Web Scraping Details</h3>
        </div>
      </div>
      
      <ScrapingTabs pythonCode={pythonCode} scrapedData={scrapedData} />
    </motion.div>
  );
}
