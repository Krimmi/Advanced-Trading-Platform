#!/bin/bash

# Comprehensive fix script for Hedge Fund Trading Platform
# This script fixes both Redis configuration and frontend dependency issues

echo "===== Hedge Fund Trading Platform Fix Script ====="

# 1. Stop any running containers
echo -e "\
===== Stopping existing containers ====="
docker-compose down

# 2. Apply Redis configuration fixes
echo -e "\
===== Applying Redis configuration fixes ====="
echo "Redis configuration has been updated in the codebase."

# 3. Fix frontend dependencies
echo -e "\
===== Fixing frontend dependencies ====="
if [ -d "hedge-fund-app" ]; then
  # Navigate to the frontend directory
  cd hedge-fund-app || exit 1

  # Update package.json to include ajv explicitly
  echo "Updating package.json..."
  if ! grep -q '"ajv":' package.json; then
    # Use sed to add ajv dependency before the last closing brace in dependencies
    sed -i 's/"dependencies": {/"dependencies": {\
    "ajv": "^8.0.0",/g' package.json
  fi

  cd ..
else
  echo "Frontend directory not found. Skipping frontend dependency fix."
fi

# 4. Update Dockerfile.frontend to use --legacy-peer-deps
echo -e "\
===== Updating Dockerfile.frontend ====="
if [ -f "Dockerfile.frontend" ]; then
  echo "Ensuring Dockerfile.frontend uses --legacy-peer-deps flag..."
  if ! grep -q -- "--legacy-peer-deps" Dockerfile.frontend; then
    sed -i 's/npm install --save/npm install --save --legacy-peer-deps/g' Dockerfile.frontend
    sed -i 's/npm install$/npm install --legacy-peer-deps/g' Dockerfile.frontend
  fi
else
  echo "Dockerfile.frontend not found. Skipping update."
fi

# 5. Rebuild Docker images
echo -e "\
===== Rebuilding Docker images ====="
docker-compose build

# 6. Start the application
echo -e "\
===== Starting the application ====="
docker-compose up -d

# 7. Wait for services to start
echo -e "\
===== Waiting for services to start ====="
sleep 10

# 8. Check container status
echo -e "\
===== Container status ====="
docker-compose ps

# 9. Check logs for errors
echo -e "\
===== Checking for errors ====="
docker-compose logs --tail=20 backend
docker-compose logs --tail=20 frontend

echo -e "\
===== Fix completed ====="
echo "The application should now be running at http://localhost:3000"
echo "API documentation is available at http://localhost:8000/api/docs"
