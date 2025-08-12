@echo off
echo 🗂️ Mounting EC2 directory to local drive...

REM Configuration
set EC2_HOST=ec2-13-215-51-84.ap-southeast-1.compute.amazonaws.com
set EC2_USER=ubuntu
set PEM_FILE=ollama-product-matcher.pem
set LOCAL_MOUNT=C:\EC2-Mount
set REMOTE_DIR=/home/ubuntu/price-scanner

REM Create mount directory if it doesn't exist
if not exist "%LOCAL_MOUNT%" (
    echo 📁 Creating mount directory: %LOCAL_MOUNT%
    mkdir "%LOCAL_MOUNT%"
)

REM Mount the EC2 directory
echo 🔗 Mounting EC2 directory...
sshfs -o IdentityFile="%PEM_FILE%" %EC2_USER%@%EC2_HOST%:%REMOTE_DIR% %LOCAL_MOUNT%

if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully mounted EC2 to %LOCAL_MOUNT%
    echo.
    echo 📂 You can now access EC2 files at: %LOCAL_MOUNT%
    echo.
    echo 🔧 To unmount later, run: unmount_ec2.bat
) else (
    echo ❌ Failed to mount EC2 directory
    echo.
    echo 🔧 Troubleshooting:
    echo 1. Make sure SSHFS is installed (run setup_sshfs.bat)
    echo 2. Check if PEM file exists: %PEM_FILE%
    echo 3. Verify EC2 connection: ssh -i "%PEM_FILE%" %EC2_USER%@%EC2_HOST%
)

pause 