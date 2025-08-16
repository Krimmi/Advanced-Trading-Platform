"""
Unit tests for the data processor.
"""
import unittest
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from src.ml_models.price_prediction.data.data_processor import DataProcessor

class TestDataProcessor(unittest.TestCase):
    """
    Test cases for DataProcessor.
    """
    def setUp(self):
        """
        Set up test environment before each test.
        """
        self.processor = DataProcessor()
        
        # Create sample data
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
    
    def test_load_data(self):
        """
        Test loading stock data.
        """
        # Test with default parameters
        data = self.processor.load_data('AAPL')
        
        # Check that data was loaded
        self.assertIsInstance(data, pd.DataFrame)
        self.assertGreater(len(data), 0)
        
        # Check required columns
        required_columns = ['open', 'high', 'low', 'close', 'volume', 'symbol']
        for col in required_columns:
            self.assertIn(col, data.columns)
        
        # Check symbol
        self.assertEqual(data['symbol'].iloc[0], 'AAPL')
        
        # Test with specific date range
        start_date = '2023-01-01'
        end_date = '2023-01-31'
        data = self.processor.load_data('MSFT', start_date=start_date, end_date=end_date)
        
        # Check date range
        self.assertGreaterEqual(data.index.min().strftime('%Y-%m-%d'), start_date)
        self.assertLessEqual(data.index.max().strftime('%Y-%m-%d'), end_date)
    
    def test_add_technical_indicators(self):
        """
        Test adding technical indicators.
        """
        # Add technical indicators
        data_with_indicators = self.processor.add_technical_indicators(self.sample_data)
        
        # Check that indicators were added
        indicators = ['sma_5', 'sma_20', 'ema_5', 'ema_20', 'rsi_14', 
                     'macd', 'macd_signal', 'macd_hist', 
                     'bollinger_middle', 'bollinger_upper', 'bollinger_lower']
        
        for indicator in indicators:
            self.assertIn(indicator, data_with_indicators.columns)
        
        # Check that NaN values were dropped
        self.assertFalse(data_with_indicators.isnull().any().any())
        
        # Check that indicators have correct values
        # SMA 5 should be the average of 5 days of close prices
        for i in range(4, len(data_with_indicators)):
            expected_sma5 = self.sample_data['close'].iloc[i-4:i+1].mean()
            self.assertAlmostEqual(data_with_indicators['sma_5'].iloc[i], expected_sma5, places=6)
    
    def test_normalize_data(self):
        """
        Test data normalization.
        """
        # Test MinMax normalization
        norm_data, scaler_params = self.processor.normalize_data(self.sample_data, method='minmax')
        
        # Check that normalized data is between 0 and 1
        for col in norm_data.columns:
            if col != 'symbol':
                self.assertGreaterEqual(norm_data[col].min(), 0)
                self.assertLessEqual(norm_data[col].max(), 1)
        
        # Check scaler parameters
        for col in self.sample_data.columns:
            if col != 'symbol':
                self.assertIn(col, scaler_params)
                self.assertIn('min', scaler_params[col])
                self.assertIn('max', scaler_params[col])
        
        # Test Z-score normalization
        norm_data, scaler_params = self.processor.normalize_data(self.sample_data, method='zscore')
        
        # Check scaler parameters
        for col in self.sample_data.columns:
            if col != 'symbol':
                self.assertIn(col, scaler_params)
                self.assertIn('mean', scaler_params[col])
                self.assertIn('std', scaler_params[col])
    
    def test_denormalize(self):
        """
        Test data denormalization.
        """
        # Normalize data
        norm_data, scaler_params = self.processor.normalize_data(self.sample_data, method='minmax')
        
        # Denormalize data
        denorm_data = self.processor.denormalize(norm_data, scaler_params, method='minmax')
        
        # Check that denormalized data matches original data
        for col in self.sample_data.columns:
            if col != 'symbol':
                np.testing.assert_allclose(
                    denorm_data[col].values,
                    self.sample_data[col].values,
                    rtol=1e-10
                )
    
    def test_create_sequences(self):
        """
        Test creating sequences for time series prediction.
        """
        # Create sequences
        seq_length = 10
        horizon = 5
        X, y = self.processor.create_sequences(
            self.sample_data, 
            target_col='close',
            seq_length=seq_length,
            horizon=horizon
        )
        
        # Check shapes
        self.assertEqual(X.shape[0], len(self.sample_data) - seq_length - horizon + 1)
        self.assertEqual(X.shape[1], seq_length)
        self.assertEqual(X.shape[2], len(self.sample_data.columns))
        self.assertEqual(y.shape[0], len(self.sample_data) - seq_length - horizon + 1)
        self.assertEqual(y.shape[1], horizon)
        
        # Check values
        for i in range(len(X)):
            # X should contain the sequence of data
            np.testing.assert_array_equal(
                X[i],
                self.sample_data.iloc[i:i+seq_length].values
            )
            
            # y should contain the target values
            target_idx = self.sample_data.columns.get_loc('close')
            np.testing.assert_array_equal(
                y[i],
                self.sample_data.iloc[i+seq_length:i+seq_length+horizon, target_idx].values
            )
    
    def test_train_val_test_split(self):
        """
        Test splitting data into training, validation, and test sets.
        """
        # Create sequences
        seq_length = 10
        horizon = 5
        X, y = self.processor.create_sequences(
            self.sample_data, 
            target_col='close',
            seq_length=seq_length,
            horizon=horizon
        )
        
        # Split data
        train_ratio = 0.7
        val_ratio = 0.15
        X_train, y_train, X_val, y_val, X_test, y_test = self.processor.train_val_test_split(
            X, y, train_ratio=train_ratio, val_ratio=val_ratio
        )
        
        # Check shapes
        total_samples = len(X)
        expected_train = int(total_samples * train_ratio)
        expected_val = int(total_samples * val_ratio)
        expected_test = total_samples - expected_train - expected_val
        
        self.assertEqual(len(X_train), expected_train)
        self.assertEqual(len(X_val), expected_val)
        self.assertEqual(len(X_test), expected_test)
        
        # Check that data was split correctly
        np.testing.assert_array_equal(X_train, X[:expected_train])
        np.testing.assert_array_equal(X_val, X[expected_train:expected_train+expected_val])
        np.testing.assert_array_equal(X_test, X[expected_train+expected_val:])
    
    def test_prepare_data_for_model(self):
        """
        Test preparing data for model training.
        """
        # Prepare data
        data = self.processor.prepare_data_for_model(
            symbol='TEST',
            start_date='2023-01-01',
            end_date='2023-04-10',
            normalize=True,
            add_indicators=True
        )
        
        # Check that all required keys are present
        required_keys = [
            'symbol', 'original_data', 'normalized_data', 'scaler_params',
            'X_train', 'y_train', 'X_val', 'y_val', 'X_test', 'y_test',
            'feature_columns', 'target_column', 'sequence_length', 'prediction_horizon',
            'metadata'
        ]
        
        for key in required_keys:
            self.assertIn(key, data)
        
        # Check shapes
        self.assertEqual(data['X_train'].shape[2], len(data['feature_columns']))
        self.assertEqual(data['X_val'].shape[2], len(data['feature_columns']))
        self.assertEqual(data['X_test'].shape[2], len(data['feature_columns']))

if __name__ == "__main__":
    unittest.main()