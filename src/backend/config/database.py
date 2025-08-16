"""
Database configuration for the Ultimate Hedge Fund & Trading Application.
This module sets up connections to PostgreSQL and TimescaleDB.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from typing import Generator
import logging

# Import configuration
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from config.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URLs
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
TIMESCALE_DATABASE_URL = settings.TIMESCALE_DATABASE_URL

# Create SQLAlchemy engines with connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Check connection validity before using
)

timescale_engine = create_engine(
    TIMESCALE_DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=1800,
    pool_pre_ping=True,
)

# Create session factories
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
TimescaleSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=timescale_engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Dependency to get DB session
def get_db() -> Generator:
    """
    Dependency function to get a database session.
    Yields a SQLAlchemy session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get TimescaleDB session
def get_timescale_db() -> Generator:
    """
    Dependency function to get a TimescaleDB session.
    Yields a SQLAlchemy session for TimescaleDB and ensures it's closed after use.
    """
    db = TimescaleSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to initialize database
def init_db() -> None:
    """
    Initialize the database by creating all tables.
    """
    try:
        # Import all models here to ensure they are registered with the Base metadata
        from ..models.user import User, Role
        from ..models.portfolio import Portfolio, PortfolioHolding, Transaction
        from ..models.stock import Stock, PriceHistory, FundamentalData, MarketData
        from ..models.alert import Alert, Notification
        from ..models.watchlist import Watchlist, WatchlistStock
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Initialize TimescaleDB specific tables and hypertables
        _init_timescale_db()
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

def _init_timescale_db() -> None:
    """
    Initialize TimescaleDB specific configurations.
    Creates hypertables for time-series data.
    """
    try:
        # Create a connection to execute raw SQL
        conn = timescale_engine.connect()
        
        # Enable TimescaleDB extension if not already enabled
        conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
        
        # Create hypertables for time-series data
        conn.execute(f"SELECT create_hypertable('price_history', 'timestamp', if_not_exists => TRUE);")
        conn.execute(f"SELECT create_hypertable('market_data', 'timestamp', if_not_exists => TRUE);")
        
        conn.close()
        logger.info("TimescaleDB hypertables created successfully")
        
    except Exception as e:
        logger.error(f"Error initializing TimescaleDB: {e}")
        raise