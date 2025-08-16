"""
Integration tests for ML prediction API endpoints.
"""
import unittest
import os
import sys
import json
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.backend.api.main import app
from src.backend.api.routers.ml_predictions_impl import predict_price, get_model_info, evaluate_model, compare_models

# Create test client
client = TestClient(app)

class MockPredictionResponse:
    """
    Mock response for prediction endpoints.
    """
    def __init__(self, symbol="AAPL", model_type="ensemble"):
        self.symbol = symbol
        self.model_type = model_type
        self.predictions = [
            {
                "date": "2023-05-01",
                "predicted_price": 150.25,
                "lower_bound": 145.50,
                "upper_bound": 155.00,
                "confidence": 0.95
            },
            {
                "date": "2023-05-02",
                "predicted_price": 151.75,
                "lower_bound": 146.80,
                "upper_bound": 156.70,
                "confidence": 0.95
            }
        ]
    
    def to_dict(self):
        return {
            "symbol": self.symbol,
            "generated_at": "2023-05-01T12:00:00Z",
            "model_type": self.model_type,
            "model_version": "1.0.0",
            "predictions": self.predictions
        }

class MockModelInfoResponse:
    """
    Mock response for model info endpoint.
    """
    def __init__(self, model_type="ensemble"):
        self.model_type = model_type
        self.is_trained = True
    
    def to_dict(self):
        return {
            "model_type": self.model_type,
            "is_trained": self.is_trained,
            "info": {
                "model_version": "1.0.0",
                "input_window_size": 20,
                "prediction_horizon": 30,
                "features": ["close", "volume", "open", "high", "low"],
                "performance_metrics": {
                    "mse": 0.1,
                    "rmse": 0.3,
                    "mae": 0.2,
                    "mape": 5.0
                },
                "last_updated": "2023-05-01T12:00:00Z"
            },
            "generated_at": "2023-05-01T12:00:00Z"
        }

class MockEvaluationResponse:
    """
    Mock response for evaluation endpoint.
    """
    def __init__(self, symbol="AAPL", model_type="ensemble"):
        self.symbol = symbol
        self.model_type = model_type
    
    def to_dict(self):
        return {
            "symbol": self.symbol,
            "model_type": self.model_type,
            "evaluation_date": "2023-05-01T12:00:00Z",
            "metrics": {
                "mse": 0.1,
                "rmse": 0.3,
                "mae": 0.2,
                "mape": 5.0
            },
            "data_range": {
                "start_date": "2023-01-01",
                "end_date": "2023-04-30",
                "num_samples": 100
            }
        }

class MockComparisonResponse:
    """
    Mock response for model comparison endpoint.
    """
    def __init__(self, symbol="AAPL"):
        self.symbol = symbol
    
    def to_dict(self):
        return {
            "symbol": self.symbol,
            "comparison_date": "2023-05-01T12:00:00Z",
            "data_range": {
                "start_date": "2023-01-01",
                "end_date": "2023-04-30",
                "num_samples": 100
            },
            "models": {
                "lstm": {
                    "metrics": {
                        "mse": 0.12,
                        "rmse": 0.35,
                        "mae": 0.25,
                        "mape": 5.5
                    },
                    "predictions": [
                        {
                            "date": "2023-05-01",
                            "predicted_price": 149.75
                        }
                    ]
                },
                "transformer": {
                    "metrics": {
                        "mse": 0.11,
                        "rmse": 0.33,
                        "mae": 0.22,
                        "mape": 5.2
                    },
                    "predictions": [
                        {
                            "date": "2023-05-01",
                            "predicted_price": 150.50
                        }
                    ]
                },
                "prophet": {
                    "metrics": {
                        "mse": 0.13,
                        "rmse": 0.36,
                        "mae": 0.26,
                        "mape": 5.8
                    },
                    "predictions": [
                        {
                            "date": "2023-05-01",
                            "predicted_price": 151.25
                        }
                    ]
                },
                "ensemble": {
                    "metrics": {
                        "mse": 0.10,
                        "rmse": 0.32,
                        "mae": 0.21,
                        "mape": 5.0
                    },
                    "predictions": [
                        {
                            "date": "2023-05-01",
                            "predicted_price": 150.25
                        }
                    ]
                }
            }
        }

class TestMLPredictionsAPI(unittest.TestCase):
    """
    Test cases for ML predictions API endpoints.
    """
    @patch('src.backend.api.routers.ml_predictions_impl.predict_price')
    async def test_get_price_predictions(self, mock_predict):
        """
        Test the price predictions endpoint.
        """
        # Set up mock
        mock_response = MockPredictionResponse("AAPL", "ensemble").to_dict()
        mock_predict.return_value = mock_response
        
        # Make request
        response = client.get("/api/predictions/price/AAPL?days=30&model_type=ensemble")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertEqual(data["model_type"], "ensemble")
        self.assertIn("predictions", data)
        self.assertGreaterEqual(len(data["predictions"]), 1)
        
        # Check that mock was called with correct parameters
        mock_predict.assert_called_once()
        args, kwargs = mock_predict.call_args
        self.assertEqual(kwargs["symbol"], "AAPL")
        self.assertEqual(kwargs["days"], 30)
        self.assertEqual(kwargs["model_type"], "ensemble")
    
    @patch('src.backend.api.routers.ml_predictions_impl.get_model_info')
    async def test_get_model_info(self, mock_get_info):
        """
        Test the model info endpoint.
        """
        # Set up mock
        mock_response = MockModelInfoResponse("ensemble").to_dict()
        mock_get_info.return_value = mock_response
        
        # Make request
        response = client.get("/api/predictions/model-info?model_type=ensemble")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["model_type"], "ensemble")
        self.assertTrue(data["is_trained"])
        self.assertIn("info", data)
        
        # Check that mock was called with correct parameters
        mock_get_info.assert_called_once()
        args, kwargs = mock_get_info.call_args
        self.assertEqual(kwargs["model_type"], "ensemble")
    
    @patch('src.backend.api.routers.ml_predictions_impl.evaluate_model')
    async def test_evaluate_model(self, mock_evaluate):
        """
        Test the model evaluation endpoint.
        """
        # Set up mock
        mock_response = MockEvaluationResponse("AAPL", "ensemble").to_dict()
        mock_evaluate.return_value = mock_response
        
        # Make request
        response = client.get("/api/predictions/evaluate/AAPL?model_type=ensemble")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertEqual(data["model_type"], "ensemble")
        self.assertIn("metrics", data)
        self.assertIn("mse", data["metrics"])
        self.assertIn("rmse", data["metrics"])
        self.assertIn("mae", data["metrics"])
        self.assertIn("mape", data["metrics"])
        
        # Check that mock was called with correct parameters
        mock_evaluate.assert_called_once()
        args, kwargs = mock_evaluate.call_args
        self.assertEqual(kwargs["symbol"], "AAPL")
        self.assertEqual(kwargs["model_type"], "ensemble")
    
    @patch('src.backend.api.routers.ml_predictions_impl.compare_models')
    async def test_compare_models(self, mock_compare):
        """
        Test the model comparison endpoint.
        """
        # Set up mock
        mock_response = MockComparisonResponse("AAPL").to_dict()
        mock_compare.return_value = mock_response
        
        # Make request
        response = client.get("/api/predictions/compare/AAPL")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertIn("models", data)
        self.assertIn("lstm", data["models"])
        self.assertIn("transformer", data["models"])
        self.assertIn("prophet", data["models"])
        self.assertIn("ensemble", data["models"])
        
        # Check that mock was called with correct parameters
        mock_compare.assert_called_once()
        args, kwargs = mock_compare.call_args
        self.assertEqual(kwargs["symbol"], "AAPL")
    
    def test_sentiment_analysis(self):
        """
        Test the sentiment analysis endpoint.
        """
        # Make request
        response = client.get("/api/predictions/sentiment/AAPL?days=30")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertIn("overall_sentiment", data)
        self.assertIn("sentiment_label", data)
        self.assertIn("daily_sentiment", data)
        self.assertEqual(len(data["daily_sentiment"]), 30)
    
    def test_factor_model_analysis(self):
        """
        Test the factor model analysis endpoint.
        """
        # Make request
        response = client.get("/api/predictions/factor-model/AAPL?model=fama-french-3")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertEqual(data["model"], "fama-french-3")
        self.assertIn("factor_exposures", data)
        self.assertIn("market", data["factor_exposures"])
        self.assertIn("size", data["factor_exposures"])
        self.assertIn("value", data["factor_exposures"])
    
    def test_anomaly_detection(self):
        """
        Test the anomaly detection endpoint.
        """
        # Make request
        response = client.get("/api/predictions/anomaly-detection/AAPL?days=30")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertIn("anomalies_detected", data)
        self.assertIn("anomalies", data)
    
    def test_smart_beta_analysis(self):
        """
        Test the smart beta analysis endpoint.
        """
        # Make request
        response = client.get("/api/predictions/smart-beta/AAPL?factors=momentum,quality,low_volatility")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["symbol"], "AAPL")
        self.assertIn("overall_smart_beta_score", data)
        self.assertIn("factor_scores", data)
        self.assertIn("momentum", data["factor_scores"])
        self.assertIn("quality", data["factor_scores"])
        self.assertIn("low_volatility", data["factor_scores"])
    
    @patch('src.backend.api.routers.ml_predictions_impl.get_model_info')
    async def test_model_status(self, mock_get_info):
        """
        Test the model status endpoint.
        """
        # Set up mocks for different model types
        mock_get_info.side_effect = [
            MockModelInfoResponse("lstm").to_dict(),
            MockModelInfoResponse("transformer").to_dict(),
            MockModelInfoResponse("prophet").to_dict(),
            MockModelInfoResponse("ensemble").to_dict()
        ]
        
        # Make request
        response = client.get("/api/predictions/model-status")
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("models", data)
        self.assertEqual(len(data["models"]), 4)
        
        # Check model info
        model_names = [model["name"] for model in data["models"]]
        self.assertIn("lstm", model_names)
        self.assertIn("transformer", model_names)
        self.assertIn("prophet", model_names)
        self.assertIn("ensemble", model_names)

if __name__ == "__main__":
    unittest.main()