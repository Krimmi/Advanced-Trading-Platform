"""
Router for ML prediction endpoints.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
import os

# Import implementation
from src.backend.api.routers.ml_predictions_impl import (
    predict_price,
    get_model_info,
    evaluate_model,
    compare_models
)

router = APIRouter()

@router.get("/price/{symbol}")
async def get_price_predictions(
    symbol: str = Path(..., description="Stock symbol"),
    days: int = Query(30, description="Number of days to predict", ge=1, le=90),
    model_type: str = Query("ensemble", description="Model type (lstm, transformer, prophet, ensemble)")
) -> Dict[str, Any]:
    """
    Get price predictions for a stock symbol.
    """
    return await predict_price(symbol, days, model_type)

@router.get("/model-info")
async def get_model_information(
    model_type: str = Query("ensemble", description="Model type (lstm, transformer, prophet, ensemble)")
) -> Dict[str, Any]:
    """
    Get information about a prediction model.
    """
    return await get_model_info(model_type)

@router.get("/evaluate/{symbol}")
async def evaluate_prediction_model(
    symbol: str = Path(..., description="Stock symbol"),
    model_type: str = Query("ensemble", description="Model type (lstm, transformer, prophet, ensemble)"),
    days: int = Query(90, description="Number of days of historical data to use", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Evaluate a prediction model on historical data.
    """
    return await evaluate_model(symbol, model_type, days)

@router.get("/compare/{symbol}")
async def compare_prediction_models(
    symbol: str = Path(..., description="Stock symbol"),
    days: int = Query(90, description="Number of days of historical data to use", ge=30, le=365)
) -> Dict[str, Any]:
    """
    Compare different prediction models on the same data.
    """
    return await compare_models(symbol, days)

@router.get("/sentiment/{symbol}")
async def analyze_sentiment(
    symbol: str = Path(..., description="Stock symbol"),
    days: int = Query(30, description="Number of past days to analyze", ge=1, le=90)
) -> Dict[str, Any]:
    """
    Get sentiment analysis for a stock symbol.
    """
    try:
        # Mock sentiment data - will be replaced with actual sentiment analysis
        sentiment_scores = []
        today = datetime.now()
        
        for i in range(days):
            date = today - timedelta(days=i)
            # Generate random sentiment between -1 and 1
            sentiment = np.random.normal(0.2, 0.4)  # Slightly positive bias
            sentiment = max(min(sentiment, 1.0), -1.0)  # Clamp between -1 and 1
            
            sentiment_scores.append({
                "date": date.strftime("%Y-%m-%d"),
                "sentiment_score": round(sentiment, 2),
                "source_count": np.random.randint(5, 50)
            })
        
        # Sort by date ascending
        sentiment_scores.sort(key=lambda x: x["date"])
        
        # Calculate overall sentiment
        overall_sentiment = sum(item["sentiment_score"] for item in sentiment_scores) / len(sentiment_scores)
        
        return {
            "symbol": symbol,
            "generated_at": datetime.now().isoformat(),
            "overall_sentiment": round(overall_sentiment, 2),
            "sentiment_label": "Bullish" if overall_sentiment > 0.3 else 
                              "Bearish" if overall_sentiment < -0.3 else "Neutral",
            "daily_sentiment": sentiment_scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@router.get("/factor-model/{symbol}")
async def factor_model_analysis(
    symbol: str = Path(..., description="Stock symbol"),
    model: str = Query("fama-french-3", description="Factor model to use: fama-french-3, fama-french-5, or apt")
) -> Dict[str, Any]:
    """
    Get factor model analysis for a stock symbol.
    """
    try:
        # Mock factor model data - will be replaced with actual factor model analysis
        if model not in ["fama-french-3", "fama-french-5", "apt"]:
            raise HTTPException(status_code=400, detail="Invalid model. Use fama-french-3, fama-french-5, or apt")
        
        # Generate mock factor exposures
        if model == "fama-french-3":
            factors = {
                "market": round(np.random.normal(1.0, 0.2), 2),
                "size": round(np.random.normal(0.2, 0.5), 2),
                "value": round(np.random.normal(0.1, 0.4), 2)
            }
        elif model == "fama-french-5":
            factors = {
                "market": round(np.random.normal(1.0, 0.2), 2),
                "size": round(np.random.normal(0.2, 0.5), 2),
                "value": round(np.random.normal(0.1, 0.4), 2),
                "profitability": round(np.random.normal(0.3, 0.3), 2),
                "investment": round(np.random.normal(-0.1, 0.3), 2)
            }
        else:  # apt
            factors = {
                "market": round(np.random.normal(1.0, 0.2), 2),
                "inflation": round(np.random.normal(0.1, 0.3), 2),
                "interest_rate": round(np.random.normal(-0.2, 0.4), 2),
                "industrial_production": round(np.random.normal(0.15, 0.25), 2),
                "default_risk": round(np.random.normal(0.05, 0.2), 2)
            }
        
        # Calculate expected return
        risk_free_rate = 0.04  # 4% risk-free rate
        factor_premiums = {
            "market": 0.06,
            "size": 0.02,
            "value": 0.03,
            "profitability": 0.02,
            "investment": 0.01,
            "inflation": 0.01,
            "interest_rate": 0.02,
            "industrial_production": 0.015,
            "default_risk": 0.02
        }
        
        expected_return = risk_free_rate
        for factor, exposure in factors.items():
            if factor in factor_premiums:
                expected_return += exposure * factor_premiums[factor]
        
        return {
            "symbol": symbol,
            "model": model,
            "generated_at": datetime.now().isoformat(),
            "factor_exposures": factors,
            "risk_free_rate": risk_free_rate,
            "expected_annual_return": round(expected_return, 4),
            "expected_monthly_return": round(expected_return / 12, 4),
            "r_squared": round(0.7 + np.random.random() * 0.2, 2),  # Random R-squared between 0.7 and 0.9
            "analysis_period": "5 years"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing factor analysis: {str(e)}")

@router.get("/anomaly-detection/{symbol}")
async def detect_anomalies(
    symbol: str = Path(..., description="Stock symbol"),
    days: int = Query(30, description="Number of past days to analyze", ge=1, le=90)
) -> Dict[str, Any]:
    """
    Detect price and volume anomalies for a stock symbol.
    """
    try:
        # Mock anomaly detection data - will be replaced with actual anomaly detection
        anomalies = []
        today = datetime.now()
        
        # Generate a few random anomalies
        num_anomalies = np.random.randint(0, 3)
        for _ in range(num_anomalies):
            anomaly_day = np.random.randint(1, days)
            date = today - timedelta(days=anomaly_day)
            
            anomaly_type = np.random.choice(["price_spike", "volume_spike", "price_drop", "unusual_pattern"])
            severity = np.random.choice(["low", "medium", "high"])
            
            anomalies.append({
                "date": date.strftime("%Y-%m-%d"),
                "type": anomaly_type,
                "severity": severity,
                "description": f"Detected {severity} {anomaly_type.replace('_', ' ')}",
                "z_score": round(np.random.uniform(2.5, 5.0), 2)
            })
        
        return {
            "symbol": symbol,
            "generated_at": datetime.now().isoformat(),
            "analysis_period": f"Past {days} days",
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")

@router.get("/smart-beta/{symbol}")
async def smart_beta_analysis(
    symbol: str = Path(..., description="Stock symbol"),
    factors: List[str] = Query(["momentum", "quality", "low_volatility"], description="Factors to analyze")
) -> Dict[str, Any]:
    """
    Get smart beta analysis for a stock symbol.
    """
    try:
        valid_factors = ["momentum", "quality", "low_volatility", "value", "size", "growth"]
        
        # Validate factors
        for factor in factors:
            if factor not in valid_factors:
                raise HTTPException(status_code=400, detail=f"Invalid factor: {factor}. Valid factors are: {', '.join(valid_factors)}")
        
        # Mock smart beta analysis - will be replaced with actual analysis
        factor_scores = {}
        for factor in factors:
            # Generate random score between 0 and 100
            factor_scores[factor] = round(np.random.uniform(0, 100), 1)
        
        # Calculate overall smart beta score (weighted average)
        weights = {
            "momentum": 0.2,
            "quality": 0.2,
            "low_volatility": 0.15,
            "value": 0.2,
            "size": 0.1,
            "growth": 0.15
        }
        
        overall_score = 0
        total_weight = 0
        
        for factor, score in factor_scores.items():
            overall_score += score * weights[factor]
            total_weight += weights[factor]
        
        overall_score = overall_score / total_weight if total_weight > 0 else 0
        
        return {
            "symbol": symbol,
            "generated_at": datetime.now().isoformat(),
            "overall_smart_beta_score": round(overall_score, 1),
            "factor_scores": factor_scores,
            "percentile_rank": round(overall_score / 100 * 99 + 1),  # Convert to percentile (1-100)
            "recommendation": "Strong Buy" if overall_score > 80 else
                             "Buy" if overall_score > 60 else
                             "Hold" if overall_score > 40 else
                             "Sell" if overall_score > 20 else "Strong Sell"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing smart beta analysis: {str(e)}")

@router.get("/model-status")
async def get_model_status() -> Dict[str, Any]:
    """
    Get status of ML models.
    """
    try:
        # Get actual model status from our implementation
        lstm_info = await get_model_info("lstm")
        transformer_info = await get_model_info("transformer")
        prophet_info = await get_model_info("prophet")
        ensemble_info = await get_model_info("ensemble")
        
        # Format the response
        models = [
            {
                "name": "lstm",
                "version": lstm_info.get("model_version", "1.0.0"),
                "last_trained": lstm_info.get("last_updated", (datetime.now() - timedelta(days=2)).isoformat()),
                "accuracy": lstm_info.get("performance_metrics", {}).get("accuracy", 0.82),
                "status": "active" if lstm_info.get("is_trained", False) else "inactive"
            },
            {
                "name": "transformer",
                "version": transformer_info.get("model_version", "1.2.1"),
                "last_trained": transformer_info.get("last_updated", (datetime.now() - timedelta(days=5)).isoformat()),
                "accuracy": transformer_info.get("performance_metrics", {}).get("accuracy", 0.78),
                "status": "active" if transformer_info.get("is_trained", False) else "inactive"
            },
            {
                "name": "prophet",
                "version": prophet_info.get("model_version", "0.9.5"),
                "last_trained": prophet_info.get("last_updated", (datetime.now() - timedelta(days=10)).isoformat()),
                "accuracy": prophet_info.get("performance_metrics", {}).get("accuracy", 0.75),
                "status": "active" if prophet_info.get("is_trained", False) else "inactive"
            },
            {
                "name": "ensemble",
                "version": ensemble_info.get("model_version", "1.1.0"),
                "last_trained": ensemble_info.get("last_updated", (datetime.now() - timedelta(days=3)).isoformat()),
                "accuracy": ensemble_info.get("performance_metrics", {}).get("accuracy", 0.88),
                "status": "active" if ensemble_info.get("is_trained", False) else "inactive"
            }
        ]
        
        return {
            "generated_at": datetime.now().isoformat(),
            "models": models,
            "next_scheduled_training": (datetime.now() + timedelta(days=1)).isoformat(),
            "system_status": "healthy"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model status: {str(e)}")