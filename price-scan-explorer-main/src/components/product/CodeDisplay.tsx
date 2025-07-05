
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodeDisplayProps {
  code: string;
}

export function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button 
        size="sm" 
        variant="ghost" 
        className="absolute top-2 right-2 h-8 gap-1.5"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            <span>Copy Code</span>
          </>
        )}
      </Button>
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs md:text-sm">
        <code className="language-python">{code}</code>
      </pre>
    </div>
  );
}
