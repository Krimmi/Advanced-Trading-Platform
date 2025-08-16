"""
Implementation of Fama-French factor models.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import os
import json
import datetime
import logging
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression
import sys

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../')))
from src.ml_models.factor_models.models.base_factor_model import BaseFactorModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fama_french_model")

class FamaFrenchModel(BaseFactorModel):
    """
    Implementation of Fama-French factor models.
    Supports both 3-factor and 5-factor models.
    """
    def __init__(
        self,
        model_name: str = "fama_french",
        model_version: str = "1.0.0",
        model_type: str = "three_factor",  # "three_factor" or "five_factor"
        lookback_period: int = 252,  # Default to 1 year of trading days
        model_path: str = None
    ):
        """
        Initialize the Fama-French factor model.
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            model_type: Type of Fama-French model ("three_factor" or "five_factor")
            lookback_period: Number of days to use for factor calculation
            model_path: Path to save/load the model
        """
        # Set factors based on model type
        if model_type == "three_factor":
            factors = ["market", "size", "value"]
        elif model_type == "five_factor":
            factors = ["market", "size", "value", "profitability", "investment"]
        else:
            raise ValueError(f"Invalid model_type: {model_type}. Must be 'three_factor' or 'five_factor'")
        
        super().__init__(
            model_name=model_name,
            model_version=model_version,
            factors=factors,
            lookback_period=lookback_period,
            model_path=model_path
        )
        
        self.model_type = model_type
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
        Calculate Fama-French factors from the data.
        
        In a real implementation, this would fetch the Fama-French factors from a data provider.
        For this example, we'll simulate the factors.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            DataFrame with factor returns
        """
        # Get the date range from the data
        dates = data.index
        
        # Create a DataFrame for factor returns
        factors_df = pd.DataFrame(index=dates)
        
        # Simulate market factor (market excess return)
        factors_df["market"] = np.random.normal(0.0005, 0.01, len(dates))  # ~12% annual return, ~16% volatility
        
        # Simulate size factor (SMB - Small Minus Big)
        factors_df["size"] = np.random.normal(0.0002, 0.005, len(dates))  # ~5% annual return, ~8% volatility
        
        # Simulate value factor (HML - High Minus Low)
        factors_df["value"] = np.random.normal(0.0001, 0.006, len(dates))  # ~2.5% annual return, ~9.5% volatility
        
        # For five-factor model, add profitability and investment factors
        if self.model_type == "five_factor":
            # Simulate profitability factor (RMW - Robust Minus Weak)
            factors_df["profitability"] = np.random.normal(0.0001, 0.004, len(dates))  # ~2.5% annual return, ~6.5% volatility
            
            # Simulate investment factor (CMA - Conservative Minus Aggressive)
            factors_df["investment"] = np.random.normal(0.0001, 0.004, len(dates))  # ~2.5% annual return, ~6.5% volatility
        
        return factors_df
    
    def fit(self, returns: pd.DataFrame, factors: pd.DataFrame) -> Dict[str, Any]:
        """
        Fit the Fama-French model to the data.
        
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
        Predict returns using the Fama-French model.
        
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
            beta_vector = pd.Series(betas)
            
            # Calculate total risk (variance)
            total_variance = beta_vector.dot(factor_covariance).dot(beta_vector)
            total_variance += self.residual_volatility[asset] ** 2  # Add residual variance
            
            # Calculate marginal contribution to risk
            mcr = factor_covariance.dot(beta_vector)
            
            # Calculate component contribution to risk
            ccr = pd.Series({factor: beta_vector[factor] * mcr[factor] for factor in self.factors})
            
            # Add residual risk
            ccr["residual"] = self.residual_volatility[asset] ** 2
            
            # Calculate percentage contribution
            pcr = ccr / total_variance
            
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
        Save the Fama-French model to disk.
        
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
            "model_type": self.model_type
        }
        
        with open(f"{save_path}_params.json", "w") as f:
            json.dump(model_params, f, indent=2, default=lambda x: float(x) if isinstance(x, np.float64) else x)
        
        # Save metadata using parent method
        super().save_model(save_path)
        
        self.logger.info(f"Fama-French model saved to {save_path}")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the Fama-French model from disk.
        
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
            self.model_type = model_params["model_type"]
            
            # Set trained flag
            self.is_trained = True
            
            # Load metadata using parent method
            super().load_model(load_path)
            
            self.logger.info(f"Fama-French model loaded from {load_path}")
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
                exposures.loc[asset, factor] = beta
        
        return exposures
    
    def get_expected_returns(self, factor_risk_premia: Dict[str, float] = None) -> pd.DataFrame:
        """
        Calculate expected returns using the Fama-French model.
        
        Args:
            factor_risk_premia: Dictionary of factor risk premia (if None, use default values)
            
        Returns:
            DataFrame of expected returns
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # Default factor risk premia (annualized)
        default_premia = {
            "market": 0.05,  # 5% equity risk premium
            "size": 0.02,    # 2% size premium
            "value": 0.02,   # 2% value premium
            "profitability": 0.01,  # 1% profitability premium
            "investment": 0.01      # 1% investment premium
        }
        
        # Use provided risk premia or defaults
        premia = factor_risk_premia or default_premia
        
        # Calculate expected returns
        expected_returns = pd.Series(index=self.factor_betas.keys())
        
        for asset, betas in self.factor_betas.items():
            # Start with alpha
            expected_return = self.alpha[asset]
            
            # Add factor contributions
            for factor, beta in betas.items():
                if factor in premia:
                    expected_return += beta * premia[factor]
            
            expected_returns[asset] = expected_return
        
        return expected_returns