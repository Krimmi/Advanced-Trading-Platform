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

### Rebuilding Containers After Code Changes

```bash
docker-compose build
docker-compose up -d
```