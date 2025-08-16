# Redis Configuration for Hedge Fund Trading Platform

## Overview

This document explains the Redis configuration for the Hedge Fund Trading Platform, including recent fixes and best practices for deployment.

## Configuration Details

The Redis configuration has been updated to address several issues:

1. **Import Path Resolution**: Fixed the import path in `src/backend/config/redis.py` to use a more reliable approach.
2. **Rate Limiter Integration**: Added a proper `RateLimiter` class that integrates with the Redis cache.
3. **Docker Environment Support**: Updated Docker configuration to ensure proper Redis connectivity.
4. **Error Handling**: Improved error handling for Redis connection failures.

## Key Components

### Redis Cache

The `RedisCache` class in `src/backend/config/redis.py` provides the following functionality:

- Connection pooling for efficient Redis usage
- JSON serialization for storing complex data structures
- Comprehensive error handling
- Rate limiting capabilities
- Connection status verification

### Rate Limiter

The `RateLimiter` class provides:

- API rate limiting based on keys (e.g., IP addresses)
- Configurable limits and time windows
- Remaining quota tracking
- Reset time calculation

## Docker Configuration

The Docker setup has been updated to ensure proper Redis connectivity:

- Redis service is configured with health checks
- Backend service waits for Redis to be healthy before starting
- Proper environment variables are set for Redis connection
- Python path is configured correctly in the Docker container

## Testing Redis Connection

A test script has been provided at `src/test_redis_connection.py` to verify Redis connectivity and functionality. To run the test:

```bash
python src/test_redis_connection.py
```

## Troubleshooting

If you encounter Redis connection issues:

1. **Check Redis Service**: Ensure the Redis service is running and healthy
   ```bash
   docker-compose ps redis
   ```

2. **Verify Connection URL**: Check that the `REDIS_URL` environment variable is set correctly
   ```bash
   echo $REDIS_URL
   ```

3. **Test Connection**: Use the test script to verify connectivity
   ```bash
   python src/test_redis_connection.py
   ```

4. **Check Logs**: Examine Redis logs for any errors
   ```bash
   docker-compose logs redis
   ```

5. **Network Issues**: Ensure the Docker network is configured correctly
   ```bash
   docker network ls
   docker network inspect <network_name>
   ```

## Best Practices

1. **Use Connection Pooling**: Always use connection pooling for Redis to avoid connection overhead
2. **Handle Connection Failures**: Always check if Redis is connected before performing operations
3. **Set Timeouts**: Configure appropriate timeouts for Redis operations
4. **Monitor Redis**: Set up monitoring for Redis to track usage and performance
5. **Use Health Checks**: Configure health checks for Redis in Docker Compose