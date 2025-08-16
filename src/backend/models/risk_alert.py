"""
Risk Alert Model
This module defines the data models for risk alerts.
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    """Alert status"""
    ACTIVE = "active"
    TRIGGERED = "triggered"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class NotificationMethod(str, Enum):
    """Notification methods"""
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"
    ALL = "all"

class AlertOperator(str, Enum):
    """Alert operators"""
    GREATER_THAN = ">"
    LESS_THAN = "<"
    GREATER_THAN_OR_EQUAL = ">="
    LESS_THAN_OR_EQUAL = "<="
    EQUAL = "="

class AlertType(str, Enum):
    """Alert types"""
    VAR = "var"
    VOLATILITY = "volatility"
    DRAWDOWN = "drawdown"
    RETURN = "return"
    EXPOSURE = "exposure"
    CORRELATION = "correlation"
    PRICE = "price"
    VOLUME = "volume"

class RiskAlert(BaseModel):
    """Risk alert model"""
    id: str = Field(..., description="Unique identifier for the alert")
    user_id: str = Field(..., description="User ID who created the alert")
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID if applicable")
    type: AlertType = Field(..., description="Type of alert")
    symbol: Optional[str] = Field(None, description="Symbol if applicable")
    operator: AlertOperator = Field(..., description="Comparison operator")
    value: float = Field(..., description="Threshold value")
    enabled: bool = Field(True, description="Whether the alert is enabled")
    notification_method: NotificationMethod = Field(..., description="Notification method")
    severity: AlertSeverity = Field(..., description="Alert severity")
    status: AlertStatus = Field(AlertStatus.ACTIVE, description="Alert status")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    last_triggered: Optional[datetime] = Field(None, description="Last time the alert was triggered")
    trigger_count: int = Field(0, description="Number of times the alert has been triggered")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class RiskAlertCreate(BaseModel):
    """Model for creating a risk alert"""
    portfolio_id: Optional[str] = Field(None, description="Portfolio ID if applicable")
    type: AlertType = Field(..., description="Type of alert")
    symbol: Optional[str] = Field(None, description="Symbol if applicable")
    operator: AlertOperator = Field(..., description="Comparison operator")
    value: float = Field(..., description="Threshold value")
    enabled: bool = Field(True, description="Whether the alert is enabled")
    notification_method: NotificationMethod = Field(..., description="Notification method")
    severity: AlertSeverity = Field(..., description="Alert severity")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class RiskAlertUpdate(BaseModel):
    """Model for updating a risk alert"""
    portfolio_id: Optional[str] = None
    type: Optional[AlertType] = None
    symbol: Optional[str] = None
    operator: Optional[AlertOperator] = None
    value: Optional[float] = None
    enabled: Optional[bool] = None
    notification_method: Optional[NotificationMethod] = None
    severity: Optional[AlertSeverity] = None
    status: Optional[AlertStatus] = None
    metadata: Optional[Dict[str, Any]] = None

class RiskAlertNotification(BaseModel):
    """Model for risk alert notifications"""
    alert_id: str = Field(..., description="Alert ID")
    user_id: str = Field(..., description="User ID")
    message: str = Field(..., description="Alert message")
    severity: AlertSeverity = Field(..., description="Alert severity")
    timestamp: datetime = Field(default_factory=datetime.now, description="Notification timestamp")
    data: Dict[str, Any] = Field(default_factory=dict, description="Additional data")
    read: bool = Field(False, description="Whether the notification has been read")