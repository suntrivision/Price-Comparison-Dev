# AWS ChromaDB Configuration
# Update these values with your EC2 instance details

# EC2 Instance Configuration
EC2_PUBLIC_IP = "3.1.103.137"  # Replace with your EC2 public IP
EC2_PRIVATE_IP = "172.31.20.76"  # Replace with your EC2 private IP

# ChromaDB Configuration
CHROMADB_HOST = EC2_PUBLIC_IP  # Use public IP for external access
CHROMADB_PORT = 8000
CHROMADB_PROTOCOL = "http"  # or "https" if you have SSL configured

# Ollama Configuration (if running on same EC2)
OLLAMA_HOST = EC2_PRIVATE_IP  # Use private IP for internal communication
OLLAMA_PORT = 11434
OLLAMA_PROTOCOL = "http"

# Models to use
EMBEDDING_MODEL = "nomic-embed-text"
LLM_MODEL = "llama3.1:8b"  # Use 8B model for better performance

# Connection settings
REQUEST_TIMEOUT = 120  # Longer timeout for cloud processing
RETRY_ATTEMPTS = 5     # More retries for cloud environment
RETRY_DELAY = 2        # Longer delay between retries

# API Endpoints
CHROMADB_BASE_URL = f"{CHROMADB_PROTOCOL}://{CHROMADB_HOST}:{CHROMADB_PORT}"
OLLAMA_BASE_URL = f"{OLLAMA_PROTOCOL}://{OLLAMA_HOST}:{OLLAMA_PORT}"
EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"

# AWS S3 Configuration
S3_BUCKET_NAME = "prodpromo"
S3_REGION = "ap-southeast-1"

# Security Group Ports
REQUIRED_PORTS = {
    "chromadb": 8000,
    "ollama": 11434,
    "nginx": 80,
    "nginx_ssl": 443,
    "redis": 6379
}

# Performance Settings
CHUNK_SIZE = 100  # Process products in chunks
EMBEDDING_BATCH_SIZE = 50  # Batch size for embeddings
MAX_CONCURRENT_REQUESTS = 10  # Limit concurrent API calls

# Monitoring and Logging
LOG_LEVEL = "INFO"
ENABLE_METRICS = True
HEALTH_CHECK_INTERVAL = 30  # seconds

# Backup Configuration
BACKUP_ENABLED = True
BACKUP_INTERVAL_HOURS = 24
BACKUP_S3_BUCKET = f"{S3_BUCKET_NAME}-backups"
BACKUP_RETENTION_DAYS = 7

# Example usage:
# from aws_ollama_config import *
# 
# # Connect to ChromaDB
# client = chromadb.HttpClient(
#     host=CHROMADB_HOST,
#     port=CHROMADB_PORT
# )
# 
# # Use Ollama for embeddings
# embedding_function = OllamaEmbeddingFunction(EMBEDDING_MODEL) 