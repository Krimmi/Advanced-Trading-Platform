"""
Prophet model for stock price prediction.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
import os
import json
import datetime
import logging
import sys
import pickle

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.price_prediction.models.base_model import BasePriceModel
from src.ml_models.price_prediction.config.config import PROPHET_CONFIG, get_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("prophet_model")

class ProphetPriceModel(BasePriceModel):
    """
    Prophet model for stock price prediction.
    """
    def __init__(
        self,
        model_name: str = "prophet_price_model",
        model_version: str = "1.0.0",
        input_window_size: int = 20,
        prediction_horizon: int = 30,
        features: List[str] = None,
        model_path: str = None,
        config: Dict[str, Any] = None
    ):
        """
        Initialize the Prophet price prediction model.
        
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
            features=features or ["close"],  # Prophet primarily uses the target variable
            model_path=model_path
        )
        
        # Get configuration
        self.config = config or get_config("prophet")["model"]
        self.logger = logger
        
        # Prophet model will be initialized in build_model
        self.model = None
        
    def preprocess_data(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Preprocess the input data for Prophet.
        
        Args:
            data: DataFrame containing the price data
            
        Returns:
            Tuple of (X, y) where X is the input features and y is the target values
            For Prophet, we return a DataFrame in the required format
        """
        # Prophet requires a DataFrame with 'ds' (date) and 'y' (target) columns
        if 'date' not in data.columns and data.index.name != 'date':
            raise ValueError("Data must have a 'date' column or index")
        
        # Create a copy to avoid modifying the original
        df = data.copy()
        
        # If date is the index, reset it to a column
        if df.index.name == 'date':
            df = df.reset_index()
        
        # Rename columns to Prophet's required format
        prophet_df = pd.DataFrame()
        prophet_df['ds'] = pd.to_datetime(df['date'])
        
        # Use the first feature as the target (usually 'close')
        target_col = self.features[0]
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in data")
        
        prophet_df['y'] = df[target_col]
        
        # Add additional regressors if specified
        for feature in self.features[1:]:
            if feature in df.columns:
                prophet_df[feature] = df[feature]
        
        return prophet_df, None  # Prophet doesn't need separate X and y
    
    def build_model(self) -> Any:
        """
        Build the Prophet model.
        
        Returns:
            Prophet model instance
        """
        try:
            from prophet import Prophet
        except ImportError:
            self.logger.error("Prophet package not installed. Install it with 'pip install prophet'")
            raise
        
        # Get configuration parameters
        changepoint_prior_scale = self.config.get("changepoint_prior_scale", 0.05)
        seasonality_prior_scale = self.config.get("seasonality_prior_scale", 10.0)
        seasonality_mode = self.config.get("seasonality_mode", "multiplicative")
        daily_seasonality = self.config.get("daily_seasonality", False)
        weekly_seasonality = self.config.get("weekly_seasonality", True)
        yearly_seasonality = self.config.get("yearly_seasonality", True)
        
        # Create Prophet model
        model = Prophet(
            changepoint_prior_scale=changepoint_prior_scale,
            seasonality_prior_scale=seasonality_prior_scale,
            seasonality_mode=seasonality_mode,
            daily_seasonality=daily_seasonality,
            weekly_seasonality=weekly_seasonality,
            yearly_seasonality=yearly_seasonality
        )
        
        # Add country holidays if specified
        holidays_country = self.config.get("holidays_country")
        if holidays_country:
            model.add_country_holidays(country_name=holidays_country)
        
        self.logger.info("Prophet model built")
        return model
    
    def train(
        self,
        X_train: pd.DataFrame,
        y_train: Optional[pd.DataFrame] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Train the Prophet model on the given data.
        
        Args:
            X_train: Training data in Prophet format (with 'ds' and 'y' columns)
            y_train: Not used for Prophet (included for API compatibility)
            **kwargs: Additional training parameters
            
        Returns:
            Dictionary containing training information
        """
        # Build the model if not already built
        if self.model is None:
            self.model = self.build_model()
        
        # Add additional regressors if present in the data
        for feature in self.features[1:]:
            if feature in X_train.columns:
                self.model.add_regressor(feature)
        
        # Fit the model
        self.logger.info(f"Training Prophet model on {len(X_train)} samples")
        self.model.fit(X_train)
        
        # Update metadata
        self.is_trained = True
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        self.metadata["training_params"] = {
            "samples": len(X_train),
            "changepoint_prior_scale": self.config.get("changepoint_prior_scale", 0.05),
            "seasonality_prior_scale": self.config.get("seasonality_prior_scale", 10.0),
            "seasonality_mode": self.config.get("seasonality_mode", "multiplicative")
        }
        
        # Prophet doesn't provide training history like Keras models
        # We'll return basic information
        self.training_history = {
            "samples": len(X_train),
            "start_date": X_train['ds'].min().strftime("%Y-%m-%d"),
            "end_date": X_train['ds'].max().strftime("%Y-%m-%d")
        }
        
        self.logger.info("Prophet model trained successfully")
        return self.training_history
    
    def predict(self, X: pd.DataFrame = None, periods: int = None) -> pd.DataFrame:
        """
        Make predictions using the trained Prophet model.
        
        Args:
            X: Input features (for Prophet, this can be None)
            periods: Number of periods to forecast (if None, use self.prediction_horizon)
            
        Returns:
            DataFrame with predictions
        """
        if not self.is_trained or self.model is None:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Set default periods if not provided
        if periods is None:
            periods = self.prediction_horizon
        
        # Create future dataframe for prediction
        future = self.model.make_future_dataframe(periods=periods)
        
        # Add additional regressors if provided in X
        if X is not None:
            for feature in self.features[1:]:
                if feature in X.columns:
                    # Merge the regressor values from X into future
                    future = future.merge(X[['ds', feature]], on='ds', how='left')
        
        # Make predictions
        self.logger.info(f"Making predictions for {periods} periods")
        forecast = self.model.predict(future)
        
        return forecast
    
    def evaluate(self, X_test: pd.DataFrame, y_test: Optional[pd.DataFrame] = None) -> Dict[str, float]:
        """
        Evaluate the model on test data.
        
        Args:
            X_test: Test data in Prophet format (with 'ds' and 'y' columns)
            y_test: Not used for Prophet (included for API compatibility)
            
        Returns:
            Dictionary of evaluation metrics
        """
        if not self.is_trained or self.model is None:
            raise ValueError("Model is not trained. Call train() first or load a trained model.")
        
        # Make predictions on test data
        forecast = self.predict(X_test)
        
        # Merge predictions with actual values
        comparison = pd.merge(
            X_test[['ds', 'y']],
            forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']],
            on='ds'
        )
        
        # Calculate metrics
        mse = np.mean((comparison['y'] - comparison['yhat']) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(comparison['y'] - comparison['yhat']))
        mape = np.mean(np.abs((comparison['y'] - comparison['yhat']) / comparison['y'])) * 100
        
        # Calculate coverage of prediction intervals
        in_interval = ((comparison['y'] >= comparison['yhat_lower']) & 
                      (comparison['y'] <= comparison['yhat_upper']))
        coverage = in_interval.mean()
        
        metrics = {
            "mse": float(mse),
            "rmse": float(rmse),
            "mae": float(mae),
            "mape": float(mape),
            "coverage": float(coverage)
        }
        
        # Update metadata
        self.metadata["performance_metrics"] = metrics
        self.metadata["updated_at"] = datetime.datetime.now().isoformat()
        
        return metrics
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save the Prophet model to disk.
        
        Args:
            path: Path to save the model (if None, use self.model_path)
            
        Returns:
            Path where the model was saved
        """
        save_path = path or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save the Prophet model using pickle
        model_file = f"{save_path}.pkl"
        with open(model_file, 'wb') as f:
            pickle.dump(self.model, f)
        
        # Save metadata using the parent class method
        super().save_model(save_path)
        
        self.logger.info(f"Prophet model saved to {model_file}")
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load the Prophet model from disk.
        
        Args:
            path: Path to load the model from (if None, use self.model_path)
        """
        load_path = path or self.model_path
        
        # Load the Prophet model
        model_file = f"{load_path}.pkl"
        try:
            with open(model_file, 'rb') as f:
                self.model = pickle.load(f)
            self.is_trained = True
            
            # Load metadata using the parent class method
            super().load_model(load_path)
            
            self.logger.info(f"Prophet model loaded from {model_file}")
        except (FileNotFoundError, IOError) as e:
            self.logger.error(f"Failed to load model: {str(e)}")
            raise