#!/bin/bash
# AWS Ollama Setup Script
# This script installs and configures Ollama for product matching on AWS EC2

set -e  # Exit on any error

echo "🚀 Starting AWS Ollama Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
echo "🔧 Installing system dependencies..."
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
    lsb-release

# Install Docker (optional, for containerized deployment)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Add Ollama to PATH
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /home/ubuntu/price-scanner
cd /home/ubuntu/price-scanner

# Clone repository (replace with your actual repo)
echo "📥 Cloning repository..."
git clone https://github.com/your-repo/price-scan-explorer-main.git || {
    echo "⚠️  Could not clone repository. Creating directory structure..."
    mkdir -p price-scan-explorer-main/src/components/product/marketplace
}

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install --upgrade pip
pip3 install pandas boto3 chromadb requests numpy sentence-transformers

# Create requirements file
cat > requirements_ollama.txt << EOF
pandas>=1.5.0
boto3>=1.26.0
chromadb>=0.4.0
requests>=2.28.0
numpy>=1.21.0
sentence-transformers>=2.2.0
EOF

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to start..."
sleep 30

# Pull required models
echo "📥 Pulling Ollama models..."
echo "Downloading nomic-embed-text (1.5GB)..."
ollama pull nomic-embed-text

echo "Downloading llama3.1:8b (8GB)..."
ollama pull llama3.1:8b

# Verify installation
echo "✅ Verifying installation..."
ollama list

# Test Ollama API
echo "🧪 Testing Ollama API..."
curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama API is working" || echo "❌ Ollama API test failed"

# Create systemd service for Ollama (optional)
echo "🔧 Creating systemd service for Ollama..."
sudo tee /etc/systemd/system/ollama.service > /dev/null << EOF
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

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > /home/ubuntu/monitor_ollama.sh << 'EOF'
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
EOF

chmod +x /home/ubuntu/monitor_ollama.sh

# Create startup script
echo "🚀 Creating startup script..."
cat > /home/ubuntu/start_product_matching.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/price-scanner/price-scan-explorer-main

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

chmod +x /home/ubuntu/start_product_matching.sh

# Configure AWS CLI (if credentials are provided)
if [ ! -z "$AWS_ACCESS_KEY_ID" ] && [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "🔑 Configuring AWS CLI..."
    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    aws configure set default.region ap-southeast-1
    aws configure set default.output json
fi

# Create log directory
mkdir -p /home/ubuntu/logs

# Set up log rotation
sudo tee /etc/logrotate.d/ollama > /dev/null << EOF
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
echo "📝 Creating environment configuration..."
cat > /home/ubuntu/.env << EOF
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

# Set permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/price-scanner
sudo chown -R ubuntu:ubuntu /home/ubuntu/.ollama

# Create health check script
echo "🏥 Creating health check script..."
cat > /home/ubuntu/health_check.sh << 'EOF'
#!/bin/bash
# Health check for Ollama service

# Check if Ollama service is running
if ! systemctl is-active --quiet ollama; then
    echo "❌ Ollama service is not running"
    exit 1
fi

# Check if API is responding
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama API is not responding"
    exit 1
fi

# Check if models are available
if ! ollama list | grep -q "nomic-embed-text"; then
    echo "❌ nomic-embed-text model not found"
    exit 1
fi

if ! ollama list | grep -q "llama3.1:8b"; then
    echo "❌ llama3.1:8b model not found"
    exit 1
fi

echo "✅ All health checks passed"
exit 0
EOF

chmod +x /home/ubuntu/health_check.sh

# Run health check
echo "🏥 Running health check..."
/home/ubuntu/health_check.sh

# Display final status
echo ""
echo "🎉 AWS Ollama Setup Complete!"
echo ""
echo "📊 System Information:"
echo "   - Ollama Version: $(ollama --version)"
echo "   - Python Version: $(python3 --version)"
echo "   - Available Models:"
ollama list
echo ""
echo "📁 Directory Structure:"
echo "   - Application: /home/ubuntu/price-scanner/"
echo "   - Ollama Models: /home/ubuntu/.ollama/models/"
echo "   - Logs: /home/ubuntu/logs/"
echo ""
echo "🚀 Quick Start Commands:"
echo "   - Monitor: /home/ubuntu/monitor_ollama.sh"
echo "   - Health Check: /home/ubuntu/health_check.sh"
echo "   - Start Matching: /home/ubuntu/start_product_matching.sh"
echo ""
echo "🔧 Service Management:"
echo "   - Start: sudo systemctl start ollama"
echo "   - Stop: sudo systemctl stop ollama"
echo "   - Status: sudo systemctl status ollama"
echo "   - Logs: sudo journalctl -u ollama -f"
echo ""
echo "📈 Monitoring:"
echo "   - CPU: htop"
echo "   - Memory: free -h"
echo "   - Disk: df -h"
echo "   - Ollama API: curl http://localhost:11434/api/tags"
echo ""

# Save setup completion timestamp
echo "$(date): AWS Ollama setup completed successfully" >> /home/ubuntu/logs/setup.log

echo "✅ Setup completed successfully!" 