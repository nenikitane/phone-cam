#!/bin/bash
# Development startup script for PhoneCam

set -e

echo "🚀 Starting PhoneCam development environment..."

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

# Start signaling server in background
echo "🔌 Starting signaling server..."
cd packages/signaling-server
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
npm run dev &
SIGNALING_PID=$!
cd ../..

# Wait for signaling server
sleep 2

# Start phone app
echo "📱 Starting phone app (Expo)..."
cd apps/phone
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run start &
PHONE_PID=$!
cd ../..

# Start desktop app
echo "🖥️  Starting desktop app (Electron)..."
cd apps/desktop
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
DESKTOP_PID=$!
cd ../..

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Access points:"
echo "   Signaling Server: ws://localhost:8080 (or your LAN IP)"
echo "   Phone App:        Expo Go / Simulator"
echo "   Desktop App:      Electron window"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C
trap "echo 'Stopping...'; kill $SIGNALING_PID $PHONE_PID $DESKTOP_PID 2>/dev/null; exit" INT

# Wait
wait