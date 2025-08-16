"""
Database initialization script for the Ultimate Hedge Fund & Trading Application.
This script creates all database tables and initializes default data.
"""
import os
import sys
import logging
from sqlalchemy.exc import SQLAlchemyError

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import database configuration
from backend.config.database import init_db, engine, Base, timescale_engine
from backend.models.user import User, Role
from backend.models.portfolio import Portfolio, PortfolioHolding, Transaction
from backend.models.stock import Stock, PriceHistory, FundamentalData, MarketData
from backend.models.alert import Alert, Notification
from backend.models.watchlist import Watchlist, WatchlistStock

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_default_roles(session):
    """
    Create default roles in the database.
    """
    logger.info("Creating default roles...")
    
    # Define default roles
    roles = [
        {"name": "admin", "description": "Administrator with full access"},
        {"name": "user", "description": "Standard user with basic access"},
        {"name": "premium", "description": "Premium user with enhanced features"},
        {"name": "analyst", "description": "Financial analyst with advanced tools"}
    ]
    
    # Create roles if they don't exist
    for role_data in roles:
        role = session.query(Role).filter_by(name=role_data["name"]).first()
        if not role:
            role = Role(name=role_data["name"], description=role_data["description"])
            session.add(role)
            logger.info(f"Created role: {role_data['name']}")
    
    session.commit()
    logger.info("Default roles created successfully")

def create_admin_user(session):
    """
    Create an admin user if it doesn't exist.
    """
    logger.info("Creating admin user...")
    
    # Check if admin user exists
    admin = session.query(User).filter_by(username="admin").first()
    if not admin:
        # Get admin role
        admin_role = session.query(Role).filter_by(name="admin").first()
        
        # Create admin user
        from backend.auth.security import get_password_hash
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),  # In production, use a secure password
            full_name="Admin User",
            is_active=True,
            is_verified=True
        )
        
        # Add admin role to user
        if admin_role:
            admin.roles.append(admin_role)
        
        session.add(admin)
        session.commit()
        logger.info("Admin user created successfully")
    else:
        logger.info("Admin user already exists")

def create_sample_stocks(session):
    """
    Create sample stock data.
    """
    logger.info("Creating sample stock data...")
    
    # Define sample stocks
    stocks = [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "country": "United States",
            "current_price": 175.50,
            "price_change": 2.30,
            "price_change_percent": 1.32,
            "market_cap": 2850000000000,
            "volume": 65000000
        },
        {
            "symbol": "MSFT",
            "name": "Microsoft Corporation",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Software—Infrastructure",
            "country": "United States",
            "current_price": 340.25,
            "price_change": 3.75,
            "price_change_percent": 1.11,
            "market_cap": 2530000000000,
            "volume": 25000000
        },
        {
            "symbol": "GOOGL",
            "name": "Alphabet Inc.",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Internet Content & Information",
            "country": "United States",
            "current_price": 138.75,
            "price_change": -0.50,
            "price_change_percent": -0.36,
            "market_cap": 1750000000000,
            "volume": 18000000
        },
        {
            "symbol": "AMZN",
            "name": "Amazon.com, Inc.",
            "exchange": "NASDAQ",
            "sector": "Consumer Cyclical",
            "industry": "Internet Retail",
            "country": "United States",
            "current_price": 145.20,
            "price_change": 1.15,
            "price_change_percent": 0.80,
            "market_cap": 1500000000000,
            "volume": 30000000
        },
        {
            "symbol": "TSLA",
            "name": "Tesla, Inc.",
            "exchange": "NASDAQ",
            "sector": "Consumer Cyclical",
            "industry": "Auto Manufacturers",
            "country": "United States",
            "current_price": 250.75,
            "price_change": -5.25,
            "price_change_percent": -2.05,
            "market_cap": 795000000000,
            "volume": 120000000
        }
    ]
    
    # Create stocks if they don't exist
    for stock_data in stocks:
        stock = session.query(Stock).filter_by(symbol=stock_data["symbol"]).first()
        if not stock:
            stock = Stock(**stock_data)
            session.add(stock)
            logger.info(f"Created stock: {stock_data['symbol']}")
    
    session.commit()
    logger.info("Sample stock data created successfully")

def main():
    """
    Main function to initialize the database.
    """
    from sqlalchemy.orm import sessionmaker
    
    try:
        logger.info("Starting database initialization...")
        
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize TimescaleDB hypertables
        logger.info("Initializing TimescaleDB hypertables...")
        conn = timescale_engine.connect()
        
        # Enable TimescaleDB extension
        conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
        
        # Create hypertables
        conn.execute("SELECT create_hypertable('price_history', 'timestamp', if_not_exists => TRUE);")
        conn.execute("SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);")
        
        conn.close()
        logger.info("TimescaleDB hypertables initialized successfully")
        
        # Create a session
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Create default data
        create_default_roles(session)
        create_admin_user(session)
        create_sample_stocks(session)
        
        # Close session
        session.close()
        
        logger.info("Database initialization completed successfully")
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()