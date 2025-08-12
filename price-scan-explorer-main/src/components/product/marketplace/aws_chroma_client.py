import chromadb
import requests
import boto3
import logging
import time
from typing import List, Dict, Optional
import sys
import os

# Add the current directory to Python path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from aws_ollama_config import *
except ImportError:
    print("⚠️  No aws_ollama_config.py found, using defaults")
    CHROMADB_HOST = "localhost"
    CHROMADB_PORT = 8000
    OLLAMA_HOST = "localhost"
    OLLAMA_PORT = 11434
    EMBEDDING_MODEL = "nomic-embed-text"

# Setup logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL if 'LOG_LEVEL' in locals() else 'INFO'))
logger = logging.getLogger(__name__)

class AWSChromaProductSearch:
    """ChromaDB client for AWS deployment with enhanced features"""
    
    def __init__(self, chroma_host: str = None, chroma_port: int = None):
        self.chroma_host = chroma_host or CHROMADB_HOST
        self.chroma_port = chroma_port or CHROMADB_PORT
        self.embedding_function = self._create_embedding_function()
        self.s3_client = boto3.client('s3', region_name=S3_REGION if 'S3_REGION' in locals() else 'ap-southeast-1')
        self._connect_to_chromadb()
    
    def _connect_to_chromadb(self):
        """Connect to ChromaDB server"""
        try:
            self.client = chromadb.HttpClient(
                host=self.chroma_host,
                port=self.chroma_port
            )
            logger.info(f"✅ Connected to ChromaDB at {self.chroma_host}:{self.chroma_port}")
            
            # Test connection
            self.client.heartbeat()
            logger.info("✅ ChromaDB heartbeat successful")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to ChromaDB: {e}")
            raise
    
    def _create_embedding_function(self):
        """Create Ollama embedding function for AWS"""
        class OllamaEmbeddingFunction:
            def __init__(self, model=None):
                self.model = model or EMBEDDING_MODEL
                self.base_url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}"
            
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
                        f"{self.base_url}/api/embeddings",
                        json={
                            "model": self.model,
                            "prompt": text
                        },
                        timeout=REQUEST_TIMEOUT if 'REQUEST_TIMEOUT' in locals() else 60
                    )
                    if response.status_code == 200:
                        return response.json()["embedding"]
                except Exception as e:
                    logger.warning(f"Embedding request failed: {e}")
                return None
            
            def name(self):
                return f"ollama-{self.model}"
        
        return OllamaEmbeddingFunction(EMBEDDING_MODEL)
    
    def get_collections(self):
        """Get available collections"""
        try:
            collections = self.client.list_collections()
            return [col.name for col in collections]
        except Exception as e:
            logger.error(f"Error getting collections: {e}")
            return []
    
    def create_collection(self, name: str, metadata: Dict = None):
        """Create a new collection"""
        try:
            collection = self.client.create_collection(
                name=name,
                embedding_function=self.embedding_function,
                metadata=metadata or {"hnsw:space": "cosine"}
            )
            logger.info(f"✅ Created collection: {name}")
            return collection
        except Exception as e:
            logger.error(f"Error creating collection {name}: {e}")
            return None
    
    def get_collection(self, name: str):
        """Get an existing collection"""
        try:
            collection = self.client.get_collection(
                name=name,
                embedding_function=self.embedding_function
            )
            return collection
        except Exception as e:
            logger.error(f"Error getting collection {name}: {e}")
            return None
    
    def search_products(self, query: str, collection_name: str = None, 
                       n_results: int = 10, where: Dict = None) -> Dict:
        """
        Search for products in a specific collection
        
        Args:
            query: Search query
            collection_name: Name of collection to search (lotus_products_ollama or shopee_products_ollama)
            n_results: Number of results
            where: Filter conditions
        
        Returns:
            Dictionary with search results
        """
        try:
            if collection_name:
                collection = self.get_collection(collection_name)
                if not collection:
                    return {'error': f'Collection {collection_name} not found'}
                
                results = collection.query(
                    query_texts=[query],
                    n_results=n_results,
                    where=where,
                    include=['metadatas', 'distances']
                )
                
                return self._process_search_results(results, collection_name)
            else:
                # Search in both collections
                lotus_results = self.search_products(query, "lotus_products_ollama", n_results, where)
                shopee_results = self.search_products(query, "shopee_products_ollama", n_results, where)
                
                return {
                    'query': query,
                    'lotus_products': lotus_results.get('products', []),
                    'shopee_products': shopee_results.get('products', []),
                    'total_results': len(lotus_results.get('products', [])) + len(shopee_results.get('products', []))
                }
                
        except Exception as e:
            logger.error(f"Search error: {e}")
            return {'error': f'Search error: {str(e)}'}
    
    def _process_search_results(self, results, collection_name: str) -> Dict:
        """Process raw search results into formatted output"""
        products = []
        
        if results['metadatas'] and results['metadatas'][0]:
            for i, metadata in enumerate(results['metadatas'][0]):
                distance = results['distances'][0][i]
                similarity = round((1 - distance) * 100, 2)
                
                product = {
                    'name': metadata['original_name'],
                    'processed_name': metadata['processed_name'],
                    'price': metadata['price'],
                    'discounted_price': metadata['discounted_price'],
                    'original_price': metadata['original_price'],
                    'url': metadata['url'],
                    'timestamp': metadata.get('timestamp', 'Unknown'),
                    'similarity': similarity,
                    'marketplace': 'Lotus' if 'lotus' in collection_name else 'Shopee'
                }
                
                # Add Shopee-specific fields
                if 'shopee' in collection_name:
                    product['shop_name'] = metadata.get('shop_name', '')
                    product['shop_url'] = metadata.get('shop_url', '')
                
                products.append(product)
        
        return {
            'products': products,
            'total_found': len(products)
        }
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        try:
            collections = self.get_collections()
            stats = {}
            
            for collection_name in collections:
                if 'lotus' in collection_name or 'shopee' in collection_name:
                    collection = self.get_collection(collection_name)
                    if collection:
                        count = collection.count()
                        stats[collection_name] = count
            
            return {
                'collections': collections,
                'collection_counts': stats,
                'total_products': sum(stats.values())
            }
        except Exception as e:
            logger.error(f"Stats error: {e}")
            return {'error': f'Stats error: {str(e)}'}
    
    def backup_to_s3(self, backup_name: str = None):
        """Backup ChromaDB data to S3"""
        if not BACKUP_ENABLED:
            logger.info("Backup is disabled")
            return
        
        try:
            if not backup_name:
                backup_name = f"chromadb-backup-{int(time.time())}"
            
            # Create backup directory
            backup_dir = f"/tmp/{backup_name}"
            os.makedirs(backup_dir, exist_ok=True)
            
            # Export collections
            collections = self.get_collections()
            for collection_name in collections:
                collection = self.get_collection(collection_name)
                if collection:
                    # Get all data from collection
                    results = collection.get(include=['metadatas', 'embeddings'])
                    
                    # Save to file
                    import json
                    backup_file = f"{backup_dir}/{collection_name}.json"
                    with open(backup_file, 'w') as f:
                        json.dump(results, f)
            
            # Upload to S3
            s3_backup_path = f"chromadb-backups/{backup_name}.tar.gz"
            
            # Create tar.gz
            import tarfile
            tar_file = f"/tmp/{backup_name}.tar.gz"
            with tarfile.open(tar_file, "w:gz") as tar:
                tar.add(backup_dir, arcname=backup_name)
            
            # Upload to S3
            self.s3_client.upload_file(
                tar_file, 
                BACKUP_S3_BUCKET if 'BACKUP_S3_BUCKET' in locals() else 'prodpromo-backups',
                s3_backup_path
            )
            
            logger.info(f"✅ Backup completed: s3://{BACKUP_S3_BUCKET}/{s3_backup_path}")
            
            # Cleanup
            os.remove(tar_file)
            import shutil
            shutil.rmtree(backup_dir)
            
        except Exception as e:
            logger.error(f"Backup error: {e}")
    
    def health_check(self) -> Dict:
        """Perform health check on ChromaDB and Ollama"""
        health_status = {
            'chromadb': False,
            'ollama': False,
            'collections': [],
            'timestamp': time.time()
        }
        
        try:
            # Check ChromaDB
            self.client.heartbeat()
            health_status['chromadb'] = True
            
            # Check collections
            health_status['collections'] = self.get_collections()
            
            # Check Ollama
            ollama_response = requests.get(
                f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/tags",
                timeout=10
            )
            if ollama_response.status_code == 200:
                health_status['ollama'] = True
                
        except Exception as e:
            logger.error(f"Health check error: {e}")
        
        return health_status

# Example usage
if __name__ == "__main__":
    # Initialize the AWS ChromaDB client
    search_client = AWSChromaProductSearch()
    
    # Get database stats
    stats = search_client.get_stats()
    print(f"📊 Database Stats: {stats}")
    
    # Perform health check
    health = search_client.health_check()
    print(f"🏥 Health Check: {health}")
    
    # Search for products
    results = search_client.search_products("Milo", n_results=5)
    print(f"\n🔍 Search Results for 'Milo':")
    print(f"Total results: {results.get('total_results', 0)}")
    
    if 'lotus_products' in results:
        print(f"\n🪷 Lotus Products:")
        for product in results['lotus_products'][:3]:
            print(f"  - {product['name']} (RM {product['price']}) - {product['similarity']}% match")
    
    if 'shopee_products' in results:
        print(f"\n🛍️ Shopee Products:")
        for product in results['shopee_products'][:3]:
            print(f"  - {product['name']} (RM {product['price']}) - {product['similarity']}% match") 