#!/bin/bash
# Upload script for EC2

EC2_HOST="ec2-13-215-51-84.ap-southeast-1.compute.amazonaws.com"
EC2_USER="ubuntu"
PEM_FILE="ollama-product-matcher.pem"
REMOTE_DIR="~/price-scanner"

echo "🚀 Uploading files to EC2..."
echo "Host: $EC2_HOST"
echo "User: $EC2_USER"
echo "Remote Directory: $REMOTE_DIR"
echo ""

# Create remote directory
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_HOST" "mkdir -p $REMOTE_DIR"

# Upload main files
echo "📤 Uploading main files..."
scp -i "$PEM_FILE" matchfuzzy_ollama_persistent.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$PEM_FILE" fast_translation.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$PEM_FILE" ollama_config.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$PEM_FILE" test_20_products.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

# Upload test files
echo "📤 Uploading test files..."
scp -i "$PEM_FILE" test_translation_fix.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
scp -i "$PEM_FILE" test_fast_translation_simple.py "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"

echo "✅ Upload completed!"
echo ""
echo "🔗 Connect to EC2:"
echo "ssh -i \"$PEM_FILE\" $EC2_USER@$EC2_HOST"
echo ""
echo "📁 Files uploaded to: $REMOTE_DIR" 