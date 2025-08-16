"""
Base models for the Ultimate Hedge Fund & Trading Application.
This module provides base classes for SQLAlchemy models.
"""
from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime
from typing import Any

from ..config.database import Base

class TimestampMixin:
    """
    Mixin to add created_at and updated_at timestamps to models.
    """
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class BaseModel(Base):
    """
    Base model class with common attributes and methods.
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Add created_at and updated_at columns to all models
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    @declared_attr
    def __tablename__(cls) -> str:
        """
        Generate __tablename__ automatically from class name.
        """
        return cls.__name__.lower()
    
    def dict(self) -> dict:
        """
        Convert model instance to dictionary.
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}