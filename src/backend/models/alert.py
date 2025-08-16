"""
Alert models for the Ultimate Hedge Fund & Trading Application.
"""
from sqlalchemy import Column, String, Float, Integer, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from .base import BaseModel


class AlertType(enum.Enum):
    """
    Enum for different types of alerts.
    """
    PRICE = "price"
    PRICE_CHANGE_PERCENT = "price_change_percent"
    VOLUME = "volume"
    MOVING_AVERAGE_CROSS = "moving_average_cross"
    RSI = "rsi"
    MACD = "macd"
    BOLLINGER_BANDS = "bollinger_bands"
    EARNINGS = "earnings"
    NEWS = "news"
    INSIDER_TRADING = "insider_trading"
    TECHNICAL_PATTERN = "technical_pattern"
    CUSTOM = "custom"


class AlertCondition(enum.Enum):
    """
    Enum for alert conditions.
    """
    ABOVE = "above"
    BELOW = "below"
    EQUAL = "equal"
    CROSSES_ABOVE = "crosses_above"
    CROSSES_BELOW = "crosses_below"
    PERCENT_INCREASE = "percent_increase"
    PERCENT_DECREASE = "percent_decrease"
    APPROACHING = "approaching"


class AlertFrequency(enum.Enum):
    """
    Enum for how often an alert can trigger.
    """
    ONCE = "once"
    DAILY = "daily"
    ALWAYS = "always"


class Alert(BaseModel):
    """
    Alert model for user-configured alerts.
    """
    __tablename__ = "alerts"
    
    # Alert configuration
    name = Column(String(100), nullable=False)
    description = Column(Text)
    symbol = Column(String(20), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)
    condition = Column(Enum(AlertCondition), nullable=False)
    threshold_value = Column(Float)
    frequency = Column(Enum(AlertFrequency), default=AlertFrequency.ONCE)
    
    # Alert status
    is_active = Column(Boolean, default=True)
    last_triggered = Column(String)  # ISO format datetime
    trigger_count = Column(Integer, default=0)
    
    # Additional parameters (stored as JSON)
    parameters = Column(JSONB)  # For type-specific parameters
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="alerts")
    
    # Notification preferences
    notify_email = Column(Boolean, default=True)
    notify_push = Column(Boolean, default=True)
    notify_sms = Column(Boolean, default=False)
    
    def __repr__(self) -> str:
        return f"<Alert {self.name} ({self.symbol})>"


class Notification(BaseModel):
    """
    Notification model for storing alert notifications.
    """
    __tablename__ = "notifications"
    
    class NotificationType(enum.Enum):
        ALERT = "alert"
        SYSTEM = "system"
        NEWS = "news"
        PORTFOLIO = "portfolio"
    
    class NotificationStatus(enum.Enum):
        UNREAD = "unread"
        READ = "read"
        ARCHIVED = "archived"
    
    # Notification details
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    
    # Related data
    related_entity_type = Column(String(50))  # e.g., 'alert', 'stock', 'portfolio'
    related_entity_id = Column(Integer)
    additional_data = Column(JSONB)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    def __repr__(self) -> str:
        return f"<Notification {self.title} ({self.notification_type.value})>"