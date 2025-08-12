#!/usr/bin/env python3
"""
AWS ChromaDB Setup Script
This script sets up ChromaDB on your AWS EC2 instance
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def run_command(command, description=""):
    """Run a shell command and handle errors"""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Success")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed")
        print(f"Error: {e.stderr}")
        return None

def check_docker():
    """Check if Docker is installed and running"""
    print("🔍 Checking Docker installation...")
    
    # Check if Docker is installed
    result = run_command("docker --version", "Checking Docker version")
    if not result:
        print("📦 Installing Docker...")
        run_command("curl -fsSL https://get.docker.com -o get-docker.sh", "Downloading Docker install script")
        run_command("sudo sh get-docker.sh", "Installing Docker")
        run_command("sudo usermod -aG docker $USER", "Adding user to docker group")
        print("🔄 Please log out and log back in for Docker group changes to take effect")
        return False
    
    # Check if Docker daemon is running
    result = run_command("sudo systemctl is-active docker", "Checking Docker daemon")
    if result and "active" in result:
        print("✅ Docker is running")
        return True
    else:
        print("🚀 Starting Docker daemon...")
        run_command("sudo systemctl start docker", "Starting Docker")
        run_command("sudo systemctl enable docker", "Enabling Docker auto-start")
        return True

def check_docker_compose():
    """Check if Docker Compose is installed"""
    print("🔍 Checking Docker Compose...")
    
    result = run_command("docker-compose --version", "Checking Docker Compose version")
    if not result:
        print("📦 Installing Docker Compose...")
        run_command(
            "sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
            "Downloading Docker Compose"
        )
        run_command("sudo chmod +x /usr/local/bin/docker-compose", "Making Docker Compose executable")
        return True
    return True

def create_chromadb_project():
    """Create the ChromaDB project directory and files"""
    print("📁 Creating ChromaDB project structure...")
    
    # Create project directory
    project_dir = Path.home() / "chromadb-project"
    project_dir.mkdir(exist_ok=True)
    os.chdir(project_dir)
    
    # Create docker-compose.yml
    docker_compose_content = '''version: '3.8'

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
'''
    
    with open("docker-compose.yml", "w") as f:
        f.write(docker_compose_content)
    
    # Create nginx configuration
    nginx_content = '''events {
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
'''
    
    with open("nginx.conf", "w") as f:
        f.write(nginx_content)
    
    # Create SSL directory
    (project_dir / "ssl").mkdir(exist_ok=True)
    
    # Create startup script
    startup_script = '''#!/bin/bash

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
'''
    
    with open("start_chromadb.sh", "w") as f:
        f.write(startup_script)
    
    run_command("chmod +x start_chromadb.sh", "Making startup script executable")
    
    print(f"✅ Project created at: {project_dir}")
    return project_dir

def create_systemd_service():
    """Create systemd service for auto-start"""
    print("🔧 Creating systemd service...")
    
    service_content = f"""[Unit]
Description=ChromaDB Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory={Path.home()}/chromadb-project
ExecStart={Path.home()}/chromadb-project/start_chromadb.sh
ExecStop=/usr/local/bin/docker-compose down
User={os.getenv('USER', 'ubuntu')}
Group={os.getenv('USER', 'ubuntu')}

[Install]
WantedBy=multi-user.target
"""
    
    with open("/tmp/chromadb.service", "w") as f:
        f.write(service_content)
    
    run_command("sudo cp /tmp/chromadb.service /etc/systemd/system/", "Copying service file")
    run_command("sudo systemctl daemon-reload", "Reloading systemd")
    run_command("sudo systemctl enable chromadb.service", "Enabling service")
    
    print("✅ Systemd service created")

def start_chromadb():
    """Start ChromaDB services"""
    print("🚀 Starting ChromaDB services...")
    
    project_dir = Path.home() / "chromadb-project"
    os.chdir(project_dir)
    
    # Start services
    run_command("docker-compose up -d", "Starting Docker services")
    
    # Wait for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(30)
    
    # Check if ChromaDB is running
    try:
        response = requests.get("http://localhost:8000/api/v1/heartbeat", timeout=10)
        if response.status_code == 200:
            print("✅ ChromaDB is running successfully!")
            
            # Get public IP
            try:
                public_ip = requests.get("http://169.254.169.254/latest/meta-data/public-ipv4", timeout=5).text
                print(f"🌐 Access ChromaDB at: http://{public_ip}")
                print(f"🔧 API endpoint: http://{public_ip}:8000")
            except:
                print("🌐 ChromaDB is running on localhost:8000")
            
            return True
        else:
            print(f"❌ ChromaDB health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ ChromaDB health check failed: {e}")
        return False

def install_python_dependencies():
    """Install Python dependencies"""
    print("🐍 Installing Python dependencies...")
    
    dependencies = [
        "chromadb",
        "requests",
        "pandas",
        "boto3",
        "flask"
    ]
    
    for dep in dependencies:
        run_command(f"pip3 install {dep}", f"Installing {dep}")

def main():
    """Main setup function"""
    print("🚀 AWS ChromaDB Setup")
    print("=" * 50)
    
    # Check and install Docker
    if not check_docker():
        print("❌ Docker setup failed. Please log out and log back in, then run this script again.")
        return False
    
    # Check and install Docker Compose
    if not check_docker_compose():
        print("❌ Docker Compose setup failed.")
        return False
    
    # Create project structure
    project_dir = create_chromadb_project()
    
    # Create systemd service
    create_systemd_service()
    
    # Install Python dependencies
    install_python_dependencies()
    
    # Start ChromaDB
    if start_chromadb():
        print("\n🎉 ChromaDB setup complete!")
        print("\n📋 Next steps:")
        print("1. Configure your security group to allow ports 80, 443, and 8000")
        print("2. Update your application to use the ChromaDB server URL")
        print("3. Run your data population script")
        print("\n📁 Data will be stored in: ~/chromadb-project/chroma_data/")
        print("🔄 Service will auto-start on boot")
        return True
    else:
        print("\n❌ ChromaDB setup failed. Check the logs above for errors.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 