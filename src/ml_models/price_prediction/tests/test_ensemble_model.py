"""
Unit tests for the ensemble model.
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
from src.ml_models.price_prediction.models.ensemble_model import EnsemblePriceModel
from src.ml_models.price_prediction.models.lstm_model import LSTMPriceModel
from src.ml_models.price_prediction.models.transformer_model import TransformerPriceModel
from src.ml_models.price_prediction.data.data_processor import DataProcessor

class MockModel:
    """
    Mock model for testing ensemble.
    """
    def __init__(self, prediction_value=None):
        self.is_trained = True
        self.prediction_value = prediction_value or 0.5
        self.model_version = "1.0.0"
        self.metadata = {"updated_at": datetime.now().isoformat()}
    
    def predict(self, X):
        # Return fixed prediction value
        return np.ones((len(X), 1)) * self.prediction_value
    
    def train(self, X_train, y_train, X_val=None, y_val=None, **kwargs):
        return {"loss": [0.1, 0.05]}
    
    def evaluate(self, X_test, y_test):
        return {"mse": 0.1, "rmse": 0.3, "mae": 0.2, "mape": 5.0}
    
    def save_model(self, path=None):
        return path or "mock_path"
    
    def load_model(self, path=None):
        pass
    
    def get_model_info(self):
        return {
            "model_version": self.model_version,
            "is_trained": self.is_trained,
            "performance_metrics": {"mse": 0.1}
        }

class TestEnsembleModel(unittest.TestCase):
    """
    Test cases for EnsemblePriceModel.
    """
    def setUp(self):
        """
        Set up test environment before each test.
        """
        self.temp_dir = tempfile.mkdtemp()
        
        # Create mock models
        self.mock_models = {
            "lstm": MockModel(prediction_value=0.3),
            "transformer": MockModel(prediction_value=0.5),
            "prophet": MockModel(prediction_value=0.7)
        }
        
        # Create ensemble model with mock models
        self.model = EnsemblePriceModel(
            model_name="ensemble_test",
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume", "open", "high", "low"],
            model_path=os.path.join(self.temp_dir, "ensemble_model"),
            models=self.mock_models
        )
        
        # Set weights
        self.model.weights = {
            "lstm": 0.4,
            "transformer": 0.4,
            "prophet": 0.2
        }
        
        # Create sample data
        self.processor = DataProcessor()
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        self.sample_data = pd.DataFrame({
            'date': dates,
            'open': np.random.normal(100, 5, 100),
            'high': np.random.normal(105, 5, 100),
            'low': np.random.normal(95, 5, 100),
            'close': np.random.normal(102, 5, 100),
            'volume': np.random.normal(1000000, 200000, 100),
            'symbol': 'TEST'
        })
        self.sample_data.set_index('date', inplace=True)
        
        # Prepare data for model
        data_with_indicators = self.processor.add_technical_indicators(self.sample_data)
        norm_data, _ = self.processor.normalize_data(data_with_indicators, method='minmax')
        
        # Create sequences
        X, y = self.processor.create_sequences(
            norm_data, 
            target_col='close',
            seq_length=10,
            horizon=5
        )
        
        # Split data
        X_train, y_train, X_val, y_val, X_test, y_test = self.processor.train_val_test_split(
            X, y, train_ratio=0.7, val_ratio=0.15
        )
        
        self.X_train = X_train
        self.y_train = y_train[:, 0].reshape(-1, 1)  # Use only first prediction step for simplicity
        self.X_val = X_val
        self.y_val = y_val[:, 0].reshape(-1, 1)
        self.X_test = X_test
        self.y_test = y_test[:, 0].reshape(-1, 1)
    
    def tearDown(self):
        """
        Clean up after each test.
        """
        shutil.rmtree(self.temp_dir)
    
    def test_initialization(self):
        """
        Test model initialization.
        """
        self.assertEqual(self.model.model_name, "ensemble_test")
        self.assertEqual(self.model.input_window_size, 10)
        self.assertEqual(self.model.prediction_horizon, 5)
        self.assertEqual(self.model.features, ["close", "volume", "open", "high", "low"])
        self.assertEqual(len(self.model.models), 3)
        self.assertIn("lstm", self.model.models)
        self.assertIn("transformer", self.model.models)
        self.assertIn("prophet", self.model.models)
    
    def test_build_model(self):
        """
        Test building the model.
        """
        # Create ensemble model without pre-initialized models
        model = EnsemblePriceModel(
            model_name="ensemble_test",
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume", "open", "high", "low"],
            model_path=os.path.join(self.temp_dir, "ensemble_model")
        )
        
        # Build model
        models = model.build_model()
        
        # Check that models were created
        self.assertGreaterEqual(len(models), 1)
        
        # Check that weights were initialized
        self.assertGreaterEqual(len(model.weights), 1)
        
        # Check that weights sum to 1
        self.assertAlmostEqual(sum(model.weights.values()), 1.0, places=6)
    
    def test_predict(self):
        """
        Test prediction.
        """
        # Make predictions
        predictions = self.model.predict(self.X_test)
        
        # Check prediction shape
        self.assertEqual(predictions.shape, (len(self.X_test), 1))
        
        # Check that predictions are weighted average of component models
        expected_prediction = (
            0.4 * 0.3 +  # lstm weight * lstm prediction
            0.4 * 0.5 +  # transformer weight * transformer prediction
            0.2 * 0.7    # prophet weight * prophet prediction
        )
        
        # All predictions should be the same (mock models return constant values)
        for pred in predictions:
            self.assertAlmostEqual(pred[0], expected_prediction, places=6)
    
    def test_train(self):
        """
        Test training.
        """
        # Train model
        history = self.model.train(
            self.X_train,
            self.y_train,
            X_val=self.X_val,
            y_val=self.y_val
        )
        
        # Check that history contains entries for each model
        self.assertIn("lstm", history)
        self.assertIn("transformer", history)
        self.assertIn("prophet", history)
        
        # Check that model is trained
        self.assertTrue(self.model.is_trained)
    
    def test_evaluate(self):
        """
        Test model evaluation.
        """
        # Evaluate model
        metrics = self.model.evaluate(self.X_test, self.y_test)
        
        # Check that metrics contains expected keys
        self.assertIn("mse", metrics)
        self.assertIn("rmse", metrics)
        self.assertIn("mae", metrics)
        self.assertIn("mape", metrics)
    
    def test_save_load_model(self):
        """
        Test saving and loading the model.
        """
        # Save model
        save_path = self.model.save_model()
        
        # Check that config file exists
        config_file = f"{save_path}_config.json"
        self.assertTrue(os.path.exists(config_file))
        
        # Create a new model
        new_model = EnsemblePriceModel(
            model_name="new_ensemble",
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume", "open", "high", "low"],
            model_path=save_path
        )
        
        # Mock the component models to avoid actual loading
        new_model.models = {
            "lstm": MockModel(prediction_value=0.3),
            "transformer": MockModel(prediction_value=0.5),
            "prophet": MockModel(prediction_value=0.7)
        }
        
        # Load model configuration
        new_model.load_model()
        
        # Check that weights were loaded correctly
        self.assertEqual(new_model.weights, self.model.weights)
    
    def test_get_model_info(self):
        """
        Test getting model information.
        """
        # Get model info
        info = self.model.get_model_info()
        
        # Check that info contains expected keys
        self.assertIn("model_name", info)
        self.assertIn("model_version", info)
        self.assertIn("input_window_size", info)
        self.assertIn("prediction_horizon", info)
        self.assertIn("features", info)
        self.assertIn("is_trained", info)
        self.assertIn("component_models", info)
        
        # Check component models info
        self.assertIn("lstm", info["component_models"])
        self.assertIn("transformer", info["component_models"])
        self.assertIn("prophet", info["component_models"])

if __name__ == "__main__":
    unittest.main()