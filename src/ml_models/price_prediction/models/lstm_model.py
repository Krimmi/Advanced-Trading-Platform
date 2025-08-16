"""
LSTM model for stock price prediction.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import os
import json
import datetime
import logging
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import sys

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.price_prediction.models.base_model import BasePriceModel
from src.ml_models.price_prediction.config.config import LSTM_CONFIG, get_config

class LSTMPriceModel(BasePriceModel):
    """
    LSTM model for stock price prediction.
    """
    def __init__(
        self,
        model_name: str = "lstm_price_model",
        model_version: str = "1.0.0",
        input_window_size: int = 20,
        prediction_horizon: int = 30,
        features: List[str] = None,
        model_path: str = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the LSTM price prediction model.
        
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
        self.config = config or get_config("lstm")["model"]
        
        # Build the model
        self.model = self.build_model()
        
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess the input data for training or prediction.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            Tuple of (X, y) where X is the input features and y is the target values
        """
        # This is a simplified version - in a real implementation, you would use the DataProcessor
        from src.ml_models.price_prediction.data.data_processor import DataProcessor
        
        processor = DataProcessor(
            sequence_length=self.input_window_size,
            features=self.features
        )
        
        # Create sequences
        X, y = processor.create_sequences(data)
        
        return X, y
    
    def build_model(self) -> tf.keras.Model:
        """
        Build the LSTM model architecture.
        
        Returns:
            The compiled LSTM model
        """
        # Get the number of features (assuming X is available)
        n_features = len(self.features)
        if hasattr(self, 'X_train') and self.X_train is not None:
            n_features = self.X_train.shape[2]
        
        # Create the model
        model = Sequential()
        
        # Add LSTM layers
        for i, units in enumerate(self.config["layers"]):
            return_sequences = i < len(self.config["layers"]) - 1
            if i == 0:
                model.add(LSTM(
                    units=units,
                    return_sequences=return_sequences,
                    input_shape=(self.input_window_size, n_features)
                ))
            else:
                model.add(LSTM(
                    units=units,
                    return_sequences=return_sequences
                ))
            
            # Add dropout
            model.add(Dropout(self.config["dropout"]))
        
        # Add output layer
        model.add(Dense(1))
        
        # Compile the model
        model.compile(
            optimizer=self.config["optimizer"],
            loss=self.config["loss"],
            metrics=["mae", "mse"]
        )
        
        self.logger.info(f"LSTM model built with {len(self.config['layers'])} layers")
        return model
    
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the model on the given data.
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features
            y_val: Validation targets
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training history
        """
        # Store the data for later use
        self.X_train = X_train
        
        # Set up callbacks
        callbacks = []
        
        # Early stopping
        if self.config.get("early_stopping"):
            early_stopping = EarlyStopping(
                monitor="val_loss" if X_val is not None else "loss",
                patience=self.config["early_stopping"],
                restore_best_weights=True
            )
            callbacks.append(early_stopping)
        
        # Model checkpoint
        if kwargs.get("save_checkpoints", False):
            checkpoint_path = os.path.join(
                os.path.dirname(self.model_path),
                f"{self.model_name}_checkpoint.h5"
            )
            checkpoint = ModelCheckpoint(
                checkpoint_path,
                monitor="val_loss" if X_val is not None else "loss",
                save_best_only=True
            )
            callbacks.append(checkpoint)
        
        # Train the model
        validation_data = (X_val, y_val) if X_val is not None and y_val is not None else None
        
        history = self.model.fit(
            X_train,
            y_train,
            epochs=kwargs.get("epochs", self.config["epochs"]),
            batch_size=kwargs.get("batch_size", self.config["batch_size"]),
            validation_data=validation_data,
            callbacks=callbacks,
            verbose=kwargs.get("verbose", 1)
        )
        
        # Store training history
        self.training_history = {
            "loss": history.history["loss"],
            "val_loss": history.history.get("val_loss", []),
            "mae": history.history["mae"],
            "val_mae": history.history.get("val_mae", []),
            "mse": history.history["mse"],
            "val_mse": history.history.get("val_mse", [])
        }
        
        # Update metadata
        self.is_trained = True
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        self.metadata["training_params"] = {
            "epochs": len(history.history["loss"]),
            "batch_size": kwargs.get("batch_size", self.config["batch_size"]),
            "optimizer": self.config["optimizer"],
            "loss": self.config["loss"]
        }
        
        self.logger.info(f"Model trained for {len(history.history['loss'])} epochs")
        
        return self.training_history
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using the trained model.
        
        Args:
            X: Input features
            
        Returns:
            Array of predictions
        """
        if not self.is_trained and self.model is None:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Make predictions
        predictions = self.model.predict(X)
        
        return predictions
    
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
        
        # Save the Keras model
        model_file = f"{save_path}.h5"
        self.model.save(model_file)
        
        # Save metadata using the parent class method
        super().save_model(save_path)
        
        self.logger.info(f"LSTM model saved to {model_file}")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the model from disk.
        
        Args:
            path: Path to load the model from (if None, use self.model_path)
        """
        load_path = path or self.model_path
        
        # Load the Keras model
        model_file = f"{load_path}.h5"
        try:
            self.model = load_model(model_file)
            self.is_trained = True
            
            # Load metadata using the parent class method
            super().load_model(load_path)
            
            self.logger.info(f"LSTM model loaded from {model_file}")
        except (FileNotFoundError, IOError) as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            raise