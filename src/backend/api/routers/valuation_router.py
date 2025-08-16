"""
Router for valuation model endpoints.
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

# Import valuation models
from src.ml_models.fundamental_analysis.valuation_models import (
    DCFValuationModel, ComparableCompanyAnalysis, ValuationService
)

# Import fundamental data router for FMP API access
from .fundamental_data import get_fmp_data

router = APIRouter()

# Initialize valuation service
valuation_service = ValuationService()

async def get_financial_data(symbol: str, period: str = "annual", limit: int = 5) -> List[Dict[str, Any]]:
    """
    Helper function to get financial data for a company.
    """
    try:
        # Get income statement
        income_statement = await get_fmp_data(f"income-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get balance sheet
        balance_sheet = await get_fmp_data(f"balance-sheet-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get cash flow statement
        cash_flow = await get_fmp_data(f"cash-flow-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get key metrics
        key_metrics = await get_fmp_data(f"key-metrics/{symbol}", {"period": period, "limit": limit})
        
        # Get company profile for market data
        profile = await get_fmp_data(f"profile/{symbol}")
        
        if not income_statement or not balance_sheet or not cash_flow:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Combine data for each period
        financial_data = []
        
        for i in range(min(len(income_statement), len(balance_sheet), len(cash_flow))):
            period_data = {
                "date": income_statement[i].get("date", ""),
                "income_statement": income_statement[i],
                "balance_sheet": balance_sheet[i],
                "cash_flow_statement": cash_flow[i],
            }
            
            # Add key metrics if available
            if i < len(key_metrics):
                period_data["key_metrics"] = key_metrics[i]
            
            # Add market data from profile
            if profile and len(profile) > 0:
                period_data["market_data"] = {
                    "price": profile[0].get("price", 0),
                    "marketCap": profile[0].get("mktCap", 0),
                    "sharesOutstanding": profile[0].get("sharesOutstanding", 0),
                    # Calculate enterprise value
                    "enterpriseValue": profile[0].get("mktCap", 0) + 
                                      balance_sheet[i].get("totalDebt", 0) - 
                                      balance_sheet[i].get("cashAndCashEquivalents", 0)
                }
            
            financial_data.append(period_data)
        
        return financial_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting financial data: {str(e)}")

@router.get("/dcf/{symbol}")
async def get_dcf_valuation(
    symbol: str,
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of periods to use"),
    discount_rate: Optional[float] = Query(None, description="Discount rate (WACC)"),
    terminal_growth_rate: Optional[float] = Query(None, description="Terminal growth rate"),
    forecast_period: Optional[int] = Query(None, description="Forecast period in years")
) -> Dict[str, Any]:
    """
    Get DCF valuation for a company.
    """
    try:
        # Get financial data
        financial_data = await get_financial_data(symbol, period, limit)
        
        # Initialize DCF model with custom parameters if provided
        dcf_model = DCFValuationModel()
        if discount_rate is not None:
            dcf_model.discount_rate = discount_rate
        if terminal_growth_rate is not None:
            dcf_model.terminal_growth_rate = terminal_growth_rate
        if forecast_period is not None:
            dcf_model.forecast_period = forecast_period
        
        # Perform DCF valuation
        valuation_result = dcf_model.value_company(financial_data)
        
        # Add symbol to result
        valuation_result["symbol"] = symbol
        
        return valuation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing DCF valuation: {str(e)}")

@router.post("/comparable-company-analysis/{symbol}")
async def get_comparable_company_analysis(
    symbol: str,
    comparable_symbols: List[str] = Body(..., description="List of comparable company symbols"),
    period: str = Query("annual", description="Period: annual or quarter"),
    multiples_to_use: Optional[List[str]] = Body(None, description="List of multiples to use")
) -> Dict[str, Any]:
    """
    Get comparable company analysis for a company.
    """
    try:
        # Get financial data for target company
        target_data = await get_financial_data(symbol, period, 1)
        if not target_data:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Get financial data for comparable companies
        comparable_data = []
        for comp_symbol in comparable_symbols:
            try:
                comp_data = await get_financial_data(comp_symbol, period, 1)
                if comp_data:
                    comparable_data.append(comp_data[0])
            except:
                # Skip if data not available for a comparable company
                continue
        
        if not comparable_data:
            raise HTTPException(status_code=404, detail="No financial data found for comparable companies")
        
        # Initialize CCA model
        cca_model = ComparableCompanyAnalysis()
        
        # Perform comparable company analysis
        valuation_result = cca_model.value_company_using_multiples(
            target_data[0],
            comparable_data,
            multiples_to_use
        )
        
        # Add symbol and comparable symbols to result
        valuation_result["symbol"] = symbol
        valuation_result["comparable_symbols"] = comparable_symbols
        
        return valuation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing comparable company analysis: {str(e)}")

@router.post("/consensus-valuation/{symbol}")
async def get_consensus_valuation(
    symbol: str,
    comparable_symbols: Optional[List[str]] = Body(None, description="List of comparable company symbols"),
    period: str = Query("annual", description="Period: annual or quarter"),
    limit: int = Query(5, description="Number of periods to use"),
    discount_rate: Optional[float] = Query(None, description="Discount rate (WACC)"),
    terminal_growth_rate: Optional[float] = Query(None, description="Terminal growth rate"),
    methods: Optional[List[str]] = Body(None, description="Valuation methods to use")
) -> Dict[str, Any]:
    """
    Get consensus valuation using multiple methods.
    """
    try:
        # Get financial data for target company
        target_data = await get_financial_data(symbol, period, 1)
        historical_data = await get_financial_data(symbol, period, limit)
        
        if not target_data or not historical_data:
            raise HTTPException(status_code=404, detail=f"Financial data not found for symbol: {symbol}")
        
        # Get financial data for comparable companies if provided
        comparable_data = []
        if comparable_symbols:
            for comp_symbol in comparable_symbols:
                try:
                    comp_data = await get_financial_data(comp_symbol, period, 1)
                    if comp_data:
                        comparable_data.append(comp_data[0])
                except:
                    # Skip if data not available for a comparable company
                    continue
        
        # Determine methods to use
        if methods is None:
            methods = ["dcf"]
            if comparable_data:
                methods.append("cca")
        
        # Perform valuation
        valuation_result = valuation_service.value_company(
            target_data[0],
            historical_data,
            comparable_data if comparable_data else None,
            methods,
            discount_rate=discount_rate,
            terminal_growth_rate=terminal_growth_rate
        )
        
        # Add symbol to result
        valuation_result["symbol"] = symbol
        if comparable_symbols:
            valuation_result["comparable_symbols"] = comparable_symbols
        
        return valuation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing consensus valuation: {str(e)}")