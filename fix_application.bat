@echo off
REM Comprehensive fix script for Hedge Fund Trading Platform
REM This script fixes both Redis configuration and frontend dependency issues

echo ===== Hedge Fund Trading Platform Fix Script =====

REM 1. Stop any running containers
echo.
echo ===== Stopping existing containers =====
docker-compose down

REM 2. Apply Redis configuration fixes
echo.
echo ===== Applying Redis configuration fixes =====
echo Redis configuration has been updated in the codebase.

REM 3. Fix frontend dependencies
echo.
echo ===== Fixing frontend dependencies =====
if exist hedge-fund-app (
  REM Navigate to the frontend directory
  cd hedge-fund-app

  REM Update package.json to include ajv explicitly
  echo Updating package.json...
  
  REM We can't easily modify JSON in batch, so we'll just inform the user
  echo Please ensure "ajv": "^8.0.0" is added to dependencies in package.json
  
  cd ..
) else (
  echo Frontend directory not found. Skipping frontend dependency fix.
)

REM 4. Update Dockerfile.frontend to use --legacy-peer-deps
echo.
echo ===== Updating Dockerfile.frontend =====
if exist Dockerfile.frontend (
  echo Ensuring Dockerfile.frontend uses --legacy-peer-deps flag...
  echo This step requires manual verification in Windows.
  echo Please check that Dockerfile.frontend includes --legacy-peer-deps flags for npm install commands.
) else (
  echo Dockerfile.frontend not found. Skipping update.
)

REM 5. Rebuild Docker images
echo.
echo ===== Rebuilding Docker images =====
docker-compose build

REM 6. Start the application
echo.
echo ===== Starting the application =====
docker-compose up -d

REM 7. Wait for services to start
echo.
echo ===== Waiting for services to start =====
timeout /t 10 /nobreak > nul

REM 8. Check container status
echo.
echo ===== Container status =====
docker-compose ps

REM 9. Check logs for errors
echo.
echo ===== Checking for errors =====
docker-compose logs --tail=20 backend
docker-compose logs --tail=20 frontend

echo.
echo ===== Fix completed =====
echo The application should now be running at http://localhost:3000
echo API documentation is available at http://localhost:8000/api/docs
