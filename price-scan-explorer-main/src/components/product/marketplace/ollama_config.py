# Ollama Configuration for Cloud Processing
# Update these values with your EC2 instance details

# Local Ollama Configuration
OLLAMA_HOST = "localhost"  # Use local Ollama instance
OLLAMA_PORT = 11434
OLLAMA_PROTOCOL = "http"  # or "https" if you have SSL configured

# Models to use
EMBEDDING_MODEL = "nomic-embed-text:latest"
LLM_MODEL = "llama3.1:8b"  # Use 8B model that's available locally
TRANSLATION_MODEL = "phi3:mini"  # Faster model for translation

# Connection settings
REQUEST_TIMEOUT = 120  # Longer timeout for translation
RETRY_ATTEMPTS = 3   # Standard retries
RETRY_DELAY = 1      # Standard delay between retries

# API Endpoints
OLLAMA_BASE_URL = f"{OLLAMA_PROTOCOL}://{OLLAMA_HOST}:{OLLAMA_PORT}"
EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"

# Security (if needed)
# OLLAMA_API_KEY = "your-api-key"  # Uncomment if you have API key authentication 