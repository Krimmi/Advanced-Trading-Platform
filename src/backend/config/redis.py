"""
Redis configuration for the Ultimate Hedge Fund & Trading Application.
This module sets up Redis for caching and rate limiting.
"""
import redis
import json
import logging
from typing import Any, Optional, Union, Dict
from datetime import timedelta

# Import configuration - simplified import path
from config.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Redis connection pool
try:
    redis_pool = redis.ConnectionPool.from_url(
        settings.REDIS_URL,
        max_connections=10,
        socket_timeout=5,
        socket_connect_timeout=5,
        health_check_interval=30
    )
    logger.info(f"Redis connection pool created for {settings.REDIS_URL}")
except Exception as e:
    logger.error(f"Failed to create Redis connection pool: {e}")
    redis_pool = None

class RedisCache:
    """
    Redis cache implementation for the application.
    """
    def __init__(self):
        """
        Initialize the Redis cache.
        """
        self.redis = redis.Redis(connection_pool=redis_pool) if redis_pool else None
        
    def is_connected(self) -> bool:
        """
        Check if Redis is connected.
        """
        if not self.redis:
            return False
        try:
            return self.redis.ping()
        except:
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping cache get")
            return None
        
        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting value from Redis: {e}")
            return None
    
    def set(self, key: str, value: Any, expiration: Optional[int] = None) -> bool:
        """
        Set a value in the cache.
        
        Args:
            key: The cache key
            value: The value to cache (will be JSON serialized)
            expiration: Expiration time in seconds
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping cache set")
            return False
        
        try:
            serialized = json.dumps(value)
            if expiration:
                return self.redis.setex(key, expiration, serialized)
            else:
                return self.redis.set(key, serialized)
        except Exception as e:
            logger.error(f"Error setting value in Redis: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete a value from the cache.
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping cache delete")
            return False
        
        try:
            return bool(self.redis.delete(key))
        except Exception as e:
            logger.error(f"Error deleting value from Redis: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """
        Check if a key exists in the cache.
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping cache exists check")
            return False
        
        try:
            return bool(self.redis.exists(key))
        except Exception as e:
            logger.error(f"Error checking if key exists in Redis: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment a counter in the cache.
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping cache increment")
            return None
        
        try:
            return self.redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing value in Redis: {e}")
            return None
    
    def rate_limit(self, key: str, limit: int, period: int) -> Dict[str, Union[bool, int]]:
        """
        Implement rate limiting using Redis.
        
        Args:
            key: The rate limit key (e.g., 'rate:ip:127.0.0.1')
            limit: Maximum number of requests
            period: Time period in seconds
            
        Returns:
            Dict with 'allowed' (bool) and 'remaining' (int) keys
        """
        if not self.is_connected():
            logger.warning("Redis not connected, skipping rate limiting")
            return {"allowed": True, "remaining": limit}
        
        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            
            # Get current count
            pipe.get(key)
            
            # Increment counter
            pipe.incr(key)
            
            # Set expiration if key is new
            pipe.expire(key, period)
            
            # Execute pipeline
            result = pipe.execute()
            
            # Get current count (after increment)
            current = int(result[1])
            
            # Check if under limit
            allowed = current <= limit
            remaining = max(0, limit - current)
            
            return {
                "allowed": allowed,
                "remaining": remaining
            }
        except Exception as e:
            logger.error(f"Error in rate limiting: {e}")
            return {"allowed": True, "remaining": limit}

# Create a singleton instance
redis_cache = RedisCache()

# Function to get the Redis cache instance
def get_redis_cache() -> RedisCache:
    """
    Get the Redis cache instance.
    """
    return redis_cache

# Rate limiter class for API rate limiting
class RateLimiter:
    """
    Rate limiter wrapper for Redis cache.
    """
    def __init__(self, redis_cache_instance):
        self.redis_cache = redis_cache_instance
    
    def is_rate_limited(self, key: str, limit: int, period: int) -> bool:
        """
        Check if a request is rate limited.
        
        Args:
            key: The rate limit key (e.g., 'rate:ip:127.0.0.1')
            limit: Maximum number of requests
            period: Time period in seconds
            
        Returns:
            bool: True if rate limited, False otherwise
        """
        result = self.redis_cache.rate_limit(key, limit, period)
        return not result["allowed"]
    
    def get_reset_time(self, key: str) -> int:
        """
        Get the time until rate limit reset in seconds.
        
        Args:
            key: The rate limit key
            
        Returns:
            int: Seconds until reset
        """
        # This is a simple implementation - in a real app, we'd store the reset time in Redis
        # For now, we'll just return a default value of 60 seconds
        return 60

# Create a rate limiter instance
rate_limiter = RateLimiter(redis_cache)