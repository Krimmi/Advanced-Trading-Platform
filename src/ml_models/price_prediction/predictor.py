"""
Main predictor module for stock price prediction.
This module provides a unified interface for making predictions using different models.
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
from src.ml_models.price_prediction.models.lstm_model import LSTMPriceModel
from src.ml_models.price_prediction.models.transformer_model import TransformerPriceModel
from src.ml_models.price_prediction.models.prophet_model import ProphetPriceModel
from src.ml_models.price_prediction.models.ensemble_model import EnsemblePriceModel
from src.ml_models.price_prediction.data.data_processor import DataProcessor
from src.ml_models.price_prediction.config.config import get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("price_predictor")

class PricePredictor:
    """
    Main class for stock price prediction.
    """
    def __init__(
        self,
        model_type: str = "ensemble",
        input_window_size: int = 20,
        prediction_horizon: int = 30,
        features: List[str] = None,
        models_dir: str = "./models",
        config: Dict[str, Any] = None
    ):
        """
        Initialize the price predictor.
        
        Args:
            model_type: Type of model to use ('lstm', 'transformer', 'prophet', or 'ensemble')
            input_window_size: Number of past days to use for prediction
            prediction_horizon: Number of days to predict into the future
            features: List of features to use for prediction
            models_dir: Directory to save/load models
            config: Configuration dictionary
        """
        self.model_type = model_type
        self.input_window_size = input_window_size
        self.prediction_horizon = prediction_horizon
        self.features = features or ["close", "volume", "open", "high", "low"]
        self.models_dir = models_dir
        self.config = config or get_config(model_type)
        self.logger = logger
        
        # Create data processor
        self.data_processor = DataProcessor(
            sequence_length=input_window_size,
            features=self.features
        )
        
        # Create model
        self.model = self._create_model()
        
    def _create_model(self) -> Any:
        """
        Create the appropriate model based on model_type.
        
        Returns:
            Model instance
        """
        model_path = os.path.join(self.models_dir, self.model_type)
        
        if self.model_type == "lstm":
            return LSTMPriceModel(
                input_window_size=self.input_window_size,
                prediction_horizon=self.prediction_horizon,
                features=self.features,
                model_path=model_path,
                config=self.config.get("model")
            )
        elif self.model_type == "transformer":
            return TransformerPriceModel(
                input_window_size=self.input_window_size,
                prediction_horizon=self.prediction_horizon,
                features=self.features,
                model_path=model_path,
                config=self.config.get("model")
            )
        elif self.model_type == "prophet":
            return ProphetPriceModel(
                input_window_size=self.input_window_size,
                prediction_horizon=self.prediction_horizon,
                features=self.features,
                model_path=model_path,
                config=self.config.get("model")
            )
        elif self.model_type == "ensemble":
            return EnsemblePriceModel(
                input_window_size=self.input_window_size,
                prediction_horizon=self.prediction_horizon,
                features=self.features,
                model_path=model_path,
                config=self.config.get("model")
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def train(
        self,
        data: pd.DataFrame,
        train_split: float = 0.7,
        val_split: float = 0.15,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the model on the given data.
        
        Args:
            data: DataFrame containing the price data
            train_split: Proportion of data to use for training
            val_split: Proportion of data to use for validation
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training history
        """
        self.logger.info(f"Training {self.model_type} model")
        
        # Preprocess data
        if self.model_type == "prophet":
            # Prophet requires a specific format
            train_data, test_data = self.data_processor.preprocess_data(data)
            
            # Train the model
            history = self.model.train(train_data, **kwargs)
        else:
            # For other models, use the standard preprocessing
            processed_data = self.data_processor.prepare_data_for_model(
                data, normalize=True, add_indicators=True
            )
            
            # Train the model
            history = self.model.train(
                processed_data["X_train"],
                processed_data["y_train"],
                processed_data["X_val"],
                processed_data["y_val"],
                **kwargs
            )
        
        self.logger.info(f"{self.model_type} model trained successfully")
        return history
    
    def predict(
        self,
        data: pd.DataFrame,
        return_confidence: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make predictions using the trained model.
        
        Args:
            data: DataFrame containing the price data
            return_confidence: Whether to return confidence intervals
            **kwargs: Additional prediction parameters
            
        Returns:
            Dictionary containing predictions and metadata
        """
        self.logger.info(f"Making predictions with {self.model_type} model")
        
        if not self.model.is_trained:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Preprocess data
        if self.model_type == "prophet":
            # For Prophet, we don't need to preprocess the data
            # Just make predictions for the future
            forecast = self.model.predict(
                periods=self.prediction_horizon,
                include_history=False,
                **kwargs
            )
            
            # Extract predictions
            dates = forecast["ds"].dt.strftime("%Y-%m-%d").tolist()
            predictions = forecast["yhat"].tolist()
            
            # Extract confidence intervals if requested
            if return_confidence:
                lower_bound = forecast["yhat_lower"].tolist()
                upper_bound = forecast["yhat_upper"].tolist()
        else:
            # For other models, preprocess the data
            X = self.data_processor.prepare_prediction_data(data)
            
            # Make predictions
            raw_predictions = self.model.predict(X)
            
            # Denormalize predictions
            predictions = self.data_processor.inverse_transform_predictions(raw_predictions)
            
            # Generate dates for predictions
            last_date = data.index[-1] if isinstance(data.index, pd.DatetimeIndex) else pd.to_datetime(data["date"].iloc[-1])
            dates = [(last_date + pd.Timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(self.prediction_horizon)]
            
            # Generate confidence intervals if requested
            if return_confidence:
                # Simple confidence intervals based on historical volatility
                std_dev = data["close"].pct_change().std()
                lower_bound = [p * (1 - 1.96 * std_dev) for p in predictions]
                upper_bound = [p * (1 + 1.96 * std_dev) for p in predictions]
        
        # Prepare response
        result = {
            "symbol": data["symbol"].iloc[0] if "symbol" in data.columns else "Unknown",
            "generated_at": datetime.datetime.now().isoformat(),
            "model_type": self.model_type,
            "model_version": self.model.model_version,
            "predictions": [
                {
                    "date": date,
                    "predicted_price": float(price)
                }
                for date, price in zip(dates, predictions)
            ]
        }
        
        # Add confidence intervals if requested
        if return_confidence:
            for i, pred in enumerate(result["predictions"]):
                pred["lower_bound"] = float(lower_bound[i])
                pred["upper_bound"] = float(upper_bound[i])
                pred["confidence"] = 0.95  # 95% confidence interval
        
        self.logger.info(f"Generated {len(result['predictions'])} predictions")
        return result
    
    def evaluate(
        self,
        data: pd.DataFrame,
        **kwargs
    ) -> Dict[str, float]:
        """
        Evaluate the model on the given data.
        
        Args:
            data: DataFrame containing the price data
            **kwargs: Additional evaluation parameters
            
        Returns:
            Dictionary of evaluation metrics
        """
        self.logger.info(f"Evaluating {self.model_type} model")
        
        if not self.model.is_trained:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Preprocess data
        if self.model_type == "prophet":
            # For Prophet, prepare data in the required format
            _, test_data = self.data_processor.preprocess_data(data)
            
            # Evaluate the model
            metrics = self.model.evaluate(test_data, **kwargs)
        else:
            # For other models, use the standard preprocessing
            processed_data = self.data_processor.prepare_data_for_model(
                data, normalize=True, add_indicators=True
            )
            
            # Evaluate the model
            metrics = self.model.evaluate(
                processed_data["X_test"],
                processed_data["y_test"],
                **kwargs
            )
        
        self.logger.info(f"Evaluation metrics: {metrics}")
        return metrics
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save the model to disk.
        
        Args:
            path: Path to save the model (if None, use default path)
            
        Returns:
            Path where the model was saved
        """
        save_path = path or os.path.join(self.models_dir, self.model_type)
        return self.model.save_model(save_path)
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the model from disk.
        
        Args:
            path: Path to load the model from (if None, use default path)
        """
        load_path = path or os.path.join(self.models_dir, self.model_type)
        self.model.load_model(load_path)
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dictionary containing model information
        """
        return {
            "model_type": self.model_type,
            "model_version": self.model.model_version,
            "input_window_size": self.input_window_size,
            "prediction_horizon": self.prediction_horizon,
            "features": self.features,
            "is_trained": self.model.is_trained,
            "performance_metrics": self.model.metadata.get("performance_metrics", {}),
            "last_updated": self.model.metadata.get("updated_at")
        }