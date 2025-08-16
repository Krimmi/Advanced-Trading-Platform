#!/bin/bash

# Script to fix frontend dependencies for the Hedge Fund Trading Platform

echo "===== Fixing Frontend Dependencies ====="

# Navigate to the frontend directory
cd hedge-fund-app || exit 1

# Remove node_modules and package-lock.json
echo "Removing existing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

# Install ajv explicitly first with legacy-peer-deps flag
echo "Installing ajv explicitly..."
npm install --save ajv@^8.0.0 --legacy-peer-deps

# Install other dependencies with legacy-peer-deps flag
echo "Installing all dependencies..."
npm install --legacy-peer-deps

echo "Frontend dependencies fixed!"
