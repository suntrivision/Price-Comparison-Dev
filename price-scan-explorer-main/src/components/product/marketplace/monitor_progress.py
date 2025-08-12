#!/usr/bin/env python3
"""
Monitor progress of the Ollama matching script
"""

import os
import time
import glob
from datetime import datetime

def check_progress():
    """Check the progress of the matching script"""
    
    print("🔍 Monitoring Ollama Matching Progress")
    print("=" * 50)
    
    # Check if ChromaDB directory exists
    chroma_dir = "./chroma_db_ollama"
    if os.path.exists(chroma_dir):
        print(f"✅ ChromaDB directory found: {chroma_dir}")
        
        # Check ChromaDB collections
        lotus_dir = os.path.join(chroma_dir, "lotus_products_ollama")
        shopee_dir = os.path.join(chroma_dir, "shopee_products_ollama")
        
        if os.path.exists(lotus_dir):
            print(f"✅ Lotus collection created")
        else:
            print(f"⏳ Lotus collection not yet created")
            
        if os.path.exists(shopee_dir):
            print(f"✅ Shopee collection created")
        else:
            print(f"⏳ Shopee collection not yet created")
    else:
        print(f"⏳ ChromaDB directory not yet created")
    
    # Check for output files
    csv_files = glob.glob("matched_lotus_shopee_ollama_output_*.csv")
    if csv_files:
        print(f"✅ Output files found:")
        for file in csv_files:
            size = os.path.getsize(file)
            modified = datetime.fromtimestamp(os.path.getmtime(file))
            print(f"  📄 {file} ({size:,} bytes, modified: {modified.strftime('%H:%M:%S')})")
    else:
        print(f"⏳ No output files yet")
    
    # Check for any log files
    log_files = glob.glob("*.log")
    if log_files:
        print(f"📝 Log files found:")
        for file in log_files:
            size = os.path.getsize(file)
            modified = datetime.fromtimestamp(os.path.getmtime(file))
            print(f"  📄 {file} ({size:,} bytes, modified: {modified.strftime('%H:%M:%S')})")
    
    # Check Python processes
    try:
        import psutil
        python_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if 'python' in proc.info['name'].lower():
                    cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                    if 'matchfuzzy_ollama' in cmdline:
                        python_processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        if python_processes:
            print(f"🔄 Python processes running:")
            for proc in python_processes:
                print(f"  🐍 PID {proc['pid']}: {proc['name']}")
        else:
            print(f"❌ No matching Python processes found")
    except ImportError:
        print(f"ℹ️  Install psutil for detailed process monitoring: pip install psutil")

if __name__ == "__main__":
    while True:
        check_progress()
        print("\n" + "=" * 50)
        print("Press Ctrl+C to stop monitoring")
        print("Checking again in 30 seconds...")
        print("=" * 50)
        time.sleep(30) 