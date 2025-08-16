"""
Data processing utilities for price prediction models.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Union
import logging
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import ta  # Technical Analysis library
import sys
import os

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.price_prediction.config.config import DATA_CONFIG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("data_processor")

class DataProcessor:
    """
    Class for processing financial data for ML models.
    """
    def __init__(
        self,
        sequence_length: int = DATA_CONFIG["sequence_length"],
        features: List[str] = None,
        target: str = DATA_CONFIG["target"],
        technical_indicators: List[str] = None,
        scaler_type: str = "minmax"
    ):
        """
        Initialize the data processor.
        
        Args:
            sequence_length: Number of time steps to use for prediction
            features: List of features to use
            target: Target variable to predict
            technical_indicators: List of technical indicators to calculate
            scaler_type: Type of scaler to use ('minmax' or 'standard')
        """
        self.sequence_length = sequence_length
        self.features = features or DATA_CONFIG["features"]
        self.target = target
        self.technical_indicators = technical_indicators or DATA_CONFIG["technical_indicators"]
        self.scaler_type = scaler_type
        
        # Initialize scalers
        self.feature_scaler = MinMaxScaler() if scaler_type == "minmax" else StandardScaler()
        self.target_scaler = MinMaxScaler() if scaler_type == "minmax" else StandardScaler()
        
        self.logger = logger
    
    def add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators to the dataframe.
        
        Args:
            df: DataFrame containing price data
            
        Returns:
            DataFrame with technical indicators added
        """
        # Make a copy to avoid modifying the original
        df_with_indicators = df.copy()
        
        # Add Simple Moving Averages
        if "sma_5" in self.technical_indicators:
            df_with_indicators["sma_5"] = ta.trend.sma_indicator(df["close"], window=5)
        
        if "sma_20" in self.technical_indicators:
            df_with_indicators["sma_20"] = ta.trend.sma_indicator(df["close"], window=20)
        
        # Add Exponential Moving Averages
        if "ema_5" in self.technical_indicators:
            df_with_indicators["ema_5"] = ta.trend.ema_indicator(df["close"], window=5)
        
        if "ema_20" in self.technical_indicators:
            df_with_indicators["ema_20"] = ta.trend.ema_indicator(df["close"], window=20)
        
        # Add RSI
        if "rsi_14" in self.technical_indicators:
            df_with_indicators["rsi_14"] = ta.momentum.rsi(df["close"], window=14)
        
        # Add MACD
        if "macd" in self.technical_indicators:
            macd = ta.trend.macd(df["close"])
            df_with_indicators["macd"] = macd
        
        # Add Bollinger Bands
        if "bollinger_upper" in self.technical_indicators or "bollinger_lower" in self.technical_indicators:
            bollinger = ta.volatility.BollingerBands(df["close"])
            if "bollinger_upper" in self.technical_indicators:
                df_with_indicators["bollinger_upper"] = bollinger.bollinger_hband()
            if "bollinger_lower" in self.technical_indicators:
                df_with_indicators["bollinger_lower"] = bollinger.bollinger_lband()
        
        # Drop NaN values that may have been introduced by indicators
        df_with_indicators = df_with_indicators.dropna()
        
        return df_with_indicators
    
    def create_sequences(
        self,
        data: pd.DataFrame,
        target_column: str = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for time series prediction.
        
        Args:
            data: DataFrame containing features and target
            target_column: Name of the target column (if None, use self.target)
            
        Returns:
            Tuple of (X, y) where X is the input sequences and y is the target values
        """
        target_col = target_column or self.target
        
        # Get all feature columns
        feature_cols = self.features.copy()
        if self.technical_indicators:
            feature_cols.extend([col for col in data.columns if col in self.technical_indicators])
        
        # Ensure all required columns are present
        for col in feature_cols + [target_col]:
            if col not in data.columns:
                raise ValueError(f"Column {col} not found in data")
        
        # Extract features and target
        features_data = data[feature_cols].values
        target_data = data[target_col].values.reshape(-1, 1)
        
        # Scale the data
        scaled_features = self.feature_scaler.fit_transform(features_data)
        scaled_target = self.target_scaler.fit_transform(target_data)
        
        # Create sequences
        X, y = [], []
        for i in range(len(scaled_features) - self.sequence_length):
            X.append(scaled_features[i:i+self.sequence_length])
            y.append(scaled_target[i+self.sequence_length])
        
        return np.array(X), np.array(y)
    
    def preprocess_data(
        self,
        df: pd.DataFrame,
        train_split: float = 0.7,
        val_split: float = 0.15,
        test_split: float = 0.15,
        shuffle: bool = False
    ) -> Dict[str, Union[np.ndarray, MinMaxScaler, StandardScaler]]:
        """
        Preprocess data for training and testing.
        
        Args:
            df: DataFrame containing price data
            train_split: Percentage of data for training
            val_split: Percentage of data for validation
            test_split: Percentage of data for testing
            shuffle: Whether to shuffle the data
            
        Returns:
            Dictionary containing preprocessed data and scalers
        """
        # Validate split percentages
        if abs(train_split + val_split + test_split - 1.0) > 1e-10:
            raise ValueError("Split percentages must sum to 1.0")
        
        # Add technical indicators
        df_processed = self.add_technical_indicators(df)
        
        # Create sequences
        X, y = self.create_sequences(df_processed)
        
        # Split the data
        n_samples = len(X)
        train_end = int(n_samples * train_split)
        val_end = train_end + int(n_samples * val_split)
        
        if shuffle:
            # Create a random permutation of indices
            indices = np.random.permutation(n_samples)
            X = X[indices]
            y = y[indices]
        
        X_train, y_train = X[:train_end], y[:train_end]
        X_val, y_val = X[train_end:val_end], y[train_end:val_end]
        X_test, y_test = X[val_end:], y[val_end:]
        
        return {
            "X_train": X_train,
            "y_train": y_train,
            "X_val": X_val,
            "y_val": y_val,
            "X_test": X_test,
            "y_test": y_test,
            "feature_scaler": self.feature_scaler,
            "target_scaler": self.target_scaler,
            "sequence_length": self.sequence_length,
            "features": self.features,
            "technical_indicators": self.technical_indicators,
            "target": self.target
        }
    
    def inverse_transform_predictions(self, predictions: np.ndarray) -> np.ndarray:
        """
        Inverse transform scaled predictions back to original scale.
        
        Args:
            predictions: Scaled predictions
            
        Returns:
            Predictions in original scale
        """
        # Reshape if needed
        if len(predictions.shape) == 1:
            predictions = predictions.reshape(-1, 1)
        
        return self.target_scaler.inverse_transform(predictions)
    
    def prepare_prediction_data(
        self,
        df: pd.DataFrame,
        sequence_length: Optional[int] = None
    ) -> np.ndarray:
        """
        Prepare data for making predictions.
        
        Args:
            df: DataFrame containing price data
            sequence_length: Number of time steps to use (if None, use self.sequence_length)
            
        Returns:
            Preprocessed data ready for prediction
        """
        seq_len = sequence_length or self.sequence_length
        
        # Add technical indicators
        df_processed = self.add_technical_indicators(df)
        
        # Extract features
        feature_cols = self.features.copy()
        if self.technical_indicators:
            feature_cols.extend([col for col in df_processed.columns if col in self.technical_indicators])
        
        # Ensure all required columns are present
        for col in feature_cols:
            if col not in df_processed.columns:
                raise ValueError(f"Column {col} not found in data")
        
        # Extract and scale features
        features_data = df_processed[feature_cols].values
        scaled_features = self.feature_scaler.transform(features_data)
        
        # Use the last sequence_length data points
        if len(scaled_features) < seq_len:
            raise ValueError(f"Not enough data points. Need at least {seq_len}, got {len(scaled_features)}")
        
        # Get the most recent sequence
        recent_sequence = scaled_features[-seq_len:].reshape(1, seq_len, -1)
        
        return recent_sequence