#!/bin/bash
# Complete EC2 Ollama Setup Script for Product Matching
# Run this script on your EC2 instance after SSH connection

set -e  # Exit on any error

echo "🚀 Starting Complete EC2 Ollama Setup for Product Matching..."
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script should be run as ubuntu user"
    exit 1
fi

# Check system resources
print_status "Checking system resources..."
TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
TOTAL_DISK=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')

print_status "System Resources:"
echo "  - Memory: ${TOTAL_MEM}GB"
echo "  - Available Disk: ${TOTAL_DISK}GB"

if [ "$TOTAL_MEM" -lt 8 ]; then
    print_warning "Memory is less than 8GB. Ollama may run slowly."
fi

if [ "$TOTAL_DISK" -lt 15 ]; then
    print_warning "Available disk space is less than 15GB. Consider expanding storage."
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
print_status "Installing system dependencies..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    tree

# Install Ollama
print_status "Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Add Ollama to PATH
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc

# Verify Ollama installation
if command -v ollama &> /dev/null; then
    print_success "Ollama installed successfully"
    ollama --version
else
    print_error "Ollama installation failed"
    exit 1
fi

# Create application directory
print_status "Setting up application directory..."
mkdir -p ~/price-scanner
cd ~/price-scanner

# Clone or create project structure
if [ -d "price-scan-explorer-main" ]; then
    print_status "Project directory already exists"
else
    print_status "Creating project directory structure..."
    mkdir -p price-scan-explorer-main/src/components/product/marketplace
    mkdir -p price-scan-explorer-main/chroma_db_ollama
fi

cd price-scan-explorer-main

# Create requirements file
print_status "Creating Python requirements file..."
cat > requirements_ollama.txt << 'EOF'
pandas>=1.5.0
boto3>=1.26.0
chromadb>=0.4.0
requests>=2.28.0
numpy>=1.21.0
sentence-transformers>=2.2.0
psutil>=5.8.0
EOF

# Install Python dependencies
print_status "Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install -r requirements_ollama.txt

# Create Ollama configuration
print_status "Creating Ollama configuration..."
cat > src/components/product/marketplace/ollama_config.py << 'EOF'
# Ollama Configuration for EC2 Processing
# Optimized for cloud deployment

# EC2 Ollama Configuration
OLLAMA_HOST = "localhost"
OLLAMA_PORT = 11434
OLLAMA_PROTOCOL = "http"

# Models to use
EMBEDDING_MODEL = "nomic-embed-text"
LLM_MODEL = "llama3.1:8b"

# Connection settings optimized for EC2
REQUEST_TIMEOUT = 120  # Longer timeout for cloud processing
RETRY_ATTEMPTS = 5     # More retries for network stability
RETRY_DELAY = 2        # Longer delay between retries

# API Endpoints
OLLAMA_BASE_URL = f"{OLLAMA_PROTOCOL}://{OLLAMA_HOST}:{OLLAMA_PORT}"
EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"

# Performance settings
BATCH_SIZE = 10        # Process products in batches
DELAY_BETWEEN_BATCHES = 0.5  # Delay between batches
EOF

# Start Ollama service
print_status "Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
print_status "Waiting for Ollama to start..."
sleep 30

# Test Ollama connection
print_status "Testing Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    print_success "Ollama service is running"
else
    print_error "Ollama service failed to start"
    exit 1
fi

# Pull required models
print_status "Downloading Ollama models..."
echo "This may take several minutes depending on your internet connection..."

print_status "Downloading nomic-embed-text (1.5GB)..."
ollama pull nomic-embed-text

print_status "Downloading llama3.1:8b (8GB)..."
ollama pull llama3.1:8b

# Verify models
print_status "Verifying installed models..."
ollama list

# Create systemd service for Ollama
print_status "Creating systemd service for Ollama..."
sudo tee /etc/systemd/system/ollama.service > /dev/null << 'EOF'
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
Environment=PATH=/usr/local/bin:/usr/bin:/bin
WorkingDirectory=/home/ubuntu

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Create monitoring script
print_status "Creating monitoring script..."
cat > ~/monitor_ollama.sh << 'EOF'
#!/bin/bash
echo "=== Ollama Status ==="
systemctl status ollama --no-pager -l
echo ""
echo "=== Available Models ==="
ollama list
echo ""
echo "=== System Resources ==="
free -h
echo ""
df -h
echo ""
echo "=== Ollama API Test ==="
curl -s http://localhost:11434/api/tags | head -20
echo ""
echo "=== Process Status ==="
ps aux | grep ollama
EOF

chmod +x ~/monitor_ollama.sh

# Create startup script
print_status "Creating startup script..."
cat > ~/start_product_matching.sh << 'EOF'
#!/bin/bash
cd ~/price-scanner/price-scan-explorer-main

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Starting Ollama service..."
    sudo systemctl start ollama
    sleep 30
fi

# Run the product matching script
echo "Starting product matching..."
python3 src/components/product/marketplace/matchfuzzy_ollama.py
EOF

chmod +x ~/start_product_matching.sh

# Create test script
print_status "Creating test script..."
cat > ~/test_ollama_setup.py << 'EOF'
#!/usr/bin/env python3
"""
Test script to verify Ollama installation
"""

import requests
import json
import time

def test_ollama_connection():
    """Test if Ollama is running and accessible"""
    print("🔍 Testing Ollama Connection...")
    print("=" * 40)
    
    # Test 1: Check if Ollama service is running
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=10)
        if response.status_code == 200:
            print("✅ Ollama service is running")
            models = response.json().get("models", [])
            print(f"📦 Available models: {len(models)}")
            for model in models:
                print(f"   - {model.get('name', 'Unknown')}")
        else:
            print(f"❌ Ollama service responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama service")
        return False
    except Exception as e:
        print(f"❌ Error connecting to Ollama: {e}")
        return False
    
    # Test 2: Test embedding generation
    print("\n🧪 Testing embedding generation...")
    try:
        embedding_response = requests.post(
            "http://localhost:11434/api/embeddings",
            json={
                "model": "nomic-embed-text",
                "prompt": "test product"
            },
            timeout=60
        )
        
        if embedding_response.status_code == 200:
            embedding = embedding_response.json().get("embedding")
            if embedding and len(embedding) > 0:
                print(f"✅ Embedding generated successfully (dimensions: {len(embedding)})")
            else:
                print("❌ Embedding generation failed - empty response")
                return False
        else:
            print(f"❌ Embedding generation failed with status: {embedding_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return False
    
    # Test 3: Test text generation
    print("\n🤖 Testing text generation...")
    try:
        generation_response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": "Hello, this is a test.",
                "stream": False
            },
            timeout=120
        )
        
        if generation_response.status_code == 200:
            result = generation_response.json()
            print("✅ Text generation successful")
            print(f"   Response: {result.get('response', '')[:100]}...")
        else:
            print(f"❌ Text generation failed with status: {generation_response.status_code}")
    except Exception as e:
        print(f"❌ Error in text generation: {e}")
    
    print("\n🎉 Ollama setup test completed!")
    return True

if __name__ == "__main__":
    test_ollama_connection()
EOF

chmod +x ~/test_ollama_setup.py

# Create log directory
mkdir -p ~/logs

# Set up log rotation
sudo tee /etc/logrotate.d/ollama > /dev/null << 'EOF'
/home/ubuntu/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

# Create environment file
print_status "Creating environment configuration..."
cat > ~/.env << 'EOF'
# Ollama Configuration
OLLAMA_HOST=localhost:11434
OLLAMA_MODELS_PATH=/home/ubuntu/.ollama/models

# AWS Configuration
AWS_DEFAULT_REGION=ap-southeast-1
AWS_S3_BUCKET=prodpromo

# Application Configuration
CHROMA_DB_PATH=/home/ubuntu/price-scanner/chroma_db_ollama
LOG_LEVEL=INFO
EOF

# Final verification
print_status "Performing final verification..."
python3 ~/test_ollama_setup.py

print_success "================================================================"
print_success "🎉 EC2 Ollama Setup Complete!"
print_success "================================================================"
echo ""
print_status "Available commands:"
echo "  - Monitor Ollama: ~/monitor_ollama.sh"
echo "  - Start Product Matching: ~/start_product_matching.sh"
echo "  - Test Setup: python3 ~/test_ollama_setup.py"
echo "  - Check Service: sudo systemctl status ollama"
echo ""
print_status "Next steps:"
echo "  1. Configure AWS credentials if needed"
echo "  2. Upload your product matching script"
echo "  3. Run: ~/start_product_matching.sh"
echo ""
print_status "System resources after setup:"
free -h
df -h
echo ""
print_success "Setup completed successfully! 🚀" 