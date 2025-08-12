# 🚀 Cursor Remote Development Setup

## Step 1: Install Remote SSH Extension
1. Open Cursor
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Remote - SSH"
4. Install the extension

## Step 2: Configure SSH Connection
1. Press `Ctrl+Shift+P` to open Command Palette
2. Type: `Remote-SSH: Connect to Host`
3. Select "Add New SSH Host"
4. Enter your connection string:
   ```
   ssh -i "ollama-product-matcher.pem" ubuntu@ec2-13-215-51-84.ap-southeast-1.compute.amazonaws.com
   ```

## Step 3: Connect to EC2
1. Press `Ctrl+Shift+P`
2. Type: `Remote-SSH: Connect to Host`
3. Select your EC2 connection
4. Choose platform: Linux
5. Enter password if prompted (usually not needed with PEM)

## Step 4: Open Remote Folder
1. Once connected, press `Ctrl+Shift+P`
2. Type: `Remote-SSH: Open Folder`
3. Navigate to: `/home/ubuntu/price-scanner`
4. Click "OK"

## Benefits:
- ✅ Edit files directly on EC2
- ✅ Integrated terminal on EC2
- ✅ Run scripts directly
- ✅ Debug on remote server
- ✅ File sync is automatic

## Quick Commands:
- **Open Terminal**: Ctrl+`
- **Open File**: Ctrl+P
- **Command Palette**: Ctrl+Shift+P 