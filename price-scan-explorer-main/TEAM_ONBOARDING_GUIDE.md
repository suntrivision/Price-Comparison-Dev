# 🚀 Team Onboarding Guide - Price Scan Explorer

Welcome to the team! This guide will help you get up and running with the Price Scan Explorer codebase in under 30 minutes.

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Project Overview](#project-overview)
3. [Development Environment Setup](#development-environment-setup)
4. [Codebase Architecture](#codebase-architecture)
5. [Development Workflow](#development-workflow)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)
8. [Team Communication](#team-communication)

---

## 🚀 Quick Start (5 minutes)

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/suntrivision/Price-Comparison-Dev.git
cd Price-Comparison-Dev
```

### **Step 2: Install Dependencies**
```bash
# Frontend (React/TypeScript)
npm install

# Backend (Python)
pip install -r price-scan-explorer-main/requirements_ollama.txt
pip install -r price-scan-explorer-main/requirements_chromadb.txt
```

### **Step 3: Start Development**
```bash
# Frontend
npm run dev

# Backend (in new terminal)
cd price-scan-explorer-main/src/components/product/marketplace
python matchfuzzy_ollama_persistent.py
```

**🎯 You're now ready to develop!**

---

## 🎯 Project Overview

### **What We're Building**
A sophisticated product matching system that compares products across different marketplaces (Lotus, Shopee) using AI-powered translation and vector similarity matching.

### **Key Technologies**
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python + Ollama (AI) + ChromaDB (Vector Database)
- **Cloud**: AWS EC2 deployment ready
- **AI Models**: phi3:mini (translation), nomic-embed-text (embeddings)

### **Business Value**
- **Automated Product Matching**: 90%+ accuracy in matching products across marketplaces
- **Price Comparison**: Real-time price analysis and optimization
- **AI Translation**: Malay-to-English product name translation
- **Scalable Architecture**: Handles 1000+ products efficiently

---

## 🛠️ Development Environment Setup

### **Prerequisites**
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (Recommended) with extensions:
  - Python
  - TypeScript and JavaScript
  - Tailwind CSS IntelliSense
  - GitLens

### **Ollama Setup (AI Backend)**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama server
ollama serve

# Install required AI models
ollama pull phi3:mini
ollama pull nomic-embed-text
ollama pull llama3.1:8b
```

### **Environment Variables**
Create `.env` file in project root:
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
TRANSLATION_MODEL=phi3:mini
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=llama3.1:8b

# AWS Configuration (for deployment)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-southeast-1
```

---

## 🏗️ Codebase Architecture

### **Project Structure**
```
Price-Comparison-Dev/
├── price-scan-explorer-main/          # Main application
│   ├── src/                          # Frontend source
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page components
│   │   └── hooks/                    # Custom React hooks
│   ├── src/components/product/marketplace/  # Backend logic
│   │   ├── matchfuzzy_ollama.py     # Main matching engine
│   │   ├── matchfuzzy_ollama_persistent.py # Database setup
│   │   ├── fast_translation.py       # Translation system
│   │   └── ollama_config.py          # Configuration
│   └── requirements_*.txt            # Python dependencies
├── aws_*.sh                          # AWS deployment scripts
└── README.md                          # Project documentation
```

### **Core Components**

#### **1. Frontend (React/TypeScript)**
- **`PriceComparisonTable.tsx`**: Main product comparison interface
- **`ComparisonTableTab.tsx`**: Tab-based comparison view
- **`MarketComparisonTab.tsx`**: Marketplace-specific views
- **`SmartComparison.tsx`**: AI-enhanced comparison logic

#### **2. Backend (Python/Ollama)**
- **`matchfuzzy_ollama.py`**: Product matching and scoring engine
- **`matchfuzzy_ollama_persistent.py`**: ChromaDB setup and data population
- **`fast_translation.py`**: High-performance translation with caching
- **`ollama_config.py`**: Centralized configuration management

#### **3. Data Flow**
```
Product Data → Translation → Embeddings → Vector Search → Matching → Results
     ↓              ↓           ↓           ↓           ↓         ↓
  CSV Files → Ollama AI → ChromaDB → Similarity → Scoring → UI Display
```

---

## 🔄 Development Workflow

### **Branch Strategy**
```
main (production)
├── develop (integration)
│   ├── feature/your-feature-name
│   ├── bugfix/issue-description
│   └── hotfix/critical-fix
```

### **Daily Workflow**
```bash
# 1. Start fresh each day
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
# ... your development work ...

# 4. Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# 5. Create Pull Request to develop
# Go to GitHub and create PR
```

### **Code Standards**
- **Frontend**: Use TypeScript, follow React best practices
- **Backend**: Use Python type hints, follow PEP 8
- **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Testing**: Write tests for new features

---

## 🎯 Common Tasks

### **Adding a New Product Field**
1. **Frontend**: Update TypeScript interfaces in `types/` folder
2. **Backend**: Update data processing in matching scripts
3. **Database**: Modify ChromaDB schema if needed
4. **UI**: Add field to comparison tables

### **Modifying AI Translation**
1. **Edit**: `fast_translation.py` for translation logic
2. **Test**: Use `test_translation.py` scripts
3. **Configure**: Update `ollama_config.py` for new models
4. **Deploy**: Test on EC2 with `setup_ec2_ollama_complete.sh`

### **Adding New Marketplace**
1. **Data**: Add marketplace data processing logic
2. **Matching**: Extend matching algorithms
3. **UI**: Create new marketplace tab
4. **Testing**: Test with sample data

### **Performance Optimization**
1. **Monitor**: Use `monitor_progress.py` for performance metrics
2. **Profile**: Use `performance_comparison.py` for benchmarks
3. **Optimize**: Adjust batch sizes, caching, and model selection
4. **Test**: Verify improvements with large datasets

---

## 🧪 Testing & Quality Assurance

### **Frontend Testing**
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E testing
npm run test:e2e
```

### **Backend Testing**
```bash
# Test Ollama connection
python quick_model_check.py

# Test translation system
python test_fast_translation_simple.py

# Test with limited data
python test_20_products.py
```

### **Integration Testing**
```bash
# Test complete workflow
python test_integration.py

# Test ChromaDB setup
python test_aws_chroma.py
```

---

## 🚀 Deployment

### **Local Development**
```bash
# Frontend
npm run dev          # http://localhost:5173

# Backend
python matchfuzzy_ollama_persistent.py  # Setup database
python matchfuzzy_ollama.py             # Run matching
```

### **AWS EC2 Deployment**
```bash
# 1. Launch EC2 instance
./aws_ec2_launch.sh

# 2. Setup Ollama and ChromaDB
./setup_ec2_ollama_complete.sh

# 3. Deploy application
./deploy_to_ec2.sh
```

### **Production Release**
```bash
# 1. Merge feature to develop
git checkout develop
git merge feature/your-feature

# 2. Merge develop to main
git checkout main
git merge develop

# 3. Tag release
git tag v1.1.0
git push origin main --tags
```

---

## 🔍 Troubleshooting

### **Common Issues & Solutions**

#### **1. Ollama Connection Issues**
```bash
# Check if Ollama is running
ollama list

# Restart Ollama
ollama serve

# Check model availability
python quick_model_check.py
```

#### **2. Translation Timeouts**
```bash
# Increase timeout in ollama_config.py
REQUEST_TIMEOUT = 180

# Use faster model
TRANSLATION_MODEL = "phi3:mini"

# Enable test mode for faster development
TEST_MODE = True
```

#### **3. ChromaDB Errors**
```bash
# Clear database
rm -rf chroma_db_ollama/

# Reinitialize
python matchfuzzy_ollama_persistent.py
```

#### **4. Frontend Build Issues**
```bash
# Clear cache
npm run clean

# Reinstall dependencies
rm -rf node_modules/
npm install

# Check TypeScript errors
npm run type-check
```

### **Debug Commands**
```bash
# Check system status
python check_status.py

# Monitor progress
python monitor_progress.py

# Test specific components
python test_ollama_connection.py
```

---

## 👥 Team Communication

### **Communication Channels**
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code review and discussion
- **Team Chat**: Daily standups and quick questions
- **Documentation**: Keep this guide updated

### **Code Review Process**
1. **Self-Review**: Test your code before PR
2. **Peer Review**: Get feedback from team members
3. **QA Testing**: Ensure functionality works as expected
4. **Merge**: Only merge after approval

### **Daily Standup Questions**
- What did you work on yesterday?
- What are you working on today?
- Any blockers or issues?
- Any questions for the team?

---

## 📚 Learning Resources

### **Essential Reading**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Ollama Documentation](https://ollama.ai/docs)
- [ChromaDB Guide](https://docs.trychroma.com/)

### **Project-Specific**
- **`README.md`**: Project overview and setup
- **`README_CLOUD_SETUP.md`**: Cloud deployment guide
- **`matching_approach_comparison.md`**: Algorithm explanations
- **`aws_deployment_guide.md`**: AWS setup instructions

### **AI/ML Concepts**
- **Vector Embeddings**: How ChromaDB stores product similarities
- **LLM Integration**: How Ollama enhances product matching
- **Batch Processing**: Efficient handling of large datasets

---

## 🎉 Getting Help

### **When You're Stuck**
1. **Check Documentation**: This guide and project READMEs
2. **Search Issues**: Look for similar problems in GitHub
3. **Ask Team**: Reach out in team chat
4. **Create Issue**: Document the problem for future reference

### **Contributing to This Guide**
- Found a bug? Update the troubleshooting section
- Learned something new? Add it to the common tasks
- Process changed? Update the workflow section

---

## 🚀 Ready to Start?

You now have everything you need to contribute to the Price Scan Explorer project! 

**Next Steps:**
1. ✅ Set up your development environment
2. ✅ Clone and run the project locally
3. ✅ Pick a small task to start with
4. ✅ Join team discussions and standups

**Remember**: There's no such thing as a stupid question. The team is here to help you succeed!

---

**Happy Coding! 🎯✨**

*Last updated: January 2025*
*Maintained by: Development Team*
