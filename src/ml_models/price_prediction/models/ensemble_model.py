"""
Ensemble model for stock price prediction.
Combines predictions from multiple models.
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
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.price_prediction.models.base_model import BasePriceModel
from src.ml_models.price_prediction.models.lstm_model import LSTMPriceModel
from src.ml_models.price_prediction.models.transformer_model import TransformerPriceModel
from src.ml_models.price_prediction.models.prophet_model import ProphetPriceModel
from src.ml_models.price_prediction.config.config import ENSEMBLE_CONFIG, get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ensemble_model")

class EnsemblePriceModel(BasePriceModel):
    """
    Ensemble model for stock price prediction.
    Combines predictions from multiple models.
    """
    def __init__(
        self,
        model_name: str = "ensemble_price_model",
        model_version: str = "1.0.0",
        input_window_size: int = 20,
        prediction_horizon: int = 30,
        features: List[str] = None,
        model_path: str = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the Ensemble price prediction model.
        
        Args:
            model_name: Name of the model
            model_version: Version of the model
            input_window_size: Number of past days to use for prediction
            prediction_horizon: Number of days to predict into the future
            features: List of features to use for prediction
            model_path: Path to save/load the model
            config: Model configuration
        """
        super().__init__(
            model_name=model_name,
            model_version=model_version,
            input_window_size=input_window_size,
            prediction_horizon=prediction_horizon,
            features=features,
            model_path=model_path
        )
        
        # Get configuration
        self.config = config or get_config("ensemble")["model"]
        self.logger = logger
        
        # Initialize component models
        self.models = {}
        self.weights = self.config.get("weights", {
            "lstm": 0.4,
            "transformer": 0.4,
            "prophet": 0.2
        })
        
        # Build the model
        self.build_model()
        
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Preprocess the input data for all component models.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            Tuple of (X, y) where X and y are dictionaries with model-specific data
        """
        # This is a simplified version - in a real implementation, you would use the DataProcessor
        X_dict = {}
        y_dict = {}
        
        # Process data for each model
        for model_name in self.models:
            if model_name == "prophet":
                # Prophet requires a specific format
                prophet_df = pd.DataFrame()
                prophet_df['ds'] = data.index if data.index.name == 'date' else data['date']
                prophet_df['y'] = data[self.features[0]]  # Usually 'close'
                X_dict[model_name] = prophet_df
                y_dict[model_name] = None
            else:
                # For LSTM and Transformer, use their preprocess_data methods
                X, y = self.models[model_name].preprocess_data(data)
                X_dict[model_name] = X
                y_dict[model_name] = y
        
        return X_dict, y_dict
    
    def build_model(self) -> Dict[str, BasePriceModel]:
        """
        Build all component models.
        
        Returns:
            Dictionary of component models
        """
        # Get the list of models to include
        model_names = self.config.get("models", ["lstm", "transformer", "prophet"])
        
        # Initialize each model
        for model_name in model_names:
            if model_name == "lstm":
                self.models[model_name] = LSTMPriceModel(
                    input_window_size=self.input_window_size,
                    prediction_horizon=self.prediction_horizon,
                    features=self.features,
                    model_path=os.path.join(os.path.dirname(self.model_path), "lstm")
                )
            elif model_name == "transformer":
                self.models[model_name] = TransformerPriceModel(
                    input_window_size=self.input_window_size,
                    prediction_horizon=self.prediction_horizon,
                    features=self.features,
                    model_path=os.path.join(os.path.dirname(self.model_path), "transformer")
                )
            elif model_name == "prophet":
                self.models[model_name] = ProphetPriceModel(
                    input_window_size=self.input_window_size,
                    prediction_horizon=self.prediction_horizon,
                    features=self.features,
                    model_path=os.path.join(os.path.dirname(self.model_path), "prophet")
                )
        
        self.logger.info(f"Ensemble model built with {len(self.models)} component models: {', '.join(self.models.keys())}")
        return self.models
    
    def train(
        self,
        X_train: Union[np.ndarray, pd.DataFrame, Dict[str, Any]],
        y_train: Union[np.ndarray, pd.DataFrame, Dict[str, Any], None] = None,
        X_val: Optional[Union[np.ndarray, pd.DataFrame, Dict[str, Any]]] = None,
        y_val: Optional[Union[np.ndarray, pd.DataFrame, Dict[str, Any]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train all component models.
        
        Args:
            X_train: Training features (can be model-specific dictionary)
            y_train: Training targets (can be model-specific dictionary)
            X_val: Validation features (can be model-specific dictionary)
            y_val: Validation targets (can be model-specific dictionary)
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training history for all models
        """
        training_history = {}
        
        # Check if X_train is already a dictionary of model-specific data
        if not isinstance(X_train, dict):
            # If not, preprocess the data for each model
            X_dict, y_dict = self.preprocess_data(X_train)
        else:
            X_dict, y_dict = X_train, y_train
        
        # Train each model
        for model_name, model in self.models.items():
            self.logger.info(f"Training {model_name} model")
            
            # Get model-specific data
            X = X_dict.get(model_name)
            y = y_dict.get(model_name)
            
            # Train the model
            if model_name == "prophet":
                # Prophet uses a different training interface
                history = model.train(X, **kwargs)
            else:
                # LSTM and Transformer use the same interface
                X_val_model = X_val.get(model_name) if isinstance(X_val, dict) else X_val
                y_val_model = y_val.get(model_name) if isinstance(y_val, dict) else y_val
                history = model.train(X, y, X_val_model, y_val_model, **kwargs)
            
            training_history[model_name] = history
        
        # Update metadata
        self.is_trained = True
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        self.metadata["component_models"] = list(self.models.keys())
        self.metadata["weights"] = self.weights
        
        self.training_history = training_history
        
        self.logger.info("All component models trained successfully")
        return training_history
    
    def predict(
        self,
        X: Union[np.ndarray, pd.DataFrame, Dict[str, Any]],
        return_components: bool = False
    ) -> Union[np.ndarray, Dict[str, np.ndarray]]:
        """
        Make predictions using the ensemble of models.
        
        Args:
            X: Input features (can be model-specific dictionary)
            return_components: Whether to return individual model predictions
            
        Returns:
            Array of ensemble predictions or dictionary of all predictions
        """
        if not self.is_trained:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Check if X is already a dictionary of model-specific data
        if not isinstance(X, dict):
            # If not, preprocess the data for each model
            X_dict, _ = self.preprocess_data(X)
        else:
            X_dict = X
        
        # Get predictions from each model
        predictions = {}
        for model_name, model in self.models.items():
            # Get model-specific data
            X_model = X_dict.get(model_name)
            
            # Make predictions
            if X_model is not None:
                pred = model.predict(X_model)
                
                # Ensure predictions are in the right format
                if isinstance(pred, pd.DataFrame):
                    # For Prophet, extract the 'yhat' column
                    pred = pred['yhat'].values
                
                predictions[model_name] = pred
        
        # Combine predictions using weights
        ensemble_pred = np.zeros_like(list(predictions.values())[0])
        total_weight = 0
        
        for model_name, pred in predictions.items():
            weight = self.weights.get(model_name, 1.0)
            ensemble_pred += weight * pred
            total_weight += weight
        
        # Normalize by total weight
        if total_weight > 0:
            ensemble_pred /= total_weight
        
        if return_components:
            # Return both ensemble and individual predictions
            return {
                "ensemble": ensemble_pred,
                **predictions
            }
        else:
            # Return only ensemble predictions
            return ensemble_pred
    
    def evaluate(
        self,
        X_test: Union[np.ndarray, pd.DataFrame, Dict[str, Any]],
        y_test: Union[np.ndarray, pd.DataFrame, Dict[str, Any], None] = None,
        return_components: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluate the ensemble model on test data.
        
        Args:
            X_test: Test features (can be model-specific dictionary)
            y_test: Test targets (can be model-specific dictionary)
            return_components: Whether to return individual model metrics
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Make predictions
        predictions = self.predict(X_test, return_components=True)
        
        # Extract ensemble predictions
        ensemble_pred = predictions["ensemble"]
        
        # Prepare actual values
        if isinstance(y_test, dict):
            # If y_test is a dictionary, use the first available target
            for model_name in self.models:
                if model_name in y_test and y_test[model_name] is not None:
                    actual = y_test[model_name]
                    break
        else:
            actual = y_test
        
        # Calculate metrics for ensemble
        mse = np.mean((actual - ensemble_pred) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(actual - ensemble_pred))
        mape = np.mean(np.abs((actual - ensemble_pred) / actual)) * 100
        
        ensemble_metrics = {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "mape": float(mape)
        }
        
        # Update metadata
        self.metadata["performance_metrics"] = ensemble_metrics
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        
        if return_components:
            # Calculate metrics for each component model
            component_metrics = {}
            for model_name in self.models:
                if model_name in predictions:
                    pred = predictions[model_name]
                    
                    model_mse = np.mean((actual - pred) ** 2)
                    model_rmse = np.sqrt(model_mse)
                    model_mae = np.mean(np.abs(actual - pred))
                    model_mape = np.mean(np.abs((actual - pred) / actual)) * 100
                    
                    component_metrics[model_name] = {
                        "mse": float(model_mse),
                        "rmse": float(model_rmse),
                        "mae": float(model_mae),
                        "mape": float(model_mape)
                    }
            
            return {
                "ensemble": ensemble_metrics,
                "components": component_metrics
            }
        else:
            return ensemble_metrics
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save the ensemble model and all component models to disk.
        
        Args:
            path: Path to save the model (if None, use self.model_path)
            
        Returns:
            Path where the model was saved
        """
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save component models
        for model_name, model in self.models.items():
            model_path = os.path.join(os.path.dirname(save_path), model_name)
            model.save_model(model_path)
        
        # Save ensemble configuration
        config_file = f"{save_path}_config.json"
        with open(config_file, 'w') as f:
            json.dump({
                "models": list(self.models.keys()),
                "weights": self.weights
            }, f, indent=2)
        
        # Save metadata using the parent class method
        super().save_model(save_path)
        
        self.logger.info(f"Ensemble model saved to {save_path}")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the ensemble model and all component models from disk.
        
        Args:
            path: Path to load the model from (if None, use self.model_path)
        """
        load_path = path or self.model_path
        
        try:
            # Load ensemble configuration
            config_file = f"{load_path}_config.json"
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            # Update weights
            self.weights = config.get("weights", self.weights)
            
            # Load component models
            for model_name in config.get("models", []):
                model_path = os.path.join(os.path.dirname(load_path), model_name)
                
                if model_name == "lstm":
                    self.models[model_name] = LSTMPriceModel(
                        input_window_size=self.input_window_size,
                        prediction_horizon=self.prediction_horizon,
                        features=self.features,
                        model_path=model_path
                    )
                elif model_name == "transformer":
                    self.models[model_name] = TransformerPriceModel(
                        input_window_size=self.input_window_size,
                        prediction_horizon=self.prediction_horizon,
                        features=self.features,
                        model_path=model_path
                    )
                elif model_name == "prophet":
                    self.models[model_name] = ProphetPriceModel(
                        input_window_size=self.input_window_size,
                        prediction_horizon=self.prediction_horizon,
                        features=self.features,
                        model_path=model_path
                    )
                
                # Load the model
                self.models[model_name].load_model(model_path)
            
            # Load metadata using the parent class method
            super().load_model(load_path)
            
            self.is_trained = all(model.is_trained for model in self.models.values())
            
            self.logger.info(f"Ensemble model loaded from {load_path} with {len(self.models)} component models")
        except (FileNotFoundError, IOError) as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            raise