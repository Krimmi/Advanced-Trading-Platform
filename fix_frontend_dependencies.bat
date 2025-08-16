@echo off
REM Script to fix frontend dependencies for the Hedge Fund Trading Platform

echo ===== Fixing Frontend Dependencies =====

REM Navigate to the frontend directory
cd hedge-fund-app || exit /b 1

REM Remove node_modules and package-lock.json
echo Removing existing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

REM Install ajv explicitly first with legacy-peer-deps flag
echo Installing ajv explicitly...
call npm install --save ajv@^8.0.0 --legacy-peer-deps

REM Install other dependencies with legacy-peer-deps flag
echo Installing all dependencies...
call npm install --legacy-peer-deps

echo Frontend dependencies fixed!
