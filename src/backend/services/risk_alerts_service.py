"""
Risk Alerts Service
This service manages risk alerts, including evaluation, triggering, and notification.
"""
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import json

from src.backend.models.risk_alert import (
    RiskAlert, RiskAlertCreate, RiskAlertUpdate, 
    AlertStatus, AlertType, AlertOperator
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RiskAlertsService:
    """
    Service for managing risk alerts
    """
    def __init__(self):
        # In-memory storage for alerts (in a real app, this would use a database)
        self._alerts: Dict[str, RiskAlert] = {}
        # In-memory storage for notifications (in a real app, this would use a database)
        self._notifications: List[Dict[str, Any]] = []
        # Flag to track if the alert evaluation loop is running
        self._is_running = False
        # Task for the alert evaluation loop
        self._evaluation_task = None

    async def start_alert_evaluation(self):
        """
        Start the alert evaluation loop
        """
        if self._is_running:
            return
        
        self._is_running = True
        self._evaluation_task = asyncio.create_task(self._alert_evaluation_loop())
        logger.info("Risk alert evaluation loop started")

    async def stop_alert_evaluation(self):
        """
        Stop the alert evaluation loop
        """
        if not self._is_running:
            return
        
        self._is_running = False
        if self._evaluation_task:
            self._evaluation_task.cancel()
            try:
                await self._evaluation_task
            except asyncio.CancelledError:
                pass
            self._evaluation_task = None
        
        logger.info("Risk alert evaluation loop stopped")

    async def _alert_evaluation_loop(self):
        """
        Main loop for evaluating alerts
        """
        try:
            while self._is_running:
                # Evaluate all active alerts
                await self._evaluate_all_alerts()
                # Wait before next evaluation
                await asyncio.sleep(5)  # Check every 5 seconds
        except asyncio.CancelledError:
            logger.info("Alert evaluation loop cancelled")
        except Exception as e:
            logger.error(f"Error in alert evaluation loop: {e}")
            self._is_running = False

    async def _evaluate_all_alerts(self):
        """
        Evaluate all active alerts
        """
        for alert_id, alert in list(self._alerts.items()):
            if alert.enabled and alert.status == AlertStatus.ACTIVE:
                try:
                    # In a real implementation, this would fetch real-time data
                    # and evaluate the alert condition
                    await self._evaluate_alert(alert)
                except Exception as e:
                    logger.error(f"Error evaluating alert {alert_id}: {e}")

    async def _evaluate_alert(self, alert: RiskAlert):
        """
        Evaluate a single alert
        
        Args:
            alert: The alert to evaluate
        """
        # In a real implementation, this would fetch real-time data
        # For now, we'll simulate alert triggering randomly
        import random
        
        # Simulate alert triggering with 5% probability
        if random.random() < 0.05:
            await self._trigger_alert(alert)

    async def _trigger_alert(self, alert: RiskAlert):
        """
        Trigger an alert
        
        Args:
            alert: The alert to trigger
        """
        # Update alert status
        alert.status = AlertStatus.TRIGGERED
        alert.last_triggered = datetime.now()
        alert.trigger_count += 1
        
        # Create notification message
        message = self._create_alert_message(alert)
        
        # Create notification
        notification = {
            "id": str(uuid.uuid4()),
            "alert_id": alert.id,
            "user_id": alert.user_id,
            "message": message,
            "severity": alert.severity,
            "timestamp": datetime.now().isoformat(),
            "data": {
                "alert_type": alert.type,
                "symbol": alert.symbol,
                "value": alert.value,
                "portfolio_id": alert.portfolio_id
            },
            "read": False
        }
        
        # Store notification
        self._notifications.append(notification)
        
        # Send notification based on method
        await self._send_notification(alert, notification)
        
        logger.info(f"Alert triggered: {alert.id} - {message}")

    def _create_alert_message(self, alert: RiskAlert) -> str:
        """
        Create a human-readable alert message
        
        Args:
            alert: The alert
            
        Returns:
            Alert message
        """
        type_display = alert.type.value.upper()
        symbol_text = f" for {alert.symbol}" if alert.symbol else ""
        portfolio_text = f" in portfolio {alert.portfolio_id}" if alert.portfolio_id else ""
        
        return f"{type_display} alert{symbol_text}{portfolio_text}: {alert.operator} {alert.value}%"

    async def _send_notification(self, alert: RiskAlert, notification: Dict[str, Any]):
        """
        Send notification based on the alert's notification method
        
        Args:
            alert: The alert
            notification: The notification data
        """
        # In a real implementation, this would send actual notifications
        # For now, we'll just log the notification
        logger.info(f"Sending {alert.notification_method} notification for alert {alert.id}")
        
        # Simulate sending notification
        # In a real app, this would use email, push notifications, SMS, etc.
        pass

    async def create_alert(self, user_id: str, alert_data: RiskAlertCreate) -> RiskAlert:
        """
        Create a new risk alert
        
        Args:
            user_id: User ID
            alert_data: Alert data
            
        Returns:
            Created alert
        """
        alert_id = str(uuid.uuid4())
        
        alert = RiskAlert(
            id=alert_id,
            user_id=user_id,
            **alert_data.dict()
        )
        
        self._alerts[alert_id] = alert
        logger.info(f"Created alert {alert_id} for user {user_id}")
        
        return alert

    async def get_alert(self, alert_id: str) -> Optional[RiskAlert]:
        """
        Get an alert by ID
        
        Args:
            alert_id: Alert ID
            
        Returns:
            Alert if found, None otherwise
        """
        return self._alerts.get(alert_id)

    async def update_alert(self, alert_id: str, update_data: RiskAlertUpdate) -> Optional[RiskAlert]:
        """
        Update an alert
        
        Args:
            alert_id: Alert ID
            update_data: Update data
            
        Returns:
            Updated alert if found, None otherwise
        """
        alert = await self.get_alert(alert_id)
        if not alert:
            return None
        
        # Update alert fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(alert, key, value)
        
        # Update timestamp
        alert.updated_at = datetime.now()
        
        logger.info(f"Updated alert {alert_id}")
        return alert

    async def delete_alert(self, alert_id: str) -> bool:
        """
        Delete an alert
        
        Args:
            alert_id: Alert ID
            
        Returns:
            True if deleted, False if not found
        """
        if alert_id in self._alerts:
            del self._alerts[alert_id]
            logger.info(f"Deleted alert {alert_id}")
            return True
        return False

    async def get_user_alerts(self, user_id: str) -> List[RiskAlert]:
        """
        Get all alerts for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of alerts
        """
        return [alert for alert in self._alerts.values() if alert.user_id == user_id]

    async def get_portfolio_alerts(self, portfolio_id: str) -> List[RiskAlert]:
        """
        Get all alerts for a portfolio
        
        Args:
            portfolio_id: Portfolio ID
            
        Returns:
            List of alerts
        """
        return [alert for alert in self._alerts.values() if alert.portfolio_id == portfolio_id]

    async def get_user_notifications(self, user_id: str, limit: int = 50, unread_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get notifications for a user
        
        Args:
            user_id: User ID
            limit: Maximum number of notifications to return
            unread_only: Whether to return only unread notifications
            
        Returns:
            List of notifications
        """
        notifications = [n for n in self._notifications if n["user_id"] == user_id]
        
        if unread_only:
            notifications = [n for n in notifications if not n["read"]]
        
        # Sort by timestamp (newest first)
        notifications.sort(key=lambda n: n["timestamp"], reverse=True)
        
        # Limit the number of notifications
        return notifications[:limit]

    async def mark_notification_as_read(self, notification_id: str) -> bool:
        """
        Mark a notification as read
        
        Args:
            notification_id: Notification ID
            
        Returns:
            True if marked as read, False if not found
        """
        for notification in self._notifications:
            if notification["id"] == notification_id:
                notification["read"] = True
                return True
        return False

    async def mark_all_notifications_as_read(self, user_id: str) -> int:
        """
        Mark all notifications for a user as read
        
        Args:
            user_id: User ID
            
        Returns:
            Number of notifications marked as read
        """
        count = 0
        for notification in self._notifications:
            if notification["user_id"] == user_id and not notification["read"]:
                notification["read"] = True
                count += 1
        return count

# Create a global instance of the risk alerts service
risk_alerts_service = RiskAlertsService()