"""
Main test runner script for the entire project.
"""
import unittest
import os
import sys
import subprocess
import time

def run_all_tests():
    """
    Run all tests in the project.
    """
    print("=" * 80)
    print("Running all tests for the Hedge Fund Trading Application")
    print("=" * 80)
    
    # Track overall success
    all_successful = True
    
    # Run ML model tests
    print("\n" + "=" * 40)
    print("Running ML Model Tests")
    print("=" * 40)
    ml_test_path = os.path.join("src", "ml_models", "price_prediction", "tests", "run_tests.py")
    ml_result = subprocess.run([sys.executable, ml_test_path], capture_output=True, text=True)
    print(ml_result.stdout)
    if ml_result.stderr:
        print("ERRORS:")
        print(ml_result.stderr)
    if ml_result.returncode != 0:
        all_successful = False
        print(f"ML Model Tests FAILED with exit code {ml_result.returncode}")
    else:
        print("ML Model Tests PASSED")
    
    # Run API tests
    print("\n" + "=" * 40)
    print("Running API Tests")
    print("=" * 40)
    api_test_path = os.path.join("src", "backend", "api", "tests", "run_tests.py")
    api_result = subprocess.run([sys.executable, api_test_path], capture_output=True, text=True)
    print(api_result.stdout)
    if api_result.stderr:
        print("ERRORS:")
        print(api_result.stderr)
    if api_result.returncode != 0:
        all_successful = False
        print(f"API Tests FAILED with exit code {api_result.returncode}")
    else:
        print("API Tests PASSED")
    
    # Print overall result
    print("\n" + "=" * 80)
    if all_successful:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
    print("=" * 80)
    
    return 0 if all_successful else 1

if __name__ == "__main__":
    sys.exit(run_all_tests())