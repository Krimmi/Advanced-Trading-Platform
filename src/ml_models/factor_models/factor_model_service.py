"""
Service for factor model operations.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union
import os
import json
import datetime
import logging
import sys

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from src.ml_models.factor_models.models.base_factor_model import BaseFactorModel
from src.ml_models.factor_models.models.fama_french.fama_french_model import FamaFrenchModel
from src.ml_models.factor_models.models.apt.apt_model import APTModel
from src.ml_models.factor_models.models.custom.custom_factor_model import CustomFactorModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("factor_model_service")

class FactorModelService:
    """
    Service for factor model operations.
    """
    def __init__(self, models_dir: str = "./models/factor_models"):
        """
        Initialize the factor model service.
        
        Args:
            models_dir: Directory to store factor models
        """
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
        # Dictionary to store loaded models
        self.models = {}
        
        self.logger = logger
    
    def create_model(
        self,
        model_type: str,
        model_name: Optional[str] = None,
        **kwargs
    ) -> BaseFactorModel:
        """
        Create a new factor model.
        
        Args:
            model_type: Type of model to create ('fama_french', 'apt', 'custom')
            model_name: Name of the model (if None, use default name)
            **kwargs: Additional parameters for the model
            
        Returns:
            Created factor model
        """
        # Set default model name if not provided
        if model_name is None:
            model_name = f"{model_type}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Set model path
        model_path = os.path.join(self.models_dir, model_name)
        
        # Create the model based on type
        if model_type == "fama_french":
            model = FamaFrenchModel(
                model_name=model_name,
                model_path=model_path,
                **kwargs
            )
        elif model_type == "apt":
            model = APTModel(
                model_name=model_name,
                model_path=model_path,
                **kwargs
            )
        elif model_type == "custom":
            model = CustomFactorModel(
                model_name=model_name,
                model_path=model_path,
                **kwargs
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Store the model
        self.models[model_name] = model
        
        self.logger.info(f"Created {model_type} model: {model_name}")
        return model
    
    def get_model(self, model_name: str) -> BaseFactorModel:
        """
        Get a factor model by name.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Factor model
        """
        # Check if model is already loaded
        if model_name in self.models:
            return self.models[model_name]
        
        # Try to load the model
        model_path = os.path.join(self.models_dir, model_name)
        
        # Check if model exists
        metadata_path = f"{model_path}_metadata.json"
        if not os.path.exists(metadata_path):
            raise ValueError(f"Model not found: {model_name}")
        
        # Load metadata to determine model type
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        
        # Create the appropriate model type
        if "fama_french" in model_name.lower() or "fama-french" in metadata.get("model_name", "").lower():
            model = FamaFrenchModel(model_path=model_path)
        elif "apt" in model_name.lower() or "apt" in metadata.get("model_name", "").lower():
            model = APTModel(model_path=model_path)
        else:
            # Default to custom model
            model = CustomFactorModel(model_path=model_path)
        
        # Load the model
        model.load_model(model_path)
        
        # Store the model
        self.models[model_name] = model
        
        self.logger.info(f"Loaded model: {model_name}")
        return model
    
    def list_models(self) -> List[Dict[str, Any]]:
        """
        List all available factor models.
        
        Returns:
            List of model information dictionaries
        """
        models_info = []
        
        # Check models directory
        if not os.path.exists(self.models_dir):
            return models_info
        
        # Find all model metadata files
        for filename in os.listdir(self.models_dir):
            if filename.endswith("_metadata.json"):
                model_name = filename.replace("_metadata.json", "")
                
                # Load metadata
                with open(os.path.join(self.models_dir, filename), "r") as f:
                    metadata = json.load(f)
                
                # Add model info
                models_info.append({
                    "model_name": model_name,
                    "model_type": metadata.get("model_name", "unknown"),
                    "created_at": metadata.get("created_at", "unknown"),
                    "updated_at": metadata.get("updated_at", "unknown"),
                    "factors": metadata.get("factors", []),
                    "is_trained": os.path.exists(os.path.join(self.models_dir, f"{model_name}_params.json"))
                })
        
        return models_info
    
    def delete_model(self, model_name: str) -> bool:
        """
        Delete a factor model.
        
        Args:
            model_name: Name of the model to delete
            
        Returns:
            True if successful, False otherwise
        """
        # Check if model exists
        model_path = os.path.join(self.models_dir, model_name)
        metadata_path = f"{model_path}_metadata.json"
        if not os.path.exists(metadata_path):
            self.logger.warning(f"Model not found: {model_name}")
            return False
        
        # Remove model files
        for filename in os.listdir(self.models_dir):
            if filename.startswith(model_name + "_"):
                os.remove(os.path.join(self.models_dir, filename))
        
        # Remove from loaded models
        if model_name in self.models:
            del self.models[model_name]
        
        self.logger.info(f"Deleted model: {model_name}")
        return True
    
    def train_model(
        self,
        model_name: str,
        returns_data: pd.DataFrame,
        factors_data: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Train a factor model.
        
        Args:
            model_name: Name of the model to train
            returns_data: DataFrame of asset returns
            factors_data: DataFrame of factor returns (if None, calculate from returns_data)
            
        Returns:
            Dictionary containing training results
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Preprocess returns data
        returns = model.preprocess_data(returns_data)
        
        # Calculate factors if not provided
        if factors_data is None:
            factors = model.calculate_factors(returns)
        else:
            factors = factors_data
        
        # Train the model
        results = model.fit(returns, factors)
        
        # Save the trained model
        model.save_model()
        
        self.logger.info(f"Trained model: {model_name}")
        return results
    
    def predict_returns(
        self,
        model_name: str,
        factors_data: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Predict returns using a factor model.
        
        Args:
            model_name: Name of the model to use
            factors_data: DataFrame of factor returns
            
        Returns:
            DataFrame of predicted returns
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise ValueError(f"Model {model_name} is not trained")
        
        # Make predictions
        predictions = model.predict(factors_data)
        
        return predictions
    
    def analyze_factor_exposures(
        self,
        model_name: str
    ) -> pd.DataFrame:
        """
        Analyze factor exposures for a model.
        
        Args:
            model_name: Name of the model to analyze
            
        Returns:
            DataFrame of factor exposures
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise ValueError(f"Model {model_name} is not trained")
        
        # Get factor exposures
        exposures = model.get_factor_exposures()
        
        return exposures
    
    def analyze_risk_decomposition(
        self,
        model_name: str,
        factors_data: pd.DataFrame
    ) -> Dict[str, pd.DataFrame]:
        """
        Analyze risk decomposition for a model.
        
        Args:
            model_name: Name of the model to analyze
            factors_data: DataFrame of factor returns
            
        Returns:
            Dictionary of DataFrames with risk decomposition for each asset
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise ValueError(f"Model {model_name} is not trained")
        
        # Calculate factor covariance
        factor_covariance = factors_data.cov()
        
        # Calculate risk decomposition
        risk_decomposition = model.calculate_risk_decomposition(factors_data, factor_covariance)
        
        return risk_decomposition
    
    def analyze_factor_contribution(
        self,
        model_name: str,
        factors_data: pd.DataFrame
    ) -> Dict[str, pd.DataFrame]:
        """
        Analyze factor contribution to returns.
        
        Args:
            model_name: Name of the model to analyze
            factors_data: DataFrame of factor returns
            
        Returns:
            Dictionary of DataFrames with factor contributions for each asset
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise ValueError(f"Model {model_name} is not trained")
        
        # Calculate factor contribution
        contributions = model.calculate_factor_contribution(factors_data)
        
        return contributions
    
    def evaluate_model(
        self,
        model_name: str,
        returns_data: pd.DataFrame,
        factors_data: pd.DataFrame
    ) -> Dict[str, float]:
        """
        Evaluate a factor model.
        
        Args:
            model_name: Name of the model to evaluate
            returns_data: DataFrame of asset returns
            factors_data: DataFrame of factor returns
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Get the model
        model = self.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise ValueError(f"Model {model_name} is not trained")
        
        # Evaluate the model
        metrics = model.evaluate(returns_data, factors_data)
        
        return metrics
    
    def compare_models(
        self,
        model_names: List[str],
        returns_data: pd.DataFrame,
        factors_data: Optional[Dict[str, pd.DataFrame]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Compare multiple factor models.
        
        Args:
            model_names: List of model names to compare
            returns_data: DataFrame of asset returns
            factors_data: Dictionary mapping model names to factor returns DataFrames
                         (if None, calculate factors for each model)
            
        Returns:
            Dictionary mapping model names to evaluation metrics
        """
        comparison = {}
        
        for model_name in model_names:
            try:
                # Get the model
                model = self.get_model(model_name)
                
                # Check if model is trained
                if not model.is_trained:
                    self.logger.warning(f"Model {model_name} is not trained, skipping")
                    continue
                
                # Get factors for this model
                if factors_data is not None and model_name in factors_data:
                    factors = factors_data[model_name]
                else:
                    # Preprocess returns data
                    returns = model.preprocess_data(returns_data)
                    
                    # Calculate factors
                    factors = model.calculate_factors(returns)
                
                # Evaluate the model
                metrics = model.evaluate(returns_data, factors)
                
                comparison[model_name] = metrics
            except Exception as e:
                self.logger.error(f"Error evaluating model {model_name}: {str(e)}")
                comparison[model_name] = {"error": str(e)}
        
        return comparison