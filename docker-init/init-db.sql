-- Create the hedge_fund_timeseries database
CREATE DATABASE hedge_fund_timeseries;

-- Connect to the hedge_fund_timeseries database
\c hedge_fund_timeseries;

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Return to the default database
\c hedge_fund_app;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    currency VARCHAR(3) DEFAULT 'USD',
    initial_balance DECIMAL(15, 2) DEFAULT 0.00
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL,
    average_price DECIMAL(15, 6) NOT NULL,
    current_price DECIMAL(15, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    cost_basis DECIMAL(15, 2),
    market_value DECIMAL(15, 2),
    unrealized_pl DECIMAL(15, 2),
    realized_pl DECIMAL(15, 2)
);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
    id SERIAL PRIMARY KEY,
    watchlist_id INTEGER REFERENCES watchlists(id),
    symbol VARCHAR(20) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    threshold DECIMAL(15, 6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT FALSE
);

-- Create backtests table
CREATE TABLE IF NOT EXISTS backtests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    strategy_name VARCHAR(100) NOT NULL,
    strategy_params JSONB NOT NULL,
    symbols TEXT[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(15, 2) NOT NULL,
    final_capital DECIMAL(15, 2),
    total_return DECIMAL(10, 6),
    annualized_return DECIMAL(10, 6),
    sharpe_ratio DECIMAL(10, 6),
    max_drawdown DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    results_data JSONB
);

-- Create a demo user with password 'password'
INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
VALUES ('demo', 'demo@example.com', '$2b$12$6HCuDxEcp6Ub0hPFrKjHg.ndOlsVDxJJdJ6BnVKyZB/3GDYxw4Whe', 'Demo', 'User', false)
ON CONFLICT DO NOTHING;

-- Create a demo portfolio
INSERT INTO portfolios (user_id, name, description, initial_balance)
VALUES (1, 'Demo Portfolio', 'A demonstration portfolio with sample positions', 100000.00)
ON CONFLICT DO NOTHING;

-- Create sample positions
INSERT INTO positions (portfolio_id, symbol, quantity, average_price, current_price, cost_basis, market_value)
VALUES 
(1, 'AAPL', 100, 150.00, 150.00, 15000.00, 15000.00),
(1, 'MSFT', 50, 250.00, 250.00, 12500.00, 12500.00),
(1, 'GOOGL', 20, 2800.00, 2800.00, 56000.00, 56000.00),
(1, 'AMZN', 10, 3300.00, 3300.00, 33000.00, 33000.00)
ON CONFLICT DO NOTHING;

-- Create a demo watchlist
INSERT INTO watchlists (user_id, name)
VALUES (1, 'Tech Stocks')
ON CONFLICT DO NOTHING;

-- Add items to the watchlist
INSERT INTO watchlist_items (watchlist_id, symbol)
VALUES 
(1, 'AAPL'),
(1, 'MSFT'),
(1, 'GOOGL'),
(1, 'AMZN'),
(1, 'TSLA'),
(1, 'NVDA'),
(1, 'META')
ON CONFLICT DO NOTHING;