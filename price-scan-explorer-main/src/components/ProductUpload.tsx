
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ProductUploadProps {
  onUploadComplete: () => void;
}

export function ProductUpload({ onUploadComplete }: ProductUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const product: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Map CSV headers to database columns
          switch (header.toLowerCase()) {
            case 'product name':
            case 'name':
              product.name = value;
              break;
            case 'sale price':
            case 'price':
              product.sale_price = value;
              break;
            case 'original price':
            case 'regular price':
              product.original_price = value;
              break;
            case 'store':
              product.store = value;
              break;
            case 'category':
              product.category = value || 'general';
              break;
            case 'image':
            case 'image url':
              product.image = value;
              break;
            case 'run number':
            case 'run #':
              product.run_number = value ? parseInt(value) : null;
              break;
            case 'source url':
            case 'url':
              product.source_url = value;
              break;
            default:
              break;
          }
        });
        
        return product;
      })
      .filter(product => product.name); // Only include products with names
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast({
        title: "Upload failed",
        description: "Please select a file and ensure you're logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const csvText = await file.text();
      const products = parseCSV(csvText);

      if (products.length === 0) {
        toast({
          title: "No valid products found",
          description: "The CSV file doesn't contain any valid product data.",
          variant: "destructive",
        });
        return;
      }

      // Add user_id to each product
      const productsWithUserId = products.map(product => ({
        ...product,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('uploaded_products')
        .insert(productsWithUserId);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload successful",
          description: `Successfully uploaded ${products.length} products.`,
        });
        setFile(null);
        onUploadComplete();
        
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while processing the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Product Name', 'Sale Price', 'Original Price', 'Store', 'Category', 'Image URL', 'Run Number', 'Source URL'];
    const sampleData = [
      'Sample Product', 'RM 15.99', 'RM 19.99', 'Sample Store', 'general', 'https://example.com/image.jpg', '1', 'https://example.com/product'
    ];
    
    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload Products</h3>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-upload">Select CSV File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Products'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Supported columns:</strong> Product Name, Sale Price, Original Price, Store, Category, Image URL, Run Number, Source URL</p>
          <p><strong>Note:</strong> Product Name is required. Other fields are optional.</p>
        </div>
      </div>
    </Card>
  );
}
