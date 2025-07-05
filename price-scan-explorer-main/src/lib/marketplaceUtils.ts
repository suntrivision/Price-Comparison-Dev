import { cleanUrl } from './utils';

export function extractMarketplaceFromUrl(url: string | null): string {
  if (!url) return 'Unknown';
  
  try {
    // Clean the URL by removing plus signs before question marks
    const cleanedUrl = cleanUrl(url);
    const lowerUrl = cleanedUrl.toLowerCase();
    
    // Debug logging for specific product
    console.log('Processing URL:', url);
    console.log('Cleaned URL:', cleanedUrl);
    console.log('Lowercase URL:', lowerUrl);
    
    // Check for common marketplace patterns in the URL
    if (lowerUrl.includes('shopee')) {
      console.log('Found Shopee marketplace');
      return 'shopee';
    }
    if (lowerUrl.includes('lazada')) {
      console.log('Found Lazada marketplace');
      return 'lazada';
    }
    if (lowerUrl.includes('lotus')) {
      console.log('Found Lotus marketplace');
      return 'lotus';
    }
    if (lowerUrl.includes('mydin')) {
      console.log('Found MyDin marketplace');
      return 'mydin';
    }
    if (lowerUrl.includes('tiktok')) {
      console.log('Found TikTok marketplace');
      return 'tiktok';
    }
    if (lowerUrl.includes('giant')) {
      console.log('Found Giant marketplace');
      return 'giant';
    }
    if (lowerUrl.includes('aeon')) {
      console.log('Found AEON marketplace');
      return 'aeon';
    }
    if (lowerUrl.includes('amazon')) {
      console.log('Found Amazon marketplace');
      return 'amazon';
    }
    if (lowerUrl.includes('grab')) {
      console.log('Found GrabMart marketplace');
      return 'grabmart';
    }
    if (lowerUrl.includes('foodpanda')) {
      console.log('Found Foodpanda marketplace');
      return 'foodpanda';
    }
    if (lowerUrl.includes('zalora')) {
      console.log('Found Zalora marketplace');
      return 'zalora';
    }
    if (lowerUrl.includes('qoo10')) {
      console.log('Found Qoo10 marketplace');
      return 'qoo10';
    }
    if (lowerUrl.includes('ebay')) {
      console.log('Found eBay marketplace');
      return 'ebay';
    }
    if (lowerUrl.includes('carousell')) {
      console.log('Found Carousell marketplace');
      return 'carousell';
    }
    if (lowerUrl.includes('11street')) {
      console.log('Found 11street marketplace');
      return '11street';
    }
    if (lowerUrl.includes('hermo')) {
      console.log('Found Hermo marketplace');
      return 'hermo';
    }
    if (lowerUrl.includes('beautyhaul')) {
      console.log('Found BeautyHaul marketplace');
      return 'beautyhaul';
    }
    if (lowerUrl.includes('sephora')) {
      console.log('Found Sephora marketplace');
      return 'sephora';
    }
    if (lowerUrl.includes('watsons')) {
      console.log('Found Watsons marketplace');
      return 'watsons';
    }
    if (lowerUrl.includes('guardian')) {
      console.log('Found Guardian marketplace');
      return 'guardian';
    }
    if (lowerUrl.includes('tesco')) {
      console.log('Found Tesco marketplace');
      return 'tesco';
    }
    if (lowerUrl.includes('99speedmart') || lowerUrl.includes('99 speedmart')) {
      console.log('Found 99 Speedmart marketplace');
      return '99speedmart';
    }
    if (lowerUrl.includes('jaya grocer') || lowerUrl.includes('jayagrocer')) {
      console.log('Found Jaya Grocer marketplace');
      return 'jayagrocer';
    }
    
    // Try to extract domain name as fallback
    const domain = new URL(cleanedUrl).hostname.toLowerCase();
    const domainParts = domain.replace('www.', '').split('.');
    
    console.log('Domain parts:', domainParts);
    
    if (domainParts.length > 0) {
      const mainDomain = domainParts[0];
      const result = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      console.log('Fallback marketplace from domain:', result);
      return result.toLowerCase();
    }
    
    console.log('No marketplace found, returning unknown');
    return 'unknown';
  } catch (error) {
    console.log('Error extracting marketplace from URL:', url, error);
    return 'unknown';
  }
}
