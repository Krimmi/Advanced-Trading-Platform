"""
Configuration settings for price prediction models.
"""
from typing import Dict, Any
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Data configuration
DATA_CONFIG = {
    "historical_days": 365,  # Days of historical data to use
    "prediction_days": 30,   # Days to predict into the future
    "train_split": 0.7,      # Percentage of data for training
    "val_split": 0.15,       # Percentage of data for validation
    "test_split": 0.15,      # Percentage of data for testing
    "features": [
        "close",             # Closing price
        "volume",            # Trading volume
        "open",              # Opening price
        "high",              # High price
        "low",               # Low price
    ],
    "technical_indicators": [
        "sma_5",             # 5-day Simple Moving Average
        "sma_20",            # 20-day Simple Moving Average
        "ema_5",             # 5-day Exponential Moving Average
        "ema_20",            # 20-day Exponential Moving Average
        "rsi_14",            # 14-day Relative Strength Index
        "macd",              # Moving Average Convergence Divergence
        "bollinger_upper",   # Upper Bollinger Band
        "bollinger_lower",   # Lower Bollinger Band
    ],
    "target": "close",       # Target variable to predict
    "sequence_length": 20,   # Number of time steps to use for prediction
}

# LSTM model configuration
LSTM_CONFIG = {
    "layers": [64, 32],      # Hidden layer sizes
    "dropout": 0.2,          # Dropout rate
    "learning_rate": 0.001,  # Learning rate
    "batch_size": 32,        # Batch size
    "epochs": 100,           # Maximum epochs
    "early_stopping": 10,    # Early stopping patience
    "optimizer": "adam",     # Optimizer
    "loss": "mse",           # Loss function
}

# Transformer model configuration
TRANSFORMER_CONFIG = {
    "d_model": 64,           # Embedding dimension
    "nhead": 4,              # Number of attention heads
    "num_encoder_layers": 2, # Number of encoder layers
    "num_decoder_layers": 2, # Number of decoder layers
    "dim_feedforward": 128,  # Feedforward network dimension
    "dropout": 0.1,          # Dropout rate
    "learning_rate": 0.0001, # Learning rate
    "batch_size": 32,        # Batch size
    "epochs": 100,           # Maximum epochs
    "early_stopping": 10,    # Early stopping patience
    "optimizer": "adam",     # Optimizer
    "loss": "mse",           # Loss function
}

# Prophet model configuration
PROPHET_CONFIG = {
    "changepoint_prior_scale": 0.05,  # Flexibility of trend
    "seasonality_prior_scale": 10.0,  # Strength of seasonality
    "seasonality_mode": "multiplicative",  # Type of seasonality
    "daily_seasonality": False,       # Daily seasonality
    "weekly_seasonality": True,       # Weekly seasonality
    "yearly_seasonality": True,       # Yearly seasonality
    "holidays_country": "US",         # Country for holidays
}

# Ensemble model configuration
ENSEMBLE_CONFIG = {
    "models": ["lstm", "transformer", "prophet"],  # Models to include
    "weights": {                      # Weights for each model
        "lstm": 0.4,
        "transformer": 0.4,
        "prophet": 0.2,
    },
    "retrain_frequency": "weekly",    # How often to retrain models
}

# Training configuration
TRAINING_CONFIG = {
    "random_seed": 42,               # Random seed for reproducibility
    "gpu_enabled": True,             # Whether to use GPU
    "log_level": "INFO",             # Logging level
    "save_checkpoints": True,        # Whether to save checkpoints
    "checkpoint_frequency": 10,      # How often to save checkpoints (epochs)
    "tensorboard": True,             # Whether to use TensorBoard
    "cross_validation": 5,           # Number of cross-validation folds
}

# Evaluation metrics
EVALUATION_METRICS = [
    "mse",                           # Mean Squared Error
    "rmse",                          # Root Mean Squared Error
    "mae",                           # Mean Absolute Error
    "mape",                          # Mean Absolute Percentage Error
    "r2",                            # R-squared
    "direction_accuracy",            # Direction accuracy
]

# Inference configuration
INFERENCE_CONFIG = {
    "confidence_interval": 0.95,     # Confidence interval for predictions
    "cache_predictions": True,       # Whether to cache predictions
    "cache_ttl": 3600,               # Time-to-live for cached predictions (seconds)
}

# Model registry configuration
MODEL_REGISTRY = {
    "registry_dir": MODELS_DIR / "registry",
    "versioning": True,              # Whether to version models
    "keep_versions": 5,              # Number of versions to keep
    "metadata": True,                # Whether to store metadata
}

# Create a function to get the configuration
def get_config(model_type: str = "ensemble") -> Dict[str, Any]:
    """
    Get the configuration for a specific model type.
    
    Args:
        model_type: Type of model (lstm, transformer, prophet, ensemble)
        
    Returns:
        Dictionary containing configuration for the specified model
    """
    base_config = {
        "data": DATA_CONFIG,
        "training": TRAINING_CONFIG,
        "evaluation": EVALUATION_METRICS,
        "inference": INFERENCE_CONFIG,
        "registry": MODEL_REGISTRY,
    }
    
    if model_type == "lstm":
        base_config["model"] = LSTM_CONFIG
    elif model_type == "transformer":
        base_config["model"] = TRANSFORMER_CONFIG
    elif model_type == "prophet":
        base_config["model"] = PROPHET_CONFIG
    elif model_type == "ensemble":
        base_config["model"] = ENSEMBLE_CONFIG
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    return base_config