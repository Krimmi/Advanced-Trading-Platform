"""
Base model class for price prediction models.
All specific model implementations should inherit from this class.
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

class BasePriceModel(ABC):
    """
    Abstract base class for all price prediction models.
    """
    def __init__(
        self,
        model_name: str,
        model_version: str = "1.0.0",
        input_window_size: int = 60,
        prediction_horizon: int = 30,
        features: List[str] = None,
        model_path: str = None
    ):
        """
        Initialize the base price prediction model.
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            input_window_size: Number of past days to use for prediction
            prediction_horizon: Number of days to predict into the future
            features: List of features to use for prediction
            model_path: Path to save/load the model
        """
        self.model_name = model_name
        self.model_version = model_version
        self.input_window_size = input_window_size
        self.prediction_horizon = prediction_horizon
        self.features = features or ["close", "volume", "open", "high", "low"]
        self.model_path = model_path or f"./models/{model_name}"
        self.model = None
        self.is_trained = False
        self.training_history = {}
        self.metadata = {
            "model_name": model_name,
            "model_version": model_version,
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
            "input_window_size": input_window_size,
            "prediction_horizon": prediction_horizon,
            "features": self.features,
            "performance_metrics": {}
        }
        self.logger = logging.getLogger(f"price_model.{model_name}")
        
    @abstractmethod
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the input data for training or prediction.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            Tuple of (X, y) where X is the input features and y is the target values
        """
        pass
    
    @abstractmethod
    def build_model(self) -> Any:
        """
        Build the model architecture.
        
        Returns:
            The model object
        """
        pass
    
    @abstractmethod
    def train(self, X_train: np.ndarray, y_train: np.ndarray, **kwargs) -> Dict[str, Any]:
        """
        Train the model on the given data.
        
        Args:
            X_train: Training features
            y_train: Training targets
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training history
        """
        pass
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using the trained model.
        
        Args:
            X: Input features
            
        Returns:
            Array of predictions
        """
        pass
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """
        Evaluate the model on test data.
        
        Args:
            X_test: Test features
            y_test: Test targets
            
        Returns:
            Dictionary of evaluation metrics
        """
        predictions = self.predict(X_test)
        
        # Calculate metrics
        mse = np.mean((predictions - y_test) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(predictions - y_test))
        mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100
        
        metrics = {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "mape": float(mape)
        }
        
        # Update metadata
        self.metadata["performance_metrics"] = metrics
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        
        return metrics
    
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
            self.input_window_size = self.metadata["input_window_size"]
            self.prediction_horizon = self.metadata["prediction_horizon"]
            self.features = self.metadata["features"]
            
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
            "input_window_size": self.input_window_size,
            "prediction_horizon": self.prediction_horizon,
            "features": self.features,
            "is_trained": self.is_trained,
            "performance_metrics": self.metadata.get("performance_metrics", {}),
            "created_at": self.metadata.get("created_at"),
            "updated_at": self.metadata.get("updated_at")
        }