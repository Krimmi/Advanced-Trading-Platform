@echo off
echo ===================================================
echo Hedge Fund Trading Platform - Docker Startup Script
echo ===================================================
echo.

REM Check if Docker is installed
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed or not in PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo Starting Hedge Fund Trading Platform...
echo This may take a few minutes on first run as Docker images are downloaded and built.
echo.

REM Create directory for docker-init if it doesn't exist
if not exist docker-init mkdir docker-init

REM Start the application with Docker Compose
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak > nul

echo.
echo ===================================================
echo Hedge Fund Trading Platform is now running!
echo.
echo Access the application at: http://localhost:3000
echo API documentation at: http://localhost:8000/api/docs
echo.
echo To stop the application, run: docker-compose down
echo ===================================================
echo.

pause