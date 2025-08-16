"""
Router for risk alerts endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path, Body
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

from src.backend.models.risk_alert import (
    RiskAlert, RiskAlertCreate, RiskAlertUpdate, 
    AlertStatus, AlertType, AlertOperator
)
from src.backend.services.risk_alerts_service import risk_alerts_service

# Configure router
router = APIRouter()

@router.post("/alerts", response_model=RiskAlert)
async def create_alert(
    alert_data: RiskAlertCreate = Body(...),
    user_id: str = Query(..., description="User ID")
):
    """
    Create a new risk alert.
    """
    try:
        alert = await risk_alerts_service.create_alert(user_id, alert_data)
        return alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating alert: {str(e)}")

@router.get("/alerts", response_model=List[RiskAlert])
async def get_user_alerts(
    user_id: str = Query(..., description="User ID")
):
    """
    Get all alerts for a user.
    """
    try:
        alerts = await risk_alerts_service.get_user_alerts(user_id)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

@router.get("/alerts/{alert_id}", response_model=RiskAlert)
async def get_alert(
    alert_id: str = Path(..., description="Alert ID")
):
    """
    Get an alert by ID.
    """
    try:
        alert = await risk_alerts_service.get_alert(alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        return alert
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert: {str(e)}")

@router.put("/alerts/{alert_id}", response_model=RiskAlert)
async def update_alert(
    alert_id: str = Path(..., description="Alert ID"),
    update_data: RiskAlertUpdate = Body(...)
):
    """
    Update an alert.
    """
    try:
        alert = await risk_alerts_service.update_alert(alert_id, update_data)
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        return alert
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating alert: {str(e)}")

@router.delete("/alerts/{alert_id}", response_model=Dict[str, bool])
async def delete_alert(
    alert_id: str = Path(..., description="Alert ID")
):
    """
    Delete an alert.
    """
    try:
        success = await risk_alerts_service.delete_alert(alert_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")

@router.get("/portfolio/{portfolio_id}/alerts", response_model=List[RiskAlert])
async def get_portfolio_alerts(
    portfolio_id: str = Path(..., description="Portfolio ID")
):
    """
    Get all alerts for a portfolio.
    """
    try:
        alerts = await risk_alerts_service.get_portfolio_alerts(portfolio_id)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio alerts: {str(e)}")

@router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_user_notifications(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, description="Maximum number of notifications to return"),
    unread_only: bool = Query(False, description="Whether to return only unread notifications")
):
    """
    Get notifications for a user.
    """
    try:
        notifications = await risk_alerts_service.get_user_notifications(user_id, limit, unread_only)
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.post("/notifications/{notification_id}/read", response_model=Dict[str, bool])
async def mark_notification_as_read(
    notification_id: str = Path(..., description="Notification ID")
):
    """
    Mark a notification as read.
    """
    try:
        success = await risk_alerts_service.mark_notification_as_read(notification_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.post("/notifications/read-all", response_model=Dict[str, int])
async def mark_all_notifications_as_read(
    user_id: str = Query(..., description="User ID")
):
    """
    Mark all notifications for a user as read.
    """
    try:
        count = await risk_alerts_service.mark_all_notifications_as_read(user_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notifications as read: {str(e)}")

@router.post("/start-evaluation", response_model=Dict[str, bool])
async def start_alert_evaluation():
    """
    Start the alert evaluation loop.
    """
    try:
        await risk_alerts_service.start_alert_evaluation()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting alert evaluation: {str(e)}")

@router.post("/stop-evaluation", response_model=Dict[str, bool])
async def stop_alert_evaluation():
    """
    Stop the alert evaluation loop.
    """
    try:
        await risk_alerts_service.stop_alert_evaluation()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping alert evaluation: {str(e)}")