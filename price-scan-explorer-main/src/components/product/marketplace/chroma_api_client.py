import chromadb
import requests
import sys
import os
from typing import List, Dict, Optional

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from ollama_config import *
except ImportError:
    OLLAMA_BASE_URL = "http://localhost:11434"
    EMBEDDINGS_ENDPOINT = f"{OLLAMA_BASE_URL}/api/embeddings"
    EMBEDDING_MODEL = "nomic-embed-text"

class ChromaProductSearch:
    """Client for searching products in ChromaDB collections"""
    
    def __init__(self, db_path: str = "./chroma_db_ollama"):
        self.client = chromadb.PersistentClient(path=db_path)
        self.embedding_function = self._create_embedding_function()
        self._load_collections()
    
    def _create_embedding_function(self):
        """Create Ollama embedding function"""
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
        
        return OllamaEmbeddingFunction(EMBEDDING_MODEL)
    
    def _load_collections(self):
        """Load ChromaDB collections"""
        try:
            self.lotus_collection = self.client.get_collection(
                name="lotus_products_ollama",
                embedding_function=self.embedding_function
            )
            self.shopee_collection = self.client.get_collection(
                name="shopee_products_ollama",
                embedding_function=self.embedding_function
            )
            print("✅ ChromaDB collections loaded successfully")
        except Exception as e:
            print(f"❌ Error loading ChromaDB collections: {e}")
            self.lotus_collection = None
            self.shopee_collection = None
    
    def search_products(self, query: str, n_results: int = 10, 
                       marketplaces: List[str] = None) -> Dict:
        """
        Search for products across marketplaces
        
        Args:
            query: Search query
            n_results: Number of results per marketplace
            marketplaces: List of marketplaces to search ('lotus', 'shopee')
        
        Returns:
            Dictionary with search results
        """
        if not self.lotus_collection or not self.shopee_collection:
            return {'error': 'ChromaDB collections not available'}
        
        if marketplaces is None:
            marketplaces = ['lotus', 'shopee']
        
        results = {
            'query': query,
            'lotus_products': [],
            'shopee_products': [],
            'total_results': 0
        }
        
        try:
            # Search Lotus products
            if 'lotus' in marketplaces:
                lotus_results = self.lotus_collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    include=['metadatas', 'distances']
                )
                
                if lotus_results['metadatas'] and lotus_results['metadatas'][0]:
                    for i, metadata in enumerate(lotus_results['metadatas'][0]):
                        distance = lotus_results['distances'][0][i]
                        similarity = round((1 - distance) * 100, 2)
                        
                        results['lotus_products'].append({
                            'name': metadata['original_name'],
                            'processed_name': metadata['processed_name'],
                            'price': metadata['price'],
                            'discounted_price': metadata['discounted_price'],
                            'original_price': metadata['original_price'],
                            'url': metadata['url'],
                            'similarity': similarity,
                            'marketplace': 'Lotus'
                        })
            
            # Search Shopee products
            if 'shopee' in marketplaces:
                shopee_results = self.shopee_collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    include=['metadatas', 'distances']
                )
                
                if shopee_results['metadatas'] and shopee_results['metadatas'][0]:
                    for i, metadata in enumerate(shopee_results['metadatas'][0]):
                        distance = shopee_results['distances'][0][i]
                        similarity = round((1 - distance) * 100, 2)
                        
                        results['shopee_products'].append({
                            'name': metadata['original_name'],
                            'processed_name': metadata['processed_name'],
                            'price': metadata['price'],
                            'discounted_price': metadata['discounted_price'],
                            'original_price': metadata['original_price'],
                            'url': metadata['url'],
                            'shop_name': metadata.get('shop_name', ''),
                            'shop_url': metadata.get('shop_url', ''),
                            'similarity': similarity,
                            'marketplace': 'Shopee'
                        })
            
            results['total_results'] = len(results['lotus_products']) + len(results['shopee_products'])
            
        except Exception as e:
            results['error'] = f'Search error: {str(e)}'
        
        return results
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        try:
            lotus_count = self.lotus_collection.count() if self.lotus_collection else 0
            shopee_count = self.shopee_collection.count() if self.shopee_collection else 0
            
            return {
                'lotus_products': lotus_count,
                'shopee_products': shopee_count,
                'total_products': lotus_count + shopee_count
            }
        except Exception as e:
            return {'error': f'Stats error: {str(e)}'}
    
    def find_similar_products(self, product_name: str, marketplace: str = 'both', 
                            threshold: float = 0.7) -> Dict:
        """
        Find similar products to a given product
        
        Args:
            product_name: Name of the product to find similar ones for
            marketplace: 'lotus', 'shopee', or 'both'
            threshold: Similarity threshold (0-1)
        
        Returns:
            Dictionary with similar products
        """
        if marketplace == 'both':
            return self.search_products(product_name, n_results=20)
        elif marketplace == 'lotus':
            return self.search_products(product_name, n_results=20, marketplaces=['lotus'])
        elif marketplace == 'shopee':
            return self.search_products(product_name, n_results=20, marketplaces=['shopee'])
        else:
            return {'error': 'Invalid marketplace specified'}
    
    def get_product_by_url(self, url: str) -> Optional[Dict]:
        """
        Get product information by URL
        
        Args:
            url: Product URL
        
        Returns:
            Product information or None if not found
        """
        try:
            # Search in both collections
            lotus_results = self.lotus_collection.get(
                where={"url": url},
                include=['metadatas']
            )
            
            if lotus_results['metadatas']:
                metadata = lotus_results['metadatas'][0]
                return {
                    'name': metadata['original_name'],
                    'processed_name': metadata['processed_name'],
                    'price': metadata['price'],
                    'discounted_price': metadata['discounted_price'],
                    'original_price': metadata['original_price'],
                    'url': metadata['url'],
                    'marketplace': 'Lotus'
                }
            
            shopee_results = self.shopee_collection.get(
                where={"url": url},
                include=['metadatas']
            )
            
            if shopee_results['metadatas']:
                metadata = shopee_results['metadatas'][0]
                return {
                    'name': metadata['original_name'],
                    'processed_name': metadata['processed_name'],
                    'price': metadata['price'],
                    'discounted_price': metadata['discounted_price'],
                    'original_price': metadata['original_price'],
                    'url': metadata['url'],
                    'shop_name': metadata.get('shop_name', ''),
                    'shop_url': metadata.get('shop_url', ''),
                    'marketplace': 'Shopee'
                }
            
            return None
            
        except Exception as e:
            print(f"Error getting product by URL: {e}")
            return None

# Example usage
if __name__ == "__main__":
    # Initialize the search client
    search_client = ChromaProductSearch()
    
    # Get database stats
    stats = search_client.get_stats()
    print(f"📊 Database Stats: {stats}")
    
    # Search for products
    results = search_client.search_products("Milo", n_results=5)
    print(f"\n🔍 Search Results for 'Milo':")
    print(f"Total results: {results['total_results']}")
    
    if 'lotus_products' in results:
        print(f"\n🪷 Lotus Products:")
        for product in results['lotus_products'][:3]:
            print(f"  - {product['name']} (RM {product['price']}) - {product['similarity']}% match")
    
    if 'shopee_products' in results:
        print(f"\n🛍️ Shopee Products:")
        for product in results['shopee_products'][:3]:
            print(f"  - {product['name']} (RM {product['price']}) - {product['similarity']}% match") 