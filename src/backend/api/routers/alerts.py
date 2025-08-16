"""
Router for alerts and notifications endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Body, Depends
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid
import numpy as np

router = APIRouter()

# --- Pydantic Models ---

class PriceAlert(BaseModel):
    symbol: str
    condition: str  # above, below
    price: float
    expiration: Optional[str] = None  # ISO format date

class TechnicalAlert(BaseModel):
    symbol: str
    indicator: str  # rsi, macd, moving_average_cross, etc.
    condition: str  # above, below, cross_above, cross_below
    value: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = None
    expiration: Optional[str] = None  # ISO format date

class NewsAlert(BaseModel):
    keywords: List[str]
    symbols: Optional[List[str]] = None
    expiration: Optional[str] = None  # ISO format date

class EarningsAlert(BaseModel):
    symbol: str
    days_before: int = 3

class PatternAlert(BaseModel):
    symbol: str
    pattern: str  # head_and_shoulders, double_top, etc.
    timeframe: str  # daily, hourly, etc.

class VolumeAlert(BaseModel):
    symbol: str
    condition: str  # above, below
    volume_multiplier: float  # Multiple of average volume
    expiration: Optional[str] = None  # ISO format date

class AIAlert(BaseModel):
    symbol: str
    alert_type: str  # price_prediction, sentiment_shift, unusual_activity
    threshold: float
    expiration: Optional[str] = None  # ISO format date

# --- Mock Data ---

# Mock alerts data - will be replaced with database storage
mock_alerts = {
    "price_alerts": [
        {
            "id": "pa1",
            "user_id": "user1",
            "symbol": "AAPL",
            "condition": "above",
            "price": 190.0,
            "created_at": "2025-08-01T10:00:00Z",
            "expiration": "2025-09-01T00:00:00Z",
            "status": "active"
        },
        {
            "id": "pa2",
            "user_id": "user1",
            "symbol": "MSFT",
            "condition": "below",
            "price": 330.0,
            "created_at": "2025-08-02T14:30:00Z",
            "expiration": None,
            "status": "active"
        }
    ],
    "technical_alerts": [
        {
            "id": "ta1",
            "user_id": "user1",
            "symbol": "GOOGL",
            "indicator": "rsi",
            "condition": "below",
            "value": 30.0,
            "parameters": {"period": 14},
            "created_at": "2025-08-03T09:15:00Z",
            "expiration": None,
            "status": "active"
        },
        {
            "id": "ta2",
            "user_id": "user1",
            "symbol": "AMZN",
            "indicator": "moving_average_cross",
            "condition": "cross_above",
            "parameters": {"fast_period": 50, "slow_period": 200},
            "created_at": "2025-08-04T11:45:00Z",
            "expiration": None,
            "status": "active"
        }
    ],
    "news_alerts": [
        {
            "id": "na1",
            "user_id": "user1",
            "keywords": ["acquisition", "merger", "buyout"],
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "created_at": "2025-08-05T16:20:00Z",
            "expiration": None,
            "status": "active"
        }
    ],
    "earnings_alerts": [
        {
            "id": "ea1",
            "user_id": "user1",
            "symbol": "NVDA",
            "days_before": 3,
            "created_at": "2025-08-06T13:10:00Z",
            "status": "active"
        }
    ],
    "pattern_alerts": [
        {
            "id": "pat1",
            "user_id": "user1",
            "symbol": "TSLA",
            "pattern": "head_and_shoulders",
            "timeframe": "daily",
            "created_at": "2025-08-07T10:30:00Z",
            "status": "active"
        }
    ],
    "volume_alerts": [
        {
            "id": "va1",
            "user_id": "user1",
            "symbol": "AMD",
            "condition": "above",
            "volume_multiplier": 2.0,
            "created_at": "2025-08-08T15:45:00Z",
            "expiration": None,
            "status": "active"
        }
    ],
    "ai_alerts": [
        {
            "id": "aia1",
            "user_id": "user1",
            "symbol": "AMZN",
            "alert_type": "price_prediction",
            "threshold": 0.05,  # 5% predicted move
            "created_at": "2025-08-09T09:00:00Z",
            "expiration": None,
            "status": "active"
        },
        {
            "id": "aia2",
            "user_id": "user1",
            "symbol": "META",
            "alert_type": "sentiment_shift",
            "threshold": 0.3,  # Significant sentiment shift
            "created_at": "2025-08-10T14:20:00Z",
            "expiration": None,
            "status": "active"
        }
    ]
}

# Mock notifications - will be replaced with database storage
mock_notifications = [
    {
        "id": "n1",
        "user_id": "user1",
        "alert_id": "pa1",
        "alert_type": "price_alert",
        "symbol": "AAPL",
        "message": "AAPL price is now above $190.00",
        "created_at": "2025-08-10T14:30:00Z",
        "read": False
    },
    {
        "id": "n2",
        "user_id": "user1",
        "alert_id": "ta1",
        "alert_type": "technical_alert",
        "symbol": "GOOGL",
        "message": "GOOGL RSI(14) is now below 30.0 (oversold)",
        "created_at": "2025-08-09T10:15:00Z",
        "read": True
    },
    {
        "id": "n3",
        "user_id": "user1",
        "alert_id": "na1",
        "alert_type": "news_alert",
        "symbol": "MSFT",
        "message": "Breaking news for MSFT: Microsoft announces acquisition of AI startup",
        "created_at": "2025-08-08T09:45:00Z",
        "read": False
    },
    {
        "id": "n4",
        "user_id": "user1",
        "alert_id": "aia2",
        "alert_type": "ai_alert",
        "symbol": "META",
        "message": "AI detected significant positive sentiment shift for META",
        "created_at": "2025-08-07T16:20:00Z",
        "read": True
    },
    {
        "id": "n5",
        "user_id": "user1",
        "alert_id": None,
        "alert_type": "system",
        "symbol": None,
        "message": "Market volatility alert: VIX has increased by 25% today",
        "created_at": "2025-08-06T15:30:00Z",
        "read": False
    }
]

# --- Helper Functions ---

def generate_mock_ai_insights() -> List[Dict[str, Any]]:
    """
    Generate mock AI insights for demonstration purposes.
    """
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD"]
    insights = []
    
    # Generate random insights
    for _ in range(5):
        symbol = np.random.choice(symbols)
        insight_type = np.random.choice([
            "price_prediction", "sentiment_shift", "unusual_activity", 
            "pattern_detection", "volatility_forecast", "sector_rotation"
        ])
        
        if insight_type == "price_prediction":
            direction = np.random.choice(["upward", "downward"])
            magnitude = np.random.uniform(0.03, 0.15)
            confidence = np.random.uniform(0.6, 0.95)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"Predicted {direction} move for {symbol}",
                "description": f"AI models predict a {direction} price movement of approximately {magnitude*100:.1f}% for {symbol} in the next 5 trading days.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "direction": direction,
                    "magnitude": magnitude,
                    "timeframe": "5d"
                }
            })
        
        elif insight_type == "sentiment_shift":
            direction = np.random.choice(["positive", "negative"])
            magnitude = np.random.uniform(0.2, 0.6)
            confidence = np.random.uniform(0.7, 0.9)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"Significant {direction} sentiment shift for {symbol}",
                "description": f"AI sentiment analysis detected a significant {direction} shift in market sentiment for {symbol} based on news and social media analysis.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "direction": direction,
                    "magnitude": magnitude,
                    "sources": ["news", "social_media", "analyst_reports"]
                }
            })
        
        elif insight_type == "unusual_activity":
            activity_type = np.random.choice(["volume", "options", "short_interest", "insider_trading"])
            confidence = np.random.uniform(0.75, 0.95)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"Unusual {activity_type} activity detected for {symbol}",
                "description": f"AI models have detected unusual {activity_type} activity for {symbol} that may indicate upcoming price movement.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "activity_type": activity_type,
                    "deviation": np.random.uniform(2.0, 5.0),
                    "historical_context": "3-month high"
                }
            })
        
        elif insight_type == "pattern_detection":
            pattern = np.random.choice(["head_and_shoulders", "double_bottom", "cup_and_handle", "flag", "triangle"])
            confidence = np.random.uniform(0.65, 0.85)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"{pattern.replace('_', ' ').title()} pattern detected for {symbol}",
                "description": f"AI pattern recognition has identified a {pattern.replace('_', ' ')} pattern forming on {symbol}'s chart.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "pattern": pattern,
                    "timeframe": np.random.choice(["daily", "4h", "1h"]),
                    "completion": np.random.uniform(0.7, 1.0)
                }
            })
        
        elif insight_type == "volatility_forecast":
            direction = np.random.choice(["increasing", "decreasing"])
            magnitude = np.random.uniform(0.2, 0.5)
            confidence = np.random.uniform(0.7, 0.9)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"Volatility forecast for {symbol}",
                "description": f"AI models predict {direction} volatility for {symbol} in the coming week.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "direction": direction,
                    "magnitude": magnitude,
                    "timeframe": "1w"
                }
            })
        
        elif insight_type == "sector_rotation":
            sector = np.random.choice(["Technology", "Healthcare", "Financials", "Energy", "Consumer Discretionary"])
            direction = np.random.choice(["into", "out of"])
            confidence = np.random.uniform(0.6, 0.85)
            
            insights.append({
                "id": f"insight_{len(insights) + 1}",
                "symbol": symbol,
                "type": insight_type,
                "title": f"Sector rotation {direction} {sector}",
                "description": f"AI models detect early signs of market rotation {direction} the {sector} sector, which may impact {symbol}.",
                "confidence": confidence,
                "created_at": (datetime.now() - timedelta(hours=np.random.randint(1, 24))).isoformat(),
                "metadata": {
                    "sector": sector,
                    "direction": direction,
                    "strength": np.random.uniform(0.3, 0.8)
                }
            })
    
    # Sort by created_at (newest first)
    insights.sort(key=lambda x: x["created_at"], reverse=True)
    
    return insights

# --- Endpoints ---

@router.get("/alerts")
async def get_all_alerts() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all alerts for the current user.
    """
    return mock_alerts

@router.post("/alerts/price")
async def create_price_alert(alert: PriceAlert) -> Dict[str, Any]:
    """
    Create a new price alert.
    """
    try:
        new_alert = {
            "id": f"pa{len(mock_alerts['price_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "condition": alert.condition,
            "price": alert.price,
            "created_at": datetime.now().isoformat(),
            "expiration": alert.expiration,
            "status": "active"
        }
        
        mock_alerts["price_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating price alert: {str(e)}")

@router.post("/alerts/technical")
async def create_technical_alert(alert: TechnicalAlert) -> Dict[str, Any]:
    """
    Create a new technical indicator alert.
    """
    try:
        new_alert = {
            "id": f"ta{len(mock_alerts['technical_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "indicator": alert.indicator,
            "condition": alert.condition,
            "value": alert.value,
            "parameters": alert.parameters or {},
            "created_at": datetime.now().isoformat(),
            "expiration": alert.expiration,
            "status": "active"
        }
        
        mock_alerts["technical_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating technical alert: {str(e)}")

@router.post("/alerts/news")
async def create_news_alert(alert: NewsAlert) -> Dict[str, Any]:
    """
    Create a new news alert.
    """
    try:
        new_alert = {
            "id": f"na{len(mock_alerts['news_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "keywords": alert.keywords,
            "symbols": alert.symbols,
            "created_at": datetime.now().isoformat(),
            "expiration": alert.expiration,
            "status": "active"
        }
        
        mock_alerts["news_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating news alert: {str(e)}")

@router.post("/alerts/earnings")
async def create_earnings_alert(alert: EarningsAlert) -> Dict[str, Any]:
    """
    Create a new earnings alert.
    """
    try:
        new_alert = {
            "id": f"ea{len(mock_alerts['earnings_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "days_before": alert.days_before,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        mock_alerts["earnings_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating earnings alert: {str(e)}")

@router.post("/alerts/pattern")
async def create_pattern_alert(alert: PatternAlert) -> Dict[str, Any]:
    """
    Create a new chart pattern alert.
    """
    try:
        new_alert = {
            "id": f"pat{len(mock_alerts['pattern_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "pattern": alert.pattern,
            "timeframe": alert.timeframe,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        mock_alerts["pattern_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating pattern alert: {str(e)}")

@router.post("/alerts/volume")
async def create_volume_alert(alert: VolumeAlert) -> Dict[str, Any]:
    """
    Create a new volume alert.
    """
    try:
        new_alert = {
            "id": f"va{len(mock_alerts['volume_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "condition": alert.condition,
            "volume_multiplier": alert.volume_multiplier,
            "created_at": datetime.now().isoformat(),
            "expiration": alert.expiration,
            "status": "active"
        }
        
        mock_alerts["volume_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating volume alert: {str(e)}")

@router.post("/alerts/ai")
async def create_ai_alert(alert: AIAlert) -> Dict[str, Any]:
    """
    Create a new AI-powered alert.
    """
    try:
        new_alert = {
            "id": f"aia{len(mock_alerts['ai_alerts']) + 1}",
            "user_id": "user1",  # In a real app, this would come from authentication
            "symbol": alert.symbol,
            "alert_type": alert.alert_type,
            "threshold": alert.threshold,
            "created_at": datetime.now().isoformat(),
            "expiration": alert.expiration,
            "status": "active"
        }
        
        mock_alerts["ai_alerts"].append(new_alert)
        return new_alert
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating AI alert: {str(e)}")

@router.delete("/alerts/{alert_type}/{alert_id}")
async def delete_alert(
    alert_type: str,
    alert_id: str
) -> Dict[str, Any]:
    """
    Delete an alert.
    """
    try:
        alert_type_key = f"{alert_type}_alerts"
        if alert_type_key not in mock_alerts:
            raise HTTPException(status_code=400, detail=f"Invalid alert type: {alert_type}")
        
        # Find the alert
        alert_index = None
        for i, alert in enumerate(mock_alerts[alert_type_key]):
            if alert["id"] == alert_id:
                alert_index = i
                break
        
        if alert_index is None:
            raise HTTPException(status_code=404, detail=f"Alert not found: {alert_id}")
        
        # Remove the alert
        deleted_alert = mock_alerts[alert_type_key].pop(alert_index)
        
        return {
            "message": f"Alert {alert_id} deleted successfully",
            "deleted_alert": deleted_alert
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")

@router.get("/notifications")
async def get_notifications(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False)
) -> Dict[str, Any]:
    """
    Get notifications for the current user.
    """
    try:
        # Filter notifications
        filtered_notifications = mock_notifications
        if unread_only:
            filtered_notifications = [n for n in filtered_notifications if not n["read"]]
        
        # Apply pagination
        paginated_notifications = filtered_notifications[offset:offset + limit]
        
        return {
            "total": len(filtered_notifications),
            "unread_count": len([n for n in filtered_notifications if not n["read"]]),
            "offset": offset,
            "limit": limit,
            "notifications": paginated_notifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting notifications: {str(e)}")

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str) -> Dict[str, Any]:
    """
    Mark a notification as read.
    """
    try:
        # Find the notification
        notification = None
        for n in mock_notifications:
            if n["id"] == notification_id:
                notification = n
                break
        
        if notification is None:
            raise HTTPException(status_code=404, detail=f"Notification not found: {notification_id}")
        
        # Mark as read
        notification["read"] = True
        
        return {
            "message": f"Notification {notification_id} marked as read",
            "notification": notification
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.post("/notifications/read-all")
async def mark_all_notifications_read() -> Dict[str, Any]:
    """
    Mark all notifications as read.
    """
    try:
        # Mark all as read
        unread_count = 0
        for n in mock_notifications:
            if not n["read"]:
                n["read"] = True
                unread_count += 1
        
        return {
            "message": f"Marked {unread_count} notifications as read"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notifications as read: {str(e)}")

@router.get("/ai-insights")
async def get_ai_insights(
    limit: int = Query(10, ge=1, le=50),
    insight_type: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """
    Get AI-generated market insights.
    """
    try:
        # Generate mock insights
        insights = generate_mock_ai_insights()
        
        # Filter by type if specified
        if insight_type:
            insights = [i for i in insights if i["type"] == insight_type]
        
        # Apply limit
        limited_insights = insights[:limit]
        
        return {
            "total": len(insights),
            "insights": limited_insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting AI insights: {str(e)}")

@router.get("/market-movers")
async def get_market_movers() -> Dict[str, Any]:
    """
    Get AI-detected unusual market movers.
    """
    try:
        # Generate mock market movers
        symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", 
                  "JPM", "V", "WMT", "PG", "JNJ", "UNH", "HD", "DIS"]
        
        # Generate gainers
        gainers = []
        for _ in range(5):
            symbol = np.random.choice(symbols)
            price_change = np.random.uniform(0.05, 0.2)
            volume_change = np.random.uniform(1.5, 5.0)
            
            gainers.append({
                "symbol": symbol,
                "price": np.random.uniform(50, 500),
                "price_change": price_change,
                "price_change_percent": price_change * 100,
                "volume": np.random.uniform(1e6, 10e6),
                "volume_change_percent": volume_change * 100,
                "unusual_factors": [
                    np.random.choice(["high_volume", "news_sentiment", "analyst_upgrade", "sector_momentum"])
                ]
            })
        
        # Generate losers
        losers = []
        for _ in range(5):
            symbol = np.random.choice(symbols)
            price_change = np.random.uniform(-0.2, -0.05)
            volume_change = np.random.uniform(1.5, 5.0)
            
            losers.append({
                "symbol": symbol,
                "price": np.random.uniform(50, 500),
                "price_change": price_change,
                "price_change_percent": price_change * 100,
                "volume": np.random.uniform(1e6, 10e6),
                "volume_change_percent": volume_change * 100,
                "unusual_factors": [
                    np.random.choice(["high_volume", "news_sentiment", "analyst_downgrade", "sector_weakness"])
                ]
            })
        
        # Generate unusual volume
        unusual_volume = []
        for _ in range(5):
            symbol = np.random.choice(symbols)
            volume_change = np.random.uniform(2.0, 10.0)
            price_change = np.random.uniform(-0.1, 0.1)
            
            unusual_volume.append({
                "symbol": symbol,
                "price": np.random.uniform(50, 500),
                "price_change": price_change,
                "price_change_percent": price_change * 100,
                "volume": np.random.uniform(5e6, 20e6),
                "volume_change_percent": volume_change * 100,
                "avg_volume": np.random.uniform(1e6, 5e6),
                "volume_ratio": volume_change
            })
        
        # Generate unusual options activity
        unusual_options = []
        for _ in range(5):
            symbol = np.random.choice(symbols)
            
            unusual_options.append({
                "symbol": symbol,
                "contract_type": np.random.choice(["call", "put"]),
                "strike_price": np.random.uniform(50, 500),
                "expiration": (datetime.now() + timedelta(days=np.random.randint(7, 60))).strftime("%Y-%m-%d"),
                "volume": np.random.uniform(1000, 10000),
                "open_interest": np.random.uniform(500, 5000),
                "volume_oi_ratio": np.random.uniform(2.0, 10.0),
                "implied_volatility": np.random.uniform(0.3, 1.2)
            })
        
        return {
            "gainers": gainers,
            "losers": losers,
            "unusual_volume": unusual_volume,
            "unusual_options": unusual_options,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market movers: {str(e)}")