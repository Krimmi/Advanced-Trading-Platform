"""
Router for stock screener endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, List, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import numpy as np

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

# --- Pydantic Models ---

class ScreenerFilter(BaseModel):
    field: str
    operator: str  # eq, gt, lt, gte, lte, between
    value: Any
    value2: Optional[Any] = None  # For 'between' operator

class ScreenerRequest(BaseModel):
    filters: List[ScreenerFilter]
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "desc"  # asc or desc
    limit: int = Field(50, ge=1, le=1000)
    offset: int = 0

# --- Mock Data ---

# Generate mock stock data for screening
def generate_mock_stocks(count: int = 100) -> List[Dict[str, Any]]:
    sectors = ["Technology", "Healthcare", "Financials", "Consumer Discretionary", 
               "Communication Services", "Industrials", "Consumer Staples", "Energy", 
               "Utilities", "Materials", "Real Estate"]
    
    industries = {
        "Technology": ["Software", "Hardware", "Semiconductors", "IT Services"],
        "Healthcare": ["Pharmaceuticals", "Biotechnology", "Medical Devices", "Healthcare Providers"],
        "Financials": ["Banks", "Insurance", "Asset Management", "Financial Services"],
        "Consumer Discretionary": ["Retail", "Automotive", "Hotels & Leisure", "Consumer Services"],
        "Communication Services": ["Telecom", "Media", "Entertainment", "Interactive Media"],
        "Industrials": ["Aerospace & Defense", "Construction", "Machinery", "Transportation"],
        "Consumer Staples": ["Food & Beverage", "Household Products", "Personal Products"],
        "Energy": ["Oil & Gas", "Renewable Energy", "Energy Equipment"],
        "Utilities": ["Electric Utilities", "Gas Utilities", "Water Utilities"],
        "Materials": ["Chemicals", "Metals & Mining", "Construction Materials"],
        "Real Estate": ["REITs", "Real Estate Management", "Real Estate Development"]
    }
    
    stocks = []
    
    for i in range(count):
        # Generate ticker symbol
        ticker = ''.join(np.random.choice(list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 4))
        
        # Select sector and industry
        sector = np.random.choice(sectors)
        industry = np.random.choice(industries[sector])
        
        # Generate financial metrics
        market_cap = np.random.choice([
            np.random.uniform(100e6, 1e9),     # Small cap
            np.random.uniform(1e9, 10e9),      # Mid cap
            np.random.uniform(10e9, 100e9),    # Large cap
            np.random.uniform(100e9, 2e12)     # Mega cap
        ], p=[0.4, 0.3, 0.2, 0.1])
        
        price = np.random.uniform(5, 500)
        pe_ratio = np.random.choice([
            np.random.uniform(5, 15),          # Value
            np.random.uniform(15, 30),         # Growth
            np.random.uniform(30, 100),        # High growth
            None                               # Negative earnings
        ], p=[0.3, 0.4, 0.2, 0.1])
        
        dividend_yield = np.random.choice([
            0,                                 # No dividend
            np.random.uniform(0.5, 2),         # Low yield
            np.random.uniform(2, 5),           # Medium yield
            np.random.uniform(5, 10)           # High yield
        ], p=[0.3, 0.4, 0.2, 0.1])
        
        beta = np.random.normal(1.0, 0.5)
        
        # Financial health metrics
        debt_to_equity = np.random.uniform(0, 2)
        current_ratio = np.random.uniform(0.5, 3)
        
        # Growth metrics
        revenue_growth = np.random.normal(0.1, 0.2)  # Mean 10%, std 20%
        eps_growth = np.random.normal(0.1, 0.25)     # Mean 10%, std 25%
        
        # Profitability metrics
        net_margin = np.random.uniform(-0.1, 0.3)
        roe = np.random.uniform(-0.1, 0.4)
        
        # Valuation metrics
        pb_ratio = np.random.uniform(0.5, 10)
        ev_to_ebitda = np.random.uniform(5, 30) if np.random.random() > 0.1 else None
        
        # Technical metrics
        price_change_1d = np.random.normal(0, 0.02)  # Daily return, mean 0%, std 2%
        price_change_1m = np.random.normal(0, 0.08)  # Monthly return
        price_change_3m = np.random.normal(0, 0.15)  # Quarterly return
        price_change_1y = np.random.normal(0, 0.25)  # Annual return
        
        rsi_14 = np.random.uniform(0, 100)
        
        # Create stock object
        stock = {
            "symbol": ticker,
            "name": f"{ticker} Corporation",
            "sector": sector,
            "industry": industry,
            "market_cap": market_cap,
            "price": price,
            "pe_ratio": pe_ratio,
            "forward_pe": pe_ratio * np.random.uniform(0.8, 1.2) if pe_ratio else None,
            "peg_ratio": pe_ratio / (eps_growth * 100) if pe_ratio and eps_growth > 0 else None,
            "ps_ratio": market_cap / (market_cap / np.random.uniform(1, 10)),
            "pb_ratio": pb_ratio,
            "dividend_yield": dividend_yield,
            "beta": beta,
            "52w_high": price * np.random.uniform(1, 1.5),
            "52w_low": price * np.random.uniform(0.5, 1),
            "avg_volume": np.random.uniform(100e3, 10e6),
            "debt_to_equity": debt_to_equity,
            "current_ratio": current_ratio,
            "quick_ratio": current_ratio * np.random.uniform(0.7, 0.9),
            "roe": roe,
            "roa": roe * np.random.uniform(0.3, 0.7),
            "net_margin": net_margin,
            "operating_margin": net_margin * np.random.uniform(1, 1.5),
            "revenue_growth": revenue_growth,
            "eps_growth": eps_growth,
            "ev_to_ebitda": ev_to_ebitda,
            "price_change_1d": price_change_1d,
            "price_change_1m": price_change_1m,
            "price_change_3m": price_change_3m,
            "price_change_1y": price_change_1y,
            "rsi_14": rsi_14,
            "macd": np.random.uniform(-10, 10),
            "analyst_rating": np.random.choice(["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"]),
            "price_target": price * np.random.uniform(0.8, 1.5),
            "insider_buying": np.random.choice([True, False], p=[0.3, 0.7])
        }
        
        stocks.append(stock)
    
    return stocks

# Generate mock stock data
mock_stocks = generate_mock_stocks(500)

# --- Helper Functions ---

def apply_filter(stocks: List[Dict[str, Any]], filter: ScreenerFilter) -> List[Dict[str, Any]]:
    """
    Apply a single filter to the list of stocks.
    """
    field = filter.field
    operator = filter.operator
    value = filter.value
    value2 = filter.value2
    
    filtered_stocks = []
    
    for stock in stocks:
        if field not in stock or stock[field] is None:
            continue
        
        stock_value = stock[field]
        
        if operator == "eq":
            if stock_value == value:
                filtered_stocks.append(stock)
        elif operator == "gt":
            if stock_value > value:
                filtered_stocks.append(stock)
        elif operator == "lt":
            if stock_value < value:
                filtered_stocks.append(stock)
        elif operator == "gte":
            if stock_value >= value:
                filtered_stocks.append(stock)
        elif operator == "lte":
            if stock_value <= value:
                filtered_stocks.append(stock)
        elif operator == "between":
            if value <= stock_value <= value2:
                filtered_stocks.append(stock)
        elif operator == "in":
            if isinstance(value, list) and stock_value in value:
                filtered_stocks.append(stock)
    
    return filtered_stocks

def sort_stocks(stocks: List[Dict[str, Any]], sort_by: str, sort_order: str) -> List[Dict[str, Any]]:
    """
    Sort stocks by a specific field.
    """
    reverse = sort_order.lower() == "desc"
    
    def sort_key(stock):
        value = stock.get(sort_by)
        # Handle None values in sorting
        if value is None:
            return -float('inf') if reverse else float('inf')
        return value
    
    return sorted(stocks, key=sort_key, reverse=reverse)

# --- Endpoints ---

@router.post("/screen")
async def screen_stocks(request: ScreenerRequest) -> Dict[str, Any]:
    """
    Screen stocks based on filters.
    """
    try:
        # Start with all stocks
        filtered_stocks = mock_stocks
        
        # Apply each filter
        for filter in request.filters:
            filtered_stocks = apply_filter(filtered_stocks, filter)
        
        # Sort results if requested
        if request.sort_by:
            filtered_stocks = sort_stocks(filtered_stocks, request.sort_by, request.sort_order)
        
        # Apply pagination
        total_results = len(filtered_stocks)
        paginated_stocks = filtered_stocks[request.offset:request.offset + request.limit]
        
        return {
            "total_results": total_results,
            "offset": request.offset,
            "limit": request.limit,
            "results": paginated_stocks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error screening stocks: {str(e)}")

@router.get("/filter-options")
async def get_filter_options() -> Dict[str, Any]:
    """
    Get available filter options for the screener.
    """
    # Define available filters and their metadata
    filters = {
        "fundamental": [
            {
                "id": "market_cap",
                "name": "Market Cap",
                "type": "number",
                "unit": "$",
                "operators": ["gt", "lt", "between"],
                "description": "Total market value of a company's outstanding shares"
            },
            {
                "id": "pe_ratio",
                "name": "P/E Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Price-to-earnings ratio"
            },
            {
                "id": "forward_pe",
                "name": "Forward P/E",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Forward price-to-earnings ratio based on estimated future earnings"
            },
            {
                "id": "peg_ratio",
                "name": "PEG Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "P/E ratio divided by earnings growth rate"
            },
            {
                "id": "ps_ratio",
                "name": "P/S Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Price-to-sales ratio"
            },
            {
                "id": "pb_ratio",
                "name": "P/B Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Price-to-book ratio"
            },
            {
                "id": "dividend_yield",
                "name": "Dividend Yield",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Annual dividend yield"
            },
            {
                "id": "beta",
                "name": "Beta",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Measure of volatility compared to the market"
            }
        ],
        "financial_health": [
            {
                "id": "debt_to_equity",
                "name": "Debt to Equity",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Total debt divided by shareholders' equity"
            },
            {
                "id": "current_ratio",
                "name": "Current Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Current assets divided by current liabilities"
            },
            {
                "id": "quick_ratio",
                "name": "Quick Ratio",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Liquid assets divided by current liabilities"
            }
        ],
        "profitability": [
            {
                "id": "roe",
                "name": "Return on Equity",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Net income divided by shareholders' equity"
            },
            {
                "id": "roa",
                "name": "Return on Assets",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Net income divided by total assets"
            },
            {
                "id": "net_margin",
                "name": "Net Profit Margin",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Net income divided by revenue"
            },
            {
                "id": "operating_margin",
                "name": "Operating Margin",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Operating income divided by revenue"
            }
        ],
        "growth": [
            {
                "id": "revenue_growth",
                "name": "Revenue Growth",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Year-over-year revenue growth"
            },
            {
                "id": "eps_growth",
                "name": "EPS Growth",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Year-over-year earnings per share growth"
            }
        ],
        "technical": [
            {
                "id": "price",
                "name": "Price",
                "type": "number",
                "unit": "$",
                "operators": ["gt", "lt", "between"],
                "description": "Current stock price"
            },
            {
                "id": "price_change_1d",
                "name": "1-Day Price Change",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Percentage price change over the last day"
            },
            {
                "id": "price_change_1m",
                "name": "1-Month Price Change",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Percentage price change over the last month"
            },
            {
                "id": "price_change_3m",
                "name": "3-Month Price Change",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Percentage price change over the last 3 months"
            },
            {
                "id": "price_change_1y",
                "name": "1-Year Price Change",
                "type": "number",
                "unit": "%",
                "operators": ["gt", "lt", "between"],
                "description": "Percentage price change over the last year"
            },
            {
                "id": "rsi_14",
                "name": "RSI (14-day)",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Relative Strength Index over 14 days"
            },
            {
                "id": "macd",
                "name": "MACD",
                "type": "number",
                "operators": ["gt", "lt", "between"],
                "description": "Moving Average Convergence Divergence"
            }
        ],
        "classification": [
            {
                "id": "sector",
                "name": "Sector",
                "type": "string",
                "operators": ["eq", "in"],
                "description": "Industry sector",
                "options": list(set(stock["sector"] for stock in mock_stocks))
            },
            {
                "id": "industry",
                "name": "Industry",
                "type": "string",
                "operators": ["eq", "in"],
                "description": "Specific industry within sector",
                "options": list(set(stock["industry"] for stock in mock_stocks))
            },
            {
                "id": "analyst_rating",
                "name": "Analyst Rating",
                "type": "string",
                "operators": ["eq", "in"],
                "description": "Consensus analyst rating",
                "options": ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"]
            },
            {
                "id": "insider_buying",
                "name": "Insider Buying",
                "type": "boolean",
                "operators": ["eq"],
                "description": "Recent insider buying activity",
                "options": [True, False]
            }
        ]
    }
    
    # Define available sort options
    sort_options = [
        {"id": "market_cap", "name": "Market Cap"},
        {"id": "price", "name": "Price"},
        {"id": "pe_ratio", "name": "P/E Ratio"},
        {"id": "dividend_yield", "name": "Dividend Yield"},
        {"id": "price_change_1d", "name": "1-Day Price Change"},
        {"id": "price_change_1m", "name": "1-Month Price Change"},
        {"id": "price_change_3m", "name": "3-Month Price Change"},
        {"id": "price_change_1y", "name": "1-Year Price Change"},
        {"id": "rsi_14", "name": "RSI (14-day)"},
        {"id": "beta", "name": "Beta"},
        {"id": "roe", "name": "Return on Equity"},
        {"id": "revenue_growth", "name": "Revenue Growth"},
        {"id": "eps_growth", "name": "EPS Growth"}
    ]
    
    return {
        "filters": filters,
        "sort_options": sort_options
    }

@router.get("/preset-screens")
async def get_preset_screens() -> List[Dict[str, Any]]:
    """
    Get preset stock screens.
    """
    presets = [
        {
            "id": "value_stocks",
            "name": "Value Stocks",
            "description": "Stocks with attractive valuation metrics",
            "filters": [
                {"field": "pe_ratio", "operator": "lt", "value": 15},
                {"field": "pb_ratio", "operator": "lt", "value": 1.5},
                {"field": "dividend_yield", "operator": "gt", "value": 2}
            ],
            "sort_by": "dividend_yield",
            "sort_order": "desc"
        },
        {
            "id": "growth_stocks",
            "name": "Growth Stocks",
            "description": "Stocks with strong growth characteristics",
            "filters": [
                {"field": "revenue_growth", "operator": "gt", "value": 0.15},
                {"field": "eps_growth", "operator": "gt", "value": 0.15},
                {"field": "market_cap", "operator": "gt", "value": 1e9}
            ],
            "sort_by": "eps_growth",
            "sort_order": "desc"
        },
        {
            "id": "dividend_income",
            "name": "Dividend Income",
            "description": "Stocks with high dividend yields",
            "filters": [
                {"field": "dividend_yield", "operator": "gt", "value": 3},
                {"field": "market_cap", "operator": "gt", "value": 1e9},
                {"field": "beta", "operator": "lt", "value": 1.2}
            ],
            "sort_by": "dividend_yield",
            "sort_order": "desc"
        },
        {
            "id": "momentum",
            "name": "Momentum Stocks",
            "description": "Stocks showing strong price momentum",
            "filters": [
                {"field": "price_change_3m", "operator": "gt", "value": 0.1},
                {"field": "price_change_1m", "operator": "gt", "value": 0.05},
                {"field": "rsi_14", "operator": "between", "value": 50, "value2": 80}
            ],
            "sort_by": "price_change_3m",
            "sort_order": "desc"
        },
        {
            "id": "quality_stocks",
            "name": "Quality Stocks",
            "description": "Stocks with strong financial health and profitability",
            "filters": [
                {"field": "roe", "operator": "gt", "value": 0.15},
                {"field": "debt_to_equity", "operator": "lt", "value": 1},
                {"field": "net_margin", "operator": "gt", "value": 0.1}
            ],
            "sort_by": "roe",
            "sort_order": "desc"
        },
        {
            "id": "oversold",
            "name": "Oversold Stocks",
            "description": "Potentially undervalued stocks based on technical indicators",
            "filters": [
                {"field": "rsi_14", "operator": "lt", "value": 30},
                {"field": "price_change_1m", "operator": "lt", "value": -0.1},
                {"field": "market_cap", "operator": "gt", "value": 500e6}
            ],
            "sort_by": "rsi_14",
            "sort_order": "asc"
        },
        {
            "id": "analyst_favorites",
            "name": "Analyst Favorites",
            "description": "Stocks highly rated by analysts",
            "filters": [
                {"field": "analyst_rating", "operator": "in", "value": ["Strong Buy", "Buy"]},
                {"field": "market_cap", "operator": "gt", "value": 1e9}
            ],
            "sort_by": "market_cap",
            "sort_order": "desc"
        },
        {
            "id": "insider_buying",
            "name": "Insider Buying",
            "description": "Stocks with recent insider buying activity",
            "filters": [
                {"field": "insider_buying", "operator": "eq", "value": True},
                {"field": "market_cap", "operator": "gt", "value": 100e6}
            ],
            "sort_by": "market_cap",
            "sort_order": "desc"
        }
    ]
    
    return presets

@router.get("/top-stocks/{category}")
async def get_top_stocks(
    category: str = Query(..., description="Category: gainers, losers, active, dividend, growth, value"),
    limit: int = Query(10, ge=1, le=50)
) -> List[Dict[str, Any]]:
    """
    Get top stocks by various categories.
    """
    try:
        if category == "gainers":
            # Sort by 1-day price change descending
            sorted_stocks = sorted(mock_stocks, key=lambda x: x.get("price_change_1d", float('-inf')), reverse=True)
        elif category == "losers":
            # Sort by 1-day price change ascending
            sorted_stocks = sorted(mock_stocks, key=lambda x: x.get("price_change_1d", float('inf')))
        elif category == "active":
            # Sort by average volume descending
            sorted_stocks = sorted(mock_stocks, key=lambda x: x.get("avg_volume", 0), reverse=True)
        elif category == "dividend":
            # Sort by dividend yield descending, exclude zeros
            sorted_stocks = sorted([s for s in mock_stocks if s.get("dividend_yield", 0) > 0], 
                                  key=lambda x: x.get("dividend_yield", 0), reverse=True)
        elif category == "growth":
            # Sort by EPS growth descending
            sorted_stocks = sorted(mock_stocks, key=lambda x: x.get("eps_growth", float('-inf')), reverse=True)
        elif category == "value":
            # Sort by P/E ratio ascending, exclude negatives and None
            sorted_stocks = sorted([s for s in mock_stocks if s.get("pe_ratio", None) is not None and s.get("pe_ratio", 0) > 0], 
                                  key=lambda x: x.get("pe_ratio", float('inf')))
        else:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
        
        # Return limited results
        return sorted_stocks[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top stocks: {str(e)}")

@router.get("/sector-performance")
async def get_sector_performance() -> List[Dict[str, Any]]:
    """
    Get performance metrics by sector.
    """
    try:
        # Group stocks by sector
        sectors = {}
        for stock in mock_stocks:
            sector = stock.get("sector")
            if sector not in sectors:
                sectors[sector] = []
            sectors[sector].append(stock)
        
        # Calculate sector performance
        sector_performance = []
        for sector, stocks in sectors.items():
            # Calculate average metrics
            avg_1d_change = np.mean([s.get("price_change_1d", 0) for s in stocks])
            avg_1m_change = np.mean([s.get("price_change_1m", 0) for s in stocks])
            avg_3m_change = np.mean([s.get("price_change_3m", 0) for s in stocks])
            avg_1y_change = np.mean([s.get("price_change_1y", 0) for s in stocks])
            
            # Calculate total market cap
            total_market_cap = sum([s.get("market_cap", 0) for s in stocks])
            
            # Calculate average P/E
            pe_values = [s.get("pe_ratio", None) for s in stocks if s.get("pe_ratio") is not None]
            avg_pe = np.mean(pe_values) if pe_values else None
            
            # Calculate average dividend yield
            div_values = [s.get("dividend_yield", 0) for s in stocks]
            avg_dividend = np.mean(div_values)
            
            sector_performance.append({
                "sector": sector,
                "stock_count": len(stocks),
                "total_market_cap": total_market_cap,
                "price_change_1d": avg_1d_change,
                "price_change_1m": avg_1m_change,
                "price_change_3m": avg_3m_change,
                "price_change_1y": avg_1y_change,
                "average_pe": avg_pe,
                "average_dividend_yield": avg_dividend
            })
        
        # Sort by 1-day performance
        sector_performance.sort(key=lambda x: x["price_change_1d"], reverse=True)
        
        return sector_performance
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating sector performance: {str(e)}")