"""
Router for market data endpoints using FMP API.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any, Optional
import httpx
import asyncio
from datetime import datetime, timedelta

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import rate limiting utility (to be implemented)
from src.utils.rate_limiting.limiter import RateLimiter

router = APIRouter()

# Initialize rate limiter for FMP API
fmp_limiter = RateLimiter(
    limit=settings.FMP_RATE_LIMIT,
    window=60  # 60 seconds (1 minute)
)

# Base FMP API URL
FMP_BASE_URL = "https://financialmodelingprep.com/api/v3"

async def get_fmp_data(endpoint: str, params: Dict = None) -> Dict:
    """
    Helper function to get data from FMP API with rate limiting.
    """
    # Wait if we're at the rate limit
    await fmp_limiter.acquire()
    
    # Add API key to params
    if params is None:
        params = {}
    params["apikey"] = settings.FMP_API_KEY
    
    # Make request to FMP API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{FMP_BASE_URL}/{endpoint}", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=response.status_code, detail=f"FMP API error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")

@router.get("/quote/{symbol}")
async def get_quote(symbol: str) -> Dict[str, Any]:
    """
    Get real-time quote for a stock symbol.
    """
    data = await get_fmp_data(f"quote/{symbol}")
    if not data:
        raise HTTPException(status_code=404, detail=f"Quote not found for symbol: {symbol}")
    return data[0]

@router.get("/historical-price/{symbol}")
async def get_historical_price(
    symbol: str,
    from_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    to_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    timeframe: str = Query("daily", description="Timeframe: daily, weekly, monthly")
) -> List[Dict[str, Any]]:
    """
    Get historical price data for a stock symbol.
    """
    # Set default dates if not provided
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    if not from_date:
        # Default to 1 year of data
        from_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    # Determine endpoint based on timeframe
    if timeframe == "daily":
        endpoint = f"historical-price-full/{symbol}"
    elif timeframe == "weekly":
        endpoint = f"historical-price-full/{symbol}?serietype=line&timeseries=52"
    elif timeframe == "monthly":
        endpoint = f"historical-price-full/{symbol}?serietype=line&timeseries=12"
    else:
        raise HTTPException(status_code=400, detail="Invalid timeframe. Use daily, weekly, or monthly.")
    
    params = {
        "from": from_date,
        "to": to_date
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data or "historical" not in data:
        raise HTTPException(status_code=404, detail=f"Historical data not found for symbol: {symbol}")
    
    return data["historical"]

@router.get("/market-indexes")
async def get_market_indexes() -> List[Dict[str, Any]]:
    """
    Get major market indexes data.
    """
    data = await get_fmp_data("quotes/index")
    return data

@router.get("/sector-performance")
async def get_sector_performance() -> List[Dict[str, Any]]:
    """
    Get sector performance data.
    """
    data = await get_fmp_data("sector-performance")
    return data

@router.get("/market-movers/{type}")
async def get_market_movers(
    type: str = Query(..., description="Type of movers: gainers, losers, or actives")
) -> List[Dict[str, Any]]:
    """
    Get market movers: gainers, losers, or most active.
    """
    if type not in ["gainers", "losers", "actives"]:
        raise HTTPException(status_code=400, detail="Type must be one of: gainers, losers, actives")
    
    endpoint = f"stock_market/{type}"
    data = await get_fmp_data(endpoint)
    return data

@router.get("/forex")
async def get_forex_data() -> List[Dict[str, Any]]:
    """
    Get forex exchange rates.
    """
    data = await get_fmp_data("fx")
    return data

@router.get("/commodities")
async def get_commodities() -> List[Dict[str, Any]]:
    """
    Get commodities data.
    """
    data = await get_fmp_data("quotes/commodity")
    return data

@router.get("/crypto")
async def get_crypto() -> List[Dict[str, Any]]:
    """
    Get cryptocurrency data.
    """
    data = await get_fmp_data("quotes/crypto")
    return data

@router.get("/economic-calendar")
async def get_economic_calendar(
    from_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    to_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format")
) -> List[Dict[str, Any]]:
    """
    Get economic calendar events.
    """
    # Set default dates if not provided
    if not to_date:
        to_date = datetime.now().strftime("%Y-%m-%d")
    if not from_date:
        # Default to 30 days of data
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    params = {
        "from": from_date,
        "to": to_date
    }
    
    data = await get_fmp_data("economic_calendar", params)
    return data