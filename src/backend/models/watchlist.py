"""
Watchlist models for the Ultimate Hedge Fund & Trading Application.
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Table, Text
from sqlalchemy.orm import relationship

from .base import BaseModel
from ..config.database import Base

# Association table for watchlist-stock many-to-many relationship
watchlist_stocks = Table(
    'watchlist_stocks',
    Base.metadata,
    Column('watchlist_id', Integer, ForeignKey('watchlists.id'), primary_key=True),
    Column('symbol', String(20), primary_key=True),
    Column('notes', Text),
)


class Watchlist(BaseModel):
    """
    Watchlist model for user-created stock watchlists.
    """
    __tablename__ = "watchlists"
    
    # Basic watchlist information
    name = Column(String(100), nullable=False)
    description = Column(Text)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="watchlists")
    
    # Stock symbols in this watchlist (many-to-many)
    stocks = relationship(
        "WatchlistStock",
        secondary=watchlist_stocks,
        back_populates="watchlists"
    )
    
    def __repr__(self) -> str:
        return f"<Watchlist {self.name}>"


class WatchlistStock(BaseModel):
    """
    WatchlistStock model for stocks in watchlists with additional metadata.
    """
    __tablename__ = "watchlist_stocks"
    
    symbol = Column(String(20), primary_key=True)
    notes = Column(Text)
    
    # Watchlist relationship
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"), primary_key=True)
    watchlists = relationship("Watchlist", back_populates="stocks")
    
    def __repr__(self) -> str:
        return f"<WatchlistStock {self.symbol}>"