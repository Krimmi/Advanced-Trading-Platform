"""
Implementation of ML prediction endpoints.
This module provides the actual implementation of the ML prediction API endpoints.
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import logging
import os
import sys
import json
from fastapi import HTTPException

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.price_prediction.predictor import PricePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ml_predictions_api")

# Global cache for predictors
predictors = {}

def get_predictor(model_type: str = "ensemble") -> PricePredictor:
    """
    Get or create a predictor for the specified model type.
    
    Args:
        model_type: Type of model to use
        
    Returns:
        PricePredictor instance
    """
    if model_type not in predictors:
        logger.info(f"Creating new predictor for model type: {model_type}")
        
        # Create predictor
        predictor = PricePredictor(
            model_type=model_type,
            input_window_size=60,  # 60 days of historical data
            prediction_horizon=30,  # Predict 30 days into the future
            models_dir=os.path.join(os.path.dirname(__file__), "../../../../models")
        )
        
        # Try to load a pre-trained model
        try:
            predictor.load_model()
            logger.info(f"Loaded pre-trained {model_type} model")
        except Exception as e:
            logger.warning(f"Could not load pre-trained {model_type} model: {str(e)}")
            logger.info(f"A new {model_type} model will be trained when needed")
        
        predictors[model_type] = predictor
    
    return predictors[model_type]

def load_stock_data(symbol: str, days: int = 365) -> pd.DataFrame:
    """
    Load historical stock data for a given symbol.
    
    Args:
        symbol: Stock symbol
        days: Number of days of historical data to load
        
    Returns:
        DataFrame containing historical stock data
    """
    logger.info(f"Loading historical data for {symbol} (last {days} days)")
    
    # In a real implementation, this would fetch data from an API or database
    # For now, we'll generate mock data
    
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')
    
    # Generate mock data
    np.random.seed(42)  # For reproducibility
    base_price = 100.0
    if symbol == "AAPL":
        base_price = 180.0
    elif symbol == "MSFT":
        base_price = 350.0
    elif symbol == "GOOGL":
        base_price = 140.0
    
    n = len(date_range)
    trend = np.linspace(0, 0.2, n)  # Slight upward trend
    noise = np.random.normal(0, 0.02, n)  # Random noise
    seasonality = 0.05 * np.sin(np.linspace(0, 8 * np.pi, n))  # Seasonal pattern
    
    # Generate price series with trend, seasonality, and noise
    closes = base_price * (1 + trend + noise + seasonality)
    
    # Generate other price components
    opens = closes * np.random.normal(0.998, 0.003, n)
    highs = closes * np.random.normal(1.015, 0.005, n)
    lows = closes * np.random.normal(0.985, 0.005, n)
    volumes = np.random.normal(1000000, 200000, n)
    
    # Create DataFrame
    df = pd.DataFrame({
        'date': date_range,
        'open': opens,
        'high': highs,
        'low': lows,
        'close': closes,
        'volume': volumes,
        'symbol': symbol
    })
    
    df.set_index('date', inplace=True)
    
    logger.info(f"Loaded {len(df)} records for {symbol}")
    return df

async def predict_price(
    symbol: str,
    days: int = 30,
    model_type: str = "ensemble"
) -> Dict[str, Any]:
    """
    Get price predictions for a stock symbol.
    
    Args:
        symbol: Stock symbol
        days: Number of days to predict
        model_type: Type of model to use
        
    Returns:
        Dictionary containing predictions
    """
    try:
        # Validate model type
        valid_model_types = ["lstm", "transformer", "prophet", "ensemble"]
        if model_type not in valid_model_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model type. Must be one of: {', '.join(valid_model_types)}"
            )
        
        # Get predictor
        predictor = get_predictor(model_type)
        
        # Load historical data
        data = load_stock_data(symbol, days=365)  # Load 1 year of historical data
        
        # Check if model is trained
        if not predictor.model.is_trained:
            logger.info(f"Training {model_type} model for {symbol}")
            predictor.train(data)
            
            # Save the trained model
            predictor.save_model()
        
        # Make predictions
        predictions = predictor.predict(
            data,
            return_confidence=True
        )
        
        # Limit predictions to requested number of days
        predictions["predictions"] = predictions["predictions"][:days]
        
        return predictions
    except Exception as e:
        logger.error(f"Error generating predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

async def get_model_info(model_type: str = "ensemble") -> Dict[str, Any]:
    """
    Get information about a prediction model.
    
    Args:
        model_type: Type of model
        
    Returns:
        Dictionary containing model information
    """
    try:
        # Validate model type
        valid_model_types = ["lstm", "transformer", "prophet", "ensemble"]
        if model_type not in valid_model_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model type. Must be one of: {', '.join(valid_model_types)}"
            )
        
        # Get predictor
        predictor = get_predictor(model_type)
        
        # Get model info
        info = predictor.get_model_info()
        
        # Add additional information
        info["available_models"] = list(predictors.keys())
        
        return info
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

async def evaluate_model(
    symbol: str,
    model_type: str = "ensemble",
    days: int = 30
) -> Dict[str, Any]:
    """
    Evaluate a prediction model on historical data.
    
    Args:
        symbol: Stock symbol
        model_type: Type of model to evaluate
        days: Number of days of historical data to use for evaluation
        
    Returns:
        Dictionary containing evaluation metrics
    """
    try:
        # Validate model type
        valid_model_types = ["lstm", "transformer", "prophet", "ensemble"]
        if model_type not in valid_model_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model type. Must be one of: {', '.join(valid_model_types)}"
            )
        
        # Get predictor
        predictor = get_predictor(model_type)
        
        # Load historical data
        data = load_stock_data(symbol, days=days)
        
        # Check if model is trained
        if not predictor.model.is_trained:
            logger.info(f"Training {model_type} model for {symbol}")
            predictor.train(data)
            
            # Save the trained model
            predictor.save_model()
        
        # Evaluate model
        metrics = predictor.evaluate(data)
        
        return {
            "symbol": symbol,
            "model_type": model_type,
            "evaluation_date": datetime.now().isoformat(),
            "metrics": metrics,
            "data_range": {
                "start_date": data.index[0].strftime("%Y-%m-%d"),
                "end_date": data.index[-1].strftime("%Y-%m-%d"),
                "num_samples": len(data)
            }
        }
    except Exception as e:
        logger.error(f"Error evaluating model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error evaluating model: {str(e)}")

async def compare_models(
    symbol: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Compare different prediction models on the same data.
    
    Args:
        symbol: Stock symbol
        days: Number of days of historical data to use for evaluation
        
    Returns:
        Dictionary containing comparison results
    """
    try:
        # Load historical data
        data = load_stock_data(symbol, days=days)
        
        # Compare models
        model_types = ["lstm", "transformer", "prophet", "ensemble"]
        comparison = {}
        
        for model_type in model_types:
            try:
                # Get predictor
                predictor = get_predictor(model_type)
                
                # Check if model is trained
                if not predictor.model.is_trained:
                    logger.info(f"Training {model_type} model for {symbol}")
                    predictor.train(data)
                    
                    # Save the trained model
                    predictor.save_model()
                
                # Evaluate model
                metrics = predictor.evaluate(data)
                
                # Make predictions
                predictions = predictor.predict(data, return_confidence=True)
                
                comparison[model_type] = {
                    "metrics": metrics,
                    "predictions": predictions["predictions"][:5]  # Include first 5 predictions
                }
            except Exception as e:
                logger.error(f"Error with {model_type} model: {str(e)}")
                comparison[model_type] = {"error": str(e)}
        
        return {
            "symbol": symbol,
            "comparison_date": datetime.now().isoformat(),
            "data_range": {
                "start_date": data.index[0].strftime("%Y-%m-%d"),
                "end_date": data.index[-1].strftime("%Y-%m-%d"),
                "num_samples": len(data)
            },
            "models": comparison
        }
    except Exception as e:
        logger.error(f"Error comparing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error comparing models: {str(e)}")