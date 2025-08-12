# 🚀 Quick Reference Card - Price Scan Explorer

## ⚡ Essential Commands

### **Project Setup**
```bash
# Clone & setup
git clone https://github.com/suntrivision/Price-Comparison-Dev.git
cd Price-Comparison-Dev
npm install
pip install -r price-scan-explorer-main/requirements_ollama.txt

# Start development
npm run dev                    # Frontend (http://localhost:5173)
ollama serve                   # AI backend
```

### **AI Models (Ollama)**
```bash
# Install required models
ollama pull phi3:mini         # Fast translation
ollama pull nomic-embed-text  # Vector embeddings
ollama pull llama3.1:8b       # LLM analysis

# Check models
ollama list
```

### **Product Matching**
```bash
# Setup database (one-time)
python matchfuzzy_ollama_persistent.py

# Run matching
python matchfuzzy_ollama.py

# Test with 20 products
python test_20_products.py
```

---

## 🔄 Git Workflow

### **Daily Routine**
```bash
git checkout develop           # Start fresh
git pull origin develop        # Get latest changes
git checkout -b feature/name   # Create feature branch
# ... work on your feature ...
git add . && git commit -m "feat: description"
git push origin feature/name   # Push to remote
# Create PR on GitHub
```

### **Branch Management**
```bash
git branch -a                 # List all branches
git checkout -b feature/name  # Create & switch to feature
git checkout develop          # Switch to develop
git checkout main             # Switch to production
git branch -d feature/name    # Delete local feature branch
```

---

## 🧪 Testing Commands

### **Frontend Testing**
```bash
npm test                      # Run tests
npm run test:coverage         # Coverage report
npm run type-check            # TypeScript check
npm run build                 # Production build
```

### **Backend Testing**
```bash
python quick_model_check.py   # Check Ollama models
python test_translation.py    # Test translation
python test_20_products.py    # Test with limited data
python monitor_progress.py    # Monitor performance
```

---

## 🚀 Deployment

### **Local Development**
```bash
# Frontend
npm run dev                   # http://localhost:5173

# Backend
cd src/components/product/marketplace/
python matchfuzzy_ollama_persistent.py
python matchfuzzy_ollama.py
```

### **AWS EC2**
```bash
./aws_ec2_launch.sh          # Launch instance
./setup_ec2_ollama_complete.sh # Setup Ollama
./deploy_to_ec2.sh           # Deploy app
```

---

## 🔧 Configuration

### **Environment Variables**
```bash
# .env file
OLLAMA_BASE_URL=http://localhost:11434
TRANSLATION_MODEL=phi3:mini
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.1:8b
```

### **Test Mode (Faster Development)**
```python
# In Python scripts
TEST_MODE = True              # Limit to 20 products
MAX_TEST_PRODUCTS = 20        # Adjust limit
```

---

## 📁 Key Files

### **Core Components**
- `matchfuzzy_ollama.py` - Main matching engine
- `matchfuzzy_ollama_persistent.py` - Database setup
- `fast_translation.py` - Translation system
- `ollama_config.py` - Configuration

### **Frontend**
- `PriceComparisonTable.tsx` - Main interface
- `ComparisonTableTab.tsx` - Tab view
- `SmartComparison.tsx` - AI logic

### **Documentation**
- `README.md` - Project overview
- `TEAM_ONBOARDING_GUIDE.md` - Complete guide
- `README_CLOUD_SETUP.md` - Cloud deployment

---

## 🚨 Troubleshooting

### **Common Issues**
```bash
# Ollama not responding
ollama serve                   # Restart server
ollama list                    # Check models

# Translation timeouts
# Increase REQUEST_TIMEOUT in ollama_config.py

# ChromaDB errors
rm -rf chroma_db_ollama/      # Clear database
python matchfuzzy_ollama_persistent.py  # Reinitialize

# Frontend build issues
rm -rf node_modules/          # Clear dependencies
npm install                    # Reinstall
```

### **Debug Commands**
```bash
python check_status.py         # System status
python test_ollama_connection.py  # Connection test
python performance_comparison.py   # Performance metrics
```

---

## 📊 Performance Tips

### **Optimization**
- Use `TEST_MODE = True` for development
- Set `BATCH_SIZE = 3` for stable translation
- Use `phi3:mini` for faster translation
- Enable caching in `fast_translation.py`

### **Monitoring**
```bash
python monitor_progress.py    # Real-time progress
python performance_comparison.py  # Benchmark results
```

---

## 🎯 Quick Tasks

### **Add New Product Field**
1. Update TypeScript interfaces
2. Modify Python data processing
3. Add to UI components
4. Test with sample data

### **Modify Translation**
1. Edit `fast_translation.py`
2. Test with `test_translation.py`
3. Update configuration
4. Deploy and verify

### **New Marketplace**
1. Add data processing logic
2. Extend matching algorithms
3. Create UI components
4. Test integration

---

## 📞 Getting Help

### **When Stuck**
1. Check this reference card
2. Read `TEAM_ONBOARDING_GUIDE.md`
3. Search GitHub issues
4. Ask team in chat
5. Create detailed issue

### **Team Resources**
- **GitHub**: Issues and PRs
- **Documentation**: Keep updated
- **Code Review**: Peer feedback
- **Daily Standups**: Quick questions

---

**💡 Pro Tip**: Bookmark this card and keep it handy during development!

*Last updated: January 2025*
