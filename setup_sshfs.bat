@echo off
echo 🚀 Setting up SSHFS mapping to EC2...

REM Install WinFsp (required for SSHFS)
echo 📦 Installing WinFsp...
winget install WinFsp.WinFsp

REM Install SSHFS-Win
echo 📦 Installing SSHFS-Win...
winget install SSHFS-Win.SSHFS-Win

echo.
echo ✅ Installation completed!
echo.
echo 🔧 Next steps:
echo 1. Create a mount point directory (e.g., C:\EC2-Mount)
echo 2. Run the mount script: mount_ec2.bat
echo.
pause 