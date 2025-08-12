# Cloud-Based Ollama Setup for Product Matching

This guide will help you set up cloud-based processing using Ollama on EC2 instead of running locally.

## Prerequisites

1. **EC2 Instance** with sufficient resources:
   - **Recommended**: t3.xlarge or larger (4+ vCPUs, 16+ GB RAM)
   - **Storage**: At least 50GB for models
   - **Security Group**: Allow inbound traffic on port 11434

2. **Ollama installed on EC2** (see EC2 setup guide)

## Step 1: Configure Your EC2 Connection

Edit the `ollama_config.py` file with your EC2 instance details:

```python
# Replace with your actual EC2 details
OLLAMA_HOST = "your-ec2-public-ip.com"  # Your EC2 public IP or domain
OLLAMA_PORT = 11434
OLLAMA_PROTOCOL = "http"  # or "https" if you have SSL
```

**Example:**
```python
OLLAMA_HOST = "ec2-18-123-45-67.ap-southeast-1.compute.amazonaws.com"
OLLAMA_PORT = 11434
OLLAMA_PROTOCOL = "http"
```

## Step 2: Install Required Models on EC2

SSH into your EC2 instance and install the required models:

```bash
# Install embedding model
ollama pull nomic-embed-text

# Install LLM model
ollama pull llama3.1:8b

# Verify models are installed
ollama list
```

## Step 3: Test the Connection

Run the test script to verify everything is working:

```bash
python test_ollama_connection.py
```

You should see:
```
✅ Loaded Ollama config: http://your-ec2-ip:11434
✅ Connection successful!
✅ Embedding successful! Dimension: 768
✅ Generation successful! Response: Hello
🎉 All tests passed!
```

## Step 4: Run the Main Script

Once the connection test passes, you can run the main matching script:

```bash
python matchfuzzy_ollama.py
```

## Troubleshooting

### Connection Issues

1. **Check EC2 Security Group**:
   - Ensure port 11434 is open for inbound traffic
   - Add your IP to the security group if needed

2. **Check Ollama Service**:
   ```bash
   # On EC2, check if Ollama is running
   sudo systemctl status ollama
   
   # Restart if needed
   sudo systemctl restart ollama
   ```

3. **Test from EC2 locally**:
   ```bash
   # On EC2, test if Ollama responds
   curl http://localhost:11434/api/tags
   ```

### Model Issues

1. **Check available models**:
   ```bash
   ollama list
   ```

2. **Pull missing models**:
   ```bash
   ollama pull nomic-embed-text
   ollama pull llama3.1:8b
   ```

### Performance Issues

1. **Increase EC2 instance size** if processing is slow
2. **Monitor EC2 resources**:
   ```bash
   htop
   df -h
   ```

## Security Considerations

1. **Use HTTPS** if exposing to the internet
2. **Restrict access** to your IP only in security groups
3. **Consider using a VPN** for secure access
4. **Monitor costs** - larger instances cost more

## Cost Optimization

1. **Use Spot Instances** for cost savings
2. **Stop instances** when not in use
3. **Choose appropriate instance sizes**
4. **Monitor usage** with AWS CloudWatch

## Next Steps

After successful setup:

1. **Run the matching script** to process your data
2. **Monitor the output** for quality matches
3. **Adjust parameters** in the config if needed
4. **Scale up** if processing large datasets

## Support

If you encounter issues:

1. Check the test script output
2. Verify EC2 instance status
3. Check Ollama logs on EC2
4. Review security group settings 