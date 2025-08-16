# Comprehensive Installation Guide for Hedge Fund Trading Platform

This guide provides detailed instructions for setting up the Hedge Fund Trading Platform, including all prerequisites and dependencies.

## Table of Contents
1. [Prerequisites Installation](#prerequisites-installation)
   - [Node.js and npm](#nodejs-and-npm)
   - [Python and pip](#python-and-pip)
   - [PostgreSQL](#postgresql)
   - [TimescaleDB (Extension for PostgreSQL)](#timescaledb)
   - [Redis](#redis)
   - [Git](#git)
2. [Project Setup](#project-setup)
   - [Clone the Repository](#clone-the-repository)
   - [Environment Configuration](#environment-configuration)
3. [Backend Setup](#backend-setup)
   - [Python Virtual Environment](#python-virtual-environment)
   - [Install Python Dependencies](#install-python-dependencies)
   - [Database Setup](#database-setup)
4. [Frontend Setup](#frontend-setup)
   - [Install Node.js Dependencies](#install-nodejs-dependencies)
   - [Configure Frontend](#configure-frontend)
5. [Running the Application](#running-the-application)
   - [Start the Backend Server](#start-the-backend-server)
   - [Start the Frontend Development Server](#start-the-frontend-development-server)
6. [API Key Configuration](#api-key-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites Installation

### Node.js and npm

#### Windows
1. Download the installer from [Node.js official website](https://nodejs.org/)
2. Run the installer and follow the installation wizard
3. Verify installation by opening Command Prompt and running:
   ```
   node --version
   npm --version
   ```

#### macOS
1. Using Homebrew (recommended):
   ```bash
   brew install node
   ```
2. Alternatively, download the installer from [Node.js official website](https://nodejs.org/)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### Python and pip

#### Windows
1. Download the installer from [Python official website](https://www.python.org/downloads/)
2. Run the installer, check "Add Python to PATH"
3. Verify installation:
   ```
   python --version
   pip --version
   ```

#### macOS
1. Using Homebrew:
   ```bash
   brew install python
   ```
2. Verify installation:
   ```bash
   python3 --version
   pip3 --version
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip
python3 --version
pip3 --version
```

### PostgreSQL

#### Windows
1. Download the installer from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the installation wizard
3. Remember the password you set for the postgres user
4. Add PostgreSQL bin directory to your PATH (usually `C:\Program Files\PostgreSQL\14\bin`)
5. Verify installation:
   ```
   psql --version
   ```

#### macOS
1. Using Homebrew:
   ```bash
   brew install postgresql
   brew services start postgresql
   ```
2. Verify installation:
   ```bash
   psql --version
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
psql --version
```

### TimescaleDB

#### Windows
1. Download the installer for your PostgreSQL version from [TimescaleDB releases](https://docs.timescale.com/install/latest/self-hosted/installation-windows/)
2. Run the installer and follow the instructions
3. Restart PostgreSQL service

#### macOS
1. Using Homebrew:
   ```bash
   brew tap timescale/tap
   brew install timescaledb
   ```
2. Run the post-install script:
   ```bash
   /usr/local/bin/timescaledb_move.sh
   ```
3. Restart PostgreSQL:
   ```bash
   brew services restart postgresql
   ```

#### Linux (Ubuntu/Debian)
```bash
# Add TimescaleDB repository
sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -
sudo apt update

# Install TimescaleDB
sudo apt install timescaledb-postgresql-14

# Configure PostgreSQL
sudo timescaledb-tune --yes

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis

#### Windows
1. Download the Redis for Windows installer from [GitHub](https://github.com/microsoftarchive/redis/releases)
2. Run the installer and follow the instructions
3. Verify installation:
   ```
   redis-cli --version
   ```

#### macOS
1. Using Homebrew:
   ```bash
   brew install redis
   brew services start redis
   ```
2. Verify installation:
   ```bash
   redis-cli --version
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli --version
```

### Git

#### Windows
1. Download the installer from [Git official website](https://git-scm.com/download/win)
2. Run the installer and follow the installation wizard
3. Verify installation:
   ```
   git --version
   ```

#### macOS
1. Using Homebrew:
   ```bash
   brew install git
   ```
2. Verify installation:
   ```bash
   git --version
   ```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install git
git --version
```

## Project Setup

### Clone the Repository
```bash
git clone https://github.com/yourusername/hedge-fund-trading-platform.git
cd hedge-fund-trading-platform
```

### Environment Configuration
Create a `.env` file in the root directory with the following content:

```
# API Keys (replace with your actual keys or leave as is for mock data)
FMP_API_KEY=demo
ALPACA_KEY_ID=your_alpaca_key_id
ALPACA_SECRET_KEY=your_alpaca_secret_key
IEX_PUBLIC_TOKEN=your_iex_public_token
IEX_SECRET_TOKEN=your_iex_secret_token
POLYGON_API_KEY=your_polygon_api_key
FINNHUB_API_KEY=your_finnhub_api_key

# Database Settings
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hedge_fund_app
TIMESCALE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hedge_fund_timeseries

# Redis Settings
REDIS_URL=redis://localhost:6379/0

# Application Settings
DEBUG=true
NODE_ENV=development
REGION=local

# JWT Settings
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION=1440  # 24 hours in minutes
```

## Backend Setup

### Python Virtual Environment
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Install Python Dependencies
```bash
pip install fastapi uvicorn pydantic python-dotenv sqlalchemy psycopg2-binary pandas numpy scikit-learn tensorflow websockets redis httpx pytest pytest-asyncio aiohttp matplotlib seaborn plotly statsmodels scipy
```

### Database Setup

#### Create PostgreSQL Databases
1. Connect to PostgreSQL:
   ```bash
   # On Windows (you might need to provide the password you set during installation)
   psql -U postgres
   
   # On macOS
   psql postgres
   
   # On Linux
   sudo -u postgres psql
   ```

2. Create the databases:
   ```sql
   CREATE DATABASE hedge_fund_app;
   CREATE DATABASE hedge_fund_timeseries;
   ```

3. Enable TimescaleDB extension (for time-series data):
   ```sql
   \c hedge_fund_timeseries
   CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
   ```

4. Exit PostgreSQL:
   ```sql
   \q
   ```

## Frontend Setup

### Install Node.js Dependencies
```bash
# Navigate to the hedge-fund-app directory
cd hedge-fund-app

# Install dependencies
npm install
```

### Configure Frontend
Create a file at `src/config/local.js` with the following content:

```javascript
export default {
  apiBaseUrl: 'http://localhost:8000',
  wsBaseUrl: 'ws://localhost:8000',
  environment: 'development',
  features: {
    'real-time-data': true,
    'advanced-analytics': true,
    'algorithmic-trading': true
  }
};
```

## Running the Application

### Start the Backend Server
In one terminal window (with virtual environment activated):
```bash
# Navigate to the root directory
cd ..

# Start the FastAPI backend server
python -m src.backend.api.main
```

### Start the Frontend Development Server
In another terminal window:
```bash
# Navigate to the hedge-fund-app directory
cd hedge-fund-app

# Start the development server
npm start
```

The application should now be running with:
- Backend API at `http://localhost:8000`
- Frontend at `http://localhost:3000`

## API Key Configuration

For full functionality with real market data, you'll need to obtain API keys from the following services:

1. **Alpha Vantage** - For stock, forex, and crypto data
   - Sign up at: https://www.alphavantage.co/support/#api-key
   - Free tier available

2. **Polygon.io** - For higher frequency market updates
   - Sign up at: https://polygon.io/dashboard/signup
   - Free tier available for historical data

3. **IEX Cloud** - For financial data and fundamentals
   - Sign up at: https://iexcloud.io/cloud-login#/register
   - Free tier available with sandbox environment

4. **Alpaca** - For commission-free stock trading
   - Sign up at: https://app.alpaca.markets/signup
   - Paper trading available for free

5. **Financial Modeling Prep** - For fundamental data
   - Sign up at: https://financialmodelingprep.com/developer/docs/
   - Free tier available

After obtaining the API keys, update your `.env` file with the actual values.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL service is running:
  ```bash
  # Windows
  net start postgresql-x64-14
  
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status postgresql
  ```
- Verify connection string in `.env` file
- Check PostgreSQL authentication settings in `pg_hba.conf`

### Redis Connection Issues
- Ensure Redis service is running:
  ```bash
  # Windows
  net start redis
  
  # macOS
  brew services list
  
  # Linux
  sudo systemctl status redis-server
  ```
- Test Redis connection:
  ```bash
  redis-cli ping
  ```

### Python Dependency Issues
- Ensure you're using the correct Python version (3.8+)
- Update pip:
  ```bash
  pip install --upgrade pip
  ```
- Install dependencies one by one if batch installation fails

### Node.js Dependency Issues
- Clear npm cache:
  ```bash
  npm cache clean --force
  ```
- Delete node_modules and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

### Port Conflicts
- If port 8000 is already in use, modify the port in `src/backend/api/main.py`
- If port 3000 is already in use, you can specify a different port:
  ```bash
  npm start -- --port 3001
  ```

### API Connection Issues
- Check that API keys are correctly set in `.env` file
- Verify network connectivity
- Check API rate limits and quotas

For additional help, please refer to the documentation for each specific component or create an issue in the repository.