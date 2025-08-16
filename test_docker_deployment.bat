@echo off
REM Test Docker Deployment for Hedge Fund Trading Platform
REM This script tests the Docker deployment and verifies Redis connectivity

echo ===== Testing Docker Deployment =====

REM Check if Docker is running
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Docker is not running or not installed
  exit /b 1
)

echo Docker is running

REM Stop any existing containers
echo.
echo ===== Stopping existing containers =====
docker-compose down

REM Start the containers
echo.
echo ===== Starting containers =====
docker-compose up -d

REM Wait for containers to start
echo.
echo ===== Waiting for containers to start =====
timeout /t 10 /nobreak > nul

REM Check container status
echo.
echo ===== Container status =====
docker-compose ps

REM Check Redis container
echo.
echo ===== Redis container status =====
docker-compose ps | findstr "redis.*Up"
if %ERRORLEVEL% neq 0 (
  echo Error: Redis container is not running
  docker-compose logs redis
  exit /b 1
)

echo Redis container is running

REM Check Redis connection
echo.
echo ===== Testing Redis connection =====
docker-compose exec redis redis-cli PING

REM Check Redis configuration
echo.
echo ===== Redis configuration =====
docker-compose exec redis redis-cli INFO | findstr "redis_version connected_clients used_memory_human role"

REM Test Redis from backend
echo.
echo ===== Testing Redis from backend =====
docker-compose exec backend python src/test_redis_connection.py

REM Check backend logs for Redis errors
echo.
echo ===== Checking backend logs for Redis errors =====
docker-compose logs backend | findstr /i "redis.*error"

REM Check if backend is healthy
echo.
echo ===== Backend health check =====
curl -s http://localhost:8000/api/health

echo.
echo ===== Test completed =====
echo If no errors were reported, the deployment is working correctly