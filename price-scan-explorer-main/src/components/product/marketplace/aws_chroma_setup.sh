#!/bin/bash

# ChromaDB AWS EC2 Setup Script
# This script sets up ChromaDB on an AWS EC2 instance

echo "🚀 Setting up ChromaDB on AWS EC2..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python and dependencies
echo "🐍 Installing Python and dependencies..."
sudo apt-get install -y python3 python3-pip python3-venv git curl wget

# Install Docker (for ChromaDB server)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
echo "📁 Creating project directory..."
mkdir -p ~/chromadb-project
cd ~/chromadb-project

# Create docker-compose.yml for ChromaDB
echo "📝 Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  chromadb:
    image: chromadb/chroma:latest
    container_name: chromadb-server
    ports:
      - "8000:8000"
    volumes:
      - ./chroma_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
      - CHROMA_SERVER_CORS_ALLOW_ORIGINS=["*"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: chromadb-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - chromadb
    restart: unless-stopped

  redis:
    image: redis:alpine
    container_name: chromadb-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
EOF

# Create nginx configuration
echo "🌐 Creating Nginx configuration..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream chromadb {
        server chromadb:8000;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://chromadb;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Create SSL directory
mkdir -p ssl

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install chromadb requests pandas boto3 flask

# Create startup script
echo "📝 Creating startup script..."
cat > start_chromadb.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting ChromaDB services..."

# Start Docker services
docker-compose up -d

# Wait for ChromaDB to be ready
echo "⏳ Waiting for ChromaDB to start..."
sleep 30

# Check if ChromaDB is running
if curl -f http://localhost:8000/api/v1/heartbeat; then
    echo "✅ ChromaDB is running successfully!"
    echo "🌐 Access ChromaDB at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    echo "🔧 API endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
else
    echo "❌ ChromaDB failed to start"
    exit 1
fi
EOF

chmod +x start_chromadb.sh

# Create systemd service for auto-start
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/chromadb.service > /dev/null << EOF
[Unit]
Description=ChromaDB Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/chromadb-project
ExecStart=/home/ubuntu/chromadb-project/start_chromadb.sh
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl enable chromadb.service
sudo systemctl start chromadb.service

echo "✅ ChromaDB setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your security group to allow ports 80, 443, and 8000"
echo "2. Update your application to use the ChromaDB server URL"
echo "3. Run your data population script"
echo ""
echo "🔗 ChromaDB will be available at:"
echo "   - Web interface: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "   - API endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo ""
echo "📁 Data will be stored in: ./chroma_data/"
echo "🔄 Service will auto-start on boot" 