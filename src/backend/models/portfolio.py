"""
Portfolio models for the Ultimate Hedge Fund & Trading Application.
"""
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Table, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .base import BaseModel
from ..config.database import Base

class PortfolioType(enum.Enum):
    """
    Enum for portfolio types.
    """
    PERSONAL = "personal"
    WATCHLIST = "watchlist"
    BACKTEST = "backtest"
    SIMULATION = "simulation"


class Portfolio(BaseModel):
    """
    Portfolio model representing user investment portfolios.
    """
    __tablename__ = "portfolios"
    
    # Basic portfolio information
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(Enum(PortfolioType), default=PortfolioType.PERSONAL)
    
    # Portfolio metrics
    initial_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    total_profit_loss = Column(Float, default=0.0)
    profit_loss_percentage = Column(Float, default=0.0)
    
    # Risk metrics
    risk_score = Column(Float)
    sharpe_ratio = Column(Float)
    volatility = Column(Float)
    
    # Ownership
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="portfolios")
    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Portfolio {self.name} ({self.type.value})>"


class PortfolioHolding(BaseModel):
    """
    PortfolioHolding model representing stocks held in a portfolio.
    """
    __tablename__ = "portfolio_holdings"
    
    # Holding information
    symbol = Column(String(20), nullable=False)
    quantity = Column(Float, nullable=False)
    average_price = Column(Float, nullable=False)
    current_price = Column(Float)
    
    # Performance metrics
    cost_basis = Column(Float)
    market_value = Column(Float)
    profit_loss = Column(Float)
    profit_loss_percentage = Column(Float)
    
    # Allocation
    weight = Column(Float)  # Percentage of portfolio
    
    # Relationships
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    portfolio = relationship("Portfolio", back_populates="holdings")
    
    def __repr__(self) -> str:
        return f"<PortfolioHolding {self.symbol} ({self.quantity})>"


class Transaction(BaseModel):
    """
    Transaction model representing buy/sell transactions in a portfolio.
    """
    __tablename__ = "transactions"
    
    class TransactionType(enum.Enum):
        BUY = "buy"
        SELL = "sell"
        DIVIDEND = "dividend"
        SPLIT = "split"
        DEPOSIT = "deposit"
        WITHDRAWAL = "withdrawal"
    
    # Transaction details
    symbol = Column(String(20))
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Float)
    price = Column(Float)
    total_amount = Column(Float, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    
    # Relationships
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    portfolio = relationship("Portfolio", back_populates="transactions")
    
    def __repr__(self) -> str:
        return f"<Transaction {self.transaction_type.value} {self.symbol} ({self.quantity})>"