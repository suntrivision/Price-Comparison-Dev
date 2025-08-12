#!/bin/bash

# Manual Translation Test using curl
# Run this script on your EC2 instance to test Ollama translation

echo "🚀 Manual Translation Test for EC2 Ollama (curl version)"
echo "======================================================"

# Configuration
OLLAMA_URL="http://localhost:11434"
LLM_MODEL="llama3.1:8b"
TEST_PRODUCT="paha ayam sejuk beku 2kg"

echo "Target URL: $OLLAMA_URL"
echo "LLM Model: $LLM_MODEL"
echo "Test Product: $TEST_PRODUCT"
echo ""

# Test 1: Check if Ollama is running
echo "🔍 Test 1: Checking if Ollama is running..."
echo "curl -s $OLLAMA_URL/api/tags"
curl -s "$OLLAMA_URL/api/tags"
echo ""
echo ""

# Test 2: Check available models
echo "📦 Test 2: Checking available models..."
echo "curl -s $OLLAMA_URL/api/tags | jq '.models[].name'"
curl -s "$OLLAMA_URL/api/tags" | jq '.models[].name' 2>/dev/null || echo "jq not available, showing raw response:"
curl -s "$OLLAMA_URL/api/tags"
echo ""
echo ""

# Test 3: Test basic generate endpoint
echo "🧪 Test 3: Testing basic generate endpoint..."
echo "curl -X POST $OLLAMA_URL/api/generate -H 'Content-Type: application/json' -d '{\"model\":\"$LLM_MODEL\",\"prompt\":\"Hello\",\"stream\":false}'"
curl -X POST "$OLLAMA_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$LLM_MODEL\",\"prompt\":\"Hello\",\"stream\":false}" \
  --max-time 30
echo ""
echo ""

# Test 4: Test translation endpoint with the failing product
echo "🌐 Test 4: Testing translation with the failing product..."
echo "Product: $TEST_PRODUCT"

TRANSLATION_PROMPT="Translate this product name to English. Keep brand names unchanged. Product: $TEST_PRODUCT. Rules: Keep brand names unchanged, translate descriptive words to English, keep measurements unchanged. Return only the translation."

echo "curl -X POST $OLLAMA_URL/api/generate -H 'Content-Type: application/json' -d '{\"model\":\"$LLM_MODEL\",\"prompt\":\"$TRANSLATION_PROMPT\",\"stream\":false}'"

curl -X POST "$OLLAMA_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$LLM_MODEL\",\"prompt\":\"$TRANSLATION_PROMPT\",\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":50}}" \
  --max-time 60
echo ""
echo ""

# Test 5: Test alternative endpoints
echo "🔧 Test 5: Testing alternative endpoints..."
echo "Testing /api/chat endpoint:"
curl -s "$OLLAMA_URL/api/chat" --max-time 5
echo ""
echo "Testing /api/embeddings endpoint:"
curl -s "$OLLAMA_URL/api/embeddings" --max-time 5
echo ""
echo ""

# Test 6: Check Ollama service status
echo "🏥 Test 6: Checking Ollama service status..."
echo "systemctl status ollama"
systemctl status ollama --no-pager -l
echo ""
echo ""

# Test 7: Check if port is listening
echo "🔌 Test 7: Checking if port 11434 is listening..."
echo "netstat -tlnp | grep 11434"
netstat -tlnp | grep 11434 || echo "Port 11434 not found in netstat"
echo ""
echo ""

# Test 8: Check Ollama logs
echo "📋 Test 8: Recent Ollama logs (last 10 lines)..."
echo "journalctl -u ollama --no-pager -n 10"
journalctl -u ollama --no-pager -n 10
echo ""
echo ""

echo "✅ Manual translation test complete!"
echo "Check the output above for any errors or issues." 