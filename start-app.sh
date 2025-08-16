#!/bin/bash

echo "==================================================="
echo "Hedge Fund Trading Platform - Docker Startup Script"
echo "==================================================="
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed."
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker Desktop or Docker service."
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Starting Hedge Fund Trading Platform..."
echo "This may take a few minutes on first run as Docker images are downloaded and built."
echo

# Create directory for docker-init if it doesn't exist
mkdir -p docker-init

# Make sure the script is executable
chmod +x start-app.sh

# Start the application with Docker Compose
docker-compose up -d

echo
echo "Waiting for services to start..."
sleep 15

echo
echo "==================================================="
echo "Hedge Fund Trading Platform is now running!"
echo
echo "Access the application at: http://localhost:3000"
echo "API documentation at: http://localhost:8000/api/docs"
echo
echo "To stop the application, run: docker-compose down"
echo "==================================================="
echo

read -p "Press Enter to continue..."