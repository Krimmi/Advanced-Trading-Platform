"""
Router for portfolio management endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
from pydantic import BaseModel, Field

router = APIRouter()

# --- Pydantic Models ---

class Position(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    current_price: Optional[float] = None
    market_value: Optional[float] = None
    unrealized_gain_loss: Optional[float] = None
    unrealized_gain_loss_percent: Optional[float] = None
    weight: Optional[float] = None

class PortfolioOptimizationRequest(BaseModel):
    symbols: List[str]
    weights: Optional[List[float]] = None
    risk_tolerance: float = Field(0.5, ge=0, le=1)
    optimization_goal: str = "sharpe"  # sharpe, min_risk, max_return, etc.

class RebalanceRequest(BaseModel):
    portfolio_id: str
    target_weights: Dict[str, float]

# --- Mock Data ---

# Mock portfolio data - will be replaced with database storage
mock_portfolios = {
    "portfolio1": {
        "id": "portfolio1",
        "name": "Growth Portfolio",
        "created_at": "2025-01-01T00:00:00Z",
        "positions": [
            {"symbol": "AAPL", "quantity": 10, "entry_price": 175.50},
            {"symbol": "MSFT", "quantity": 5, "entry_price": 340.20},
            {"symbol": "GOOGL", "quantity": 8, "entry_price": 135.75},
            {"symbol": "AMZN", "quantity": 3, "entry_price": 145.30},
            {"symbol": "NVDA", "quantity": 15, "entry_price": 450.25}
        ],
        "cash": 5000.00
    },
    "portfolio2": {
        "id": "portfolio2",
        "name": "Dividend Portfolio",
        "created_at": "2025-02-15T00:00:00Z",
        "positions": [
            {"symbol": "JNJ", "quantity": 12, "entry_price": 155.30},
            {"symbol": "PG", "quantity": 15, "entry_price": 145.20},
            {"symbol": "KO", "quantity": 25, "entry_price": 60.75},
            {"symbol": "VZ", "quantity": 20, "entry_price": 40.50},
            {"symbol": "MCD", "quantity": 8, "entry_price": 265.40}
        ],
        "cash": 3500.00
    }
}

# Mock current prices - will be replaced with real-time data
mock_prices = {
    "AAPL": 180.25,
    "MSFT": 355.40,
    "GOOGL": 142.30,
    "AMZN": 152.75,
    "NVDA": 475.60,
    "JNJ": 160.45,
    "PG": 150.30,
    "KO": 62.80,
    "VZ": 42.25,
    "MCD": 270.15
}

# --- Helper Functions ---

def calculate_portfolio_metrics(portfolio: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate portfolio metrics like total value, gain/loss, etc.
    """
    total_value = portfolio["cash"]
    total_cost = portfolio["cash"]
    positions = []
    
    for position in portfolio["positions"]:
        symbol = position["symbol"]
        quantity = position["quantity"]
        entry_price = position["entry_price"]
        
        # Get current price (in real app, this would come from market data)
        current_price = mock_prices.get(symbol, entry_price)
        
        # Calculate position metrics
        cost_basis = quantity * entry_price
        market_value = quantity * current_price
        unrealized_gain_loss = market_value - cost_basis
        unrealized_gain_loss_percent = (unrealized_gain_loss / cost_basis) * 100 if cost_basis > 0 else 0
        
        # Add to totals
        total_value += market_value
        total_cost += cost_basis
        
        # Add position with calculated metrics
        positions.append({
            "symbol": symbol,
            "quantity": quantity,
            "entry_price": entry_price,
            "current_price": current_price,
            "market_value": market_value,
            "unrealized_gain_loss": unrealized_gain_loss,
            "unrealized_gain_loss_percent": unrealized_gain_loss_percent
        })
    
    # Calculate portfolio-level metrics
    total_gain_loss = total_value - total_cost
    total_gain_loss_percent = (total_gain_loss / total_cost) * 100 if total_cost > 0 else 0
    
    # Calculate position weights
    for position in positions:
        position["weight"] = (position["market_value"] / total_value) * 100 if total_value > 0 else 0
    
    return {
        "id": portfolio["id"],
        "name": portfolio["name"],
        "created_at": portfolio["created_at"],
        "positions": positions,
        "cash": portfolio["cash"],
        "cash_weight": (portfolio["cash"] / total_value) * 100 if total_value > 0 else 0,
        "total_value": total_value,
        "total_cost": total_cost,
        "total_gain_loss": total_gain_loss,
        "total_gain_loss_percent": total_gain_loss_percent,
        "last_updated": datetime.now().isoformat()
    }

# --- Endpoints ---

@router.get("/portfolios")
async def get_portfolios() -> List[Dict[str, Any]]:
    """
    Get all portfolios.
    """
    portfolios = []
    for portfolio_id in mock_portfolios:
        portfolio = mock_portfolios[portfolio_id]
        # Calculate basic metrics for list view
        total_value = portfolio["cash"]
        for position in portfolio["positions"]:
            symbol = position["symbol"]
            current_price = mock_prices.get(symbol, position["entry_price"])
            total_value += position["quantity"] * current_price
        
        portfolios.append({
            "id": portfolio["id"],
            "name": portfolio["name"],
            "created_at": portfolio["created_at"],
            "total_value": total_value,
            "position_count": len(portfolio["positions"])
        })
    
    return portfolios

@router.get("/portfolios/{portfolio_id}")
async def get_portfolio(portfolio_id: str) -> Dict[str, Any]:
    """
    Get a specific portfolio with detailed metrics.
    """
    if portfolio_id not in mock_portfolios:
        raise HTTPException(status_code=404, detail=f"Portfolio not found: {portfolio_id}")
    
    portfolio = mock_portfolios[portfolio_id]
    return calculate_portfolio_metrics(portfolio)

@router.post("/portfolios")
async def create_portfolio(
    name: str = Body(...),
    initial_cash: float = Body(10000.0)
) -> Dict[str, Any]:
    """
    Create a new portfolio.
    """
    portfolio_id = f"portfolio{len(mock_portfolios) + 1}"
    new_portfolio = {
        "id": portfolio_id,
        "name": name,
        "created_at": datetime.now().isoformat(),
        "positions": [],
        "cash": initial_cash
    }
    
    mock_portfolios[portfolio_id] = new_portfolio
    return new_portfolio

@router.post("/portfolios/{portfolio_id}/positions")
async def add_position(
    portfolio_id: str,
    symbol: str = Body(...),
    quantity: float = Body(...),
    entry_price: float = Body(...)
) -> Dict[str, Any]:
    """
    Add a position to a portfolio.
    """
    if portfolio_id not in mock_portfolios:
        raise HTTPException(status_code=404, detail=f"Portfolio not found: {portfolio_id}")
    
    portfolio = mock_portfolios[portfolio_id]
    
    # Check if position already exists
    for position in portfolio["positions"]:
        if position["symbol"] == symbol:
            # Update existing position
            old_quantity = position["quantity"]
            old_entry_price = position["entry_price"]
            
            # Calculate new average entry price
            total_shares = old_quantity + quantity
            new_entry_price = ((old_quantity * old_entry_price) + (quantity * entry_price)) / total_shares
            
            position["quantity"] = total_shares
            position["entry_price"] = new_entry_price
            
            return calculate_portfolio_metrics(portfolio)
    
    # Add new position
    portfolio["positions"].append({
        "symbol": symbol,
        "quantity": quantity,
        "entry_price": entry_price
    })
    
    return calculate_portfolio_metrics(portfolio)

@router.delete("/portfolios/{portfolio_id}/positions/{symbol}")
async def remove_position(
    portfolio_id: str,
    symbol: str,
    quantity: Optional[float] = Query(None, description="Quantity to remove (if None, removes entire position)")
) -> Dict[str, Any]:
    """
    Remove a position from a portfolio.
    """
    if portfolio_id not in mock_portfolios:
        raise HTTPException(status_code=404, detail=f"Portfolio not found: {portfolio_id}")
    
    portfolio = mock_portfolios[portfolio_id]
    
    # Find position
    position_index = None
    for i, position in enumerate(portfolio["positions"]):
        if position["symbol"] == symbol:
            position_index = i
            break
    
    if position_index is None:
        raise HTTPException(status_code=404, detail=f"Position not found: {symbol}")
    
    position = portfolio["positions"][position_index]
    
    if quantity is None or quantity >= position["quantity"]:
        # Remove entire position
        portfolio["positions"].pop(position_index)
    else:
        # Reduce position quantity
        position["quantity"] -= quantity
    
    return calculate_portfolio_metrics(portfolio)

@router.post("/optimize")
async def optimize_portfolio(request: PortfolioOptimizationRequest) -> Dict[str, Any]:
    """
    Optimize a portfolio based on modern portfolio theory.
    """
    try:
        symbols = request.symbols
        risk_tolerance = request.risk_tolerance
        optimization_goal = request.optimization_goal
        
        # Mock optimization - will be replaced with actual optimization algorithms
        
        # Generate random returns and volatilities for the symbols
        returns = {}
        volatilities = {}
        for symbol in symbols:
            returns[symbol] = np.random.normal(0.08, 0.02)  # Mean annual return around 8%
            volatilities[symbol] = np.random.uniform(0.15, 0.35)  # Annual volatility between 15% and 35%
        
        # Generate correlation matrix
        n = len(symbols)
        correlation_matrix = np.random.uniform(0.3, 0.7, size=(n, n))
        np.fill_diagonal(correlation_matrix, 1.0)
        # Make it symmetric
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
        
        # Generate optimized weights based on risk tolerance
        weights = {}
        total_weight = 0
        
        for symbol in symbols:
            # Higher risk tolerance means more weight to higher return assets
            # Lower risk tolerance means more weight to lower volatility assets
            if optimization_goal == "sharpe":
                # For Sharpe ratio optimization, balance return and risk
                weight = returns[symbol] / volatilities[symbol]
            elif optimization_goal == "min_risk":
                # For minimum risk, favor low volatility
                weight = 1 / volatilities[symbol]
            elif optimization_goal == "max_return":
                # For maximum return, favor high returns
                weight = returns[symbol]
            else:
                # Default to Sharpe ratio
                weight = returns[symbol] / volatilities[symbol]
            
            # Adjust by risk tolerance
            if optimization_goal != "min_risk" and optimization_goal != "max_return":
                weight = weight * (risk_tolerance * returns[symbol] + (1 - risk_tolerance) / volatilities[symbol])
            
            weights[symbol] = weight
            total_weight += weight
        
        # Normalize weights to sum to 1
        for symbol in weights:
            weights[symbol] = weights[symbol] / total_weight
        
        # Calculate expected portfolio metrics
        portfolio_return = sum(weights[symbol] * returns[symbol] for symbol in symbols)
        
        # Simplified volatility calculation (ignoring covariance)
        portfolio_volatility = sum(weights[symbol] * volatilities[symbol] for symbol in symbols)
        
        # Calculate Sharpe ratio (assuming risk-free rate of 3%)
        risk_free_rate = 0.03
        sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
        
        return {
            "optimization_goal": optimization_goal,
            "risk_tolerance": risk_tolerance,
            "optimized_weights": {symbol: round(weights[symbol], 4) for symbol in symbols},
            "expected_annual_return": round(portfolio_return, 4),
            "expected_annual_volatility": round(portfolio_volatility, 4),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "efficient_frontier": [
                {"return": round(portfolio_return * 0.8, 4), "risk": round(portfolio_volatility * 0.6, 4)},
                {"return": round(portfolio_return * 0.9, 4), "risk": round(portfolio_volatility * 0.8, 4)},
                {"return": round(portfolio_return, 4), "risk": round(portfolio_volatility, 4)},
                {"return": round(portfolio_return * 1.1, 4), "risk": round(portfolio_volatility * 1.2, 4)},
                {"return": round(portfolio_return * 1.2, 4), "risk": round(portfolio_volatility * 1.5, 4)}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing portfolio: {str(e)}")

@router.post("/portfolios/{portfolio_id}/rebalance")
async def rebalance_portfolio(
    portfolio_id: str,
    request: RebalanceRequest
) -> Dict[str, Any]:
    """
    Generate rebalancing instructions for a portfolio.
    """
    if portfolio_id not in mock_portfolios:
        raise HTTPException(status_code=404, detail=f"Portfolio not found: {portfolio_id}")
    
    portfolio = mock_portfolios[portfolio_id]
    portfolio_metrics = calculate_portfolio_metrics(portfolio)
    
    total_value = portfolio_metrics["total_value"]
    current_positions = {p["symbol"]: p for p in portfolio_metrics["positions"]}
    
    # Validate target weights sum to approximately 100%
    target_weight_sum = sum(request.target_weights.values())
    if not (99.0 <= target_weight_sum <= 101.0):
        raise HTTPException(status_code=400, detail=f"Target weights must sum to approximately 100% (got {target_weight_sum}%)")
    
    # Calculate target values and differences
    rebalance_actions = []
    
    # Process existing positions
    for symbol, position in current_positions.items():
        current_weight = position["weight"]
        target_weight = request.target_weights.get(symbol, 0)
        
        # Calculate target value
        target_value = (target_weight / 100) * total_value
        current_value = position["market_value"]
        value_difference = target_value - current_value
        
        # Calculate shares to buy/sell
        current_price = position["current_price"]
        shares_difference = value_difference / current_price if current_price > 0 else 0
        
        action = "hold"
        if shares_difference > 0.01:
            action = "buy"
        elif shares_difference < -0.01:
            action = "sell"
        
        rebalance_actions.append({
            "symbol": symbol,
            "action": action,
            "shares": abs(round(shares_difference, 2)),
            "estimated_value": abs(round(value_difference, 2)),
            "current_weight": round(current_weight, 2),
            "target_weight": round(target_weight, 2),
            "weight_difference": round(target_weight - current_weight, 2)
        })
    
    # Process new positions (symbols in target weights but not in current portfolio)
    for symbol, target_weight in request.target_weights.items():
        if symbol not in current_positions and target_weight > 0:
            # Calculate target value
            target_value = (target_weight / 100) * total_value
            
            # Use mock price or default to 100
            current_price = mock_prices.get(symbol, 100)
            shares = target_value / current_price if current_price > 0 else 0
            
            rebalance_actions.append({
                "symbol": symbol,
                "action": "buy",
                "shares": round(shares, 2),
                "estimated_value": round(target_value, 2),
                "current_weight": 0,
                "target_weight": round(target_weight, 2),
                "weight_difference": round(target_weight, 2)
            })
    
    return {
        "portfolio_id": portfolio_id,
        "total_value": total_value,
        "rebalance_actions": rebalance_actions,
        "generated_at": datetime.now().isoformat()
    }

@router.get("/portfolios/{portfolio_id}/risk-analysis")
async def portfolio_risk_analysis(portfolio_id: str) -> Dict[str, Any]:
    """
    Get risk analysis for a portfolio.
    """
    if portfolio_id not in mock_portfolios:
        raise HTTPException(status_code=404, detail=f"Portfolio not found: {portfolio_id}")
    
    portfolio = mock_portfolios[portfolio_id]
    portfolio_metrics = calculate_portfolio_metrics(portfolio)
    
    # Mock risk analysis - will be replaced with actual risk models
    positions = portfolio_metrics["positions"]
    
    # Calculate mock risk metrics
    volatility = np.random.uniform(0.15, 0.25)  # Annual volatility
    beta = np.random.uniform(0.8, 1.2)  # Portfolio beta
    var_95 = portfolio_metrics["total_value"] * volatility * 1.65 / np.sqrt(252)  # Daily 95% VaR
    cvar_95 = var_95 * 1.3  # Expected shortfall
    max_drawdown = portfolio_metrics["total_value"] * np.random.uniform(0.1, 0.3)  # Maximum drawdown
    
    # Generate sector exposure
    sectors = ["Technology", "Healthcare", "Financials", "Consumer Discretionary", 
               "Communication Services", "Industrials", "Consumer Staples", "Energy", 
               "Utilities", "Materials", "Real Estate"]
    
    sector_exposure = {}
    remaining_weight = 100.0
    
    for i, sector in enumerate(sectors):
        if i == len(sectors) - 1:
            # Last sector gets remaining weight
            sector_exposure[sector] = round(remaining_weight, 2)
        else:
            weight = round(np.random.uniform(0, remaining_weight / 2), 2)
            sector_exposure[sector] = weight
            remaining_weight -= weight
    
    # Generate factor exposure
    factors = {
        "Market": np.random.uniform(0.8, 1.2),
        "Size": np.random.uniform(-0.5, 0.5),
        "Value": np.random.uniform(-0.5, 0.5),
        "Momentum": np.random.uniform(-0.5, 0.5),
        "Quality": np.random.uniform(-0.5, 0.5),
        "Volatility": np.random.uniform(-0.5, 0.5)
    }
    
    # Generate stress test scenarios
    stress_tests = [
        {
            "scenario": "Market Crash (-20%)",
            "impact": round(-0.2 * beta * portfolio_metrics["total_value"], 2),
            "impact_percent": round(-20 * beta, 2)
        },
        {
            "scenario": "Interest Rate Hike (+1%)",
            "impact": round(-0.05 * portfolio_metrics["total_value"], 2),
            "impact_percent": -5
        },
        {
            "scenario": "Economic Recession",
            "impact": round(-0.15 * portfolio_metrics["total_value"], 2),
            "impact_percent": -15
        },
        {
            "scenario": "Inflation Surge (+3%)",
            "impact": round(-0.08 * portfolio_metrics["total_value"], 2),
            "impact_percent": -8
        },
        {
            "scenario": "Tech Sector Decline (-15%)",
            "impact": round(-0.15 * sector_exposure.get("Technology", 0) / 100 * portfolio_metrics["total_value"], 2),
            "impact_percent": round(-15 * sector_exposure.get("Technology", 0) / 100, 2)
        }
    ]
    
    return {
        "portfolio_id": portfolio_id,
        "total_value": portfolio_metrics["total_value"],
        "risk_metrics": {
            "annual_volatility": round(volatility, 4),
            "beta": round(beta, 2),
            "sharpe_ratio": round((0.08 - 0.03) / volatility, 2),  # Assuming 8% return, 3% risk-free
            "sortino_ratio": round((0.08 - 0.03) / (volatility * 0.8), 2),  # Downside deviation estimated
            "var_95_daily": round(var_95, 2),
            "cvar_95_daily": round(cvar_95, 2),
            "max_drawdown": round(max_drawdown, 2),
            "max_drawdown_percent": round((max_drawdown / portfolio_metrics["total_value"]) * 100, 2)
        },
        "sector_exposure": sector_exposure,
        "factor_exposure": factors,
        "correlation_to_market": round(np.random.uniform(0.7, 0.9), 2),
        "stress_tests": stress_tests,
        "generated_at": datetime.now().isoformat()
    }