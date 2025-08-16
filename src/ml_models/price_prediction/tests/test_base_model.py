"""
Unit tests for the base model class.
"""
import unittest
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import tempfile
import shutil

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.ml_models.price_prediction.models.base_model import BasePriceModel

class MockModel(BasePriceModel):
    """
    Mock implementation of BasePriceModel for testing.
    """
    def preprocess_data(self, data):
        # Simple preprocessing for testing
        return np.array([[1, 2, 3]]), np.array([4])
    
    def build_model(self):
        # Return a simple mock model
        return "mock_model"
    
    def train(self, X_train, y_train, **kwargs):
        # Mock training
        self.is_trained = True
        return {"loss": [0.1, 0.05], "val_loss": [0.2, 0.1]}
    
    def predict(self, X):
        # Mock prediction
        return np.array([5.0])

class TestBasePriceModel(unittest.TestCase):
    """
    Test cases for BasePriceModel.
    """
    def setUp(self):
        """
        Set up test environment before each test.
        """
        self.temp_dir = tempfile.mkdtemp()
        self.model = MockModel(
            model_name="test_model",
            model_version="1.0.0",
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume"],
            model_path=os.path.join(self.temp_dir, "test_model")
        )
    
    def tearDown(self):
        """
        Clean up after each test.
        """
        shutil.rmtree(self.temp_dir)
    
    def test_initialization(self):
        """
        Test model initialization.
        """
        self.assertEqual(self.model.model_name, "test_model")
        self.assertEqual(self.model.model_version, "1.0.0")
        self.assertEqual(self.model.input_window_size, 10)
        self.assertEqual(self.model.prediction_horizon, 5)
        self.assertEqual(self.model.features, ["close", "volume"])
        self.assertFalse(self.model.is_trained)
    
    def test_evaluate(self):
        """
        Test model evaluation.
        """
        # Mock data
        X_test = np.array([[1, 2, 3]])
        y_test = np.array([4.0])
        
        # Evaluate
        metrics = self.model.evaluate(X_test, y_test)
        
        # Check metrics
        self.assertIn("mse", metrics)
        self.assertIn("rmse", metrics)
        self.assertIn("mae", metrics)
        self.assertIn("mape", metrics)
        
        # Check values (prediction is 5.0, actual is 4.0)
        self.assertAlmostEqual(metrics["mse"], 1.0)  # (5-4)^2 = 1
        self.assertAlmostEqual(metrics["rmse"], 1.0)  # sqrt(1) = 1
        self.assertAlmostEqual(metrics["mae"], 1.0)  # |5-4| = 1
    
    def test_save_load_model(self):
        """
        Test saving and loading model metadata.
        """
        # Save model
        save_path = self.model.save_model()
        
        # Check that metadata file exists
        metadata_file = f"{save_path}_metadata.json"
        self.assertTrue(os.path.exists(metadata_file))
        
        # Create a new model
        new_model = MockModel(
            model_name="new_model",
            model_version="2.0.0",
            input_window_size=20,
            prediction_horizon=10,
            features=["open", "high", "low"],
            model_path=save_path
        )
        
        # Load metadata
        new_model.load_model()
        
        # Check that metadata was loaded correctly
        self.assertEqual(new_model.model_name, "test_model")
        self.assertEqual(new_model.model_version, "1.0.0")
        self.assertEqual(new_model.input_window_size, 10)
        self.assertEqual(new_model.prediction_horizon, 5)
        self.assertEqual(new_model.features, ["close", "volume"])
    
    def test_get_model_info(self):
        """
        Test getting model information.
        """
        # Train the model
        X_train = np.array([[1, 2, 3]])
        y_train = np.array([4.0])
        self.model.train(X_train, y_train)
        
        # Get model info
        info = self.model.get_model_info()
        
        # Check info
        self.assertEqual(info["model_name"], "test_model")
        self.assertEqual(info["model_version"], "1.0.0")
        self.assertEqual(info["input_window_size"], 10)
        self.assertEqual(info["prediction_horizon"], 5)
        self.assertEqual(info["features"], ["close", "volume"])
        self.assertTrue(info["is_trained"])

if __name__ == "__main__":
    unittest.main()