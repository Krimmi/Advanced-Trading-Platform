#!/bin/bash

# Start the Hedge Fund Trading Application

echo "Starting NinjaTech Hedge Fund Trading Platform..."
echo "==============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to continue."
    exit 1
fi

# Display Node.js and npm versions
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "Dependencies installed successfully."
else
    echo "Dependencies already installed."
fi

# Start the development server
echo
echo "Starting development server..."
echo "The application will be available at http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server."
echo

npm start