"""
Transaction Cost Models
This module provides models for estimating transaction costs in portfolio rebalancing.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Union, Any

class TransactionCostModel:
    """
    Base class for transaction cost models
    """
    def __init__(self):
        pass
    
    def estimate_costs(self, trades: pd.Series, prices: pd.Series, volumes: Optional[pd.Series] = None) -> pd.Series:
        """
        Estimate transaction costs for a set of trades
        
        Args:
            trades: Series of trades (positive for buys, negative for sells)
            prices: Series of asset prices
            volumes: Optional series of asset trading volumes
            
        Returns:
            Series of estimated transaction costs
        """
        raise NotImplementedError("Subclasses must implement estimate_costs")

class FixedRateModel(TransactionCostModel):
    """
    Fixed rate transaction cost model
    
    This model applies a fixed percentage cost to each trade.
    """
    def __init__(self, rate: float = 0.001):
        """
        Initialize the model
        
        Args:
            rate: Fixed transaction cost rate (e.g., 0.001 for 0.1%)
        """
        super().__init__()
        self.rate = rate
    
    def estimate_costs(self, trades: pd.Series, prices: pd.Series, volumes: Optional[pd.Series] = None) -> pd.Series:
        """
        Estimate transaction costs using a fixed rate
        
        Args:
            trades: Series of trades (positive for buys, negative for sells)
            prices: Series of asset prices
            volumes: Optional series of asset trading volumes (not used in this model)
            
        Returns:
            Series of estimated transaction costs
        """
        # Calculate absolute trade values
        trade_values = abs(trades * prices)
        
        # Apply fixed rate
        costs = trade_values * self.rate
        
        return costs

class VariableRateModel(TransactionCostModel):
    """
    Variable rate transaction cost model
    
    This model applies different rates based on asset-specific characteristics.
    """
    def __init__(self, rates: Dict[str, float], default_rate: float = 0.001):
        """
        Initialize the model
        
        Args:
            rates: Dictionary mapping asset symbols to their specific rates
            default_rate: Default rate for assets not in the rates dictionary
        """
        super().__init__()
        self.rates = rates
        self.default_rate = default_rate
    
    def estimate_costs(self, trades: pd.Series, prices: pd.Series, volumes: Optional[pd.Series] = None) -> pd.Series:
        """
        Estimate transaction costs using variable rates
        
        Args:
            trades: Series of trades (positive for buys, negative for sells)
            prices: Series of asset prices
            volumes: Optional series of asset trading volumes (not used in this model)
            
        Returns:
            Series of estimated transaction costs
        """
        # Calculate absolute trade values
        trade_values = abs(trades * prices)
        
        # Apply rates
        costs = pd.Series(index=trades.index, dtype=float)
        
        for symbol in trades.index:
            rate = self.rates.get(symbol, self.default_rate)
            costs[symbol] = trade_values[symbol] * rate
        
        return costs

class MarketImpactModel(TransactionCostModel):
    """
    Market impact transaction cost model
    
    This model estimates costs based on trade size relative to market volume.
    """
    def __init__(self, impact_factor: float = 0.1, fixed_rate: float = 0.0005):
        """
        Initialize the model
        
        Args:
            impact_factor: Factor for market impact calculation
            fixed_rate: Fixed component of transaction costs
        """
        super().__init__()
        self.impact_factor = impact_factor
        self.fixed_rate = fixed_rate
    
    def estimate_costs(self, trades: pd.Series, prices: pd.Series, volumes: Optional[pd.Series] = None) -> pd.Series:
        """
        Estimate transaction costs including market impact
        
        Args:
            trades: Series of trades (positive for buys, negative for sells)
            prices: Series of asset prices
            volumes: Series of asset trading volumes
            
        Returns:
            Series of estimated transaction costs
        """
        if volumes is None or len(volumes) == 0:
            # Fall back to fixed rate if volumes not provided
            return abs(trades * prices) * self.fixed_rate
        
        # Calculate absolute trade values
        trade_values = abs(trades * prices)
        
        # Calculate market impact component
        trade_volumes = abs(trades) / prices  # Convert dollar trades to share quantities
        volume_ratio = trade_volumes / volumes
        impact_costs = trade_values * self.impact_factor * np.sqrt(volume_ratio)
        
        # Add fixed component
        total_costs = trade_values * self.fixed_rate + impact_costs
        
        return total_costs

class ComprehensiveModel(TransactionCostModel):
    """
    Comprehensive transaction cost model
    
    This model combines fixed costs, variable rates, market impact, and bid-ask spread.
    """
    def __init__(
        self, 
        fixed_rate: float = 0.0005, 
        asset_rates: Optional[Dict[str, float]] = None,
        impact_factor: float = 0.1,
        spread_factor: float = 0.0001,
        min_cost: float = 0.0
    ):
        """
        Initialize the model
        
        Args:
            fixed_rate: Base fixed rate component
            asset_rates: Dictionary mapping asset symbols to their specific rates
            impact_factor: Factor for market impact calculation
            spread_factor: Factor for bid-ask spread estimation
            min_cost: Minimum cost per trade
        """
        super().__init__()
        self.fixed_rate = fixed_rate
        self.asset_rates = asset_rates or {}
        self.impact_factor = impact_factor
        self.spread_factor = spread_factor
        self.min_cost = min_cost
    
    def estimate_costs(self, trades: pd.Series, prices: pd.Series, volumes: Optional[pd.Series] = None) -> pd.Series:
        """
        Estimate transaction costs using the comprehensive model
        
        Args:
            trades: Series of trades (positive for buys, negative for sells)
            prices: Series of asset prices
            volumes: Optional series of asset trading volumes
            
        Returns:
            Series of estimated transaction costs
        """
        # Calculate absolute trade values
        trade_values = abs(trades * prices)
        
        # Initialize costs with fixed component
        costs = pd.Series(index=trades.index, dtype=float)
        
        for symbol in trades.index:
            # Get asset-specific rate or use default
            asset_rate = self.asset_rates.get(symbol, self.fixed_rate)
            
            # Fixed component
            cost = trade_values[symbol] * asset_rate
            
            # Add bid-ask spread component
            spread_cost = trade_values[symbol] * self.spread_factor
            cost += spread_cost
            
            # Add market impact if volumes provided
            if volumes is not None and symbol in volumes and volumes[symbol] > 0:
                trade_volume = abs(trades[symbol]) / prices[symbol]
                volume_ratio = trade_volume / volumes[symbol]
                impact_cost = trade_values[symbol] * self.impact_factor * np.sqrt(volume_ratio)
                cost += impact_cost
            
            # Apply minimum cost
            costs[symbol] = max(cost, self.min_cost)
        
        return costs

def create_transaction_cost_model(model_type: str, **kwargs) -> TransactionCostModel:
    """
    Factory function to create a transaction cost model
    
    Args:
        model_type: Type of model to create ('fixed', 'variable', 'market_impact', or 'comprehensive')
        **kwargs: Additional arguments for the specific model
        
    Returns:
        TransactionCostModel instance
    """
    if model_type == 'fixed':
        return FixedRateModel(**kwargs)
    elif model_type == 'variable':
        return VariableRateModel(**kwargs)
    elif model_type == 'market_impact':
        return MarketImpactModel(**kwargs)
    elif model_type == 'comprehensive':
        return ComprehensiveModel(**kwargs)
    else:
        raise ValueError(f"Unknown model type: {model_type}")