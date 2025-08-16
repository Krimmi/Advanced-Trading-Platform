"""
Test script to verify Redis connection.
"""
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.backend.config.redis import redis_cache, rate_limiter

def test_redis_connection():
    """Test Redis connection and functionality."""
    print("Testing Redis connection...")
    
    # Test connection
    is_connected = redis_cache.is_connected()
    print(f"Redis connection status: {'Connected' if is_connected else 'Not connected'}")
    
    if is_connected:
        # Test basic operations
        print("\nTesting basic Redis operations:")
        
        # Set a value
        set_result = redis_cache.set("test_key", {"message": "Hello Redis!"})
        print(f"Set operation result: {set_result}")
        
        # Get the value
        get_result = redis_cache.get("test_key")
        print(f"Get operation result: {get_result}")
        
        # Test existence
        exists_result = redis_cache.exists("test_key")
        print(f"Exists operation result: {exists_result}")
        
        # Test rate limiting
        print("\nTesting rate limiting:")
        limit_result = rate_limiter.is_rate_limited("test_rate_limit", 10, 60)
        print(f"Rate limit check result: {'Limited' if limit_result else 'Not limited'}")
        
        reset_time = rate_limiter.get_reset_time("test_rate_limit")
        print(f"Rate limit reset time: {reset_time} seconds")
        
        # Clean up
        delete_result = redis_cache.delete("test_key")
        print(f"\nCleanup - Delete operation result: {delete_result}")
    
    print("\nRedis connection test completed.")

if __name__ == "__main__":
    test_redis_connection()