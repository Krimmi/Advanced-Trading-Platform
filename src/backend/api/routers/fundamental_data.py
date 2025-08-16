"""
Router for fundamental data endpoints using FMP API.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any, Optional
import httpx
from datetime import datetime, timedelta

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import rate limiting utility
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

@router.get("/profile/{symbol}")
async def get_company_profile(symbol: str) -> Dict[str, Any]:
    """
    Get company profile information.
    """
    data = await get_fmp_data(f"profile/{symbol}")
    if not data:
        raise HTTPException(status_code=404, detail=f"Profile not found for symbol: {symbol}")
    return data[0]

@router.get("/income-statement/{symbol}")
async def get_income_statement(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of statements to return")
) -> List[Dict[str, Any]]:
    """
    Get income statements for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"income-statement/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Income statements not found for symbol: {symbol}")
    
    return data

@router.get("/balance-sheet/{symbol}")
async def get_balance_sheet(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of statements to return")
) -> List[Dict[str, Any]]:
    """
    Get balance sheets for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"balance-sheet-statement/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Balance sheets not found for symbol: {symbol}")
    
    return data

@router.get("/cash-flow/{symbol}")
async def get_cash_flow(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of statements to return")
) -> List[Dict[str, Any]]:
    """
    Get cash flow statements for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"cash-flow-statement/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Cash flow statements not found for symbol: {symbol}")
    
    return data

@router.get("/key-metrics/{symbol}")
async def get_key_metrics(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of periods to return")
) -> List[Dict[str, Any]]:
    """
    Get key metrics for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"key-metrics/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Key metrics not found for symbol: {symbol}")
    
    return data

@router.get("/financial-ratios/{symbol}")
async def get_financial_ratios(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of periods to return")
) -> List[Dict[str, Any]]:
    """
    Get financial ratios for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"ratios/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Financial ratios not found for symbol: {symbol}")
    
    return data

@router.get("/earnings/{symbol}")
async def get_earnings(
    symbol: str,
    limit: int = Query(4, description="Number of earnings to return")
) -> List[Dict[str, Any]]:
    """
    Get earnings data for a company.
    """
    endpoint = f"earnings/{symbol}"
    params = {
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Earnings data not found for symbol: {symbol}")
    
    return data

@router.get("/earnings-calendar")
async def get_earnings_calendar(
    from_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    to_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format")
) -> List[Dict[str, Any]]:
    """
    Get earnings calendar.
    """
    # Set default dates if not provided
    if not to_date:
        to_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    if not from_date:
        from_date = datetime.now().strftime("%Y-%m-%d")
    
    endpoint = "earning_calendar"
    params = {
        "from": from_date,
        "to": to_date
    }
    
    data = await get_fmp_data(endpoint, params)
    return data

@router.get("/insider-trading/{symbol}")
async def get_insider_trading(
    symbol: str,
    limit: int = Query(100, description="Number of transactions to return")
) -> List[Dict[str, Any]]:
    """
    Get insider trading data for a company.
    """
    endpoint = f"insider-trading"
    params = {
        "symbol": symbol,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Insider trading data not found for symbol: {symbol}")
    
    return data

@router.get("/sec-filings/{symbol}")
async def get_sec_filings(
    symbol: str,
    limit: int = Query(20, description="Number of filings to return")
) -> List[Dict[str, Any]]:
    """
    Get SEC filings for a company.
    """
    endpoint = f"sec_filings/{symbol}"
    params = {
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"SEC filings not found for symbol: {symbol}")
    
    return data

@router.get("/analyst-estimates/{symbol}")
async def get_analyst_estimates(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of estimates to return")
) -> List[Dict[str, Any]]:
    """
    Get analyst estimates for a company.
    """
    if period not in ["annual", "quarter"]:
        raise HTTPException(status_code=400, detail="Period must be either 'annual' or 'quarter'")
    
    endpoint = f"analyst-estimates/{symbol}"
    params = {
        "period": period,
        "limit": limit
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Analyst estimates not found for symbol: {symbol}")
    
    return data

@router.get("/price-target/{symbol}")
async def get_price_target(symbol: str) -> Dict[str, Any]:
    """
    Get price target for a company.
    """
    endpoint = f"price-target/{symbol}"
    
    data = await get_fmp_data(endpoint)
    if not data:
        raise HTTPException(status_code=404, detail=f"Price target not found for symbol: {symbol}")
    
    return data[0]

@router.get("/esg-score/{symbol}")
async def get_esg_score(symbol: str) -> Dict[str, Any]:
    """
    Get ESG score for a company.
    """
    endpoint = f"esg-environmental-social-governance-data"
    params = {
        "symbol": symbol
    }
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"ESG score not found for symbol: {symbol}")
    
    return data[0]

@router.get("/earnings-call-transcript/{symbol}")
async def get_earnings_call_transcript(
    symbol: str,
    quarter: Optional[int] = Query(None, description="Quarter (1-4)"),
    year: Optional[int] = Query(None, description="Year (e.g., 2023)")
) -> Dict[str, Any]:
    """
    Get earnings call transcript for a company.
    """
    endpoint = f"earning_call_transcript/{symbol}"
    params = {}
    
    if quarter is not None and year is not None:
        params["quarter"] = quarter
        params["year"] = year
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Earnings call transcript not found for symbol: {symbol}")
    
    return data[0]

@router.get("/form-13f")
async def get_form_13f(
    cik: str = Query(..., description="CIK number"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format")
) -> List[Dict[str, Any]]:
    """
    Get Form 13F data for an institution.
    """
    endpoint = f"form-thirteen/{cik}"
    params = {}
    
    if date:
        params["date"] = date
    
    data = await get_fmp_data(endpoint, params)
    if not data:
        raise HTTPException(status_code=404, detail=f"Form 13F data not found for CIK: {cik}")
    
    return data