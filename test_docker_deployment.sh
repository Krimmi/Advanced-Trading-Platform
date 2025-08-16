#!/bin/bash

# Test Docker Deployment for Hedge Fund Trading Platform
# This script tests the Docker deployment and verifies Redis connectivity

echo "===== Testing Docker Deployment ====="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running or not installed"
  exit 1
fi

echo "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
  echo "Error: docker-compose is not installed"
  exit 1
fi

echo "docker-compose is available"

# Stop any existing containers
echo -e "\n===== Stopping existing containers ====="
docker-compose down

# Start the containers
echo -e "\n===== Starting containers ====="
docker-compose up -d

# Wait for containers to start
echo -e "\n===== Waiting for containers to start ====="
sleep 10

# Check container status
echo -e "\n===== Container status ====="
docker-compose ps

# Check Redis container
echo -e "\n===== Redis container status ====="
REDIS_RUNNING=$(docker-compose ps | grep redis | grep "Up" | wc -l)
if [ $REDIS_RUNNING -eq 1 ]; then
  echo "Redis container is running"
else
  echo "Error: Redis container is not running"
  docker-compose logs redis
  exit 1
fi

# Check Redis connection
echo -e "\n===== Testing Redis connection ====="
docker-compose exec -T redis redis-cli PING

# Check Redis configuration
echo -e "\n===== Redis configuration ====="
docker-compose exec -T redis redis-cli INFO | grep -E "redis_version|connected_clients|used_memory_human|role"

# Test Redis from backend
echo -e "\n===== Testing Redis from backend ====="
docker-compose exec -T backend python src/test_redis_connection.py

# Check backend logs for Redis errors
echo -e "\n===== Checking backend logs for Redis errors ====="
docker-compose logs backend | grep -i redis | grep -i error

# Check if backend is healthy
echo -e "\n===== Backend health check ====="
BACKEND_URL="http://localhost:8000/api/health"
curl -s $BACKEND_URL | grep -q "healthy"
if [ $? -eq 0 ]; then
  echo "Backend is healthy"
else
  echo "Error: Backend health check failed"
  curl -s $BACKEND_URL
  echo ""
  docker-compose logs backend | tail -n 50
fi

echo -e "\n===== Test completed ====="
echo "If no errors were reported, the deployment is working correctly"