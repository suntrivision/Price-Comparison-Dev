#!/bin/bash
# Quick setup for fast translation on EC2
# Run this script on your EC2 instance

echo "🚀 Quick Fast Translation Setup for EC2"
echo "======================================="

# Navigate to the marketplace directory
cd price-scan-explorer-main/src/components/product/marketplace

# Make the setup script executable and run it
chmod +x setup_fast_translation.sh
./setup_fast_translation.sh

echo ""
echo "🎉 Setup complete! You can now use fast translation."
echo ""
echo "📋 Quick test commands:"
echo "  python compare_translation_speed.py    # Compare model speeds"
echo "  python test_optimized_translation.py   # Test optimized translation"
echo ""
echo "💡 Usage in your code:"
echo "  from fast_translation import fast_translate"
echo "  results = fast_translate(['text1', 'text2'])" 