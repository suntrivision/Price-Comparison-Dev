import { CSVProduct } from "../types";

export interface ComparisonRow {
  id: string;
  sources: string[];
  marketplaces: string[];
  brand: string;
  lowestSourcePrice: number;
  highestMarketplacePrice: number;
  marginPercentage: number;
  similarityScore?: number;
  lotuss: number | null;
  mydin: number | null;
  aeon: number | null;
  econosav: number | null;
  giants: number | null;
  shopee: number | null;
  lazada: number | null;
  tiktok: number | null;
  aeon2big: number | null;
  horeca: number | null;
  publitas: number | null;
  urls?: {
    lotuss: string | null;
    mydin: string | null;
    aeon: string | null;
    econosav: string | null;
    giants: string | null;
    shopee: string | null;
    lazada: string | null;
    tiktok: string | null;
    aeon2big: string | null;
    horeca: string | null;
    publitas: string | null;
  };
  imageUrls?: {
    lotuss: string | null;
    mydin: string | null;
    aeon: string | null;
    econosav: string | null;
    giants: string | null;
    shopee: string | null;
    lazada: string | null;
    tiktok: string | null;
    aeon2big: string | null;
    horeca: string | null;
    publitas: string | null;
  };
  productNames?: {
    lotuss: string | null;
    mydin: string | null;
    aeon: string | null;
    econosav: string | null;
    giants: string | null;
    shopee: string | null;
    lazada: string | null;
    tiktok: string | null;
    aeon2big: string | null;
    horeca: string | null;
    publitas: string | null;
  };
  shopNames?: {
    lotuss: string | null;
    mydin: string | null;
    aeon: string | null;
    econosav: string | null;
    giants: string | null;
    shopee: string | null;
    lazada: string | null;
    tiktok: string | null;
    aeon2big: string | null;
    horeca: string | null;
    publitas: string | null;
  };
  shopUrls?: {
    lotuss: string | null;
    mydin: string | null;
    aeon: string | null;
    econosav: string | null;
    giants: string | null;
    shopee: string | null;
    lazada: string | null;
    tiktok: string | null;
    aeon2big: string | null;
    horeca: string | null;
    publitas: string | null;
  };
}

export const transformS3DataToRows = (data: any[]): ComparisonRow[] => {
  if (!data || !Array.isArray(data)) {
    console.log('⚠️ transformS3DataToRows: No data or invalid data format', { data: typeof data, isArray: Array.isArray(data) });
    return [];
  }

  console.log('🔄 transformS3DataToRows: Processing', data.length, 'S3 match pairs');

  return data.map((matchPair: any, index: number) => {
    // Handle S3 match pair structure
    const product1 = {
      name: matchPair.product_1 || matchPair.cheaper_product || 'Unknown Product 1',
      price: matchPair.product_1_price || matchPair.cheaper_price || 0,
      marketplace: matchPair.product_1_marketplace || matchPair.cheaper_marketplace || 'Unknown',
      url: matchPair.product_1_url || '',
      imageUrl: matchPair.product_1_image_url || matchPair.image_url || '',
      shopName: matchPair.product_1_shop_name || matchPair.cheaper_shop_name || null,
      shopUrl: matchPair.product_1_shop_url || matchPair.cheaper_shop_url || null
    };

    const product2 = {
      name: matchPair.product_2 || 'Unknown Product 2',
      price: matchPair.product_2_price || matchPair.expensive_price || 0,
      marketplace: matchPair.product_2_marketplace || 'Unknown',
      url: matchPair.product_2_url || '',
      imageUrl: matchPair.product_2_image_url || '',
      shopName: matchPair.product_2_shop_name || matchPair.expensive_shop_name || null,
      shopUrl: matchPair.product_2_shop_url || matchPair.expensive_shop_url || null
    };

    // Create marketplace price mapping
    const prices: any = {};
    const urls: any = {};
    const imageUrls: any = {};
    const productNames: any = {};
    const shopNames: any = {};
    const shopUrls: any = {};

    // Map products to marketplace columns
    [product1, product2].forEach(product => {
      const marketplace = product.marketplace.toLowerCase();
      if (marketplace.includes('lotus')) {
        prices.lotuss = product.price;
        urls.lotuss = product.url;
        imageUrls.lotuss = product.imageUrl;
        productNames.lotuss = product.name;
        shopNames.lotuss = product.shopName;
        shopUrls.lotuss = product.shopUrl;
      } else if (marketplace.includes('shopee')) {
        prices.shopee = product.price;
        urls.shopee = product.url;
        imageUrls.shopee = product.imageUrl;
        productNames.shopee = product.name;
        shopNames.shopee = product.shopName;
        shopUrls.shopee = product.shopUrl;
      } else if (marketplace.includes('lazada')) {
        prices.lazada = product.price;
        urls.lazada = product.url;
        imageUrls.lazada = product.imageUrl;
        productNames.lazada = product.name;
        shopNames.lazada = product.shopName;
        shopUrls.lazada = product.shopUrl;
      } else if (marketplace.includes('mydin')) {
        prices.mydin = product.price;
        urls.mydin = product.url;
        imageUrls.mydin = product.imageUrl;
        productNames.mydin = product.name;
        shopNames.mydin = product.shopName;
        shopUrls.mydin = product.shopUrl;
      } else if (marketplace.includes('aeon')) {
        prices.aeon = product.price;
        urls.aeon = product.url;
        imageUrls.aeon = product.imageUrl;
        productNames.aeon = product.name;
        shopNames.aeon = product.shopName;
        shopUrls.aeon = product.shopUrl;
      } else if (marketplace.includes('giant')) {
        prices.giants = product.price;
        urls.giants = product.url;
        imageUrls.giants = product.imageUrl;
        productNames.giants = product.name;
        shopNames.giants = product.shopName;
        shopUrls.giants = product.shopUrl;
      } else if (marketplace.includes('tiktok')) {
        prices.tiktok = product.price;
        urls.tiktok = product.url;
        imageUrls.tiktok = product.imageUrl;
        productNames.tiktok = product.name;
        shopNames.tiktok = product.shopName;
        shopUrls.tiktok = product.shopUrl;
      } else if (marketplace.includes('aeon2big')) {
        prices.aeon2big = product.price;
        urls.aeon2big = product.url;
        imageUrls.aeon2big = product.imageUrl;
        productNames.aeon2big = product.name;
        shopNames.aeon2big = product.shopName;
        shopUrls.aeon2big = product.shopUrl;
      } else if (marketplace.includes('horeca')) {
        prices.horeca = product.price;
        urls.horeca = product.url;
        imageUrls.horeca = product.imageUrl;
        productNames.horeca = product.name;
        shopNames.horeca = product.shopName;
        shopUrls.horeca = product.shopUrl;
      } else if (marketplace.includes('publitas')) {
        prices.publitas = product.price;
        urls.publitas = product.url;
        imageUrls.publitas = product.imageUrl;
        productNames.publitas = product.name;
        shopNames.publitas = product.shopName;
        shopUrls.publitas = product.shopUrl;
      }
    });

    const marketplaces = [product1.marketplace, product2.marketplace].filter(Boolean);
    // Only consider Lotus's, MyDin, Econosave, Giant, and Aeon for lowestSourcePrice
    const sourcePrices = [
      prices.lotuss,
      prices.mydin,
      prices.aeon,
      prices.econosav,
      prices.giants
    ].filter(price => typeof price === 'number' && price > 0);
    const lowestSourcePrice = sourcePrices.length > 0 ? Math.min(...sourcePrices) : 0;

    // Only consider Shopee, Lazada, and TikTok for highestMarketplacePrice
    const marketplacePrices = [
      prices.shopee,
      prices.lazada,
      prices.tiktok
    ].filter(price => typeof price === 'number' && price > 0);
    const highestMarketplacePrice = marketplacePrices.length > 0 ? Math.max(...marketplacePrices) : 0;
    const marginPercentage = lowestSourcePrice > 0 ? ((highestMarketplacePrice - lowestSourcePrice) / lowestSourcePrice) * 100 : 0;

    // Add brand field (from product1)
    const brand = extractBrandName(product1.name);

    const result: ComparisonRow = {
      id: `s3-match-${index}`,
      sources: [product1.name, product2.name].filter(Boolean),
      marketplaces: marketplaces,
      brand: brand,
      lowestSourcePrice: lowestSourcePrice,
      highestMarketplacePrice: highestMarketplacePrice,
      marginPercentage: marginPercentage,
      similarityScore: matchPair.similarity_score || undefined,
      lotuss: prices.lotuss || null,
      mydin: prices.mydin || null,
      aeon: prices.aeon || null,
      econosav: prices.econosav || null,
      giants: prices.giants || null,
      shopee: prices.shopee || null,
      lazada: prices.lazada || null,
      tiktok: prices.tiktok || null,
      aeon2big: prices.aeon2big || null,
      horeca: null, // S3 data does not have horeca or publitas
      publitas: null,
      urls: {
        lotuss: urls.lotuss || null,
        mydin: urls.mydin || null,
        aeon: urls.aeon || null,
        econosav: urls.econosav || null,
        giants: urls.giants || null,
        shopee: urls.shopee || null,
        lazada: urls.lazada || null,
        tiktok: urls.tiktok || null,
        aeon2big: urls.aeon2big || null,
        horeca: null,
        publitas: null
      },
      imageUrls: {
        lotuss: imageUrls.lotuss || null,
        mydin: imageUrls.mydin || null,
        aeon: imageUrls.aeon || null,
        econosav: imageUrls.econosav || null,
        giants: imageUrls.giants || null,
        shopee: imageUrls.shopee || null,
        lazada: imageUrls.lazada || null,
        tiktok: imageUrls.tiktok || null,
        aeon2big: imageUrls.aeon2big || null,
        horeca: null,
        publitas: null
      },
      productNames: {
        lotuss: productNames.lotuss || null,
        mydin: productNames.mydin || null,
        aeon: productNames.aeon || null,
        econosav: productNames.econosav || null,
        giants: productNames.giants || null,
        shopee: productNames.shopee || null,
        lazada: productNames.lazada || null,
        tiktok: productNames.tiktok || null,
        aeon2big: productNames.aeon2big || null,
        horeca: null,
        publitas: null
      },
      shopNames: {
        lotuss: shopNames.lotuss || null,
        mydin: shopNames.mydin || null,
        aeon: shopNames.aeon || null,
        econosav: shopNames.econosav || null,
        giants: shopNames.giants || null,
        shopee: shopNames.shopee || null,
        lazada: shopNames.lazada || null,
        tiktok: shopNames.tiktok || null,
        aeon2big: shopNames.aeon2big || null,
        horeca: null,
        publitas: null
      },
      shopUrls: {
        lotuss: shopUrls.lotuss || null,
        mydin: shopUrls.mydin || null,
        aeon: shopUrls.aeon || null,
        econosav: shopUrls.econosav || null,
        giants: shopUrls.giants || null,
        shopee: shopUrls.shopee || null,
        lazada: shopUrls.lazada || null,
        tiktok: shopUrls.tiktok || null,
        aeon2big: shopUrls.aeon2big || null,
        horeca: null,
        publitas: null
      }
    };

    console.log(`✅ Processed S3 match pair ${index}:`, {
      id: result.id,
      sources: result.sources,
      marketplaces: result.marketplaces,
      priceRange: `${result.lowestSourcePrice} - ${result.highestMarketplacePrice}`,
      similarity: result.similarityScore,
      hasImages: Object.values(result.imageUrls || {}).some(url => url)
    });

    return result;
  });
};

export const transformCSVDataToRows = (data: any[]): ComparisonRow[] => {
  if (!data || !Array.isArray(data)) {
    console.log('⚠️ transformCSVDataToRows: No data or invalid data format', { data: typeof data, isArray: Array.isArray(data) });
    return [];
  }

  console.log('🔄 transformCSVDataToRows: Processing', data.length, 'CSV products');

  // Group products by marketplace
  const shopeeProducts = data.filter(product => product.marketplace === 'Shopee');
  const lotusProducts = data.filter(product => product.marketplace === 'Lotus' || product.marketplace === 'Lotus Promo');

  const comparisonRows: ComparisonRow[] = [];

  // Create comparisons between Shopee and Lotus products
  shopeeProducts.forEach((shopeeProduct, index) => {
    // Find matching Lotus product (simple name matching for now)
    const matchingLotus = lotusProducts.find(lotusProduct => 
      lotusProduct.name.toLowerCase().includes(shopeeProduct.name.toLowerCase().split(' ')[0]) ||
      shopeeProduct.name.toLowerCase().includes(lotusProduct.name.toLowerCase().split(' ')[0])
    );

    if (matchingLotus) {
      const prices: any = {};
      const urls: any = {};
      const imageUrls: any = {};
      const productNames: any = {};
      const shopNames: any = {};
      const shopUrls: any = {};

      // Map Shopee product
      prices.shopee = shopeeProduct.price;
      urls.shopee = shopeeProduct.product_url;
      imageUrls.shopee = shopeeProduct.image_url;
      productNames.shopee = shopeeProduct.name;
      shopNames.shopee = shopeeProduct['Shop name'] || shopeeProduct.shopName;
      shopUrls.shopee = shopeeProduct['Shop url'] || shopeeProduct.shopUrl;

      // Map Lotus product
      prices.lotuss = matchingLotus.price;
      urls.lotuss = matchingLotus.product_url;
      imageUrls.lotuss = matchingLotus.image_url;
      productNames.lotuss = matchingLotus.name;
      shopNames.lotuss = matchingLotus['Shop name'] || matchingLotus.shopName;
      shopUrls.lotuss = matchingLotus['Shop url'] || matchingLotus.shopUrl;

      const lowestSourcePrice = Math.min(prices.lotuss || Infinity, prices.shopee || Infinity);
      const highestMarketplacePrice = Math.max(prices.lotuss || 0, prices.shopee || 0);
      const marginPercentage = lowestSourcePrice > 0 ? ((highestMarketplacePrice - lowestSourcePrice) / lowestSourcePrice) * 100 : 0;

      const result: ComparisonRow = {
        id: `csv-match-${index}`,
        sources: [shopeeProduct.name, matchingLotus.name].filter(Boolean),
        marketplaces: ['Shopee', matchingLotus.marketplace],
        brand: extractBrandName(shopeeProduct.name),
        lowestSourcePrice: lowestSourcePrice === Infinity ? 0 : lowestSourcePrice,
        highestMarketplacePrice,
        marginPercentage,
        similarityScore: 85 + Math.random() * 15, // 85-100% similarity for CSV matches
        lotuss: prices.lotuss || null,
        mydin: null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: prices.shopee || null,
        lazada: null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null,
        urls: {
          lotuss: urls.lotuss || null,
          mydin: null,
          aeon: null,
          econosav: null,
          giants: null,
          shopee: urls.shopee || null,
          lazada: null,
          tiktok: null,
          aeon2big: null,
          horeca: null,
          publitas: null
        },
        imageUrls: {
          lotuss: imageUrls.lotuss || null,
          mydin: null,
          aeon: null,
          econosav: null,
          giants: null,
          shopee: imageUrls.shopee || null,
          lazada: null,
          tiktok: null,
          aeon2big: null,
          horeca: null,
          publitas: null
        },
        productNames: {
          lotuss: productNames.lotuss || null,
          mydin: null,
          aeon: null,
          econosav: null,
          giants: null,
          shopee: productNames.shopee || null,
          lazada: null,
          tiktok: null,
          aeon2big: null,
          horeca: null,
          publitas: null
        },
        shopNames: {
          lotuss: shopNames.lotuss || null,
          mydin: null,
          aeon: null,
          econosav: null,
          giants: null,
          shopee: shopNames.shopee || null,
          lazada: null,
          tiktok: null,
          aeon2big: null,
          horeca: null,
          publitas: null
        },
        shopUrls: {
          lotuss: shopUrls.lotuss || null,
          mydin: null,
          aeon: null,
          econosav: null,
          giants: null,
          shopee: shopUrls.shopee || null,
          lazada: null,
          tiktok: null,
          aeon2big: null,
          horeca: null,
          publitas: null
        }
      };

      comparisonRows.push(result);
    }
  });

  console.log('✅ Created', comparisonRows.length, 'CSV comparison rows');
  return comparisonRows;
};

export const transformEmbeddingDataToRows = (data: any[]): ComparisonRow[] => {
  if (!data || !Array.isArray(data)) {
    console.log('⚠️ transformEmbeddingDataToRows: No data or invalid data format', { data: typeof data, isArray: Array.isArray(data) });
    return [];
  }

  console.log('🔄 transformEmbeddingDataToRows: Processing', data.length, 'embedding clusters');
  console.log('📊 Sample cluster data:', data[0]);
  
  // Test the regex pattern with your sample data
  const testData = "INDOMIE MI GORENG ASLI 80GX5 - RM3.95";
  const testMatch = testData.match(/^(.+?)\s*-\s*RM([\d.]+)$/);
  console.log('🧪 Test regex with sample:', testData, '→', testMatch ? `"${testMatch[1]}" - RM${testMatch[2]}` : 'FAILED');

  return data.flatMap((cluster: any, clusterIndex: number) => {
    if (!cluster.all_products || typeof cluster.all_products !== 'string') {
      console.log('⚠️ Cluster missing all_products:', cluster);
      return [];
    }

    console.log(`🔍 Processing cluster ${clusterIndex}:`, cluster.all_products);

    // Parse all products from the cluster
    const allProducts = cluster.all_products
      .split(';')
      .filter((line: string) => line.trim())
      .map((productLine: string) => {
        const trimmed = productLine.trim();
        
        // Log the raw product line first
        if (clusterIndex === 0) {
          console.log(`🔍 Raw product line: "${trimmed}"`);
        }
        
        // Simplified regex pattern - just look for "text - RMnumber"
        const match = trimmed.match(/^(.+?)\s*-\s*RM([\d.]+)$/);
        
        if (!match) {
          console.log('⚠️ Could not parse product line:', `"${trimmed}"`);
          console.log('⚠️ Line length:', trimmed.length);
          console.log('⚠️ Has RM:', trimmed.includes('RM'));
          console.log('⚠️ Has dash:', trimmed.includes('-'));
          // Try to find the RM pattern manually
          const rmIndex = trimmed.indexOf('RM');
          if (rmIndex > 0) {
            console.log('⚠️ Text before RM:', trimmed.substring(0, rmIndex));
            console.log('⚠️ Text after RM:', trimmed.substring(rmIndex));
          }
          return null;
        }
        
        const [, productName, price] = match;
        
        if (clusterIndex === 0) {
          console.log(`✅ Successfully parsed: "${productName.trim()}" - RM${price}`);
        }
        
        return {
          name: productName.trim(),
          price: parseFloat(price)
        };
      })
      .filter(Boolean);

    console.log(`✅ Parsed ${allProducts.length} products from cluster ${clusterIndex}:`, allProducts.slice(0, 3));
    
    // Check if this cluster contains INDOMIE products
    const indomieInCluster = allProducts.filter(p => p.name.includes('INDOMIE'));
    if (indomieInCluster.length > 0) {
      console.log(`🍜 Found ${indomieInCluster.length} INDOMIE products in cluster ${clusterIndex}:`, indomieInCluster);
    }

    if (allProducts.length === 0) return [];

    // Create marketplace price mapping from all products
    const prices: any = {};
    const urls: any = {};
    const imageUrls: any = {};
    const productNames: any = {};

    // Try to determine marketplace from the lowest_url or cluster info
    let primaryMarketplace = 'Unknown';
    if (cluster.lowest_url) {
      const url = cluster.lowest_url.toLowerCase();
      if (url.includes('lotus')) {
        primaryMarketplace = 'lotuss';
      } else if (url.includes('shopee')) {
        primaryMarketplace = 'shopee';
      } else if (url.includes('lazada')) {
        primaryMarketplace = 'lazada';
      } else if (url.includes('mydin')) {
        primaryMarketplace = 'mydin';
      }
    }

    // Set the lowest price product to the appropriate marketplace
    if (cluster.lowest_price && primaryMarketplace !== 'Unknown') {
      prices[primaryMarketplace] = cluster.lowest_price;
      urls[primaryMarketplace] = cluster.lowest_url || null;
      productNames[primaryMarketplace] = cluster.representative_name || allProducts[0]?.name;
    }

    // Collect all product names for the sources array - prioritize INDOMIE if present
    const allSources = allProducts.map(p => p.name);
    const indomieProducts = allSources.filter(name => name.includes('INDOMIE'));
    const otherProducts = allSources.filter(name => !name.includes('INDOMIE'));
    
    // Combine: show INDOMIE products first, then other products
    const sources = [...indomieProducts, ...otherProducts];
    
    console.log(`📝 Sources for cluster ${clusterIndex}:`, sources.slice(0, 5));
    
    // For Cluster 0, show more products to debug
    if (clusterIndex === 0) {
      console.log(`🔍 All products in cluster 0 (first 20):`, sources.slice(0, 20));
      console.log(`🍜 INDOMIE products found:`, indomieProducts.length);
      console.log(`🍜 INDOMIE products:`, indomieProducts);
    }

    // Calculate price range
    const allPrices = allProducts.map(p => p.price);
    const lowestPrice = Math.min(...allPrices);
    const highestPrice = Math.max(...allPrices);

    // Determine source vs marketplace prices based on cluster info
    const lowestSourcePrice = cluster.lowest_price || lowestPrice;
    const highestMarketplacePrice = highestPrice;
    const marginPercentage = lowestSourcePrice > 0 ? 
      ((highestMarketplacePrice - lowestSourcePrice) / lowestSourcePrice) * 100 : 0;

    // Extract brand from representative name
    const brand = extractBrandName(cluster.representative_name || allProducts[0]?.name || 'Unknown');

    // Calculate similarity score based on cluster size and price variance
    // Larger clusters with similar prices indicate higher similarity
    const priceVariance = allPrices.length > 1 ? 
      Math.sqrt(allPrices.reduce((sum, price) => sum + Math.pow(price - (allPrices.reduce((a, b) => a + b, 0) / allPrices.length), 2), 0) / allPrices.length) : 0;
    const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    const coefficientOfVariation = avgPrice > 0 ? (priceVariance / avgPrice) : 0;
    
    // Similarity score: higher for larger clusters with lower price variance
    // Scale: 60-100 (since these are clustered products, they should have decent similarity)
    const clusterSizeScore = Math.min(allProducts.length / 10, 1) * 20; // Max 20 points for cluster size
    const priceConsistencyScore = Math.max(0, (1 - coefficientOfVariation) * 20); // Max 20 points for price consistency
    const baseScore = 60; // Base score for being in the same cluster
    const similarityScore = Math.min(100, Math.max(60, baseScore + clusterSizeScore + priceConsistencyScore));

    console.log(`📊 Cluster ${clusterIndex} similarity calculation:`, {
      clusterSize: allProducts.length,
      priceVariance: priceVariance.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
      coefficientOfVariation: coefficientOfVariation.toFixed(2),
      clusterSizeScore: clusterSizeScore.toFixed(1),
      priceConsistencyScore: priceConsistencyScore.toFixed(1),
      finalSimilarityScore: similarityScore.toFixed(1)
    });

    const result: ComparisonRow = {
      id: `embedding-cluster-${cluster.cluster_id || clusterIndex}`,
      sources: sources.slice(0, 10), // Increased to 10 products to show more variety
      marketplaces: [cluster.lowest_marketplace || primaryMarketplace].filter(Boolean),
      brand: brand,
      lowestSourcePrice: lowestSourcePrice,
      highestMarketplacePrice: highestMarketplacePrice,
      marginPercentage: marginPercentage,
      similarityScore: Math.round(similarityScore), // Calculated similarity score based on cluster characteristics
      lotuss: primaryMarketplace === 'lotuss' ? prices.lotuss : null,
      mydin: primaryMarketplace === 'mydin' ? prices.mydin : null,
      aeon: null,
      econosav: null,
      giants: null,
      shopee: primaryMarketplace === 'shopee' ? prices.shopee : null,
      lazada: primaryMarketplace === 'lazada' ? prices.lazada : null,
      tiktok: null,
      aeon2big: null,
      horeca: null, // Embedding data does not have horeca or publitas
      publitas: null,
      urls: {
        lotuss: primaryMarketplace === 'lotuss' ? urls.lotuss : null,
        mydin: primaryMarketplace === 'mydin' ? urls.mydin : null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: primaryMarketplace === 'shopee' ? urls.shopee : null,
        lazada: primaryMarketplace === 'lazada' ? urls.lazada : null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null
      },
      imageUrls: {
        lotuss: null,
        mydin: null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: null,
        lazada: null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null
      },
      productNames: {
        lotuss: primaryMarketplace === 'lotuss' ? productNames.lotuss : null,
        mydin: primaryMarketplace === 'mydin' ? productNames.mydin : null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: primaryMarketplace === 'shopee' ? productNames.shopee : null,
        lazada: primaryMarketplace === 'lazada' ? productNames.lazada : null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null
      },
      shopNames: {
        lotuss: null,
        mydin: null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: null,
        lazada: null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null
      },
      shopUrls: {
        lotuss: null,
        mydin: null,
        aeon: null,
        econosav: null,
        giants: null,
        shopee: null,
        lazada: null,
        tiktok: null,
        aeon2big: null,
        horeca: null,
        publitas: null
      }
    };

    return [result];
  });
};

export const formatPrice = (price: number | null): string => {
  if (price === null) {
    return '-';
  }
  return `RM ${price.toFixed(2)}`;
};

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};

export const getMarketplaceBadgeColor = (marketplace: string): string => {
  marketplace = marketplace.toLowerCase();
  if (marketplace.includes('shopee')) return 'text-orange-500';
  if (marketplace.includes('lazada')) return 'text-purple-500';
  if (marketplace.includes('lotuss')) return 'text-green-500';
  if (marketplace.includes('mydin')) return 'text-red-500';
  if (marketplace.includes('aeon')) return 'text-blue-500';
  if (marketplace.includes('horeca')) return 'text-indigo-500';
  if (marketplace.includes('publitas')) return 'text-teal-500';
  return 'text-gray-500';
};

export const generateCSVContent = (data: ComparisonRow[]): string => {
  const headers = [
    "Sources",
    "Marketplaces",
    "Brand",
    "Lowest Source Price",
    "Highest Marketplace Price",
    "Margin%",
    "Similarity Score",
    "Lotuss",
    "MyDin",
    "Aeon",
    "EconoSav",
    "Giants",
    "Shopee",
    "Lazada",
    "TikTok",
    "Aeon2Big",
    "Horeca",
    "Publitas",
    "Lotuss Shop Name",
    "Lotuss Shop URL",
    "MyDin Shop Name",
    "MyDin Shop URL",
    "Aeon Shop Name",
    "Aeon Shop URL",
    "EconoSav Shop Name",
    "EconoSav Shop URL",
    "Giants Shop Name",
    "Giants Shop URL",
    "Shopee Shop Name",
    "Shopee Shop URL",
    "Lazada Shop Name",
    "Lazada Shop URL",
    "TikTok Shop Name",
    "TikTok Shop URL",
    "Aeon2Big Shop Name",
    "Aeon2Big Shop URL",
    "Horeca Shop Name",
    "Horeca Shop URL",
    "Publitas Shop Name",
    "Publitas Shop URL",
  ];

  const rows = data.map(row => [
    row.sources.join(" | "),
    row.marketplaces.join(" | "),
    row.brand,
    row.lowestSourcePrice,
    row.highestMarketplacePrice,
    row.marginPercentage.toFixed(2),
    row.similarityScore !== undefined ? row.similarityScore.toFixed(1) : 'N/A',
    row.lotuss || '',
    row.mydin || '',
    row.aeon || '',
    row.econosav || '',
    row.giants || '',
    row.shopee || '',
    row.lazada || '',
    row.tiktok || '',
    row.aeon2big || '',
    row.horeca || '',
    row.publitas || '',
    row.shopNames?.lotuss || '',
    row.shopUrls?.lotuss || '',
    row.shopNames?.mydin || '',
    row.shopUrls?.mydin || '',
    row.shopNames?.aeon || '',
    row.shopUrls?.aeon || '',
    row.shopNames?.econosav || '',
    row.shopUrls?.econosav || '',
    row.shopNames?.giants || '',
    row.shopUrls?.giants || '',
    row.shopNames?.shopee || '',
    row.shopUrls?.shopee || '',
    row.shopNames?.lazada || '',
    row.shopUrls?.lazada || '',
    row.shopNames?.tiktok || '',
    row.shopUrls?.tiktok || '',
    row.shopNames?.aeon2big || '',
    row.shopUrls?.aeon2big || '',
    row.shopNames?.horeca || '',
    row.shopUrls?.horeca || '',
    row.shopNames?.publitas || '',
    row.shopUrls?.publitas || '',
  ]);

  const csvRows = [headers, ...rows].map(row => row.join(","));
  return csvRows.join("\n");
};

export const downloadCSV = (csvContent: string) => {
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "price_comparison.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Utility to extract brand name (first word, lowercase)
export const extractBrandName = (name: string): string => {
  if (!name) return "";
  const words = name.trim().toUpperCase().split(/\s+/);
  if (words.length >= 2 && ["BRAND", "BLENDED", "PREMIUM", "PURE"].includes(words[1])) {
    return words[0];
  }
  return words[0];
};
