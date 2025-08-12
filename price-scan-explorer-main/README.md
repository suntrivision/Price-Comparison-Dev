# 🚀 Price Scan Explorer - Ollama Product Matching System

A sophisticated product matching system that leverages Ollama for translation and similarity analysis, storing results in ChromaDB for high-performance vector search.

## 🌟 Features

- **AI-Powered Translation**: Uses Ollama with phi3:mini for fast Malay-to-English translation
- **Vector Similarity Matching**: ChromaDB integration for semantic product matching
- **Batch Processing**: Efficient batch translation with caching and retry logic
- **Multi-Marketplace Support**: Lotus and Shopee product comparison
- **Performance Optimization**: Test mode for development, full mode for production
- **Cloud Deployment Ready**: AWS EC2 deployment scripts and guides

## 🏗️ Architecture

### Core Components
- `matchfuzzy_ollama_persistent.py` - ChromaDB setup and data population
- `matchfuzzy_ollama.py` - Product matching and scoring engine
- `fast_translation.py` - High-performance translation with caching
- `ollama_config.py` - Centralized configuration management

### Data Flow
1. **Setup Phase**: Run `matchfuzzy_ollama_persistent.py` to populate ChromaDB
2. **Matching Phase**: Run `matchfuzzy_ollama.py` for product matching
3. **Output**: CSV files with matched products and similarity scores

## 🎯 Branching Strategy

```
main (production)
├── develop (development)
│   ├── feature/ollama-product-matching-system ← Current
│   ├── feature/ui-enhancements
│   └── feature/performance-optimization
└── hotfix/critical-bug-fix
```

### Branch Types
- **`main`** - Production-ready code, stable releases
- **`develop`** - Integration branch for features
- **`feature/*`** - Short-lived feature development branches
- **`hotfix/*`** - Critical production bug fixes

### Workflow
1. Create feature branch from `develop`
2. Develop and test features
3. Merge feature branch to `develop`
4. Merge `develop` to `main` for releases
5. Create hotfix branches from `main` if needed

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Ollama server running locally
- Required models: `phi3:mini`, `nomic-embed-text`

### Installation
```bash
# Clone the repository
git clone https://github.com/suntrivision/price-scan-explorer-main.git
cd price-scan-explorer-main

# Install dependencies
pip install -r requirements_ollama.txt
pip install -r requirements_chromadb.txt

# Start Ollama server
ollama serve
```

### Setup Models
```bash
# Install required models
ollama pull phi3:mini
ollama pull nomic-embed-text
```

### Run Product Matching
```bash
# Step 1: Setup ChromaDB (one-time)
python src/components/product/marketplace/matchfuzzy_ollama_persistent.py

# Step 2: Run matching
python src/components/product/marketplace/matchfuzzy_ollama.py
```

## 🔧 Configuration

### Ollama Settings (`ollama_config.py`)
```python
OLLAMA_BASE_URL = "http://localhost:11434"
TRANSLATION_MODEL = "phi3:mini"  # Fast translation
EMBEDDING_MODEL = "nomic-embed-text"  # Vector embeddings
LLM_MODEL = "llama3.1:8b"  # LLM analysis
```

### Test Mode
Set `TEST_MODE = True` in scripts to limit processing to 20 products for faster development.

## 📊 Performance

- **Translation Speed**: 3-5x faster with batch processing
- **Caching**: 1000x faster for repeated translations
- **Memory Usage**: 50% reduction with phi3:mini
- **Processing**: Handles 1000+ products efficiently

## 🚀 Deployment

### Local Development
```bash
git checkout develop
git checkout -b feature/your-feature
# Develop your feature
git add . && git commit -m "feat: your feature description"
git push origin feature/your-feature
# Create Pull Request to develop
```

### Production Release
```bash
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

### AWS EC2 Deployment
See `aws_deployment_guide.md` and `setup_ec2_ollama_complete.sh` for complete EC2 setup.

## 🧪 Testing

### Test Scripts
- `quick_model_check.py` - Verify Ollama models
- `test_20_products.py` - Test with limited dataset
- `test_fast_translation_simple.py` - Translation testing

### Run Tests
```bash
python src/components/product/marketplace/quick_model_check.py
python src/components/product/marketplace/test_20_products.py
```

## 📁 Project Structure

```
price-scan-explorer-main/
├── src/components/product/marketplace/
│   ├── matchfuzzy_ollama.py          # Main matching engine
│   ├── matchfuzzy_ollama_persistent.py # ChromaDB setup
│   ├── fast_translation.py           # Translation system
│   ├── ollama_config.py              # Configuration
│   └── test_*.py                     # Test scripts
├── aws_*.sh                          # AWS deployment scripts
├── requirements_*.txt                 # Dependencies
└── README.md                          # This file
```

## 🔍 Troubleshooting

### Common Issues
1. **Translation Timeouts**: Check Ollama server and model availability
2. **404 Errors**: Verify API endpoints and model names
3. **Memory Issues**: Use `phi3:mini` for translation, `nomic-embed-text` for embeddings

### Debug Commands
```bash
# Check Ollama status
ollama list

# Test connection
python src/components/product/marketplace/quick_model_check.py

# Monitor progress
python src/components/product/marketplace/monitor_progress.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Add tests if applicable
5. Submit a Pull Request to `develop`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review test scripts for examples
- Check Ollama server status
- Verify model availability

---

**🚀 Ready to revolutionize product matching with AI!**
