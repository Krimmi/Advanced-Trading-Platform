# Hedge Fund Trading Platform

An advanced trading application with ML/AI capabilities for hedge fund operations, featuring global infrastructure and security enhancements.

## Features

### Core Trading Functionality
- Real-time market data visualization
- Backtesting of trading strategies
- Machine learning model integration
- Portfolio management and optimization
- Risk analysis and management

### Advanced Capabilities
- Natural Language Processing (NLP) for market sentiment analysis
- Algorithmic trading framework
- Strategy marketplace
- Advanced visualization components
- Personalized dashboards

### Global Infrastructure
- Multi-region deployment (US East, EU West, Asia Pacific)
- Data sovereignty compliance
- Zero-trust security model
- Global latency optimization

## Technology Stack

### Frontend
- React with TypeScript
- Material-UI for component library
- Redux for state management
- Chart.js and D3.js for visualizations
- WebSocket for real-time data

### Backend
- Python with FastAPI
- PostgreSQL/TimescaleDB for data storage
- Redis for caching and real-time features
- Machine Learning with TensorFlow/scikit-learn

### Infrastructure
- Kubernetes for container orchestration
- Terraform for infrastructure as code
- Istio service mesh for zero-trust security
- Global load balancing with AWS Global Accelerator

## Getting Started

### Docker Setup (Recommended)

The easiest way to get started is using Docker:

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000/api/docs
```

For detailed Docker setup instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

### Manual Installation

If you prefer manual installation:

1. Clone the repository
```bash
git clone https://github.com/yourusername/hedge-fund-trading-platform.git
cd hedge-fund-trading-platform
```

2. Set up the backend
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your configuration
# See .env.example for required variables
```

3. Set up the frontend
```bash
cd hedge-fund-app
npm install
npm start
```

4. Access the application
```
http://localhost:3000
```

For detailed manual installation instructions, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).

## Testing the Deployment

We provide scripts to test your deployment:

```bash
# For Linux/macOS
./test_docker_deployment.sh

# For Windows
test_docker_deployment.bat
```

These scripts verify that all components, including Redis, are functioning correctly.

## Redis Configuration

The platform uses Redis for:
- Caching frequently accessed data
- Rate limiting API requests
- Real-time data processing
- Session management

For detailed Redis configuration information, see [REDIS_CONFIGURATION.md](REDIS_CONFIGURATION.md).

## Using Real Market Data

The application is designed to work with both mock data and real market data. By default, it uses mock data for development and testing purposes. To use real market data, you need to configure API keys.

### Required APIs

For full functionality with real data, the following APIs are recommended:

- **Alpha Vantage** - For stock, forex, and crypto data
- **Polygon.io** - For higher frequency market updates
- **IEX Cloud** - For financial data and fundamentals
- **Alpaca** - For commission-free stock trading
- **Financial Modeling Prep** - For fundamental data

## Global Deployment

The platform is designed for global deployment across multiple regions:

- **US East (N. Virginia)** - Primary region
- **EU West (Ireland)** - GDPR-compliant region
- **Asia Pacific (Singapore)** - PDPA-compliant region

Each region includes:
- Regional API endpoints
- Data residency controls
- Compliance with local regulations
- Optimized latency for local users

## Security Features

- Zero-trust security model with identity-based access controls
- Service micro-segmentation with Istio
- Continuous verification mechanisms
- Advanced threat protection with behavioral analysis
- Comprehensive audit logging

## Troubleshooting

If you encounter issues:

1. Check the [DOCKER_SETUP.md](DOCKER_SETUP.md) for common Docker-related issues
2. For Redis-specific issues, see [REDIS_CONFIGURATION.md](REDIS_CONFIGURATION.md)
3. Run the test scripts to diagnose deployment problems

## License

This project is licensed under the MIT License - see the LICENSE file for details