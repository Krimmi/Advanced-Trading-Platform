"""
User model for the Ultimate Hedge Fund & Trading Application.
"""
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from typing import List, Optional

from .base import BaseModel
from ..config.database import Base

# Association table for user-role many-to-many relationship
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)

class User(BaseModel):
    """
    User model representing application users.
    """
    __tablename__ = "users"
    
    # Basic user information
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # User preferences
    theme = Column(String(20), default="light")
    default_portfolio_id = Column(Integer, nullable=True)
    
    # Relationships
    portfolios = relationship("Portfolio", back_populates="user")
    watchlists = relationship("Watchlist", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    
    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Role(BaseModel):
    """
    Role model for user permissions.
    """
    __tablename__ = "roles"
    
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")
    
    def __repr__(self) -> str:
        return f"<Role {self.name}>"