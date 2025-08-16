"""
Stock models for the Ultimate Hedge Fund & Trading Application.
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Index, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel
from ..config.database import Base

class Stock(BaseModel):
    """
    Stock model representing basic stock information.
    """
    __tablename__ = "stocks"
    
    # Basic stock information
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    exchange = Column(String(50))
    sector = Column(String(100))
    industry = Column(String(100))
    country = Column(String(50))
    
    # Current price data
    current_price = Column(Float)
    price_change = Column(Float)
    price_change_percent = Column(Float)
    market_cap = Column(Float)
    volume = Column(Float)
    
    # Additional information
    description = Column(Text)
    website = Column(String(255))
    logo_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    price_history = relationship("PriceHistory", back_populates="stock", cascade="all, delete-orphan")
    fundamental_data = relationship("FundamentalData", back_populates="stock", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Stock {self.symbol} ({self.name})>"


class PriceHistory(Base):
    """
    PriceHistory model for storing historical price data.
    This will be stored in TimescaleDB as a hypertable.
    """
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String(20), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    adjusted_close = Column(Float)
    volume = Column(Float)
    
    # Foreign key to stock
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    stock = relationship("Stock", back_populates="price_history")
    
    # Create composite index on symbol and timestamp
    __table_args__ = (
        Index('idx_price_history_symbol_timestamp', 'symbol', 'timestamp'),
    )
    
    def __repr__(self) -> str:
        return f"<PriceHistory {self.symbol} ({self.timestamp})>"


class FundamentalData(BaseModel):
    """
    FundamentalData model for storing fundamental financial data.
    """
    __tablename__ = "fundamental_data"
    
    # Foreign key to stock
    stock_id = Column(Integer, ForeignKey("stocks.id"), unique=True)
    stock = relationship("Stock", back_populates="fundamental_data")
    
    # Financial ratios
    pe_ratio = Column(Float)
    pb_ratio = Column(Float)
    dividend_yield = Column(Float)
    eps = Column(Float)
    beta = Column(Float)
    fifty_two_week_high = Column(Float)
    fifty_two_week_low = Column(Float)
    
    # Financial statements data (stored as JSON)
    income_statement = Column(JSONB)
    balance_sheet = Column(JSONB)
    cash_flow = Column(JSONB)
    
    # Key metrics
    revenue_growth = Column(Float)
    profit_margin = Column(Float)
    debt_to_equity = Column(Float)
    return_on_equity = Column(Float)
    return_on_assets = Column(Float)
    
    # Last updated timestamp
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<FundamentalData for {self.stock.symbol if self.stock else 'Unknown'}>"


class MarketData(Base):
    """
    MarketData model for storing market-wide data.
    This will be stored in TimescaleDB as a hypertable.
    """
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False)
    data_type = Column(String(50), nullable=False)  # e.g., 'index', 'sector', 'economic'
    name = Column(String(100), nullable=False)  # e.g., 'S&P 500', 'Technology', 'GDP'
    value = Column(Float)
    change = Column(Float)
    change_percent = Column(Float)
    additional_data = Column(JSONB)  # For any additional data points
    
    # Create composite index on data_type, name, and timestamp
    __table_args__ = (
        Index('idx_market_data_type_name_timestamp', 'data_type', 'name', 'timestamp'),
    )
    
    def __repr__(self) -> str:
        return f"<MarketData {self.data_type} {self.name} ({self.timestamp})>"