# 🚀 EC2 Connection & Ollama Setup Guide

## 📋 **Prerequisites**
- Your EC2 instance is running at: `13.250.111.78`
- Your private key file: `ollama-product-matcher.pem`
- SSH client (PowerShell on Windows)

## 🔗 **Step 1: Connect to Your EC2 Instance**

### Option A: Using PowerShell (Recommended for Windows)
```powershell
# Navigate to your project directory
cd C:\Y3pricescanner\Price-scan-explorer-main-ver2

# Connect to EC2 instance
ssh -i ollama-product-matcher.pem ubuntu@13.250.111.78
```

### Option B: Using Windows Terminal/Git Bash
```bash
ssh -i ollama-product-matcher.pem ubuntu@13.250.111.78
```

## 🛠️ **Step 2: Run the Complete Setup Script**

Once connected to your EC2 instance, run:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/setup_ollama_complete.sh | bash
```

**OR** if you prefer to copy the script manually:

```bash
# Create the setup script
nano setup_ollama_complete.sh
# (Paste the script content and save with Ctrl+X, Y, Enter)

# Make it executable and run
chmod +x setup_ollama_complete.sh
./setup_ollama_complete.sh
```

## ⏱️ **Expected Setup Time**
- **System updates**: 5-10 minutes
- **Ollama installation**: 2-3 minutes
- **Model downloads**: 15-30 minutes
  - `nomic-embed-text`: ~1.5GB (5-10 minutes)
  - `llama3.1:8b`: ~8GB (20-30 minutes)
- **Python dependencies**: 2-3 minutes
- **Total setup time**: 25-45 minutes

## 📊 **Step 3: Verify Installation**

After setup completes, verify everything is working:

```bash
# Check Ollama status
/home/ubuntu/health_check.sh

# Monitor system resources
/home/ubuntu/monitor_ollama.sh

# List available models
ollama list
```

## 🚀 **Step 4: Run Product Matching**

Start the Ollama-enhanced product matching:

```bash
# Run the matching script
/home/ubuntu/start_product_matching.sh
```

## 📈 **Step 5: Monitor Progress**

Monitor the matching process:

```bash
# Check system resources
htop

# Monitor Ollama service
sudo systemctl status ollama

# Check logs
sudo journalctl -u ollama -f
```

## 🔧 **Useful Commands**

### Service Management
```bash
# Start Ollama service
sudo systemctl start ollama

# Stop Ollama service
sudo systemctl stop ollama

# Check service status
sudo systemctl status ollama

# View service logs
sudo journalctl -u ollama -f
```

### Model Management
```bash
# List available models
ollama list

# Pull additional models
ollama pull llama3.1:8b

# Remove models
ollama rm llama3.1:8b
```

### System Monitoring
```bash
# Check CPU and memory
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Test Ollama API
curl http://localhost:11434/api/tags
```

## 📁 **Directory Structure**

After setup, your EC2 instance will have:

```
/home/ubuntu/
├── price-scanner/           # Main application directory
│   ├── matchfuzzy_ollama.py # Product matching script
│   └── requirements_ollama.txt
├── monitor_ollama.sh        # Monitoring script
├── health_check.sh          # Health check script
├── start_product_matching.sh # Startup script
└── .ollama/                 # Ollama models and data
    └── models/
        ├── nomic-embed-text/
        └── llama3.1:8b/
```

## 🎯 **Expected Output**

The matching script will:

1. **Load data** from S3: `combined_shopeeLotusFBeCatHORECA12-0.csv`
2. **Preprocess** product names using LLM
3. **Create embeddings** using Nomic Embed model
4. **Perform matching** with LLM analysis
5. **Save results** to S3: `matched_lotus_shopee_ollama_output_08072025.csv`

## 🔍 **Troubleshooting**

### Connection Issues
```bash
# Check if instance is running
aws ec2 describe-instances --instance-ids i-1234567890abcdef0 --query 'Reservations[0].Instances[0].State.Name'

# Check security group allows SSH
aws ec2 describe-security-groups --group-ids sg-1234567890abcdef0
```

### Ollama Issues
```bash
# Restart Ollama service
sudo systemctl restart ollama

# Check Ollama logs
sudo journalctl -u ollama -f

# Test API manually
curl -X POST http://localhost:11434/api/generate -d '{"model":"llama3.1:8b","prompt":"Hello"}'
```

### Memory Issues
```bash
# Check available memory
free -h

# If low memory, consider:
# 1. Stop other services
# 2. Use smaller models
# 3. Increase swap space
```

## 💰 **Cost Optimization**

### Stop Instance When Not in Use
```bash
# From your local machine
aws ec2 stop-instances --instance-ids i-1234567890abcdef0
```

### Start Instance When Needed
```bash
# From your local machine
aws ec2 start-instances --instance-ids i-1234567890abcdef0
```

## 📞 **Support**

If you encounter issues:

1. **Check the logs**: `sudo journalctl -u ollama -f`
2. **Run health check**: `/home/ubuntu/health_check.sh`
3. **Monitor resources**: `htop`
4. **Restart services**: `sudo systemctl restart ollama`

## 🎉 **Success Indicators**

Setup is complete when you see:

✅ Ollama service is running  
✅ Both models are downloaded  
✅ Health check passes  
✅ Product matching script runs successfully  
✅ Results are saved to S3  

---

**Happy matching! 🚀** 