"""
Unit tests for the predictor service.
"""
import unittest
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import tempfile
import shutil
from unittest.mock import patch, MagicMock

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.ml_models.price_prediction.predictor import PricePredictor

class MockModel:
    """
    Mock model for testing predictor.
    """
    def __init__(self, model_type="ensemble"):
        self.is_trained = True
        self.model_type = model_type
        self.model_version = "1.0.0"
        self.input_window_size = 20
        self.prediction_horizon = 30
        self.features = ["close", "volume", "open", "high", "low"]
        self.metadata = {
            "updated_at": datetime.now().isoformat(),
            "performance_metrics": {
                "mse": 0.1,
                "rmse": 0.3,
                "mae": 0.2,
                "mape": 5.0
            }
        }
    
    def predict(self, X):
        # Return random predictions
        return np.random.normal(100, 5, (self.prediction_horizon, 1))
    
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
            "model_type": self.model_type,
            "model_version": self.model_version,
            "input_window_size": self.input_window_size,
            "prediction_horizon": self.prediction_horizon,
            "features": self.features,
            "is_trained": self.is_trained,
            "performance_metrics": self.metadata["performance_metrics"],
            "last_updated": self.metadata["updated_at"]
        }

class MockDataProcessor:
    """
    Mock data processor for testing predictor.
    """
    def load_data(self, symbol, start_date=None, end_date=None):
        # Return mock data
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        data = pd.DataFrame({
            'open': np.random.normal(100, 5, 100),
            'high': np.random.normal(105, 5, 100),
            'low': np.random.normal(95, 5, 100),
            'close': np.random.normal(102, 5, 100),
            'volume': np.random.normal(1000000, 200000, 100),
            'symbol': symbol
        }, index=dates)
        return data
    
    def prepare_data_for_model(self, symbol, start_date=None, end_date=None, normalize=True, add_indicators=True):
        # Return mock processed data
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        original_data = pd.DataFrame({
            'open': np.random.normal(100, 5, 100),
            'high': np.random.normal(105, 5, 100),
            'low': np.random.normal(95, 5, 100),
            'close': np.random.normal(102, 5, 100),
            'volume': np.random.normal(1000000, 200000, 100),
            'symbol': symbol
        }, index=dates)
        
        # Create mock sequences
        X_train = np.random.random((50, 20, 5))
        y_train = np.random.random((50, 1))
        X_val = np.random.random((20, 20, 5))
        y_val = np.random.random((20, 1))
        X_test = np.random.random((30, 20, 5))
        y_test = np.random.random((30, 1))
        
        return {
            'symbol': symbol,
            'original_data': original_data,
            'normalized_data': original_data.copy(),
            'scaler_params': {'close': {'min': 90, 'max': 110}},
            'X_train': X_train,
            'y_train': y_train,
            'X_val': X_val,
            'y_val': y_val,
            'X_test': X_test,
            'y_test': y_test,
            'feature_columns': ['open', 'high', 'low', 'close', 'volume'],
            'target_column': 'close',
            'sequence_length': 20,
            'prediction_horizon': 30,
            'metadata': {
                'start_date': '2023-01-01',
                'end_date': '2023-04-10',
                'num_samples': 100,
                'num_features': 5,
                'normalization': 'minmax',
                'technical_indicators': True
            }
        }
    
    def prepare_prediction_data(self, data):
        # Return mock prediction data
        return np.random.random((1, 20, 5))
    
    def inverse_transform_predictions(self, predictions):
        # Return mock denormalized predictions
        return predictions * 100

class TestPricePredictor(unittest.TestCase):
    """
    Test cases for PricePredictor.
    """
    def setUp(self):
        """
        Set up test environment before each test.
        """
        self.temp_dir = tempfile.mkdtemp()
        
        # Create patches
        self.model_patch = patch('src.ml_models.price_prediction.predictor.LSTMPriceModel', return_value=MockModel("lstm"))
        self.transformer_patch = patch('src.ml_models.price_prediction.predictor.TransformerPriceModel', return_value=MockModel("transformer"))
        self.prophet_patch = patch('src.ml_models.price_prediction.predictor.ProphetPriceModel', return_value=MockModel("prophet"))
        self.ensemble_patch = patch('src.ml_models.price_prediction.predictor.EnsemblePriceModel', return_value=MockModel("ensemble"))
        self.processor_patch = patch('src.ml_models.price_prediction.predictor.DataProcessor', return_value=MockDataProcessor())
        
        # Start patches
        self.mock_lstm = self.model_patch.start()
        self.mock_transformer = self.transformer_patch.start()
        self.mock_prophet = self.prophet_patch.start()
        self.mock_ensemble = self.ensemble_patch.start()
        self.mock_processor = self.processor_patch.start()
        
        # Create predictor
        self.predictor = PricePredictor(
            model_type="ensemble",
            input_window_size=20,
            prediction_horizon=30,
            features=["close", "volume", "open", "high", "low"],
            models_dir=self.temp_dir
        )
    
    def tearDown(self):
        """
        Clean up after each test.
        """
        # Stop patches
        self.model_patch.stop()
        self.transformer_patch.stop()
        self.prophet_patch.stop()
        self.ensemble_patch.stop()
        self.processor_patch.stop()
        
        # Remove temp directory
        shutil.rmtree(self.temp_dir)
    
    def test_initialization(self):
        """
        Test predictor initialization.
        """
        self.assertEqual(self.predictor.model_type, "ensemble")
        self.assertEqual(self.predictor.input_window_size, 20)
        self.assertEqual(self.predictor.prediction_horizon, 30)
        self.assertEqual(self.predictor.features, ["close", "volume", "open", "high", "low"])
        self.assertIsNotNone(self.predictor.model)
        self.assertIsNotNone(self.predictor.data_processor)
    
    def test_create_model(self):
        """
        Test creating different model types.
        """
        # Test LSTM model
        lstm_predictor = PricePredictor(model_type="lstm", models_dir=self.temp_dir)
        self.assertEqual(lstm_predictor.model_type, "lstm")
        self.assertIsInstance(lstm_predictor.model, MockModel)
        
        # Test Transformer model
        transformer_predictor = PricePredictor(model_type="transformer", models_dir=self.temp_dir)
        self.assertEqual(transformer_predictor.model_type, "transformer")
        self.assertIsInstance(transformer_predictor.model, MockModel)
        
        # Test Prophet model
        prophet_predictor = PricePredictor(model_type="prophet", models_dir=self.temp_dir)
        self.assertEqual(prophet_predictor.model_type, "prophet")
        self.assertIsInstance(prophet_predictor.model, MockModel)
        
        # Test invalid model type
        with self.assertRaises(ValueError):
            PricePredictor(model_type="invalid", models_dir=self.temp_dir)
    
    def test_train(self):
        """
        Test training the model.
        """
        # Train model
        history = self.predictor.train(pd.DataFrame())
        
        # Check that training was called
        self.assertTrue(self.predictor.model.is_trained)
        
        # Check that history contains expected keys
        self.assertIn("loss", history)
    
    def test_predict(self):
        """
        Test making predictions.
        """
        # Make predictions
        predictions = self.predictor.predict(pd.DataFrame())
        
        # Check that predictions contains expected keys
        self.assertIn("symbol", predictions)
        self.assertIn("generated_at", predictions)
        self.assertIn("model_type", predictions)
        self.assertIn("model_version", predictions)
        self.assertIn("predictions", predictions)
        
        # Check that predictions array has expected length
        self.assertEqual(len(predictions["predictions"]), 30)
        
        # Check that each prediction has expected keys
        for pred in predictions["predictions"]:
            self.assertIn("date", pred)
            self.assertIn("predicted_price", pred)
            self.assertIn("lower_bound", pred)
            self.assertIn("upper_bound", pred)
            self.assertIn("confidence", pred)
    
    def test_evaluate(self):
        """
        Test evaluating the model.
        """
        # Evaluate model
        metrics = self.predictor.evaluate(pd.DataFrame())
        
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
        save_path = self.predictor.save_model()
        
        # Create a new predictor
        new_predictor = PricePredictor(
            model_type="ensemble",
            input_window_size=20,
            prediction_horizon=30,
            features=["close", "volume", "open", "high", "low"],
            models_dir=self.temp_dir
        )
        
        # Load model
        new_predictor.load_model()
        
        # Check that model is loaded
        self.assertTrue(new_predictor.model.is_trained)
    
    def test_get_model_info(self):
        """
        Test getting model information.
        """
        # Get model info
        info = self.predictor.get_model_info()
        
        # Check that info contains expected keys
        self.assertIn("model_type", info)
        self.assertIn("model_version", info)
        self.assertIn("input_window_size", info)
        self.assertIn("prediction_horizon", info)
        self.assertIn("features", info)
        self.assertIn("is_trained", info)
        self.assertIn("performance_metrics", info)
        self.assertIn("last_updated", info)

if __name__ == "__main__":
    unittest.main()