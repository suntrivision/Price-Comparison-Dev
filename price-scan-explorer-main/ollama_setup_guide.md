# Ollama Setup Guide for Product Matching

## 📊 Storage Requirements

### Minimum Setup (1.5GB)
- **nomic-embed-text**: 1.5GB (essential for embeddings)

### Recommended Setup (9.5GB)
- **nomic-embed-text**: 1.5GB
- **llama3.1:8b**: 8GB

### Full Setup (13.3GB)
- **nomic-embed-text**: 1.5GB
- **llama3.1:8b**: 8GB
- **phi3:mini**: 3.8GB

## 🖥️ System Requirements

### Minimum
- **RAM**: 8GB
- **Storage**: 2GB free space
- **OS**: Windows 10/11, macOS, or Linux

### Recommended
- **RAM**: 16GB
- **Storage**: 15GB free space
- **GPU**: 8GB VRAM (optional)

### Optimal
- **RAM**: 32GB
- **Storage**: 30GB free space
- **GPU**: 16GB VRAM

## 🚀 Installation Steps

### 1. Install Ollama
```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve
```

### 2. Pull Required Models
```bash
# Essential for embeddings (1.5GB)
ollama pull nomic-embed-text

# Recommended for analysis (8GB)
ollama pull llama3.1:8b

# Optional for speed (3.8GB)
ollama pull phi3:mini
```

### 3. Install Python Dependencies
```bash
pip install -r requirements_ollama.txt
```

### 4. Verify Installation
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test embedding generation
python -c "
import requests
response = requests.post('http://localhost:11434/api/embeddings', 
                        json={'model': 'nomic-embed-text', 'prompt': 'test'})
print('Embedding test:', 'SUCCESS' if response.status_code == 200 else 'FAILED')
"
```

## 📁 Storage Locations

### Ollama Models (Default)
- **Windows**: `C:\Users\<username>\.ollama\models`
- **macOS**: `~/.ollama/models`
- **Linux**: `~/.ollama/models`

### ChromaDB Database
- **Project Directory**: `./chroma_db_ollama/`
- **Size**: ~260MB for 60,000 products

## 🔧 Performance Optimization

### For Large Datasets (>100k products)
```bash
# Use larger model for better accuracy
ollama pull llama3.1:70b  # 70GB (requires 32GB+ RAM)

# Or use faster model for speed
ollama pull phi3:mini     # 3.8GB (faster inference)
```

### Memory Optimization
```bash
# Set environment variables for better performance
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
export OLLAMA_MODELS=~/.ollama/models
```

## 📊 Expected Performance

### Processing Speed
- **Small dataset** (<10k products): 2-5 minutes
- **Medium dataset** (10k-50k products): 5-15 minutes
- **Large dataset** (>50k products): 15-60 minutes

### Memory Usage
- **nomic-embed-text**: 2GB RAM
- **llama3.1:8b**: 8GB RAM
- **ChromaDB**: 1GB RAM
- **Total**: 11GB RAM (recommended 16GB)

### Storage Growth
- **Per 10k products**: +50MB ChromaDB storage
- **Model updates**: +1-2GB per model update
- **Logs**: +100MB per month

## 🛠️ Troubleshooting

### Common Issues
1. **Out of Memory**: Reduce batch size or use smaller model
2. **Slow Processing**: Use GPU or smaller model
3. **Model Not Found**: Check if model is downloaded with `ollama list`

### Monitoring Commands
```bash
# Check model status
ollama list

# Monitor system resources
htop  # or Task Manager on Windows

# Check ChromaDB size
du -sh ./chroma_db_ollama/
```

## 💡 Tips for Production

1. **Start with minimum setup** (nomic-embed-text only)
2. **Scale up** based on performance needs
3. **Monitor storage** and clean up old models
4. **Use SSD** for faster ChromaDB operations
5. **Backup models** to external storage 