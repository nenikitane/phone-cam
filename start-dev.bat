@echo off
echo 🚀 Starting PhoneCam development environment...

REM Check if node_modules exist
if not exist node_modules (
    echo 📦 Installing root dependencies...
    npm install
)

REM Start signaling server
echo 🔌 Starting signaling server...
cd packages\signaling-server
if not exist node_modules npm install
npm run build
start "Signaling Server" cmd /k npm run dev
cd ..\..

REM Wait a bit
timeout /t 2 >nul

REM Start phone app
echo 📱 Starting phone app (Expo)...
cd apps\phone
if not exist node_modules npm install
start "Phone App (Expo)" cmd /k npm run start
cd ..\..

REM Start desktop app
echo 🖥️  Starting desktop app (Electron)...
cd apps\desktop
if not exist node_modules npm install
start "Desktop App (Electron)" cmd /k npm run dev
cd ..\..

echo.
echo ✅ All services started!
echo.
echo 📋 Access points:
echo    Signaling Server: ws://localhost:8080 (or your LAN IP)
echo    Phone App:        Expo Go / Simulator
echo    Desktop App:      Electron window
echo.
echo Press any key to stop all services...
pause >nul

REM Kill all child processes
taskkill /F /T /PID %SIGNALING_PID% 2>nul
taskkill /F /T /PID %PHONE_PID% 2>nul
taskkill /F /T /PID %DESKTOP_PID% 2>nul