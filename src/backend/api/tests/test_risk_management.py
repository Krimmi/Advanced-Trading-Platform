"""
Tests for risk management API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os
import json
from typing import Dict, List, Any

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.backend.api.main import app

# Create test client
client = TestClient(app)

def test_calculate_risk_metrics():
    """Test calculating risk metrics."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "weights": {"AAPL": 0.2, "MSFT": 0.2, "GOOGL": 0.2, "AMZN": 0.2, "FB": 0.2},
        "lookback_days": 252,
        "risk_free_rate": 0.02
    }
    
    # Make request
    response = client.post("/api/risk-management/risk-metrics", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "symbols" in data
    assert "weights" in data
    assert "risk_free_rate" in data
    assert "lookback_days" in data
    assert "generated_at" in data
    
    # Check metrics
    metrics = data["metrics"]
    assert "expected_return" in metrics
    assert "volatility" in metrics
    assert "sharpe_ratio" in metrics
    assert "sortino_ratio" in metrics
    assert "var_95" in metrics
    assert "cvar_95" in metrics
    assert "max_drawdown" in metrics

def test_optimize_portfolio():
    """Test optimizing a portfolio."""
    # Define test data for each optimization method
    optimization_methods = [
        "maximum_sharpe", 
        "minimum_volatility", 
        "maximum_return", 
        "risk_parity", 
        "maximum_diversification", 
        "minimum_cvar", 
        "hierarchical_risk_parity", 
        "equal_weight", 
        "inverse_volatility"
    ]
    
    for method in optimization_methods:
        # Define test data
        test_data = {
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "optimization_method": method,
            "lookback_days": 252,
            "risk_free_rate": 0.02
        }
        
        # Add method-specific parameters
        if method == "maximum_return":
            test_data["target_volatility"] = 0.2
        
        # Make request
        response = client.post("/api/risk-management/optimize-portfolio", json=test_data)
        
        # Check response
        assert response.status_code == 200
        data = response.json()
        assert "weights" in data
        assert "expected_return" in data
        assert "volatility" in data
        assert "sharpe_ratio" in data
        assert "metrics" in data
        assert "generated_at" in data
        assert data["optimization_method"] == method
        
        # Check weights
        weights = data["weights"]
        assert len(weights) == len(test_data["symbols"])
        assert sum(weights.values()) > 0.99 and sum(weights.values()) < 1.01  # Sum should be approximately 1

def test_efficient_frontier():
    """Test generating the efficient frontier."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "num_portfolios": 20,
        "lookback_days": 252,
        "risk_free_rate": 0.02
    }
    
    # Make request
    response = client.post("/api/risk-management/efficient-frontier", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "efficient_frontier" in data
    assert "symbols" in data
    assert "num_portfolios" in data
    assert "risk_free_rate" in data
    assert "generated_at" in data
    
    # Check efficient frontier
    ef = data["efficient_frontier"]
    assert len(ef) > 0
    assert "return" in ef[0]
    assert "volatility" in ef[0]
    assert "sharpe_ratio" in ef[0]

def test_stress_test():
    """Test running stress tests."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "weights": {"AAPL": 0.2, "MSFT": 0.2, "GOOGL": 0.2, "AMZN": 0.2, "FB": 0.2},
        "lookback_days": 252,
        "test_types": ["historical", "monte_carlo", "custom"]
    }
    
    # Make request
    response = client.post("/api/risk-management/stress-test", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "stress_test_results" in data
    assert "symbols" in data
    assert "weights" in data
    assert "lookback_days" in data
    assert "generated_at" in data
    
    # Check stress test results
    stress_results = data["stress_test_results"]
    if "historical_scenarios" in stress_results:
        assert len(stress_results["historical_scenarios"]) > 0
    if "monte_carlo" in stress_results:
        assert "var" in stress_results["monte_carlo"]
        assert "cvar" in stress_results["monte_carlo"]
    if "custom_scenarios" in stress_results:
        assert len(stress_results["custom_scenarios"]) > 0

def test_construct_portfolio():
    """Test constructing a portfolio."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "strategy": "maximum_sharpe",
        "lookback_days": 252,
        "risk_free_rate": 0.02,
        "run_stress_test": False
    }
    
    # Make request
    response = client.post("/api/risk-management/construct-portfolio", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "weights" in data
    assert "expected_return" in data
    assert "volatility" in data
    assert "sharpe_ratio" in data
    assert "metrics" in data
    assert "generated_at" in data
    assert data["strategy"] == "maximum_sharpe"
    
    # Check weights
    weights = data["weights"]
    assert len(weights) == len(test_data["symbols"])
    assert sum(weights.values()) > 0.99 and sum(weights.values()) < 1.01  # Sum should be approximately 1

def test_rebalance_portfolio():
    """Test rebalancing a portfolio."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "current_weights": {"AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.1, "AMZN": 0.1, "FB": 0.1},
        "strategy": "maximum_sharpe",
        "lookback_days": 252,
        "risk_free_rate": 0.02,
        "transaction_costs": {"default": 0.001},
        "max_turnover": 0.2
    }
    
    # Make request
    response = client.post("/api/risk-management/rebalance-portfolio", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "current_weights" in data
    assert "target_weights" in data
    assert "trades" in data
    assert "turnover" in data
    assert "trade_costs" in data
    assert "total_cost" in data
    assert "expected_return" in data
    assert "volatility" in data
    assert "sharpe_ratio" in data
    assert "metrics" in data
    assert "generated_at" in data
    assert data["strategy"] == "maximum_sharpe"
    
    # Check weights
    current_weights = data["current_weights"]
    target_weights = data["target_weights"]
    trades = data["trades"]
    assert len(current_weights) == len(test_data["symbols"])
    assert len(target_weights) == len(test_data["symbols"])
    assert len(trades) == len(test_data["symbols"])
    assert sum(target_weights.values()) > 0.99 and sum(target_weights.values()) < 1.01  # Sum should be approximately 1
    
    # Check turnover constraint
    assert data["turnover"] <= test_data["max_turnover"] + 0.01  # Allow small numerical error

def test_compare_strategies():
    """Test comparing different strategies."""
    # Define test data
    test_data = {
        "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
        "strategies": ["maximum_sharpe", "minimum_volatility", "equal_weight", "risk_parity"],
        "lookback_days": 252,
        "risk_free_rate": 0.02
    }
    
    # Make request
    response = client.post("/api/risk-management/compare-strategies", json=test_data)
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "comparison" in data
    assert "symbols" in data
    assert "strategies" in data
    assert "generated_at" in data
    
    # Check comparison
    comparison = data["comparison"]
    assert len(comparison) == len(test_data["strategies"])
    for strategy in comparison:
        assert "method" in strategy
        assert "expected_return" in strategy
        assert "volatility" in strategy
        assert "sharpe_ratio" in strategy

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])