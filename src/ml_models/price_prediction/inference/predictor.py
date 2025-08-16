"""
Predictor service for stock price prediction.
This module provides a high-level interface for making predictions using the trained models.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union
import os
import json
import datetime
import logging
import sys
from pathlib import Path

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
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
    Service for making stock price predictions using trained models.
    """
    def __init__(
        self,
        model_type: str = "ensemble",
        models_dir: str = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the price predictor.
        
        Args:
            model_type: Type of model to use ('lstm', 'transformer', 'prophet', or 'ensemble')
            models_dir: Directory containing trained models
            config: Configuration dictionary
        """
        self.model_type = model_type
        self.config = config or get_config(model_type)
        
        # Set models directory
        if models_dir is None:
            # Default to models directory in the package
            self.models_dir = Path(__file__).parent.parent / "models"
        else:
            self.models_dir = Path(models_dir)
        
        # Create models directory if it doesn't exist
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize data processor
        self.data_processor = DataProcessor()
        
        # Initialize model
        self.model = self._initialize_model()
        
        # Try to load a trained model
        self._load_model()
        
        self.logger = logger
    
    def _initialize_model(self) -> Union[LSTMPriceModel, TransformerPriceModel, ProphetPriceModel, EnsemblePriceModel]:
        """
        Initialize the appropriate model based on model_type.
        
        Returns:
            Initialized model instance
        """
        model_config = self.config["model"]
        data_config = self.config["data"]
        
        # Get common parameters
        input_window_size = data_config.get("sequence_length", 20)
        prediction_horizon = data_config.get("prediction_days", 30)
        features = data_config.get("features", ["close", "volume", "open", "high", "low"])
        
        # Initialize the appropriate model
        if self.model_type == "lstm":
            model_path = str(self.models_dir / "lstm_model")
            return LSTMPriceModel(
                input_window_size=input_window_size,
                prediction_horizon=prediction_horizon,
                features=features,
                model_path=model_path,
                config=model_config
            )
        elif self.model_type == "transformer":
            model_path = str(self.models_dir / "transformer_model")
            return TransformerPriceModel(
                input_window_size=input_window_size,
                prediction_horizon=prediction_horizon,
                features=features,
                model_path=model_path,
                config=model_config
            )
        elif self.model_type == "prophet":
            model_path = str(self.models_dir / "prophet_model")
            return ProphetPriceModel(
                input_window_size=input_window_size,
                prediction_horizon=prediction_horizon,
                features=features,
                model_path=model_path,
                config=model_config
            )
        elif self.model_type == "ensemble":
            model_path = str(self.models_dir / "ensemble_model")
            return EnsemblePriceModel(
                input_window_size=input_window_size,
                prediction_horizon=prediction_horizon,
                features=features,
                model_path=model_path,
                config=model_config
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    def _load_model(self) -> None:
        """
        Load a trained model if available.
        """
        try:
            if self.model_type == "lstm":
                model_path = str(self.models_dir / "lstm_model")
                self.model.load_model(model_path)
            elif self.model_type == "transformer":
                model_path = str(self.models_dir / "transformer_model")
                self.model.load_model(model_path)
            elif self.model_type == "prophet":
                model_path = str(self.models_dir / "prophet_model")
                self.model.load_model(model_path)
            elif self.model_type == "ensemble":
                model_path = str(self.models_dir / "ensemble_model")
                self.model.load_model(model_path)
            
            self.logger.info(f"Loaded trained {self.model_type} model")
        except Exception as e:
            self.logger.warning(f"Could not load trained model: {str(e)}")
            self.logger.info("Using untrained model - training required before prediction")
    
    def train(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the model on historical data for the given symbol.
        
        Args:
            symbol: Stock symbol
            start_date: Start date for training data (format: YYYY-MM-DD)
            end_date: End date for training data (format: YYYY-MM-DD)
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training results
        """
        self.logger.info(f"Training {self.model_type} model for {symbol}")
        
        # Load and prepare data
        data = self.data_processor.prepare_data_for_model(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            normalize=True,
            add_indicators=True
        )
        
        # Train the model
        if self.model_type == "prophet":
            # Prophet requires a specific data format
            prophet_df = pd.DataFrame()
            prophet_df['ds'] = data['original_data'].index
            prophet_df['y'] = data['original_data'][data['target_column']]
            
            training_results = self.model.train(prophet_df, **kwargs)
        else:
            # LSTM, Transformer, and Ensemble use the same interface
            training_results = self.model.train(
                data['X_train'], data['y_train'],
                data['X_val'], data['y_val'],
                **kwargs
            )
        
        # Save the trained model
        self.model.save_model()
        
        self.logger.info(f"Model training completed for {symbol}")
        return {
            "symbol": symbol,
            "model_type": self.model_type,
            "training_date": datetime.datetime.now().isoformat(),
            "results": training_results
        }
    
    def predict(
        self,
        symbol: str,
        days: int = None,
        include_history: bool = False,
        return_confidence: bool = True
    ) -> Dict[str, Any]:
        """
        Make price predictions for the given symbol.
        
        Args:
            symbol: Stock symbol
            days: Number of days to predict (if None, use model's prediction_horizon)
            include_history: Whether to include historical data in the response
            return_confidence: Whether to include confidence intervals
            
        Returns:
            Dictionary containing predictions
        """
        if not self.model.is_trained:
            raise ValueError("Model is not trained. Call train() first.")
        
        # Set default prediction horizon
        if days is None:
            days = self.model.prediction_horizon
        
        self.logger.info(f"Making {days}-day predictions for {symbol} using {self.model_type} model")
        
        # Load recent data for the symbol
        data = self.data_processor.prepare_data_for_model(
            symbol=symbol,
            normalize=True,
            add_indicators=True
        )
        
        # Make predictions
        if self.model_type == "prophet":
            # Prophet has a different prediction interface
            forecast = self.model.predict(periods=days)
            
            # Extract predictions
            predictions = []
            today = datetime.datetime.now().date()
            
            for i in range(days):
                date = today + datetime.timedelta(days=i+1)
                idx = forecast[forecast['ds'].dt.date == date].index
                
                if len(idx) > 0:
                    pred_row = forecast.iloc[idx[0]]
                    predictions.append({
                        "date": date.isoformat(),
                        "predicted_price": float(pred_row['yhat']),
                        "lower_bound": float(pred_row['yhat_lower']) if return_confidence else None,
                        "upper_bound": float(pred_row['yhat_upper']) if return_confidence else None,
                        "confidence": 0.95 if return_confidence else None
                    })
        else:
            # LSTM, Transformer, and Ensemble
            # Get the most recent data window for prediction
            X_recent = data['X_test'][-1:] if len(data['X_test']) > 0 else data['X_val'][-1:]
            
            # Make predictions
            raw_predictions = self.model.predict(X_recent)
            
            # Denormalize predictions if needed
            if hasattr(self.data_processor, 'denormalize') and data.get('scaler_params'):
                # Create a DataFrame with the predictions
                pred_df = pd.DataFrame(raw_predictions, columns=[f'pred_{i}' for i in range(raw_predictions.shape[1])])
                # Denormalize
                denorm_preds = self.data_processor.denormalize(
                    pred_df,
                    data['scaler_params'],
                    columns=pred_df.columns,
                    method='minmax'
                )
                raw_predictions = denorm_preds.values
            
            # Format predictions
            predictions = []
            today = datetime.datetime.now().date()
            
            for i in range(min(days, raw_predictions.shape[1])):
                date = today + datetime.timedelta(days=i+1)
                pred_value = float(raw_predictions[0, i])
                
                # Add confidence intervals if requested
                if return_confidence:
                    # Simple confidence interval based on historical volatility
                    std_dev = data['original_data'][data['target_column']].std()
                    confidence_factor = 1.96  # 95% confidence
                    
                    predictions.append({
                        "date": date.isoformat(),
                        "predicted_price": pred_value,
                        "lower_bound": pred_value - confidence_factor * std_dev,
                        "upper_bound": pred_value + confidence_factor * std_dev,
                        "confidence": 0.95
                    })
                else:
                    predictions.append({
                        "date": date.isoformat(),
                        "predicted_price": pred_value,
                        "lower_bound": None,
                        "upper_bound": None,
                        "confidence": None
                    })
        
        # Include historical data if requested
        history = []
        if include_history:
            hist_data = data['original_data'].tail(30).copy()
            hist_data.index = hist_data.index.astype(str)
            
            for date, row in hist_data.iterrows():
                history.append({
                    "date": date,
                    "price": float(row[data['target_column']])
                })
        
        # Get model info
        model_info = self.model.get_model_info()
        
        return {
            "symbol": symbol,
            "generated_at": datetime.datetime.now().isoformat(),
            "model_type": self.model_type,
            "model_version": model_info.get("model_version", "1.0.0"),
            "predictions": predictions,
            "history": history if include_history else None
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dictionary containing model information
        """
        model_info = self.model.get_model_info()
        
        return {
            "model_type": self.model_type,
            "is_trained": self.model.is_trained,
            "info": model_info
        }
    
    def evaluate(
        self,
        symbol: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate the model on historical data for the given symbol.
        
        Args:
            symbol: Stock symbol
            start_date: Start date for evaluation data (format: YYYY-MM-DD)
            end_date: End date for evaluation data (format: YYYY-MM-DD)
            
        Returns:
            Dictionary containing evaluation metrics
        """
        if not self.model.is_trained:
            raise ValueError("Model is not trained. Call train() first.")
        
        self.logger.info(f"Evaluating {self.model_type} model for {symbol}")
        
        # Load and prepare data
        data = self.data_processor.prepare_data_for_model(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            normalize=True,
            add_indicators=True
        )
        
        # Evaluate the model
        if self.model_type == "prophet":
            # Prophet requires a specific data format
            prophet_df = pd.DataFrame()
            prophet_df['ds'] = data['original_data'].index
            prophet_df['y'] = data['original_data'][data['target_column']]
            
            metrics = self.model.evaluate(prophet_df)
        else:
            # LSTM, Transformer, and Ensemble use the same interface
            metrics = self.model.evaluate(data['X_test'], data['y_test'])
        
        return {
            "symbol": symbol,
            "model_type": self.model_type,
            "evaluation_date": datetime.datetime.now().isoformat(),
            "metrics": metrics
        }