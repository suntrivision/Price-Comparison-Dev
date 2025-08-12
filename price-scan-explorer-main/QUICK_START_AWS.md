# 🚀 Quick Start: AWS EC2 Setup for Ollama Product Matching

## 📋 Prerequisites

1. **AWS Account** with billing enabled
2. **AWS CLI** installed and configured
3. **SSH Key Pair** created in AWS Console
4. **Git** installed locally

## ⚡ 5-Minute Setup

### Step 1: Prepare Your Environment

```bash
# Clone the repository
git clone https://github.com/your-repo/price-scan-explorer-main.git
cd price-scan-explorer-main

# Make scripts executable
chmod +x aws_ec2_launch.sh
chmod +x setup_aws_ollama.sh
```

### Step 2: Configure AWS Settings

```bash
# Edit the configuration file
nano aws_config.env

# Update these REQUIRED values:
KEY_NAME=your-actual-key-pair-name  # Create this in AWS Console
AWS_REGION=ap-southeast-1           # Your preferred region
```

### Step 3: Launch EC2 Instance

```bash
# Run the launch script
./aws_ec2_launch.sh
```

**What this does:**
- ✅ Creates security group with necessary ports
- ✅ Sets up IAM role for S3 access
- ✅ Launches r6i.xlarge instance (32GB RAM)
- ✅ Installs Ollama + all dependencies
- ✅ Downloads models (nomic-embed-text + llama3.1:8b)
- ✅ Configures monitoring and health checks

### Step 4: Monitor Setup Progress

```bash
# The script will show you the instance IP
# Wait 15-20 minutes for setup to complete

# Check setup status (replace with your instance IP)
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP
/home/ubuntu/monitor_ollama.sh
```

### Step 5: Start Product Matching

```bash
# Connect to your instance
ssh -i your-key.pem ubuntu@YOUR_INSTANCE_IP

# Run health check
/home/ubuntu/health_check.sh

# Start product matching
/home/ubuntu/start_product_matching.sh
```

## 🎯 Expected Results

After setup, you'll have:

- **EC2 Instance**: r6i.xlarge with 32GB RAM
- **Ollama Models**: nomic-embed-text (1.5GB) + llama3.1:8b (8GB)
- **ChromaDB**: Vector database for semantic matching
- **Python Environment**: All dependencies installed
- **Monitoring**: Health checks and system monitoring
- **S3 Integration**: Direct access to your prodpromo bucket

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **Setup Time** | 15-20 minutes |
| **Model Download** | 10-15 minutes |
| **Processing Speed** | 5-15 minutes for 60k products |
| **Monthly Cost** | ~$190 |
| **Uptime** | 99.9% |

## 🔧 Management Commands

### Instance Management
```bash
# Stop instance (save costs)
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Start instance
aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID

# Terminate instance (permanent)
aws ec2 terminate-instances --instance-ids YOUR_INSTANCE_ID
```

### Service Management
```bash
# Check Ollama status
sudo systemctl status ollama

# Restart Ollama
sudo systemctl restart ollama

# View logs
sudo journalctl -u ollama -f
```

### Application Management
```bash
# Monitor system
/home/ubuntu/monitor_ollama.sh

# Health check
/home/ubuntu/health_check.sh

# Start matching
/home/ubuntu/start_product_matching.sh
```

## 🛠️ Troubleshooting

### Common Issues

1. **Setup Taking Too Long**
   ```bash
   # Check setup logs
   sudo journalctl -u cloud-init -f
   ```

2. **Ollama Not Responding**
   ```bash
   # Restart Ollama service
   sudo systemctl restart ollama
   sleep 30
   curl http://localhost:11434/api/tags
   ```

3. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   
   # Restart with more memory
   sudo systemctl restart ollama
   ```

4. **S3 Access Issues**
   ```bash
   # Test S3 access
   aws s3 ls s3://prodpromo/
   ```

### Getting Help

```bash
# View all logs
sudo journalctl -u ollama -f
sudo journalctl -u cloud-init -f

# Check system resources
htop
df -h
free -h

# Test Ollama API
curl http://localhost:11434/api/tags
```

## 💰 Cost Optimization

### Development Mode
```bash
# Use smaller instance for development
INSTANCE_TYPE=t3.xlarge  # ~$120/month
```

### Production Mode
```bash
# Use recommended instance for production
INSTANCE_TYPE=r6i.xlarge  # ~$180/month
```

### Auto-Shutdown (Save Costs)
```bash
# Enable auto-shutdown when idle
ENABLE_AUTO_SHUTDOWN=true
IDLE_TIMEOUT_HOURS=2
```

## 🔒 Security Best Practices

1. **Restrict SSH Access**
   ```bash
   # Update security group to your IP only
   ALLOW_SSH_FROM=YOUR_IP/32
   ```

2. **Use IAM Roles** (already configured)
3. **Enable CloudWatch Monitoring**
4. **Regular Backups** (already configured)

## 📈 Scaling Options

### Vertical Scaling (More Power)
```bash
# Upgrade to larger instance
INSTANCE_TYPE=r6i.2xlarge  # 64GB RAM, ~$360/month
```

### Horizontal Scaling (Multiple Instances)
```bash
# Launch multiple instances
./aws_ec2_launch.sh  # Instance 1
./aws_ec2_launch.sh  # Instance 2
```

## 🎉 Success Checklist

- [ ] EC2 instance launched successfully
- [ ] Ollama models downloaded (nomic-embed-text + llama3.1:8b)
- [ ] Health check passes: `/home/ubuntu/health_check.sh`
- [ ] Product matching script runs: `/home/ubuntu/start_product_matching.sh`
- [ ] Results uploaded to S3: `s3://prodpromo/thunderbitscrape/`
- [ ] Monitoring working: `/home/ubuntu/monitor_ollama.sh`

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `sudo journalctl -u ollama -f`
3. Run health check: `/home/ubuntu/health_check.sh`
4. Check system resources: `htop`, `free -h`, `df -h`

---

**🎯 You're all set! Your AWS EC2 instance is ready for Ollama-powered product matching.** 