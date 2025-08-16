"""
Router for factor model endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
import os
import sys
import pandas as pd

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.factor_models.factor_model_service import FactorModelService

# Configure router
router = APIRouter()

# Global instance of FactorModelService
factor_model_service = FactorModelService(
    models_dir=os.path.join(os.path.dirname(__file__), "../../../../models/factor_models")
)

@router.get("/models")
async def list_factor_models() -> Dict[str, Any]:
    """
    List all available factor models.
    """
    try:
        models = factor_model_service.list_models()
        return {
            "models": models,
            "count": len(models),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing factor models: {str(e)}")

@router.post("/models")
async def create_factor_model(
    model_type: str = Query(..., description="Type of factor model to create (fama_french, apt, custom)"),
    model_name: Optional[str] = Query(None, description="Name of the model (if None, use default name)"),
    num_factors: int = Query(5, description="Number of factors for APT model", ge=1, le=20),
    model_subtype: str = Query("three_factor", description="Subtype for Fama-French model (three_factor or five_factor)")
) -> Dict[str, Any]:
    """
    Create a new factor model.
    """
    try:
        # Validate model type
        if model_type not in ["fama_french", "apt", "custom"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid model type. Must be one of: fama_french, apt, custom"
            )
        
        # Additional parameters based on model type
        kwargs = {}
        if model_type == "fama_french":
            if model_subtype not in ["three_factor", "five_factor"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid model_subtype for Fama-French model. Must be one of: three_factor, five_factor"
                )
            kwargs["model_type"] = model_subtype
        elif model_type == "apt":
            kwargs["num_factors"] = num_factors
        
        # Create the model
        model = factor_model_service.create_model(
            model_type=model_type,
            model_name=model_name,
            **kwargs
        )
        
        return {
            "model_name": model.model_name,
            "model_type": model_type,
            "created_at": datetime.now().isoformat(),
            "model_info": model.get_model_info()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating factor model: {str(e)}")

@router.get("/models/{model_name}")
async def get_factor_model_info(
    model_name: str = Path(..., description="Name of the factor model")
) -> Dict[str, Any]:
    """
    Get information about a specific factor model.
    """
    try:
        model = factor_model_service.get_model(model_name)
        return {
            "model_name": model_name,
            "model_info": model.get_model_info(),
            "generated_at": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@router.delete("/models/{model_name}")
async def delete_factor_model(
    model_name: str = Path(..., description="Name of the factor model")
) -> Dict[str, Any]:
    """
    Delete a factor model.
    """
    try:
        success = factor_model_service.delete_model(model_name)
        if not success:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
        
        return {
            "model_name": model_name,
            "deleted": success,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting model: {str(e)}")

@router.post("/models/{model_name}/train")
async def train_factor_model(
    model_name: str = Path(..., description="Name of the factor model"),
    symbols: List[str] = Query(..., description="List of stock symbols to use for training"),
    lookback_days: int = Query(252, description="Number of days of historical data to use", ge=30, le=1000)
) -> Dict[str, Any]:
    """
    Train a factor model using historical data for the specified symbols.
    """
    try:
        # Get the model
        model = factor_model_service.get_model(model_name)
        
        # Load historical data for the symbols
        # In a real implementation, this would fetch data from an API or database
        # For now, we'll generate mock data
        returns_data = generate_mock_returns_data(symbols, lookback_days)
        
        # Train the model
        results = factor_model_service.train_model(model_name, returns_data)
        
        return {
            "model_name": model_name,
            "training_results": results,
            "symbols_used": symbols,
            "lookback_days": lookback_days,
            "trained_at": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@router.get("/models/{model_name}/factor-exposures")
async def get_factor_exposures(
    model_name: str = Path(..., description="Name of the factor model")
) -> Dict[str, Any]:
    """
    Get factor exposures (betas) for all assets in the model.
    """
    try:
        # Get the model
        model = factor_model_service.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise HTTPException(status_code=400, detail=f"Model {model_name} is not trained")
        
        # Get factor exposures
        exposures = factor_model_service.analyze_factor_exposures(model_name)
        
        # Convert DataFrame to dict for JSON response
        exposures_dict = exposures.to_dict(orient="index")
        
        return {
            "model_name": model_name,
            "factor_exposures": exposures_dict,
            "generated_at": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting factor exposures: {str(e)}")

@router.post("/models/{model_name}/predict")
async def predict_returns(
    model_name: str = Path(..., description="Name of the factor model"),
    symbols: List[str] = Query(None, description="List of stock symbols to predict (if None, use all assets in the model)"),
    days: int = Query(30, description="Number of days to predict", ge=1, le=365)
) -> Dict[str, Any]:
    """
    Predict returns using a factor model.
    """
    try:
        # Get the model
        model = factor_model_service.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise HTTPException(status_code=400, detail=f"Model {model_name} is not trained")
        
        # Generate mock factor data for prediction
        # In a real implementation, this would use actual factor data
        factors_data = generate_mock_factor_data(model.factors, days)
        
        # Make predictions
        predictions = factor_model_service.predict_returns(model_name, factors_data)
        
        # Filter predictions to requested symbols if provided
        if symbols:
            predictions = predictions[symbols]
        
        # Convert DataFrame to dict for JSON response
        predictions_dict = predictions.to_dict(orient="index")
        
        return {
            "model_name": model_name,
            "predictions": predictions_dict,
            "factors_used": model.factors,
            "generated_at": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting returns: {str(e)}")

@router.post("/models/{model_name}/risk-decomposition")
async def analyze_risk_decomposition(
    model_name: str = Path(..., description="Name of the factor model"),
    symbols: List[str] = Query(None, description="List of stock symbols to analyze (if None, use all assets in the model)")
) -> Dict[str, Any]:
    """
    Analyze risk decomposition by factor for the specified symbols.
    """
    try:
        # Get the model
        model = factor_model_service.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise HTTPException(status_code=400, detail=f"Model {model_name} is not trained")
        
        # Generate mock factor data for risk decomposition
        # In a real implementation, this would use actual factor data
        factors_data = generate_mock_factor_data(model.factors, 252)  # Use 1 year of data for risk analysis
        
        # Calculate risk decomposition
        risk_decomposition = factor_model_service.analyze_risk_decomposition(model_name, factors_data)
        
        # Filter to requested symbols if provided
        if symbols:
            risk_decomposition = {symbol: risk_decomposition[symbol] for symbol in symbols if symbol in risk_decomposition}
        
        # Convert DataFrames to dicts for JSON response
        risk_decomposition_dict = {}
        for symbol, df in risk_decomposition.items():
            risk_decomposition_dict[symbol] = df.to_dict(orient="index")
        
        return {
            "model_name": model_name,
            "risk_decomposition": risk_decomposition_dict,
            "generated_at": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing risk decomposition: {str(e)}")

@router.post("/models/{model_name}/factor-contribution")
async def analyze_factor_contribution(
    model_name: str = Path(..., description="Name of the factor model"),
    symbols: List[str] = Query(None, description="List of stock symbols to analyze (if None, use all assets in the model)"),
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365)
) -> Dict[str, Any]:
    """
    Analyze factor contribution to returns for the specified symbols.
    """
    try:
        # Get the model
        model = factor_model_service.get_model(model_name)
        
        # Check if model is trained
        if not model.is_trained:
            raise HTTPException(status_code=400, detail=f"Model {model_name} is not trained")
        
        # Generate mock factor data for contribution analysis
        # In a real implementation, this would use actual factor data
        factors_data = generate_mock_factor_data(model.factors, days)
        
        # Calculate factor contribution
        contributions = factor_model_service.analyze_factor_contribution(model_name, factors_data)
        
        # Filter to requested symbols if provided
        if symbols:
            contributions = {symbol: contributions[symbol] for symbol in symbols if symbol in contributions}
        
        # Convert DataFrames to dicts for JSON response
        contributions_dict = {}
        for symbol, df in contributions.items():
            contributions_dict[symbol] = df.to_dict(orient="index")
        
        return {
            "model_name": model_name,
            "factor_contributions": contributions_dict,
            "days_analyzed": days,
            "generated_at": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing factor contribution: {str(e)}")

@router.post("/models/compare")
async def compare_factor_models(
    model_names: List[str] = Query(..., description="List of model names to compare"),
    symbols: List[str] = Query(..., description="List of stock symbols to use for comparison"),
    days: int = Query(90, description="Number of days of historical data to use", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Compare multiple factor models on the same data.
    """
    try:
        # Load historical data for the symbols
        # In a real implementation, this would fetch data from an API or database
        # For now, we'll generate mock data
        returns_data = generate_mock_returns_data(symbols, days)
        
        # Compare models
        comparison = factor_model_service.compare_models(model_names, returns_data)
        
        return {
            "model_names": model_names,
            "comparison_results": comparison,
            "symbols_used": symbols,
            "days_analyzed": days,
            "generated_at": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing models: {str(e)}")

# Helper functions for generating mock data

def generate_mock_returns_data(symbols: List[str], days: int) -> pd.DataFrame:
    """
    Generate mock returns data for the specified symbols.
    
    Args:
        symbols: List of stock symbols
        days: Number of days of historical data
        
    Returns:
        DataFrame of asset returns
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')
    
    # Generate mock returns data
    np.random.seed(42)  # For reproducibility
    returns = pd.DataFrame(index=date_range)
    
    for symbol in symbols:
        # Generate random returns with some autocorrelation
        returns[symbol] = np.random.normal(0.0005, 0.015, len(date_range))
    
    return returns

def generate_mock_factor_data(factors: List[str], days: int) -> pd.DataFrame:
    """
    Generate mock factor data for the specified factors.
    
    Args:
        factors: List of factor names
        days: Number of days of factor data
        
    Returns:
        DataFrame of factor returns
    """
    # Generate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='B')
    
    # Generate mock factor data
    np.random.seed(42)  # For reproducibility
    factor_data = pd.DataFrame(index=date_range)
    
    for factor in factors:
        # Different factors have different characteristics
        if factor == "market":
            # Market factor has higher mean and volatility
            factor_data[factor] = np.random.normal(0.0005, 0.01, len(date_range))
        elif factor == "size" or factor == "value":
            # Size and value factors have lower mean and volatility
            factor_data[factor] = np.random.normal(0.0002, 0.005, len(date_range))
        elif factor == "profitability" or factor == "investment":
            # Profitability and investment factors have even lower volatility
            factor_data[factor] = np.random.normal(0.0001, 0.004, len(date_range))
        else:
            # Generic factors
            factor_data[factor] = np.random.normal(0.0001, 0.006, len(date_range))
    
    return factor_data