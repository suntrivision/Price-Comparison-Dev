#!/bin/bash
# WSL EC2 Mount Setup

echo "🚀 Setting up WSL EC2 mount..."

# Configuration
EC2_HOST="ec2-13-215-51-84.ap-southeast-1.compute.amazonaws.com"
EC2_USER="ubuntu"
PEM_FILE="/mnt/c/Y3pricescanner/Price-scan-explorer-main-ver2/price-scan-explorer-main/src/components/product/marketplace/ollama-product-matcher.pem"
LOCAL_MOUNT="/mnt/c/EC2-Mount"
REMOTE_DIR="/home/ubuntu/price-scanner"

# Create mount directory
echo "📁 Creating mount directory..."
mkdir -p "$LOCAL_MOUNT"

# Set correct permissions for PEM file
echo "🔐 Setting PEM file permissions..."
chmod 600 "$PEM_FILE"

# Mount using SSHFS
echo "🔗 Mounting EC2 directory..."
sshfs -o IdentityFile="$PEM_FILE" "$EC2_USER@$EC2_HOST:$REMOTE_DIR" "$LOCAL_MOUNT"

if [ $? -eq 0 ]; then
    echo "✅ Successfully mounted EC2 to $LOCAL_MOUNT"
    echo ""
    echo "📂 You can now access EC2 files at: $LOCAL_MOUNT"
    echo "🌐 Windows path: C:\EC2-Mount"
    echo ""
    echo "🔧 To unmount: fusermount -u $LOCAL_MOUNT"
else
    echo "❌ Failed to mount EC2 directory"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Install SSHFS: sudo apt install sshfs"
    echo "2. Check PEM file: $PEM_FILE"
    echo "3. Test connection: ssh -i '$PEM_FILE' $EC2_USER@$EC2_HOST"
fi 