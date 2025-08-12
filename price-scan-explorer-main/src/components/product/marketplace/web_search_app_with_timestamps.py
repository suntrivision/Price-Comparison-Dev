from flask import Flask, render_template, request, jsonify
import chromadb
import requests
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
except ImportError:
    OLLAMA_BASE_URL = "http://localhost:11434"
    EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
    EMBEDDING_MODEL = "nomic-embed-text"

app = Flask(__name__)

# Initialize ChromaDB
client = chromadb.PersistentClient(path="./chroma_db_ollama")

# Custom embedding function using Ollama
class OllamaEmbeddingFunction:
    def __init__(self, model=None):
        self.model = model or EMBEDDING_MODEL
    
    def __call__(self, input):
        embeddings = []
        for text in input:
            embedding = self.get_ollama_embedding(text)
            if embedding:
                embeddings.append(embedding)
            else:
                embeddings.append([0.0] * 384)
        return embeddings
    
    def get_ollama_embedding(self, text):
        try:
            response = requests.post(
                EMBEDDINGS_ENDPOINT,
                json={
                    "model": self.model,
                    "prompt": text
                },
                timeout=30
            )
            if response.status_code == 200:
                return response.json()["embedding"]
        except:
            pass
        return None
    
    def name(self):
        return f"ollama-{self.model}"

embedding_function = OllamaEmbeddingFunction(EMBEDDING_MODEL)

# Get collections
try:
    lotus_collection = client.get_collection(
        name="lotus_products_ollama",
        embedding_function=embedding_function
    )
    shopee_collection = client.get_collection(
        name="shopee_products_ollama",
        embedding_function=embedding_function
    )
    print("✅ ChromaDB collections loaded successfully")
except Exception as e:
    print(f"❌ Error loading ChromaDB collections: {e}")
    lotus_collection = None
    shopee_collection = None

@app.route('/')
def index():
    return render_template('search_with_timestamps.html')

@app.route('/search', methods=['POST'])
def search():
    if not lotus_collection or not shopee_collection:
        return jsonify({'error': 'ChromaDB collections not available'})
    
    query = request.json.get('query', '').strip()
    if not query:
        return jsonify({'error': 'Please provide a search query'})
    
    try:
        # Search in both collections
        lotus_results = lotus_collection.query(
            query_texts=[query],
            n_results=10,
            include=['metadatas', 'distances']
        )
        
        shopee_results = shopee_collection.query(
            query_texts=[query],
            n_results=10,
            include=['metadatas', 'distances']
        )
        
        # Process results with timestamps
        lotus_products = []
        if lotus_results['metadatas'] and lotus_results['metadatas'][0]:
            for i, metadata in enumerate(lotus_results['metadatas'][0]):
                distance = lotus_results['distances'][0][i]
                similarity = round((1 - distance) * 100, 2)
                
                lotus_products.append({
                    'name': metadata['original_name'],
                    'processed_name': metadata['processed_name'],
                    'price': metadata['price'],
                    'discounted_price': metadata['discounted_price'],
                    'original_price': metadata['original_price'],
                    'url': metadata['url'],
                    'timestamp': metadata.get('timestamp', 'Unknown'),  # Include timestamp
                    'similarity': similarity,
                    'marketplace': 'Lotus'
                })
        
        shopee_products = []
        if shopee_results['metadatas'] and shopee_results['metadatas'][0]:
            for i, metadata in enumerate(shopee_results['metadatas'][0]):
                distance = shopee_results['distances'][0][i]
                similarity = round((1 - distance) * 100, 2)
                
                shopee_products.append({
                    'name': metadata['original_name'],
                    'processed_name': metadata['processed_name'],
                    'price': metadata['price'],
                    'discounted_price': metadata['discounted_price'],
                    'original_price': metadata['original_price'],
                    'url': metadata['url'],
                    'shop_name': metadata.get('shop_name', ''),
                    'shop_url': metadata.get('shop_url', ''),
                    'timestamp': metadata.get('timestamp', 'Unknown'),  # Include timestamp
                    'similarity': similarity,
                    'marketplace': 'Shopee'
                })
        
        return jsonify({
            'query': query,
            'lotus_products': lotus_products,
            'shopee_products': shopee_products,
            'total_results': len(lotus_products) + len(shopee_products)
        })
        
    except Exception as e:
        return jsonify({'error': f'Search error: {str(e)}'})

@app.route('/stats')
def stats():
    try:
        lotus_count = lotus_collection.count() if lotus_collection else 0
        shopee_count = shopee_collection.count() if shopee_collection else 0
        
        return jsonify({
            'lotus_products': lotus_count,
            'shopee_products': shopee_count,
            'total_products': lotus_count + shopee_count
        })
    except Exception as e:
        return jsonify({'error': f'Stats error: {str(e)}'})

if __name__ == '__main__':
    print("🌐 Starting Product Search Web Application (with timestamps)...")
    print("📊 Available collections:")
    print(f"   - Lotus products: {lotus_collection.count() if lotus_collection else 'Not available'}")
    print(f"   - Shopee products: {shopee_collection.count() if shopee_collection else 'Not available'}")
    print("\n🚀 Web app running at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000) 