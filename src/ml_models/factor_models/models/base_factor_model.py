"""
Base class for factor models.
"""
from abc import ABC, abstractmethod
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import os
import json
import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class BaseFactorModel(ABC):
    """
    Abstract base class for all factor models.
    """
    def __init__(
        self,
        model_name: str,
        model_version: str = "1.0.0",
        factors: List[str] = None,
        lookback_period: int = 252,  # Default to 1 year of trading days
        model_path: str = None
    ):
        """
        Initialize the base factor model.
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            factors: List of factors to use in the model
            lookback_period: Number of days to use for factor calculation
            model_path: Path to save/load the model
        """
        self.model_name = model_name
        self.model_version = model_version
        self.factors = factors or []
        self.lookback_period = lookback_period
        self.model_path = model_path or f"./models/{model_name}"
        self.model = None
        self.is_trained = False
        self.training_history = {}
        self.metadata = {
            "model_name": model_name,
            "model_version": model_version,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
            "factors": self.factors,
            "lookback_period": lookback_period,
            "performance_metrics": {}
        }
        self.logger = logging.getLogger(f"factor_model.{model_name}")
        
    @abstractmethod
    def preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess the input data for factor calculation.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            Preprocessed DataFrame
        """
        pass
    
    @abstractmethod
    def calculate_factors(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate factor exposures for the given data.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            DataFrame with factor exposures
        """
        pass
    
    @abstractmethod
    def fit(self, returns: pd.DataFrame, factors: pd.DataFrame) -> Dict[str, Any]:
        """
        Fit the factor model to the data.
        
        Args:
            returns: DataFrame of asset returns
            factors: DataFrame of factor returns
            
        Returns:
            Dictionary containing model parameters
        """
        pass
    
    @abstractmethod
    def predict(self, factors: pd.DataFrame) -> pd.DataFrame:
        """
        Predict returns using the factor model.
        
        Args:
            factors: DataFrame of factor exposures
            
        Returns:
            DataFrame of predicted returns
        """
        pass
    
    def evaluate(self, returns: pd.DataFrame, factors: pd.DataFrame) -> Dict[str, float]:
        """
        Evaluate the factor model on test data.
        
        Args:
            returns: DataFrame of asset returns
            factors: DataFrame of factor exposures
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Predict returns
        predicted_returns = self.predict(factors)
        
        # Calculate metrics
        metrics = self._calculate_metrics(returns, predicted_returns)
        
        # Update metadata
        self.metadata["performance_metrics"] = metrics
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        
        return metrics
    
    def _calculate_metrics(self, actual_returns: pd.DataFrame, predicted_returns: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate evaluation metrics.
        
        Args:
            actual_returns: DataFrame of actual returns
            predicted_returns: DataFrame of predicted returns
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Align data
        actual = actual_returns.values.flatten()
        predicted = predicted_returns.values.flatten()
        
        # Calculate metrics
        mse = np.mean((actual - predicted) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(actual - predicted))
        
        # Calculate R-squared
        ss_total = np.sum((actual - np.mean(actual)) ** 2)
        ss_residual = np.sum((actual - predicted) ** 2)
        r_squared = 1 - (ss_residual / ss_total) if ss_total != 0 else 0
        
        # Calculate information coefficient (correlation between predicted and actual)
        ic = np.corrcoef(actual, predicted)[0, 1] if len(actual) > 1 else 0
        
        return {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "r_squared": float(r_squared),
            "information_coefficient": float(ic)
        }
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save the model to disk.
        
        Args:
            path: Path to save the model (if None, use self.model_path)
            
        Returns:
            Path where the model was saved
        """
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save metadata
        with open(f"{save_path}_metadata.json", "w") as f:
            json.dump(self.metadata, f, indent=2)
        
        self.logger.info(f"Model metadata saved to {save_path}_metadata.json")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the model from disk.
        
        Args:
            path: Path to load the model from (if None, use self.model_path)
        """
        load_path = path or self.model_path
        
        # Load metadata
        try:
            with open(f"{load_path}_metadata.json", "r") as f:
                self.metadata = json.load(f)
                
            self.model_name = self.metadata["model_name"]
            self.model_version = self.metadata["model_version"]
            self.factors = self.metadata["factors"]
            self.lookback_period = self.metadata["lookback_period"]
            
            self.logger.info(f"Model metadata loaded from {load_path}_metadata.json")
        except FileNotFoundError:
            self.logger.warning(f"No metadata found at {load_path}_metadata.json")
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dictionary containing model information
        """
        return {
            "model_name": self.model_name,
            "model_version": self.model_version,
            "factors": self.factors,
            "lookback_period": self.lookback_period,
            "is_trained": self.is_trained,
            "performance_metrics": self.metadata.get("performance_metrics", {}),
            "created_at": self.metadata.get("created_at"),
            "updated_at": self.metadata.get("updated_at")
        }
    
    def calculate_factor_contribution(self, factors: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate factor contribution to returns.
        
        Args:
            factors: DataFrame of factor exposures
            
        Returns:
            DataFrame of factor contributions
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # This is a placeholder - subclasses should implement this
        return pd.DataFrame()
    
    def calculate_risk_decomposition(self, factors: pd.DataFrame, factor_covariance: pd.DataFrame = None) -> pd.DataFrame:
        """
        Calculate risk decomposition by factor.
        
        Args:
            factors: DataFrame of factor exposures
            factor_covariance: DataFrame of factor covariance matrix (if None, calculate from factors)
            
        Returns:
            DataFrame of risk decomposition
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call fit() first.")
        
        # This is a placeholder - subclasses should implement this
        return pd.DataFrame()