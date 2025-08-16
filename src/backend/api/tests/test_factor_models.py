"""
Tests for factor models API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os
import json
from typing import Dict, List, Any

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.backend.api.main import app

# Create test client
client = TestClient(app)

def test_list_factor_models():
    """Test listing factor models."""
    response = client.get("/api/factor-models/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "count" in data
    assert isinstance(data["models"], list)

def test_create_factor_model():
    """Test creating a factor model."""
    # Create a Fama-French 3-factor model
    response = client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_ff3_model",
            "model_subtype": "three_factor"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_ff3_model"
    assert "model_info" in data
    
    # Create an APT model
    response = client.post(
        "/api/factor-models/models",
        params={
            "model_type": "apt",
            "model_name": "test_apt_model",
            "num_factors": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_apt_model"
    assert "model_info" in data
    
    # Create a custom factor model
    response = client.post(
        "/api/factor-models/models",
        params={
            "model_type": "custom",
            "model_name": "test_custom_model"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_custom_model"
    assert "model_info" in data

def test_get_factor_model_info():
    """Test getting factor model info."""
    # First create a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_info_model",
            "model_subtype": "three_factor"
        }
    )
    
    # Get model info
    response = client.get("/api/factor-models/models/test_info_model")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_info_model"
    assert "model_info" in data
    assert "factors" in data["model_info"]

def test_train_factor_model():
    """Test training a factor model."""
    # First create a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_train_model",
            "model_subtype": "three_factor"
        }
    )
    
    # Train the model
    response = client.post(
        "/api/factor-models/models/test_train_model/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_train_model"
    assert "training_results" in data
    assert "symbols_used" in data
    assert len(data["symbols_used"]) == 5

def test_predict_returns():
    """Test predicting returns with a factor model."""
    # First create and train a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_predict_model",
            "model_subtype": "three_factor"
        }
    )
    
    client.post(
        "/api/factor-models/models/test_predict_model/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    
    # Predict returns
    response = client.post(
        "/api/factor-models/models/test_predict_model/predict",
        params={
            "symbols": ["AAPL", "MSFT"],
            "days": 30
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_predict_model"
    assert "predictions" in data
    assert "factors_used" in data

def test_risk_decomposition():
    """Test risk decomposition analysis."""
    # First create and train a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_risk_model",
            "model_subtype": "three_factor"
        }
    )
    
    client.post(
        "/api/factor-models/models/test_risk_model/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    
    # Analyze risk decomposition
    response = client.post(
        "/api/factor-models/models/test_risk_model/risk-decomposition",
        params={
            "symbols": ["AAPL", "MSFT"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_risk_model"
    assert "risk_decomposition" in data
    assert "AAPL" in data["risk_decomposition"]
    assert "MSFT" in data["risk_decomposition"]

def test_factor_contribution():
    """Test factor contribution analysis."""
    # First create and train a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_contrib_model",
            "model_subtype": "three_factor"
        }
    )
    
    client.post(
        "/api/factor-models/models/test_contrib_model/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    
    # Analyze factor contribution
    response = client.post(
        "/api/factor-models/models/test_contrib_model/factor-contribution",
        params={
            "symbols": ["AAPL", "MSFT"],
            "days": 30
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_contrib_model"
    assert "factor_contributions" in data
    assert "AAPL" in data["factor_contributions"]
    assert "MSFT" in data["factor_contributions"]

def test_compare_models():
    """Test comparing multiple factor models."""
    # First create and train two models
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_compare_ff3",
            "model_subtype": "three_factor"
        }
    )
    
    client.post(
        "/api/factor-models/models/test_compare_ff3/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_compare_ff5",
            "model_subtype": "five_factor"
        }
    )
    
    client.post(
        "/api/factor-models/models/test_compare_ff5/train",
        params={
            "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "FB"],
            "lookback_days": 252
        }
    )
    
    # Compare models
    response = client.post(
        "/api/factor-models/models/compare",
        params={
            "model_names": ["test_compare_ff3", "test_compare_ff5"],
            "symbols": ["AAPL", "MSFT", "GOOGL"],
            "days": 90
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "model_names" in data
    assert "comparison_results" in data
    assert "test_compare_ff3" in data["comparison_results"]
    assert "test_compare_ff5" in data["comparison_results"]

def test_delete_factor_model():
    """Test deleting a factor model."""
    # First create a model
    client.post(
        "/api/factor-models/models",
        params={
            "model_type": "fama_french",
            "model_name": "test_delete_model",
            "model_subtype": "three_factor"
        }
    )
    
    # Delete the model
    response = client.delete("/api/factor-models/models/test_delete_model")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "test_delete_model"
    assert data["deleted"] is True
    
    # Verify it's gone
    response = client.get("/api/factor-models/models/test_delete_model")
    assert response.status_code == 404

if __name__ == "__main__":
    # Run tests
    pytest.main(["-xvs", __file__])