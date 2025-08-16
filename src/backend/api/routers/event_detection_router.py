"""
Router for event detection endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import event detection module
from src.ml_models.fundamental_analysis.event_detection import (
    EventDetectionService, FinancialEvent
)

# Import fundamental data router for FMP API access
from .fundamental_data import get_fmp_data

router = APIRouter()

# Initialize event detection service
event_detection_service = EventDetectionService()

@router.get("/earnings-events/{symbol}")
async def get_earnings_events(
    symbol: str,
    limit: int = Query(4, description="Number of earnings to analyze")
) -> List[Dict[str, Any]]:
    """
    Detect earnings events for a company.
    """
    try:
        # Get earnings data from FMP API
        earnings_data = await get_fmp_data(f"earnings/{symbol}", {"limit": limit})
        
        if not earnings_data:
            raise HTTPException(status_code=404, detail=f"Earnings data not found for symbol: {symbol}")
        
        # Detect earnings events
        detector = event_detection_service.detectors["earnings"]
        events = detector.detect_events(earnings_data)
        
        # Convert events to dictionaries
        return [event.to_dict() for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting earnings events: {str(e)}")

@router.get("/dividend-events/{symbol}")
async def get_dividend_events(
    symbol: str,
    limit: int = Query(10, description="Number of dividends to analyze")
) -> List[Dict[str, Any]]:
    """
    Detect dividend events for a company.
    """
    try:
        # Get dividend data from FMP API
        dividend_data = await get_fmp_data(f"historical-price-full/stock_dividend/{symbol}", {"limit": limit})
        
        if not dividend_data or "historical" not in dividend_data:
            raise HTTPException(status_code=404, detail=f"Dividend data not found for symbol: {symbol}")
        
        # Detect dividend events
        detector = event_detection_service.detectors["dividend"]
        events = detector.detect_events(dividend_data["historical"])
        
        # Convert events to dictionaries
        return [event.to_dict() for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting dividend events: {str(e)}")

@router.get("/news-events/{symbol}")
async def get_news_events(
    symbol: str,
    limit: int = Query(50, description="Number of news items to analyze")
) -> List[Dict[str, Any]]:
    """
    Detect news events for a company.
    """
    try:
        # Get news data from FMP API
        news_data = await get_fmp_data(f"stock_news", {"tickers": symbol, "limit": limit})
        
        if not news_data:
            raise HTTPException(status_code=404, detail=f"News data not found for symbol: {symbol}")
        
        # Format news data for the detector
        formatted_news = []
        for news in news_data:
            formatted_news.append({
                "symbol": symbol,
                "date": news.get("publishedDate", ""),
                "headline": news.get("title", ""),
                "content": news.get("text", ""),
                "source": news.get("site", "news"),
                "url": news.get("url", "")
            })
        
        # Detect news events
        detector = event_detection_service.detectors["news"]
        events = detector.detect_events(formatted_news)
        
        # Convert events to dictionaries
        return [event.to_dict() for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting news events: {str(e)}")

@router.get("/technical-events/{symbol}")
async def get_technical_events(
    symbol: str,
    days: int = Query(200, description="Number of days of price data to analyze")
) -> List[Dict[str, Any]]:
    """
    Detect technical events for a company.
    """
    try:
        # Get price data from FMP API
        price_data = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": days})
        
        if not price_data or "historical" not in price_data:
            raise HTTPException(status_code=404, detail=f"Price data not found for symbol: {symbol}")
        
        # Convert to pandas DataFrame
        historical = price_data["historical"]
        df = pd.DataFrame(historical)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df.sort_index(inplace=True)
        
        # Add symbol column
        df['symbol'] = symbol
        
        # Detect technical events
        detector = event_detection_service.detectors["technical"]
        events = detector.detect_events(df)
        
        # Convert events to dictionaries
        return [event.to_dict() for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting technical events: {str(e)}")

@router.get("/all-events/{symbol}")
async def get_all_events(
    symbol: str,
    days: int = Query(200, description="Number of days of data to analyze"),
    event_types: Optional[List[str]] = Query(None, description="Types of events to include")
) -> List[Dict[str, Any]]:
    """
    Detect all types of events for a company.
    """
    try:
        # Initialize data dictionary
        data = {}
        
        # Get earnings data
        try:
            earnings_data = await get_fmp_data(f"earnings/{symbol}", {"limit": 4})
            if earnings_data:
                data["earnings_data"] = earnings_data
        except:
            pass
        
        # Get dividend data
        try:
            dividend_data = await get_fmp_data(f"historical-price-full/stock_dividend/{symbol}", {"limit": 10})
            if dividend_data and "historical" in dividend_data:
                data["dividend_data"] = dividend_data["historical"]
        except:
            pass
        
        # Get news data
        try:
            news_data = await get_fmp_data(f"stock_news", {"tickers": symbol, "limit": 50})
            if news_data:
                # Format news data for the detector
                formatted_news = []
                for news in news_data:
                    formatted_news.append({
                        "symbol": symbol,
                        "date": news.get("publishedDate", ""),
                        "headline": news.get("title", ""),
                        "content": news.get("text", ""),
                        "source": news.get("site", "news"),
                        "url": news.get("url", "")
                    })
                data["news_data"] = formatted_news
        except:
            pass
        
        # Get price data
        try:
            price_data = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": days})
            if price_data and "historical" in price_data:
                # Convert to pandas DataFrame
                historical = price_data["historical"]
                df = pd.DataFrame(historical)
                df['date'] = pd.to_datetime(df['date'])
                df.set_index('date', inplace=True)
                df.sort_index(inplace=True)
                
                # Add symbol column
                df['symbol'] = symbol
                
                data["price_data"] = df
        except:
            pass
        
        # Detect events
        events = event_detection_service.detect_events(data, event_types)
        
        # Convert events to dictionaries
        return [event.to_dict() for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting events: {str(e)}")

@router.get("/filter-events/{symbol}")
async def filter_events(
    symbol: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    event_types: Optional[List[str]] = Query(None, description="Types of events to include"),
    min_impact_score: Optional[float] = Query(None, description="Minimum absolute impact score")
) -> List[Dict[str, Any]]:
    """
    Get filtered events for a company.
    """
    try:
        # Get all events first
        all_events_response = await get_all_events(symbol, 365, None)
        
        # Convert dictionary events back to FinancialEvent objects
        events = [FinancialEvent.from_dict(event_dict) for event_dict in all_events_response]
        
        # Filter events
        filtered_events = event_detection_service.filter_events(
            events,
            start_date,
            end_date,
            [symbol],
            event_types,
            min_impact_score
        )
        
        # Convert events to dictionaries
        return [event.to_dict() for event in filtered_events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filtering events: {str(e)}")

@router.get("/event-impact/{symbol}")
async def analyze_event_impact(
    symbol: str,
    event_type: str = Query(..., description="Type of event to analyze"),
    window_days: int = Query(5, description="Number of days to analyze after each event"),
    days: int = Query(365, description="Number of days of historical data to use")
) -> Dict[str, Any]:
    """
    Analyze the price impact of events.
    """
    try:
        # Get price data
        price_data = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": days})
        
        if not price_data or "historical" not in price_data:
            raise HTTPException(status_code=404, detail=f"Price data not found for symbol: {symbol}")
        
        # Convert to pandas DataFrame
        historical = price_data["historical"]
        df = pd.DataFrame(historical)
        df['date'] = pd.to_datetime(df['date'])
        df.set_index('date', inplace=True)
        df.sort_index(inplace=True)
        
        # Add symbol column
        df['symbol'] = symbol
        
        # Get all events
        all_events_response = await get_all_events(symbol, days, None)
        
        # Convert dictionary events back to FinancialEvent objects
        events = [FinancialEvent.from_dict(event_dict) for event_dict in all_events_response]
        
        # Filter by event type if specified
        if event_type != "all":
            events = [event for event in events if event.event_type == event_type]
        
        # Analyze event impact
        impact_analysis = event_detection_service.analyze_event_impact(events, df, window_days)
        
        return impact_analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing event impact: {str(e)}")