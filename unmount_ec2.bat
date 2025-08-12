@echo off
echo 🔌 Unmounting EC2 directory...

set LOCAL_MOUNT=C:\EC2-Mount

REM Unmount the directory
echo 🔗 Unmounting %LOCAL_MOUNT%...
fusermount -u "%LOCAL_MOUNT%"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully unmounted EC2 directory
    echo.
    echo 📂 To remount, run: mount_ec2.bat
) else (
    echo ❌ Failed to unmount directory
    echo.
    echo 🔧 Alternative unmount methods:
    echo 1. Use Windows Explorer: Right-click on %LOCAL_MOUNT% and select "Disconnect"
    echo 2. Use Task Manager: End any processes using the mount
)

pause 