import { useState, useEffect, useMemo } from 'react';

interface MatchedCSVRow {
  'Lotus Product': string;
  'Lotus URL': string;
  'Lotus Price': string;
  'Shopee Product': string;
  'Shopee URL': string;
  'Shopee Price': string;
  'Match Score': string;
}

interface ProcessedMatchedProduct {
  id: string;
  cluster_id: string;
  representative_name: string;
  name: string;
  price: number;
  marketplace: string;
  product_url: string;
  image_url: string;
  source_search_url: string;
  size_info: string;
  similarity_to_best_price: number;
  enhanced_with_image: boolean;
  lowest_price: number;
  lowest_marketplace: string;
  lowest_url: string;
  category: string;
  matched_products: Array<{
    name: string;
    price: number;
    marketplace: string;
    similarity_score: number;
    product_url: string;
  }>;
}

export function useMatchedCSVData() {
  const [csvData, setCsvData] = useState<MatchedCSVRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://prodpromo.s3.ap-southeast-1.amazonaws.com/thunderbitscrape/matched_lotus_shopee_horeca_publitasA.csv.txt');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('🔍 Raw CSV text length:', csvText.length);
      console.log('🔍 First 500 characters:', csvText.substring(0, 500));
      
      // Clean the CSV text - remove BOM and other encoding artifacts
      let cleanedCsvText = csvText.replace(/^\uFEFF/, '').replace(/^[^\"]*/,'');
      
      // The new format has data wrapped in quotes, so we need to extract individual records
      const recordPattern = /"([^"]+(?:"[^"]*"[^"]*)*?)"/g;
      const records = [];
      let match;
      
      while ((match = recordPattern.exec(cleanedCsvText)) !== null) {
        records.push(match[1]);
      }
      
      console.log('🔍 Extracted records:', records.length);
      
      if (records.length === 0) {
        throw new Error('No CSV records found');
      }
      
      // Parse CSV with proper comma handling for URLs with query parameters
      const parseCSVRecord = (record: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inUrl = false;
        let i = 0;
        
        while (i < record.length) {
          const char = record[i];
          
          // Check if we're starting a URL (contains http)
          if (record.substring(i, i + 4) === 'http') {
            inUrl = true;
          }
          
          // Check if we're ending a URL (comma followed by non-URL content)
          if (char === ',' && inUrl) {
            // Look ahead to see if next part starts with http or contains RM or is a number
            const nextPart = record.substring(i + 1, i + 20);
            if (nextPart.includes('RM') || nextPart.match(/^\d/) || nextPart.includes('http')) {
              inUrl = false;
            }
          }
          
          if (char === ',' && !inUrl) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
          i++;
        }
        result.push(current.trim());
        return result;
      };
      
      // First record should be the header
      const headers = parseCSVRecord(records[0]);
      console.log('🔍 CSV Headers:', headers);
      
      const data: MatchedCSVRow[] = [];
      
      // Process each record (skip header)
      for (let i = 1; i < records.length; i++) {
        const values = parseCSVRecord(records[i]);
        console.log(`🔍 Record ${i} parsed into ${values.length} values`);
        
        if (values.length >= 6) { // Ensure we have at least the required columns
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
          });
          data.push(row as MatchedCSVRow);
        }
      }
      
      console.log('🔍 Matched CSV Data loaded:', data.length, 'rows');
      
      // If no data was parsed, try a simpler fallback approach
      if (data.length === 0) {
        console.log('🔍 Trying fallback parsing method...');
        
        // Try to parse the data as a simple format where each record is on a separate line
        const simpleRecords = cleanedCsvText.split('" "').map(record => record.replace(/^"/, '').replace(/"$/, ''));
        
        if (simpleRecords.length > 1) {
          const simpleHeaders = simpleRecords[0].split(',');
          console.log('🔍 Fallback headers:', simpleHeaders);
          
          for (let i = 1; i < simpleRecords.length; i++) {
            // Split by comma but try to keep URLs together
            const parts = simpleRecords[i].split(',');
            
            if (parts.length >= 7) {
              // Expected format: Product, URL, Price, Product, URL, Price, Score
              const fallbackRow: any = {};
              fallbackRow[simpleHeaders[0]] = parts[0];
              fallbackRow[simpleHeaders[1]] = parts[1];
              fallbackRow[simpleHeaders[2]] = parts[2];
              fallbackRow[simpleHeaders[3]] = parts[3];
              fallbackRow[simpleHeaders[4]] = parts[4];
              fallbackRow[simpleHeaders[5]] = parts[5];
              fallbackRow[simpleHeaders[6]] = parts[6];
              
              data.push(fallbackRow as MatchedCSVRow);
            }
          }
          
          console.log('🔍 Fallback parsing loaded:', data.length, 'rows');
        }
      }
      
      setCsvData(data);
      
    } catch (err) {
      console.error('❌ Error fetching matched CSV data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processedData = useMemo(() => {
    if (!csvData.length) return [];

    const products: ProcessedMatchedProduct[] = [];

    csvData.forEach((row, index) => {
      const lotusPrice = parseFloat(row['Lotus Price']?.replace('RM', '').replace(',', '') || '0');
      const shopeePrice = parseFloat(row['Shopee Price']?.replace('RM', '').replace(',', '') || '0');
      const matchScore = parseFloat(row['Match Score'] || '0');

      // Create Lotus product entry
      products.push({
        id: `matched-lotus-${index}`,
        cluster_id: `matched-${index}`,
        representative_name: row['Lotus Product'],
        name: row['Lotus Product'],
        price: lotusPrice,
        marketplace: 'Lotus',
        product_url: row['Lotus URL'] || '',
        image_url: '',
        source_search_url: row['Lotus URL'] || '',
        size_info: '',
        similarity_to_best_price: matchScore,
        enhanced_with_image: false,
        lowest_price: Math.min(lotusPrice, shopeePrice),
        lowest_marketplace: lotusPrice <= shopeePrice ? 'Lotus' : 'Shopee',
        lowest_url: lotusPrice <= shopeePrice ? row['Lotus URL'] : row['Shopee URL'],
        category: 'Fuzzy Matched Products',
        matched_products: [{
          name: row['Shopee Product'],
          price: shopeePrice,
          marketplace: 'Shopee',
          similarity_score: matchScore,
          product_url: row['Shopee URL'] || ''
        }]
      });

      // Create Shopee product entry
      products.push({
        id: `matched-shopee-${index}`,
        cluster_id: `matched-${index}`,
        representative_name: row['Shopee Product'],
        name: row['Shopee Product'],
        price: shopeePrice,
        marketplace: 'Shopee',
        product_url: row['Shopee URL'] || '',
        image_url: '',
        source_search_url: row['Shopee URL'] || '',
        size_info: '',
        similarity_to_best_price: matchScore,
        enhanced_with_image: false,
        lowest_price: Math.min(lotusPrice, shopeePrice),
        lowest_marketplace: lotusPrice <= shopeePrice ? 'Lotus' : 'Shopee',
        lowest_url: lotusPrice <= shopeePrice ? row['Lotus URL'] : row['Shopee URL'],
        category: 'Fuzzy Matched Products',
        matched_products: [{
          name: row['Lotus Product'],
          price: lotusPrice,
          marketplace: 'Lotus',
          similarity_score: matchScore,
          product_url: row['Lotus URL'] || ''
        }]
      });
    });

    return products;
  }, [csvData]);

  return {
    csvData,
    processedData,
    isLoading,
    error,
    refetch: fetchData
  };
} 