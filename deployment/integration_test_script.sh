#!/bin/bash
# Comprehensive Integration Test Script for Hedge Fund Trading Application

echo "Starting integration tests..."
echo "============================="

# Set environment to testing
export NODE_ENV=testing

# Step 1: Database Connection Tests
echo "Testing database connections..."
node ./scripts/test-db-connection.js
if [ $? -ne 0 ]; then
  echo "ERROR: Database connection test failed!"
  exit 1
fi
echo "Database connection tests passed."

# Step 2: API Service Tests
echo "Testing API services..."
npm run test:api
if [ $? -ne 0 ]; then
  echo "ERROR: API service tests failed!"
  exit 1
fi
echo "API service tests passed."

# Step 3: Data Provider Integration Tests
echo "Testing data provider integrations..."
npm run test:data-providers
if [ $? -ne 0 ]; then
  echo "ERROR: Data provider integration tests failed!"
  exit 1
fi
echo "Data provider integration tests passed."

# Step 4: Authentication Flow Tests
echo "Testing authentication flows..."
npm run test:auth
if [ $? -ne 0 ]; then
  echo "ERROR: Authentication flow tests failed!"
  exit 1
fi
echo "Authentication flow tests passed."

# Step 5: End-to-End Trading Flow Tests
echo "Testing end-to-end trading flows..."
npm run test:e2e:trading
if [ $? -ne 0 ]; then
  echo "ERROR: End-to-end trading flow tests failed!"
  exit 1
fi
echo "End-to-end trading flow tests passed."

# Step 6: Performance Tests
echo "Running performance tests..."
npm run test:performance
if [ $? -ne 0 ]; then
  echo "WARNING: Performance tests did not meet all targets."
  # Not failing the build for performance issues, but flagging
fi
echo "Performance tests completed."

# Step 7: Security Tests
echo "Running security scans..."
npm run test:security
if [ $? -ne 0 ]; then
  echo "ERROR: Security tests failed!"
  exit 1
fi
echo "Security tests passed."

# Step 8: Load Tests
echo "Running load tests..."
npm run test:load
if [ $? -ne 0 ]; then
  echo "WARNING: Load tests did not meet all targets."
  # Not failing the build for load issues, but flagging
fi
echo "Load tests completed."

echo "============================="
echo "All integration tests completed successfully!"
exit 0