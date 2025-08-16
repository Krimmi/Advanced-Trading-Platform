"""
Router for risk management and portfolio construction endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
import os
import sys
import pandas as pd

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.risk_management.risk_metrics import RiskMetrics
from src.ml_models.risk_management.portfolio_optimization import PortfolioOptimizer
from src.ml_models.risk_management.stress_testing import StressTester
from src.ml_models.risk_management.portfolio_construction import PortfolioConstructor

# Configure router
router = APIRouter()

# Helper function to generate mock returns data
def generate_mock_returns_data(symbols: List[str], days: int = 252) -> pd.DataFrame:
    """
    Generate mock returns data for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        DataFrame of asset returns
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')
    
    # Generate mock returns data
    np.random.seed(42)  # For reproducibility
    returns = pd.DataFrame(index=date_range)
    
    for symbol in symbols:
        # Generate random returns with some autocorrelation
        returns[symbol] = np.random.normal(0.0005, 0.015, len(date_range))
    
    return returns

@router.post("/risk-metrics")
async def calculate_risk_metrics(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    weights: Dict[str, float] = Body(..., description="Portfolio weights"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate")
) -> Dict[str, Any]:
    """
    Calculate risk metrics for a portfolio.
    """
    try:
        # Convert weights to Series
        weights_series = pd.Series(weights)
        
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create risk metrics calculator
        risk_metrics = RiskMetrics(returns_data, risk_free_rate)
        
        # Calculate risk metrics
        metrics = risk_metrics.calculate_risk_metrics_summary(weights_series.values)
        
        # Convert numpy values to Python types for JSON serialization
        for key, value in metrics.items():
            if isinstance(value, np.float64) or isinstance(value, np.float32):
                metrics[key] = float(value)
        
        return {
            "symbols": symbols,
            "weights": weights,
            "risk_free_rate": risk_free_rate,
            "lookback_days": lookback_days,
            "metrics": metrics,
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating risk metrics: {str(e)}")

@router.post("/optimize-portfolio")
async def optimize_portfolio(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    optimization_method: str = Body(..., description="Optimization method (maximum_sharpe, minimum_volatility, maximum_return, risk_parity, maximum_diversification, minimum_cvar, hierarchical_risk_parity, equal_weight, inverse_volatility)"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate"),
    target_return: Optional[float] = Body(None, description="Target portfolio return (for minimum volatility with target return)"),
    target_volatility: Optional[float] = Body(None, description="Target portfolio volatility (for maximum return with target volatility)"),
    bounds: Optional[List[float]] = Body(None, description="Bounds for portfolio weights [min, max]"),
    weight_constraints: Optional[Dict[str, List[float]]] = Body(None, description="Weight constraints for specific assets {asset: [min, max]}")
) -> Dict[str, Any]:
    """
    Optimize a portfolio using the specified method.
    """
    try:
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create portfolio optimizer
        optimizer = PortfolioOptimizer(returns_data, risk_free_rate)
        
        # Process constraints
        opt_bounds = (0, 1)  # Default bounds (long-only)
        if bounds:
            opt_bounds = (bounds[0], bounds[1])
        
        opt_constraints = []
        
        if weight_constraints:
            for asset, constraint in weight_constraints.items():
                if asset in symbols:
                    asset_idx = symbols.index(asset)
                    min_weight, max_weight = constraint
                    
                    # Minimum weight constraint
                    if min_weight is not None:
                        min_constraint = {
                            'type': 'ineq',
                            'fun': lambda weights, idx=asset_idx, min_w=min_weight: weights[idx] - min_w
                        }
                        opt_constraints.append(min_constraint)
                    
                    # Maximum weight constraint
                    if max_weight is not None:
                        max_constraint = {
                            'type': 'ineq',
                            'fun': lambda weights, idx=asset_idx, max_w=max_weight: max_w - weights[idx]
                        }
                        opt_constraints.append(max_constraint)
        
        # Optimize portfolio
        if optimization_method == 'maximum_sharpe':
            result = optimizer.optimize_sharpe_ratio(opt_bounds, opt_constraints)
        elif optimization_method == 'minimum_volatility':
            result = optimizer.optimize_minimum_volatility(opt_bounds, opt_constraints)
        elif optimization_method == 'maximum_return':
            result = optimizer.optimize_maximum_return(target_volatility, opt_bounds, opt_constraints)
        elif optimization_method == 'risk_parity':
            result = optimizer.optimize_risk_parity(bounds=opt_bounds)
        elif optimization_method == 'maximum_diversification':
            result = optimizer.optimize_maximum_diversification(opt_bounds, opt_constraints)
        elif optimization_method == 'minimum_cvar':
            result = optimizer.optimize_minimum_cvar(bounds=opt_bounds, constraints=opt_constraints)
        elif optimization_method == 'hierarchical_risk_parity':
            result = optimizer.optimize_hierarchical_risk_parity()
        elif optimization_method == 'equal_weight':
            result = optimizer.optimize_equal_weight()
        elif optimization_method == 'inverse_volatility':
            result = optimizer.optimize_inverse_volatility()
        else:
            raise HTTPException(status_code=400, detail=f"Unknown optimization method: {optimization_method}")
        
        # Convert weights to dictionary
        weights_dict = result['weights'].to_dict()
        
        # Convert numpy values to Python types for JSON serialization
        for key, value in result['metrics'].items():
            if isinstance(value, np.float64) or isinstance(value, np.float32):
                result['metrics'][key] = float(value)
        
        # Create response
        response = {
            "symbols": symbols,
            "optimization_method": optimization_method,
            "weights": weights_dict,
            "expected_return": float(result['expected_return']),
            "volatility": float(result['volatility']),
            "sharpe_ratio": float(result['sharpe_ratio']),
            "metrics": result['metrics'],
            "generated_at": datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing portfolio: {str(e)}")

@router.post("/efficient-frontier")
async def generate_efficient_frontier(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    num_portfolios: int = Body(100, description="Number of portfolios to generate", ge=10, le=1000),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate"),
    bounds: Optional[List[float]] = Body(None, description="Bounds for portfolio weights [min, max]")
) -> Dict[str, Any]:
    """
    Generate the efficient frontier.
    """
    try:
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create portfolio optimizer
        optimizer = PortfolioOptimizer(returns_data, risk_free_rate)
        
        # Process bounds
        opt_bounds = (0, 1)  # Default bounds (long-only)
        if bounds:
            opt_bounds = (bounds[0], bounds[1])
        
        # Generate efficient frontier
        ef_df = optimizer.generate_efficient_frontier(num_portfolios, opt_bounds)
        
        # Convert DataFrame to list of dictionaries for JSON serialization
        ef_list = ef_df.to_dict(orient='records')
        
        # Convert numpy values to Python types for JSON serialization
        for portfolio in ef_list:
            for key, value in portfolio.items():
                if isinstance(value, np.float64) or isinstance(value, np.float32):
                    portfolio[key] = float(value)
        
        # Create response
        response = {
            "symbols": symbols,
            "num_portfolios": num_portfolios,
            "risk_free_rate": risk_free_rate,
            "efficient_frontier": ef_list,
            "generated_at": datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating efficient frontier: {str(e)}")

@router.post("/stress-test")
async def run_stress_test(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    weights: Dict[str, float] = Body(..., description="Portfolio weights"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    test_types: List[str] = Body(['historical', 'monte_carlo', 'custom'], description="Types of stress tests to run")
) -> Dict[str, Any]:
    """
    Run stress tests on a portfolio.
    """
    try:
        # Convert weights to Series
        weights_series = pd.Series(weights)
        
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create stress tester
        stress_tester = StressTester(returns_data, weights_series)
        
        # Initialize results
        stress_test_results = {}
        
        # Run historical scenario analysis
        if 'historical' in test_types:
            # Define common historical stress periods
            historical_scenarios = {
                'Global Financial Crisis': ('2007-10-01', '2009-03-31'),
                'COVID-19 Crash': ('2020-02-15', '2020-03-31'),
                'Tech Bubble Burst': ('2000-03-01', '2002-10-31'),
                'European Debt Crisis': ('2011-07-01', '2011-09-30'),
                'Flash Crash': ('2010-05-06', '2010-05-07'),
                'Black Monday': ('1987-10-19', '1987-10-20'),
                'Recent Bull Market': ('2019-01-01', '2019-12-31')
            }
            
            historical_results = stress_tester.historical_scenario_analysis(historical_scenarios)
            stress_test_results['historical_scenarios'] = historical_results.to_dict(orient='records')
        
        # Run Monte Carlo stress test
        if 'monte_carlo' in test_types:
            monte_carlo_result = stress_tester.monte_carlo_stress_test(num_simulations=1000)
            
            # Convert numpy values to Python types for JSON serialization
            for key, value in monte_carlo_result.items():
                if isinstance(value, np.float64) or isinstance(value, np.float32):
                    monte_carlo_result[key] = float(value)
            
            stress_test_results['monte_carlo'] = monte_carlo_result
        
        # Run custom scenario analysis
        if 'custom' in test_types:
            # Define custom shock scenarios
            custom_scenarios = {
                'Market Crash': {'SPY': -0.30, 'QQQ': -0.35, 'IWM': -0.40},
                'Tech Selloff': {'QQQ': -0.25, 'AAPL': -0.30, 'MSFT': -0.30, 'AMZN': -0.35, 'GOOGL': -0.35},
                'Interest Rate Hike': {'TLT': -0.15, 'IEF': -0.10, 'LQD': -0.08, 'SPY': -0.05},
                'Inflation Surge': {'TIP': 0.05, 'GLD': 0.10, 'SPY': -0.08, 'TLT': -0.12},
                'Economic Recovery': {'SPY': 0.15, 'IWM': 0.20, 'XLF': 0.25, 'XLI': 0.18}
            }
            
            # Filter scenarios to include only assets in the portfolio
            filtered_scenarios = {}
            for scenario_name, shocks in custom_scenarios.items():
                filtered_shocks = {asset: shock for asset, shock in shocks.items() if asset in symbols}
                if filtered_shocks:
                    filtered_scenarios[scenario_name] = filtered_shocks
            
            if filtered_scenarios:
                custom_results = stress_tester.custom_scenario_analysis(filtered_scenarios)
                stress_test_results['custom_scenarios'] = custom_results.to_dict(orient='records')
        
        # Create response
        response = {
            "symbols": symbols,
            "weights": weights,
            "lookback_days": lookback_days,
            "stress_test_results": stress_test_results,
            "generated_at": datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running stress tests: {str(e)}")

@router.post("/construct-portfolio")
async def construct_portfolio(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    strategy: str = Body(..., description="Portfolio construction strategy"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate"),
    constraints: Optional[Dict[str, Any]] = Body(None, description="Portfolio constraints"),
    target_return: Optional[float] = Body(None, description="Target portfolio return"),
    target_volatility: Optional[float] = Body(None, description="Target portfolio volatility"),
    target_risk_contribution: Optional[Dict[str, float]] = Body(None, description="Target risk contribution"),
    run_stress_test: bool = Body(True, description="Whether to run stress tests on the constructed portfolio")
) -> Dict[str, Any]:
    """
    Construct a portfolio using the specified strategy and constraints.
    """
    try:
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create portfolio constructor
        constructor = PortfolioConstructor(returns_data, risk_free_rate)
        
        # Construct portfolio
        result = constructor.construct_portfolio(
            strategy=strategy,
            constraints=constraints,
            target_return=target_return,
            target_volatility=target_volatility,
            target_risk_contribution=target_risk_contribution,
            run_stress_test=run_stress_test
        )
        
        # Convert weights to dictionary
        weights_dict = result['weights'].to_dict()
        
        # Convert numpy values to Python types for JSON serialization
        for key, value in result['metrics'].items():
            if isinstance(value, np.float64) or isinstance(value, np.float32):
                result['metrics'][key] = float(value)
        
        # Process stress test results if available
        if 'stress_test' in result:
            stress_test_results = {}
            
            for test_type, test_result in result['stress_test'].items():
                if isinstance(test_result, pd.DataFrame):
                    stress_test_results[test_type] = test_result.to_dict(orient='records')
                else:
                    # Convert numpy values to Python types for JSON serialization
                    processed_result = {}
                    for key, value in test_result.items():
                        if isinstance(value, np.float64) or isinstance(value, np.float32):
                            processed_result[key] = float(value)
                        else:
                            processed_result[key] = value
                    
                    stress_test_results[test_type] = processed_result
            
            result['stress_test'] = stress_test_results
        
        # Create response
        response = {
            "symbols": symbols,
            "strategy": strategy,
            "weights": weights_dict,
            "expected_return": float(result['expected_return']),
            "volatility": float(result['volatility']),
            "sharpe_ratio": float(result['sharpe_ratio']),
            "metrics": result['metrics'],
            "generated_at": datetime.now().isoformat()
        }
        
        # Add stress test results if available
        if 'stress_test' in result:
            response['stress_test'] = result['stress_test']
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error constructing portfolio: {str(e)}")

@router.post("/rebalance-portfolio")
async def rebalance_portfolio(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    current_weights: Dict[str, float] = Body(..., description="Current portfolio weights"),
    strategy: str = Body(..., description="Portfolio construction strategy"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate"),
    constraints: Optional[Dict[str, Any]] = Body(None, description="Portfolio constraints"),
    transaction_costs: Optional[Dict[str, float]] = Body(None, description="Transaction costs for each asset"),
    max_turnover: Optional[float] = Body(None, description="Maximum allowed portfolio turnover")
) -> Dict[str, Any]:
    """
    Rebalance an existing portfolio.
    """
    try:
        # Convert weights to Series
        current_weights_series = pd.Series(current_weights)
        
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create portfolio constructor
        constructor = PortfolioConstructor(returns_data, risk_free_rate)
        
        # Rebalance portfolio
        result = constructor.rebalance_portfolio(
            current_weights=current_weights_series,
            strategy=strategy,
            constraints=constraints,
            transaction_costs=transaction_costs,
            max_turnover=max_turnover
        )
        
        # Convert Series to dictionaries
        current_weights_dict = result['current_weights'].to_dict()
        target_weights_dict = result['target_weights'].to_dict()
        trades_dict = result['trades'].to_dict()
        trade_costs_dict = result['trade_costs'].to_dict()
        
        # Convert numpy values to Python types for JSON serialization
        for key, value in result['metrics'].items():
            if isinstance(value, np.float64) or isinstance(value, np.float32):
                result['metrics'][key] = float(value)
        
        # Create response
        response = {
            "symbols": symbols,
            "strategy": strategy,
            "current_weights": current_weights_dict,
            "target_weights": target_weights_dict,
            "trades": trades_dict,
            "turnover": float(result['turnover']),
            "trade_costs": trade_costs_dict,
            "total_cost": float(result['total_cost']),
            "expected_return": float(result['expected_return']),
            "volatility": float(result['volatility']),
            "sharpe_ratio": float(result['sharpe_ratio']),
            "metrics": result['metrics'],
            "generated_at": datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rebalancing portfolio: {str(e)}")

@router.post("/compare-strategies")
async def compare_strategies(
    symbols: List[str] = Body(..., description="List of stock symbols"),
    strategies: List[str] = Body(..., description="List of strategies to compare"),
    lookback_days: int = Body(252, description="Number of days of historical data to use", ge=30, le=1000),
    risk_free_rate: float = Body(0.0, description="Annualized risk-free rate"),
    constraints: Optional[Dict[str, Any]] = Body(None, description="Portfolio constraints")
) -> Dict[str, Any]:
    """
    Compare different portfolio construction strategies.
    """
    try:
        # Generate mock returns data
        # In a real implementation, this would fetch data from an API or database
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Create portfolio optimizer
        optimizer = PortfolioOptimizer(returns_data, risk_free_rate)
        
        # Compare strategies
        comparison_df = optimizer.compare_optimization_methods(strategies, constraints=constraints)
        
        # Convert DataFrame to list of dictionaries for JSON serialization
        comparison_list = comparison_df.to_dict(orient='records')
        
        # Convert numpy values to Python types for JSON serialization
        for strategy in comparison_list:
            for key, value in strategy.items():
                if isinstance(value, np.float64) or isinstance(value, np.float32):
                    strategy[key] = float(value)
        
        # Create response
        response = {
            "symbols": symbols,
            "strategies": strategies,
            "comparison": comparison_list,
            "generated_at": datetime.now().isoformat()
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing strategies: {str(e)}")