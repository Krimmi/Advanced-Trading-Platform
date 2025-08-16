# Hedge Fund Trading Platform - Docker Setup

This guide explains how to run the Hedge Fund Trading Platform using Docker, which eliminates the need for manual installation of dependencies like PostgreSQL, Redis, and other components.

## Prerequisites

The only requirement is Docker:

- **Windows/Mac**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

## Quick Start

### Windows

1. Double-click the `start-app.bat` file
2. Wait for the application to start (this may take a few minutes on first run)
3. Access the application at http://localhost:3000

### macOS/Linux

1. Open Terminal
2. Navigate to the project directory
3. Make the start script executable:
   ```bash
   chmod +x start-app.sh
   ```
4. Run the start script:
   ```bash
   ./start-app.sh
   ```
5. Access the application at http://localhost:3000

## Manual Start

If you prefer to start the application manually:

```bash
# Start all services
docker-compose up -d

# Check the status of the services
docker-compose ps

# View logs
docker-compose logs -f
```

## Stopping the Application

```bash
docker-compose down
```

## Resetting the Application

To completely reset the application, including all data:

```bash
docker-compose down -v
```

This will remove all containers and volumes, giving you a fresh start.

## Default Credentials

The application is pre-configured with a demo account:

- **Username**: demo
- **Password**: password

## Configuration

### API Keys

To use real market data, you'll need to obtain API keys from various providers. Edit the `docker-compose.yml` file and update the environment variables for the backend service:

```yaml
backend:
  environment:
    - FMP_API_KEY=your_fmp_api_key
    - ALPACA_KEY_ID=your_alpaca_key_id
    - ALPACA_SECRET_KEY=your_alpaca_secret_key
    - IEX_PUBLIC_TOKEN=your_iex_public_token
    - IEX_SECRET_TOKEN=your_iex_secret_token
    - POLYGON_API_KEY=your_polygon_api_key
    - FINNHUB_API_KEY=your_finnhub_api_key
```

After updating the API keys, restart the application:

```bash
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Application Not Starting

Check the logs for errors:

```bash
docker-compose logs
```

### Database Connection Issues

Ensure the PostgreSQL container is running:

```bash
docker-compose ps postgres
```

### Redis Connection Issues

If you encounter Redis-related errors:

1. Check if Redis container is running:
   ```bash
   docker-compose ps redis
   ```

2. Verify Redis logs:
   ```bash
   docker-compose logs redis
   ```

3. Test Redis connection from the backend:
   ```bash
   docker-compose exec backend python src/test_redis_connection.py
   ```

4. Check Redis configuration:
   ```bash
   docker-compose exec redis redis-cli CONFIG GET *
   ```

5. Restart Redis service:
   ```bash
   docker-compose restart redis
   ```

### Port Conflicts

If you have services already using ports 3000, 8000, 5432, or 6379, you'll need to modify the port mappings in the `docker-compose.yml` file.

### Performance Issues

Docker on Windows/Mac may have limited resources by default. Consider increasing the memory and CPU allocation in Docker Desktop settings.

## Advanced Usage

### Accessing the Database Directly

```bash
docker-compose exec postgres psql -U postgres -d hedge_fund_app
```

### Accessing Redis

```bash
docker-compose exec redis redis-cli
```

Common Redis commands:
```
PING                  # Test connection
INFO                  # Get Redis server information
KEYS *                # List all keys (use with caution in production)
GET <key>             # Get value for a specific key
TTL <key>             # Check time-to-live for a key
MONITOR               # Monitor Redis commands in real-time
```

### Testing Redis Rate Limiting

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Check rate limit keys
KEYS *rate*

# Get current count for a rate limit key
GET rate:ip:127.0.0.1

# Check TTL for a rate limit key
TTL rate:ip:127.0.0.1
```

### Rebuilding Containers After Code Changes

```bash
docker-compose build
docker-compose up -d
```

## Redis Configuration

The Redis configuration has been updated to provide better reliability and error handling. Key improvements include:

1. Fixed import paths for better compatibility in Docker environments
2. Added proper rate limiting implementation
3. Improved error handling for Redis connection failures
4. Added connection pooling for better performance

For more details on Redis configuration, see the [REDIS_CONFIGURATION.md](REDIS_CONFIGURATION.md) file.