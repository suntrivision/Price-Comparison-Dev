// Test the regex pattern against the provided sample data
const sampleData = "INDOMIE MI GORENG ASLI 80GX5 - RM3.95; INDOMIE MI GORENG ASLI VALUE PACK 10S - RM7.99; INDOMIE MI GORENG SPECIAL (GSS) 5x85G - RM3.95; INDOMIE MI GORENG CILI HIJAU 5X85G - RM4.29; SAJI MI GORENG ASLI 5X80G - RM5.99; MI SEDAAP CUP MI GORENG ASLI 6X81G - RM13.65; INDOMIE MI GORENG HOT N SPICY 5X80G - RM4.29; INDOMIE MI GORENG SPECIAL VALUE PACK 10S - RM7.99; MI SEDAAP GORENG ASLI JUMBO 4X139G - RM5.85; CP8_INDOMIE MI GORENG ASLI (GSM) 5x80G - RM31.6; IBUMIE ALWAYS MI GORENG ASLI 5X80G - RM5.75; CP12_IBUMIE ALWAYS MI GORENG ASLI 5X80G - RM55.92; INDOMIE MI GRG HOT SPICY CHICKEN 5X83G - RM3.99; MI SEDAAP MI GORENG ORIG 5X90G - RM4.69; SERI AJI TEPUNG GORENG ASLI 900G - RM8.9";

const products = sampleData
  .split(';')
  .filter(line => line.trim())
  .map(productLine => {
    const trimmed = productLine.trim();
    console.log('Testing line:', `"${trimmed}"`);
    
    // Try different regex patterns
    let match = trimmed.match(/^(.+?)\s+-\s+RM([\d.]+)$/);
    
    if (!match) {
      match = trimmed.match(/^(.+?)\s*-\s*RM([\d.]+)$/);
    }
    
    if (!match) {
      match = trimmed.match(/^(.+?)\s+-\s*RM\s*([\d.]+)$/);
    }
    
    if (!match) {
      console.log('❌ Could not parse:', trimmed);
      return null;
    }
    
    const [, productName, price] = match;
    console.log('✅ Parsed:', productName.trim(), '- RM' + price);
    return {
      name: productName.trim(),
      price: parseFloat(price)
    };
  })
  .filter(Boolean);

console.log('\n📊 Total parsed products:', products.length);
console.log('📋 Sample products:', products.slice(0, 3)); 