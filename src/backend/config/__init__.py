"""
Configuration package for the Ultimate Hedge Fund & Trading Application.
"""
from .redis import redis_cache, get_redis_cache

# Export the rate_limiter for use in the API
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

# Create a rate limiter instance using the Redis cache
rate_limiter = RateLimiter(redis_cache)