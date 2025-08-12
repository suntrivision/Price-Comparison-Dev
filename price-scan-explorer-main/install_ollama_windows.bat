@echo off
echo ========================================
echo    Ollama Installation for Windows
echo ========================================
echo.

echo Checking if Ollama is already installed...
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama is already installed!
    goto :start_ollama
)

echo ❌ Ollama is not installed. Installing now...
echo.

echo Step 1: Downloading Ollama...
echo Please visit: https://ollama.ai/download
echo Download the Windows installer and run it as Administrator
echo.
echo After installation, press any key to continue...
pause >nul

echo.
echo Step 2: Checking Ollama installation...
ollama --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama installed successfully!
) else (
    echo ❌ Ollama installation failed or not in PATH
    echo Please make sure Ollama is installed and added to PATH
    pause
    exit /b 1
)

:start_ollama
echo.
echo Step 3: Starting Ollama service...
echo Starting Ollama in background...
start /B ollama serve

echo Waiting for Ollama to start...
timeout /t 10 /nobreak >nul

echo.
echo Step 4: Testing Ollama connection...
python test_ollama_connection.py

echo.
echo Step 5: Installing required models...
echo This may take several minutes depending on your internet speed...
echo.

echo Installing nomic-embed-text (1.5GB)...
ollama pull nomic-embed-text

echo.
echo Installing llama3.1:8b (8GB)...
ollama pull llama3.1:8b

echo.
echo ✅ Ollama setup completed!
echo.
echo 🚀 Next steps:
echo 1. Run: python test_ollama_connection.py
echo 2. Run: python src/components/product/marketplace/matchfuzzy_ollama.py
echo.
echo 📊 System Requirements:
echo - RAM: 16GB+ recommended
echo - Storage: 15GB+ free space
echo - Internet: Stable connection for model downloads
echo.
pause 