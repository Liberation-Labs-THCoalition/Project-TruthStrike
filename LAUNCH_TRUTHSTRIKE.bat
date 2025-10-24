@echo off
echo =========================================
echo      TRUTHSTRIKE LAUNCHER v1.0
echo      Counter-Propaganda Infrastructure
echo =========================================
echo.

echo [1/3] Starting Pattern Update Server...
start "TruthStrike API Server" cmd /k "cd api && python server.py"
timeout /t 2 >nul

echo [2/3] Opening Dashboard...
start "" "dashboard/index.html"

echo [3/3] Extension Ready for Installation
echo.
echo =========================================
echo   INSTALLATION INSTRUCTIONS:
echo =========================================
echo.
echo 1. Open Chrome/Brave browser
echo 2. Navigate to: chrome://extensions/
echo 3. Enable "Developer mode" (top right)
echo 4. Click "Load unpacked"
echo 5. Select the "extension" folder
echo.
echo =========================================
echo   API SERVER: http://localhost:5000
echo   DASHBOARD: dashboard/index.html
echo =========================================
echo.
echo The pattern server is running in the background.
echo Close this window to stop all services.
echo.
pause