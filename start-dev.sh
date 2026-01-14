#!/bin/bash

# Cloudflare Blog Dev Environment Startup Script
# Interactive foreground startup, background version recommended

echo "=== Cloudflare Blog Dev Environment Startup ==="
echo "Linux/macOS Version - Interactive Foreground Startup"
echo

echo "Recommended to use background startup scripts, which can:"
echo "  1. Run server in background"
echo "  2. View real-time logs"
echo "  3. Easily stop and restart"
echo
echo "Available scripts:"
echo "  ./start-dev-background.sh - Background startup (recommended)"
echo "  ./stop-dev.sh             - Stop server"
echo "  ./restart-dev.sh          - Restart server"
echo
read -p "Continue with interactive foreground startup? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo
    echo "Please use: ./start-dev-background.sh"
    sleep 3
    exit 0
fi

echo
echo "Starting interactive development server..."
echo "Press Ctrl+C to stop server"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed, please install Node.js first"
    exit 1
fi

# Run cross-platform startup script
node start-dev.js

# If script execution fails, show error message
if [ $? -ne 0 ]; then
    echo
    echo "[ERROR] Startup failed, please check above error messages"
    exit 1
fi