"""
Router for financial analysis endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import financial analysis module
from src.ml_models.fundamental_analysis.financial_analysis import FinancialStatementAnalysis
from src.ml_models.fundamental_analysis.financial_ratios import FinancialRatioCalculator

# Import fundamental data router for FMP API access
from .fundamental_data import get_fmp_data

# Import helper function from valuation router
from .valuation_router import get_financial_data

router = APIRouter()

# Initialize financial analysis service
financial_analysis_service = FinancialStatementAnalysis()

@router.get("/income-statement-analysis/{symbol}")
async def analyze_income_statement(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    compare_previous: bool = Query(True, description="Compare with previous period")
) -> Dict[str, Any]:
    """
    Analyze income statement for a company.
    """
    try:
        # Get income statement data
        income_statements = await get_fmp_data(f"income-statement/{symbol}", {"period": period, "limit": 2 if compare_previous else 1})
        
        if not income_statements:
            raise HTTPException(status_code=404, detail=f"Income statement not found for symbol: {symbol}")
        
        # Get current and previous income statements
        current_income_statement = income_statements[0]
        previous_income_statement = income_statements[1] if compare_previous and len(income_statements) > 1 else None
        
        # Analyze income statement
        analysis = financial_analysis_service.analyze_income_statement(
            current_income_statement,
            previous_income_statement
        )
        
        # Add symbol and date to result
        analysis["symbol"] = symbol
        analysis["date"] = current_income_statement.get("date", "")
        if previous_income_statement:
            analysis["previous_date"] = previous_income_statement.get("date", "")
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing income statement: {str(e)}")

@router.get("/balance-sheet-analysis/{symbol}")
async def analyze_balance_sheet(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    compare_previous: bool = Query(True, description="Compare with previous period")
) -> Dict[str, Any]:
    """
    Analyze balance sheet for a company.
    """
    try:
        # Get balance sheet data
        balance_sheets = await get_fmp_data(f"balance-sheet-statement/{symbol}", {"period": period, "limit": 2 if compare_previous else 1})
        
        if not balance_sheets:
            raise HTTPException(status_code=404, detail=f"Balance sheet not found for symbol: {symbol}")
        
        # Get current and previous balance sheets
        current_balance_sheet = balance_sheets[0]
        previous_balance_sheet = balance_sheets[1] if compare_previous and len(balance_sheets) > 1 else None
        
        # Analyze balance sheet
        analysis = financial_analysis_service.analyze_balance_sheet(
            current_balance_sheet,
            previous_balance_sheet
        )
        
        # Add symbol and date to result
        analysis["symbol"] = symbol
        analysis["date"] = current_balance_sheet.get("date", "")
        if previous_balance_sheet:
            analysis["previous_date"] = previous_balance_sheet.get("date", "")
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing balance sheet: {str(e)}")

@router.get("/cash-flow-analysis/{symbol}")
async def analyze_cash_flow(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    compare_previous: bool = Query(True, description="Compare with previous period")
) -> Dict[str, Any]:
    """
    Analyze cash flow statement for a company.
    """
    try:
        # Get cash flow and income statement data
        cash_flows = await get_fmp_data(f"cash-flow-statement/{symbol}", {"period": period, "limit": 2 if compare_previous else 1})
        income_statements = await get_fmp_data(f"income-statement/{symbol}", {"period": period, "limit": 1})
        
        if not cash_flows:
            raise HTTPException(status_code=404, detail=f"Cash flow statement not found for symbol: {symbol}")
        
        # Get current and previous cash flows
        current_cash_flow = cash_flows[0]
        previous_cash_flow = cash_flows[1] if compare_previous and len(cash_flows) > 1 else None
        
        # Get income statement for the same period
        income_statement = income_statements[0] if income_statements else None
        
        # Analyze cash flow statement
        analysis = financial_analysis_service.analyze_cash_flow_statement(
            current_cash_flow,
            previous_cash_flow,
            income_statement
        )
        
        # Add symbol and date to result
        analysis["symbol"] = symbol
        analysis["date"] = current_cash_flow.get("date", "")
        if previous_cash_flow:
            analysis["previous_date"] = previous_cash_flow.get("date", "")
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing cash flow statement: {str(e)}")

@router.get("/comprehensive-analysis/{symbol}")
async def analyze_financial_statements(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    compare_previous: bool = Query(True, description="Compare with previous period")
) -> Dict[str, Any]:
    """
    Perform comprehensive analysis of all financial statements.
    """
    try:
        # Get financial data
        limit = 2 if compare_previous else 1
        financial_data = await get_financial_data(symbol, period, limit)
        
        if not financial_data:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Get current and previous period data
        current_period = financial_data[0]
        previous_period = financial_data[1] if compare_previous and len(financial_data) > 1 else None
        
        # Analyze financial statements
        analysis = financial_analysis_service.analyze_financial_statements(
            current_period,
            previous_period
        )
        
        # Add symbol and date to result
        analysis["symbol"] = symbol
        analysis["date"] = current_period.get("date", "")
        if previous_period:
            analysis["previous_date"] = previous_period.get("date", "")
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing financial statements: {str(e)}")

@router.get("/financial-trends/{symbol}")
async def analyze_financial_trends(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of periods to analyze"),
    metrics: Optional[List[str]] = Query(None, description="List of metrics to analyze")
) -> Dict[str, Any]:
    """
    Analyze trends in financial metrics over time.
    """
    try:
        # Get financial data
        financial_data = await get_financial_data(symbol, period, limit)
        
        if not financial_data:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Analyze financial trends
        trend_series = financial_analysis_service.analyze_financial_trends(financial_data, metrics)
        
        # Convert pandas Series to lists for JSON serialization
        trends = {}
        for metric, series in trend_series.items():
            trends[metric] = {
                "dates": series.index.strftime("%Y-%m-%d").tolist(),
                "values": series.tolist()
            }
        
        # Calculate growth rates
        growth_rates = financial_analysis_service.calculate_growth_rates(trend_series)
        
        # Create result
        result = {
            "symbol": symbol,
            "trends": trends,
            "growth_rates": growth_rates
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing financial trends: {str(e)}")

@router.get("/financial-ratios/{symbol}")
async def calculate_financial_ratios(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    compare_previous: bool = Query(True, description="Compare with previous period")
) -> Dict[str, Any]:
    """
    Calculate financial ratios for a company.
    """
    try:
        # Get financial data
        limit = 2 if compare_previous else 1
        financial_data = await get_financial_data(symbol, period, limit)
        
        if not financial_data:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Get current and previous period data
        current_period = financial_data[0]
        previous_period = financial_data[1] if compare_previous and len(financial_data) > 1 else None
        
        # Initialize ratio calculator
        ratio_calculator = FinancialRatioCalculator()
        
        # Calculate all ratios
        ratios = ratio_calculator.calculate_all_ratios(
            current_period,
            previous_period,
            current_period.get("market_data")
        )
        
        # Add symbol and date to result
        result = {
            "symbol": symbol,
            "date": current_period.get("date", ""),
            "ratios": ratios
        }
        
        if previous_period:
            result["previous_date"] = previous_period.get("date", "")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating financial ratios: {str(e)}")

@router.get("/peer-comparison")
async def compare_with_peers(
    symbol: str,
    peer_symbols: List[str] = Query(..., description="List of peer company symbols"),
    period: str = Query("annual", description="Period: annual or quarter"),
    metrics: List[str] = Query(..., description="List of metrics to compare")
) -> Dict[str, Any]:
    """
    Compare a company with its peers based on selected metrics.
    """
    try:
        # Add target symbol to the list
        all_symbols = [symbol] + peer_symbols
        
        # Get financial data for all companies
        companies_data = {}
        for sym in all_symbols:
            try:
                data = await get_financial_data(sym, period, 1)
                if data:
                    companies_data[sym] = data[0]
            except:
                # Skip if data not available for a company
                continue
        
        if not companies_data:
            raise HTTPException(status_code=404, detail="No financial data found for companies")
        
        # Extract metrics for comparison
        comparison = {}
        for metric in metrics:
            comparison[metric] = {}
            
            for sym, data in companies_data.items():
                # Try to find the metric in different parts of the data
                value = None
                
                # Check income statement
                if "income_statement" in data and metric in data["income_statement"]:
                    value = data["income_statement"][metric]
                
                # Check balance sheet
                elif "balance_sheet" in data and metric in data["balance_sheet"]:
                    value = data["balance_sheet"][metric]
                
                # Check cash flow statement
                elif "cash_flow_statement" in data and metric in data["cash_flow_statement"]:
                    value = data["cash_flow_statement"][metric]
                
                # Check key metrics
                elif "key_metrics" in data and metric in data["key_metrics"]:
                    value = data["key_metrics"][metric]
                
                # Check market data
                elif "market_data" in data and metric in data["market_data"]:
                    value = data["market_data"][metric]
                
                # If not found, calculate ratios
                if value is None:
                    # Initialize ratio calculator
                    ratio_calculator = FinancialRatioCalculator()
                    
                    # Calculate all ratios
                    ratios = ratio_calculator.calculate_all_ratios(
                        data,
                        None,
                        data.get("market_data")
                    )
                    
                    # Check in different ratio categories
                    for category in ["liquidity", "profitability", "solvency", "efficiency", "valuation"]:
                        if category in ratios and metric in ratios[category]:
                            value = ratios[category][metric]
                            break
                
                comparison[metric][sym] = value
        
        # Create result
        result = {
            "target_symbol": symbol,
            "peer_symbols": peer_symbols,
            "comparison": comparison
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing with peers: {str(e)}")