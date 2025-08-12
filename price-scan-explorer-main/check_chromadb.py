import sqlite3
import os

def check_chromadb():
    db_path = 'chroma_db_ollama/chroma.sqlite3'
    
    if not os.path.exists(db_path):
        print("❌ ChromaDB database not found")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📊 Tables in ChromaDB: {[table[0] for table in tables]}")
        
        # Check collections table
        if ('collections',) in tables:
            cursor.execute("SELECT name, id FROM collections")
            collections = cursor.fetchall()
            print(f"📚 Collections: {collections}")
        
        # Check embeddings table structure
        if ('embeddings',) in tables:
            cursor.execute("PRAGMA table_info(embeddings)")
            columns = cursor.fetchall()
            print(f"📋 Embeddings table columns: {[col[1] for col in columns]}")
            
            cursor.execute("SELECT COUNT(*) FROM embeddings")
            count = cursor.fetchone()[0]
            print(f"🔢 Total embeddings: {count}")
            
            if count > 0:
                # Get sample data
                cursor.execute("SELECT id, embedding_id FROM embeddings LIMIT 5")
                samples = cursor.fetchall()
                print(f"📝 Sample embeddings: {samples}")
        
        # Check segments table
        if ('segments',) in tables:
            cursor.execute("SELECT COUNT(*) FROM segments")
            segment_count = cursor.fetchone()[0]
            print(f"📦 Total segments: {segment_count}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking ChromaDB: {e}")

if __name__ == "__main__":
    check_chromadb() 