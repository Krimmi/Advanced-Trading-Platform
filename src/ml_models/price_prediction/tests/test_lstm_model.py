"""
Unit tests for the LSTM model.
"""
import unittest
import os
import sys
import numpy as np
import pandas as pd
import tensorflow as tf
from datetime import datetime, timedelta
import tempfile
import shutil

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.ml_models.price_prediction.models.lstm_model import LSTMPriceModel
from src.ml_models.price_prediction.data.data_processor import DataProcessor

class TestLSTMModel(unittest.TestCase):
    """
    Test cases for LSTMPriceModel.
    """
    def setUp(self):
        """
        Set up test environment before each test.
        """
        self.temp_dir = tempfile.mkdtemp()
        
        # Create model
        self.model = LSTMPriceModel(
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume", "open", "high", "low"],
            model_path=os.path.join(self.temp_dir, "lstm_model")
        )
        
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
        self.assertEqual(self.model.input_window_size, 10)
        self.assertEqual(self.model.prediction_horizon, 5)
        self.assertEqual(self.model.features, ["close", "volume", "open", "high", "low"])
        self.assertFalse(self.model.is_trained)
    
    def test_build_model(self):
        """
        Test building the model.
        """
        # Build model
        model = self.model.build_model()
        
        # Check that model is a Keras model
        self.assertIsInstance(model, tf.keras.Model)
        
        # Check input shape
        self.assertEqual(model.input_shape, (None, 10, 5))  # (batch_size, timesteps, features)
        
        # Check output shape
        self.assertEqual(model.output_shape, (None, 1))  # (batch_size, output_dim)
    
    def test_train_and_predict(self):
        """
        Test training and prediction.
        """
        # Skip test if GPU is not available (training is slow on CPU)
        if not tf.config.list_physical_devices('GPU'):
            self.skipTest("Skipping test_train_and_predict because GPU is not available")
        
        # Train model with minimal epochs for testing
        history = self.model.train(
            self.X_train, 
            self.y_train,
            X_val=self.X_val,
            y_val=self.y_val,
            epochs=2,
            batch_size=16,
            verbose=0
        )
        
        # Check that model is trained
        self.assertTrue(self.model.is_trained)
        
        # Check that history contains expected keys
        self.assertIn('loss', history)
        self.assertIn('val_loss', history)
        
        # Make predictions
        predictions = self.model.predict(self.X_test)
        
        # Check prediction shape
        self.assertEqual(predictions.shape, (len(self.X_test), 1))
        
        # Check that predictions are reasonable (between 0 and 1 for normalized data)
        self.assertTrue(np.all(predictions >= 0))
        self.assertTrue(np.all(predictions <= 1))
    
    def test_save_load_model(self):
        """
        Test saving and loading the model.
        """
        # Skip test if GPU is not available (training is slow on CPU)
        if not tf.config.list_physical_devices('GPU'):
            self.skipTest("Skipping test_save_load_model because GPU is not available")
        
        # Train model with minimal epochs for testing
        self.model.train(
            self.X_train, 
            self.y_train,
            epochs=1,
            batch_size=16,
            verbose=0
        )
        
        # Make predictions before saving
        predictions_before = self.model.predict(self.X_test)
        
        # Save model
        save_path = self.model.save_model()
        
        # Create a new model
        new_model = LSTMPriceModel(
            input_window_size=10,
            prediction_horizon=5,
            features=["close", "volume", "open", "high", "low"],
            model_path=save_path
        )
        
        # Load model
        new_model.load_model()
        
        # Check that model is trained
        self.assertTrue(new_model.is_trained)
        
        # Make predictions after loading
        predictions_after = new_model.predict(self.X_test)
        
        # Check that predictions are the same
        np.testing.assert_allclose(predictions_before, predictions_after)
    
    def test_evaluate(self):
        """
        Test model evaluation.
        """
        # Skip test if GPU is not available (training is slow on CPU)
        if not tf.config.list_physical_devices('GPU'):
            self.skipTest("Skipping test_evaluate because GPU is not available")
        
        # Train model with minimal epochs for testing
        self.model.train(
            self.X_train, 
            self.y_train,
            epochs=1,
            batch_size=16,
            verbose=0
        )
        
        # Evaluate model
        metrics = self.model.evaluate(self.X_test, self.y_test)
        
        # Check that metrics contains expected keys
        self.assertIn('mse', metrics)
        self.assertIn('rmse', metrics)
        self.assertIn('mae', metrics)
        self.assertIn('mape', metrics)
        
        # Check that metrics are reasonable
        self.assertGreaterEqual(metrics['mse'], 0)
        self.assertGreaterEqual(metrics['rmse'], 0)
        self.assertGreaterEqual(metrics['mae'], 0)

if __name__ == "__main__":
    unittest.main()