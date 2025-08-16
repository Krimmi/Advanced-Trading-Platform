"""
Implementation of a custom factor model with user-defined factors.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Callable
import os
import json
import datetime
import logging
import statsmodels.api as sm
import sys

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from src.ml_models.factor_models.models.base_factor_model import BaseFactorModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("custom_factor_model")

class CustomFactorModel(BaseFactorModel):
    """
    Implementation of a custom factor model with user-defined factors.
    """
    def __init__(
        self,
        model_name: str = "custom_factor_model",
        model_version: str = "1.0.0",
        factors: List[str] = None,
        factor_functions: Dict[str, Callable] = None,
        lookback_period: int = 252,  # Default to 1 year of trading days
        model_path: str = None
    ):
        """
        Initialize the custom factor model.
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            factors: List of factor names
            factor_functions: Dictionary mapping factor names to functions that calculate factor values
            lookback_period: Number of days to use for factor calculation
            model_path: Path to save/load the model
        """
        # Default factors if none provided
        if factors is None:
            factors = ["market", "momentum", "volatility", "size", "value"]
        
        super().__init__(
            model_name=model_name,
            model_version=model_version,
            factors=factors,
            lookback_period=lookback_period,
            model_path=model_path
        )
        
        # Initialize factor functions
        self.factor_functions = factor_functions or {}
        
        # Initialize model parameters
        self.regression_models = {}  # Dictionary of regression models for each asset
        self.factor_betas = {}  # Dictionary of factor betas for each asset
        self.alpha = {}  # Dictionary of alpha (intercept) for each asset
        self.r_squared = {}  # Dictionary of R-squared for each asset
        self.residual_volatility = {}  # Dictionary of residual volatility for each asset
        
        self.logger = logger
    
    def preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess the input data for factor calculation.
        
        Args:
            data: DataFrame containing the price data with columns for each asset
                 and a DatetimeIndex
            
        Returns:
            DataFrame of asset returns
        """
        # Calculate daily returns
        returns = data.pct_change().dropna()
        
        # Filter to lookback period
        if len(returns) > self.lookback_period:
            returns = returns.iloc[-self.lookback_period:]
        
        return returns
    
    def calculate_factors(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate custom factors from the data.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            DataFrame with factor returns
        """
        # Create a DataFrame for factor returns
        factors_df = pd.DataFrame(index=data.index)
        
        # Calculate each factor using the provided functions
        for factor in self.factors:
            if factor in self.factor_functions:
                # Use the provided function to calculate the factor
                factors_df[factor] = self.factor_functions[factor](data)
            else:
                # Use default calculation for common factors
                if factor == "market":
                    # Market factor is the average return across all assets
                    factors_df[factor] = data.mean(axis=1)
                elif factor == "momentum":
                    # Momentum factor is the 12-month return minus 1-month return
                    if len(data) >= 252:  # Approximately 1 year of trading days
                        momentum = data.pct_change(252) - data.pct_change(21)
                        factors_df[factor] = momentum.mean(axis=1)
                    else:
                        # Use shorter lookback if not enough data
                        lookback = max(2, len(data) // 12)
                        momentum = data.pct_change(lookback) - data.pct_change(1)
                        factors_df[factor] = momentum.mean(axis=1)
                elif factor == "volatility":
                    # Volatility factor is the rolling standard deviation
                    if len(data) >= 21:  # Approximately 1 month of trading days
                        vol = data.pct_change().rolling(21).std().mean(axis=1)
                        factors_df[factor] = vol
                    else:
                        # Use shorter lookback if not enough data
                        lookback = max(2, len(data) // 21)
                        vol = data.pct_change().rolling(lookback).std().mean(axis=1)
                        factors_df[factor] = vol
                elif factor == "size":
                    # Size factor is simulated with random data
                    # In a real implementation, this would use market capitalization data
                    factors_df[factor] = np.random.normal(0.0002, 0.005, len(data.index))
                elif factor == "value":
                    # Value factor is simulated with random data
                    # In a real implementation, this would use price-to-book or other value metrics
                    factors_df[factor] = np.random.normal(0.0001, 0.006, len(data.index))
                else:
                    # For unknown factors, use random data
                    self.logger.warning(f"No calculation function provided for factor '{factor}'. Using random data.")
                    factors_df[factor] = np.random.normal(0.0001, 0.01, len(data.index))
        
        # Fill any NaN values
        factors_df = factors_df.fillna(0)
        
        return factors_df
    
    def add_factor(self, factor_name: str, factor_function: Callable = None) -> None:
        """
        Add a new factor to the model.
        
        Args:
            factor_name: Name of the factor
            factor_function: Function that calculates the factor values
        """
        if factor_name not in self.factors:
            self.factors.append(factor_name)
        
        if factor_function is not None:
            self.factor_functions[factor_name] = factor_function
        
        self.logger.info(f"Added factor '{factor_name}' to the model")
    
    def remove_factor(self, factor_name: str) -> None:
        """
        Remove a factor from the model.
        
        Args:
            factor_name: Name of the factor to remove
        """
        if factor_name in self.factors:
            self.factors.remove(factor_name)
        
        if factor_name in self.factor_functions:
            del self.factor_functions[factor_name]
        
        self.logger.info(f"Removed factor '{factor_name}' from the model")
    
    def fit(self, returns: pd.DataFrame, factors: pd.DataFrame) -> Dict[str, Any]:
        """
        Fit the custom factor model to the data.
        
        Args:
            returns: DataFrame of asset returns
            factors: DataFrame of factor returns
            
        Returns:
            Dictionary containing model parameters
        """
        # Align data
        common_dates = returns.index.intersection(factors.index)
        returns = returns.loc[common_dates]
        factors = factors.loc[common_dates]
        
        # Add constant for intercept
        X = sm.add_constant(factors)
        
        # Fit model for each asset
        assets = returns.columns
        self.regression_models = {}
        self.factor_betas = {}
        self.alpha = {}
        self.r_squared = {}
        self.residual_volatility = {}
        
        for asset in assets:
            # Get asset returns
            y = returns[asset]
            
            # Fit OLS model
            model = sm.OLS(y, X).fit()
            
            # Store model
            self.regression_models[asset] = model
            
            # Store parameters
            self.alpha[asset] = model.params["const"]
            self.factor_betas[asset] = {factor: model.params[factor] for factor in self.factors}
            self.r_squared[asset] = model.rsquared
            self.residual_volatility[asset] = np.sqrt(model.mse_resid)
        
        # Update metadata
        self.is_trained = True
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        self.metadata["num_assets"] = len(assets)
        self.metadata["training_period"] = {
            "start_date": returns.index[0].strftime("%Y-%m-%d"),
            "end_date": returns.index[-1].strftime("%Y-%m-%d"),
            "num_observations": len(returns)
        }
        
        # Return model parameters
        return {
            "alpha": self.alpha,
            "factor_betas": self.factor_betas,
            "r_squared": self.r_squared,
            "residual_volatility": self.residual_volatility
        }
    
    def predict(self, factors: pd.DataFrame) -> pd.DataFrame:
        """
        Predict returns using the custom factor model.
        
        Args:
            factors: DataFrame of factor returns
            
        Returns:
            DataFrame of predicted returns
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # Add constant for intercept
        X = sm.add_constant(factors)
        
        # Predict returns for each asset
        predicted_returns = pd.DataFrame(index=factors.index)
        
        for asset, model in self.regression_models.items():
            predicted_returns[asset] = model.predict(X)
        
        return predicted_returns
    
    def calculate_factor_contribution(self, factors: pd.DataFrame) -> Dict[str, pd.DataFrame]:
        """
        Calculate factor contribution to returns.
        
        Args:
            factors: DataFrame of factor returns
            
        Returns:
            Dictionary of DataFrames with factor contributions for each asset
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # Calculate factor contribution for each asset
        contributions = {}
        
        for asset, betas in self.factor_betas.items():
            # Initialize DataFrame for this asset
            asset_contrib = pd.DataFrame(index=factors.index)
            
            # Add alpha contribution (constant)
            asset_contrib["alpha"] = self.alpha[asset]
            
            # Add factor contributions
            for factor in self.factors:
                if factor in factors.columns and factor in betas:
                    asset_contrib[factor] = betas[factor] * factors[factor]
            
            # Add total predicted return
            asset_contrib["total"] = asset_contrib.sum(axis=1)
            
            contributions[asset] = asset_contrib
        
        return contributions
    
    def calculate_risk_decomposition(self, factors: pd.DataFrame, factor_covariance: pd.DataFrame = None) -> Dict[str, pd.DataFrame]:
        """
        Calculate risk decomposition by factor.
        
        Args:
            factors: DataFrame of factor returns
            factor_covariance: DataFrame of factor covariance matrix (if None, calculate from factors)
            
        Returns:
            Dictionary of DataFrames with risk decomposition for each asset
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # Calculate factor covariance if not provided
        if factor_covariance is None:
            factor_covariance = factors.cov()
        
        # Calculate risk decomposition for each asset
        risk_decomposition = {}
        
        for asset, betas in self.factor_betas.items():
            # Convert betas to Series
            beta_vector = pd.Series({factor: betas.get(factor, 0) for factor in factors.columns})
            
            # Calculate total risk (variance)
            total_variance = beta_vector.dot(factor_covariance).dot(beta_vector)
            total_variance += self.residual_volatility.get(asset, 0) ** 2  # Add residual variance
            
            # Calculate marginal contribution to risk
            mcr = factor_covariance.dot(beta_vector)
            
            # Calculate component contribution to risk
            ccr = pd.Series({factor: beta_vector[factor] * mcr[factor] for factor in factors.columns})
            
            # Add residual risk
            ccr["residual"] = self.residual_volatility.get(asset, 0) ** 2
            
            # Calculate percentage contribution
            pcr = ccr / total_variance if total_variance > 0 else ccr * 0
            
            # Create DataFrame with all risk metrics
            risk_df = pd.DataFrame({
                "beta": beta_vector,
                "marginal_contribution": mcr,
                "component_contribution": ccr,
                "percentage_contribution": pcr * 100  # Convert to percentage
            })
            
            # Add total risk
            risk_df.loc["total", "component_contribution"] = total_variance
            risk_df.loc["total", "percentage_contribution"] = 100.0
            
            risk_decomposition[asset] = risk_df
        
        return risk_decomposition
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save the custom factor model to disk.
        
        Args:
            path: Path to save the model (if None, use self.model_path)
            
        Returns:
            Path where the model was saved
        """
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save model parameters
        model_params = {
            "alpha": self.alpha,
            "factor_betas": self.factor_betas,
            "r_squared": self.r_squared,
            "residual_volatility": self.residual_volatility,
            "factors": self.factors
        }
        
        with open(f"{save_path}_params.json", "w") as f:
            json.dump(model_params, f, indent=2, default=lambda x: float(x) if isinstance(x, np.float64) else x)
        
        # Note: We can't save factor_functions as they are Python functions
        # We'll need to recreate them when loading the model
        
        # Save metadata using parent method
        super().save_model(save_path)
        
        self.logger.info(f"Custom factor model saved to {save_path}")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the custom factor model from disk.
        
        Args:
            path: Path to load the model from (if None, use self.model_path)
        """
        load_path = path or self.model_path
        
        # Load model parameters
        try:
            with open(f"{load_path}_params.json", "r") as f:
                model_params = json.load(f)
            
            self.alpha = model_params["alpha"]
            self.factor_betas = model_params["factor_betas"]
            self.r_squared = model_params["r_squared"]
            self.residual_volatility = model_params["residual_volatility"]
            self.factors = model_params["factors"]
            
            # Set trained flag
            self.is_trained = True
            
            # Load metadata using parent method
            super().load_model(load_path)
            
            self.logger.info(f"Custom factor model loaded from {load_path}")
        except FileNotFoundError:
            self.logger.warning(f"No model parameters found at {load_path}_params.json")
    
    def get_factor_exposures(self) -> pd.DataFrame:
        """
        Get factor exposures (betas) for all assets.
        
        Returns:
            DataFrame of factor exposures
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # Create DataFrame of factor exposures
        exposures = pd.DataFrame(index=self.factor_betas.keys(), columns=self.factors)
        
        for asset, betas in self.factor_betas.items():
            for factor, beta in betas.items():
                if factor in exposures.columns:
                    exposures.loc[asset, factor] = beta
        
        return exposures
    
    def get_factor_correlations(self, factors: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate correlations between factors.
        
        Args:
            factors: DataFrame of factor returns
            
        Returns:
            DataFrame of factor correlations
        """
        return factors.corr()
    
    def get_factor_summary(self, factors: pd.DataFrame) -> pd.DataFrame:
        """
        Get summary statistics for each factor.
        
        Args:
            factors: DataFrame of factor returns
            
        Returns:
            DataFrame of factor summary statistics
        """
        # Calculate summary statistics
        summary = pd.DataFrame(index=factors.columns)
        
        # Mean return (annualized)
        summary["mean_return"] = factors.mean() * 252
        
        # Standard deviation (annualized)
        summary["volatility"] = factors.std() * np.sqrt(252)
        
        # Sharpe ratio (assuming zero risk-free rate)
        summary["sharpe_ratio"] = summary["mean_return"] / summary["volatility"]
        
        # Skewness
        summary["skewness"] = factors.skew()
        
        # Kurtosis
        summary["kurtosis"] = factors.kurtosis()
        
        # Minimum
        summary["minimum"] = factors.min()
        
        # Maximum
        summary["maximum"] = factors.max()
        
        return summary