"""
Data Preprocessing Module

This module provides tools for cleaning, transforming, and preparing data for analysis and modeling.
It includes functions for handling missing values, outliers, feature engineering, and normalization.
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Union, Tuple, Callable
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

class DataPreprocessor:
    """
    Handles data preprocessing tasks including cleaning, transformation, and feature engineering.
    """
    
    def __init__(self):
        self.preprocessing_pipelines = {}
    
    def register_pipeline(self, name: str, pipeline: Pipeline) -> None:
        """Register a scikit-learn pipeline for preprocessing."""
        self.preprocessing_pipelines[name] = pipeline
        logger.info(f"Preprocessing pipeline '{name}' registered.")
    
    def get_pipeline(self, name: str) -> Pipeline:
        """Get a registered preprocessing pipeline."""
        if name not in self.preprocessing_pipelines:
            raise ValueError(f"Preprocessing pipeline '{name}' not found.")
        return self.preprocessing_pipelines[name]
    
    def clean_market_data(self, data: pd.DataFrame, 
                         handle_missing: str = 'ffill',
                         handle_outliers: bool = True,
                         min_date: Optional[str] = None,
                         max_date: Optional[str] = None) -> pd.DataFrame:
        """
        Clean market data by handling missing values, outliers, and filtering by date.
        
        Args:
            data: DataFrame containing market data
            handle_missing: Method to handle missing values ('ffill', 'bfill', 'interpolate', 'drop', 'none')
            handle_outliers: Whether to detect and handle outliers
            min_date: Minimum date to include (YYYY-MM-DD)
            max_date: Maximum date to include (YYYY-MM-DD)
            
        Returns:
            Cleaned DataFrame
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for cleaning.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Ensure DataFrame has a datetime index
        if not isinstance(df.index, pd.DatetimeIndex):
            if 'date' in df.columns:
                df = df.set_index('date')
            elif 'timestamp' in df.columns:
                df = df.set_index('timestamp')
            else:
                logger.warning("DataFrame does not have a datetime index or date/timestamp column.")
        
        # Filter by date if specified
        if isinstance(df.index, pd.DatetimeIndex):
            if min_date:
                df = df[df.index >= pd.Timestamp(min_date)]
            if max_date:
                df = df[df.index <= pd.Timestamp(max_date)]
        
        # Handle missing values
        if handle_missing == 'ffill':
            df = df.fillna(method='ffill')
        elif handle_missing == 'bfill':
            df = df.fillna(method='bfill')
        elif handle_missing == 'interpolate':
            df = df.interpolate(method='time')
        elif handle_missing == 'drop':
            df = df.dropna()
        
        # Handle outliers if requested
        if handle_outliers:
            for col in df.select_dtypes(include=[np.number]).columns:
                # Calculate IQR
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                
                # Define bounds
                lower_bound = Q1 - 3 * IQR
                upper_bound = Q3 + 3 * IQR
                
                # Replace outliers with bounds
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
        
        return df
    
    def calculate_technical_indicators(self, data: pd.DataFrame, 
                                      indicators: List[str] = None) -> pd.DataFrame:
        """
        Calculate technical indicators for market data.
        
        Args:
            data: DataFrame containing market data with OHLCV columns
            indicators: List of indicators to calculate (default: all available)
            
        Returns:
            DataFrame with added technical indicators
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for technical indicators.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Default indicators if none specified
        all_indicators = [
            'sma', 'ema', 'rsi', 'macd', 'bollinger_bands', 
            'atr', 'adx', 'obv', 'roc', 'momentum'
        ]
        indicators = indicators or all_indicators
        
        # Check required columns
        required_cols = {
            'open': df.columns.str.lower().str.contains('open'),
            'high': df.columns.str.lower().str.contains('high'),
            'low': df.columns.str.lower().str.contains('low'),
            'close': df.columns.str.lower().str.contains('close'),
            'volume': df.columns.str.lower().str.contains('volume')
        }
        
        missing_cols = [col for col, exists in required_cols.items() if not any(exists)]
        if missing_cols:
            logger.warning(f"Missing required columns for technical indicators: {missing_cols}")
            return df
        
        # Get column names (case insensitive)
        col_map = {}
        for req_col in required_cols.keys():
            matching_cols = [col for col in df.columns if col.lower().startswith(req_col)]
            if matching_cols:
                col_map[req_col] = matching_cols[0]
        
        # Calculate indicators
        if 'sma' in indicators:
            # Simple Moving Average
            for window in [5, 10, 20, 50, 200]:
                df[f'sma_{window}'] = df[col_map['close']].rolling(window=window).mean()
        
        if 'ema' in indicators:
            # Exponential Moving Average
            for window in [5, 10, 20, 50, 200]:
                df[f'ema_{window}'] = df[col_map['close']].ewm(span=window, adjust=False).mean()
        
        if 'rsi' in indicators:
            # Relative Strength Index
            delta = df[col_map['close']].diff()
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            
            rs = avg_gain / avg_loss
            df['rsi_14'] = 100 - (100 / (1 + rs))
        
        if 'macd' in indicators:
            # Moving Average Convergence Divergence
            ema_12 = df[col_map['close']].ewm(span=12, adjust=False).mean()
            ema_26 = df[col_map['close']].ewm(span=26, adjust=False).mean()
            df['macd'] = ema_12 - ema_26
            df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
            df['macd_hist'] = df['macd'] - df['macd_signal']
        
        if 'bollinger_bands' in indicators:
            # Bollinger Bands
            window = 20
            sma = df[col_map['close']].rolling(window=window).mean()
            std = df[col_map['close']].rolling(window=window).std()
            df['bb_upper'] = sma + (std * 2)
            df['bb_middle'] = sma
            df['bb_lower'] = sma - (std * 2)
        
        if 'atr' in indicators:
            # Average True Range
            high = df[col_map['high']]
            low = df[col_map['low']]
            close = df[col_map['close']]
            
            tr1 = high - low
            tr2 = (high - close.shift()).abs()
            tr3 = (low - close.shift()).abs()
            
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            df['atr_14'] = tr.rolling(window=14).mean()
        
        if 'adx' in indicators:
            # Average Directional Index
            high = df[col_map['high']]
            low = df[col_map['low']]
            close = df[col_map['close']]
            
            # True Range
            tr1 = high - low
            tr2 = (high - close.shift()).abs()
            tr3 = (low - close.shift()).abs()
            tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
            
            # Directional Movement
            up_move = high - high.shift()
            down_move = low.shift() - low
            
            pos_dm = up_move.where((up_move > down_move) & (up_move > 0), 0)
            neg_dm = down_move.where((down_move > up_move) & (down_move > 0), 0)
            
            # Smoothed values
            window = 14
            tr_smooth = tr.rolling(window).sum()
            pos_dm_smooth = pos_dm.rolling(window).sum()
            neg_dm_smooth = neg_dm.rolling(window).sum()
            
            # Directional Indicators
            pdi = 100 * pos_dm_smooth / tr_smooth
            ndi = 100 * neg_dm_smooth / tr_smooth
            
            # ADX
            dx = 100 * (pdi - ndi).abs() / (pdi + ndi)
            df['adx_14'] = dx.rolling(window).mean()
        
        if 'obv' in indicators:
            # On-Balance Volume
            df['obv'] = np.where(
                df[col_map['close']] > df[col_map['close']].shift(),
                df[col_map['volume']],
                np.where(
                    df[col_map['close']] < df[col_map['close']].shift(),
                    -df[col_map['volume']],
                    0
                )
            ).cumsum()
        
        if 'roc' in indicators:
            # Rate of Change
            for window in [5, 10, 20]:
                df[f'roc_{window}'] = df[col_map['close']].pct_change(periods=window) * 100
        
        if 'momentum' in indicators:
            # Momentum
            for window in [5, 10, 20]:
                df[f'momentum_{window}'] = df[col_map['close']] - df[col_map['close']].shift(window)
        
        return df
    
    def normalize_data(self, data: pd.DataFrame, method: str = 'standard',
                      columns: List[str] = None) -> pd.DataFrame:
        """
        Normalize numerical data using various scaling methods.
        
        Args:
            data: DataFrame to normalize
            method: Normalization method ('standard', 'minmax', 'robust')
            columns: Specific columns to normalize (default: all numeric)
            
        Returns:
            Normalized DataFrame
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for normalization.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Select columns to normalize
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            # Filter to only include columns that exist and are numeric
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            columns = [col for col in columns if col in numeric_cols]
        
        if not columns:
            logger.warning("No numeric columns found for normalization.")
            return df
        
        # Choose scaler based on method
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'minmax':
            scaler = MinMaxScaler()
        elif method == 'robust':
            scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown normalization method: {method}")
        
        # Fit and transform
        df[columns] = scaler.fit_transform(df[columns])
        
        return df
    
    def create_time_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Create time-based features from a DataFrame with a datetime index.
        
        Args:
            data: DataFrame with datetime index
            
        Returns:
            DataFrame with additional time features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for time feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Ensure DataFrame has a datetime index
        if not isinstance(df.index, pd.DatetimeIndex):
            if 'date' in df.columns:
                df = df.set_index('date')
            elif 'timestamp' in df.columns:
                df = df.set_index('timestamp')
            else:
                logger.warning("DataFrame does not have a datetime index or date/timestamp column.")
                return df
        
        # Extract time features
        df['year'] = df.index.year
        df['month'] = df.index.month
        df['day'] = df.index.day
        df['day_of_week'] = df.index.dayofweek
        df['day_of_year'] = df.index.dayofyear
        df['week_of_year'] = df.index.isocalendar().week
        df['is_month_start'] = df.index.is_month_start.astype(int)
        df['is_month_end'] = df.index.is_month_end.astype(int)
        df['is_quarter_start'] = df.index.is_quarter_start.astype(int)
        df['is_quarter_end'] = df.index.is_quarter_end.astype(int)
        df['is_year_start'] = df.index.is_year_start.astype(int)
        df['is_year_end'] = df.index.is_year_end.astype(int)
        
        # Add cyclical features for month, day of week, etc.
        df['month_sin'] = np.sin(2 * np.pi * df.index.month / 12)
        df['month_cos'] = np.cos(2 * np.pi * df.index.month / 12)
        df['day_of_week_sin'] = np.sin(2 * np.pi * df.index.dayofweek / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df.index.dayofweek / 7)
        
        return df
    
    def create_lagged_features(self, data: pd.DataFrame, columns: List[str] = None,
                              lags: List[int] = [1, 5, 10]) -> pd.DataFrame:
        """
        Create lagged features for time series data.
        
        Args:
            data: DataFrame with time series data
            columns: Columns to create lags for (default: all numeric)
            lags: List of lag periods to create
            
        Returns:
            DataFrame with additional lagged features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for lagged feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Select columns to create lags for
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Create lagged features
        for col in columns:
            for lag in lags:
                df[f'{col}_lag_{lag}'] = df[col].shift(lag)
        
        return df
    
    def create_rolling_features(self, data: pd.DataFrame, columns: List[str] = None,
                               windows: List[int] = [5, 10, 20],
                               functions: List[str] = ['mean', 'std', 'min', 'max']) -> pd.DataFrame:
        """
        Create rolling window features for time series data.
        
        Args:
            data: DataFrame with time series data
            columns: Columns to create rolling features for (default: all numeric)
            windows: List of window sizes
            functions: List of functions to apply to rolling windows
            
        Returns:
            DataFrame with additional rolling features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for rolling feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Select columns to create rolling features for
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Map function names to actual functions
        func_map = {
            'mean': np.mean,
            'std': np.std,
            'min': np.min,
            'max': np.max,
            'median': np.median,
            'sum': np.sum,
            'var': np.var
        }
        
        # Create rolling features
        for col in columns:
            for window in windows:
                for func_name in functions:
                    if func_name in func_map:
                        df[f'{col}_roll_{window}_{func_name}'] = df[col].rolling(window=window).agg(func_map[func_name])
        
        return df
    
    def create_expanding_features(self, data: pd.DataFrame, columns: List[str] = None,
                                 functions: List[str] = ['mean', 'std', 'min', 'max']) -> pd.DataFrame:
        """
        Create expanding window features for time series data.
        
        Args:
            data: DataFrame with time series data
            columns: Columns to create expanding features for (default: all numeric)
            functions: List of functions to apply to expanding windows
            
        Returns:
            DataFrame with additional expanding features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for expanding feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Select columns to create expanding features for
        if columns is None:
            columns = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Map function names to actual functions
        func_map = {
            'mean': np.mean,
            'std': np.std,
            'min': np.min,
            'max': np.max,
            'median': np.median,
            'sum': np.sum,
            'var': np.var
        }
        
        # Create expanding features
        for col in columns:
            for func_name in functions:
                if func_name in func_map:
                    df[f'{col}_expand_{func_name}'] = df[col].expanding().agg(func_map[func_name])
        
        return df
    
    def create_return_features(self, data: pd.DataFrame, price_col: str = 'close',
                              periods: List[int] = [1, 5, 10, 20]) -> pd.DataFrame:
        """
        Create return-based features for financial time series.
        
        Args:
            data: DataFrame with financial time series data
            price_col: Column name containing price data
            periods: List of periods for calculating returns
            
        Returns:
            DataFrame with additional return features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for return feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Find the price column (case insensitive)
        if price_col not in df.columns:
            matching_cols = [col for col in df.columns if col.lower() == price_col.lower()]
            if matching_cols:
                price_col = matching_cols[0]
            else:
                logger.warning(f"Price column '{price_col}' not found in DataFrame.")
                return df
        
        # Calculate simple returns
        for period in periods:
            df[f'return_{period}d'] = df[price_col].pct_change(periods=period)
        
        # Calculate log returns
        for period in periods:
            df[f'log_return_{period}d'] = np.log(df[price_col] / df[price_col].shift(period))
        
        # Calculate cumulative returns
        df['cum_return'] = (1 + df[f'return_1d']).cumprod() - 1
        
        # Calculate volatility (rolling standard deviation of returns)
        for window in [5, 10, 20, 60]:
            df[f'volatility_{window}d'] = df[f'return_1d'].rolling(window=window).std()
        
        return df
    
    def create_interaction_features(self, data: pd.DataFrame, 
                                   feature_pairs: List[Tuple[str, str]] = None) -> pd.DataFrame:
        """
        Create interaction features between pairs of numeric columns.
        
        Args:
            data: DataFrame with numeric columns
            feature_pairs: List of column name pairs to create interactions for
                          (default: all pairs of numeric columns)
            
        Returns:
            DataFrame with additional interaction features
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for interaction feature creation.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Get numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Generate all pairs if not specified
        if feature_pairs is None:
            import itertools
            feature_pairs = list(itertools.combinations(numeric_cols, 2))
        
        # Create interaction features
        for col1, col2 in feature_pairs:
            if col1 in df.columns and col2 in df.columns:
                # Product
                df[f'{col1}_x_{col2}'] = df[col1] * df[col2]
                
                # Sum
                df[f'{col1}_plus_{col2}'] = df[col1] + df[col2]
                
                # Difference
                df[f'{col1}_minus_{col2}'] = df[col1] - df[col2]
                
                # Ratio (with error handling)
                df[f'{col1}_div_{col2}'] = df[col1] / df[col2].replace(0, np.nan)
        
        return df
    
    def reduce_dimensions(self, data: pd.DataFrame, method: str = 'pca',
                         n_components: int = None, variance_threshold: float = 0.95) -> pd.DataFrame:
        """
        Reduce dimensionality of the dataset.
        
        Args:
            data: DataFrame with numeric columns
            method: Dimensionality reduction method ('pca')
            n_components: Number of components to keep
            variance_threshold: Minimum explained variance to retain
            
        Returns:
            DataFrame with reduced dimensions
        """
        if data.empty:
            logger.warning("Empty DataFrame provided for dimensionality reduction.")
            return data
        
        # Make a copy to avoid modifying the original
        df = data.copy()
        
        # Select only numeric columns
        numeric_df = df.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            logger.warning("No numeric columns found for dimensionality reduction.")
            return df
        
        # Handle missing values
        numeric_df = numeric_df.fillna(numeric_df.mean())
        
        # Choose method
        if method == 'pca':
            # Determine number of components
            if n_components is None:
                pca = PCA(n_components=variance_threshold, svd_solver='full')
            else:
                pca = PCA(n_components=n_components)
            
            # Fit and transform
            components = pca.fit_transform(numeric_df)
            
            # Create component columns
            component_cols = [f'PC{i+1}' for i in range(components.shape[1])]
            component_df = pd.DataFrame(components, index=df.index, columns=component_cols)
            
            # Add explained variance as metadata
            explained_variance = pca.explained_variance_ratio_
            cumulative_variance = np.cumsum(explained_variance)
            
            logger.info(f"PCA explained variance: {cumulative_variance[-1]:.4f} with {len(component_cols)} components")
            
            # Replace numeric columns with components
            non_numeric_cols = [col for col in df.columns if col not in numeric_df.columns]
            result_df = pd.concat([df[non_numeric_cols], component_df], axis=1)
            
            return result_df
        else:
            raise ValueError(f"Unknown dimensionality reduction method: {method}")
    
    def create_preprocessing_pipeline(self, name: str, steps: List[Dict[str, Any]]) -> Pipeline:
        """
        Create and register a preprocessing pipeline with multiple steps.
        
        Args:
            name: Name for the pipeline
            steps: List of preprocessing steps, each a dict with 'type' and parameters
            
        Returns:
            The created scikit-learn Pipeline
        """
        pipeline_steps = []
        
        for i, step in enumerate(steps):
            step_type = step.pop('type')
            
            if step_type == 'imputer':
                strategy = step.get('strategy', 'mean')
                if strategy == 'knn':
                    n_neighbors = step.get('n_neighbors', 5)
                    pipeline_steps.append((f'imputer_{i}', KNNImputer(n_neighbors=n_neighbors)))
                else:
                    pipeline_steps.append((f'imputer_{i}', SimpleImputer(strategy=strategy)))
            
            elif step_type == 'scaler':
                method = step.get('method', 'standard')
                if method == 'standard':
                    pipeline_steps.append((f'scaler_{i}', StandardScaler()))
                elif method == 'minmax':
                    pipeline_steps.append((f'scaler_{i}', MinMaxScaler()))
                elif method == 'robust':
                    pipeline_steps.append((f'scaler_{i}', RobustScaler()))
            
            elif step_type == 'pca':
                n_components = step.get('n_components', None)
                variance_threshold = step.get('variance_threshold', 0.95)
                
                if n_components is None:
                    pipeline_steps.append((f'pca_{i}', PCA(n_components=variance_threshold)))
                else:
                    pipeline_steps.append((f'pca_{i}', PCA(n_components=n_components)))
        
        # Create the pipeline
        pipeline = Pipeline(pipeline_steps)
        
        # Register the pipeline
        self.register_pipeline(name, pipeline)
        
        return pipeline
    
    def apply_pipeline(self, name: str, data: pd.DataFrame, 
                      fit: bool = True) -> pd.DataFrame:
        """
        Apply a registered preprocessing pipeline to data.
        
        Args:
            name: Name of the registered pipeline
            data: DataFrame to preprocess
            fit: Whether to fit the pipeline (True) or just transform (False)
            
        Returns:
            Preprocessed DataFrame
        """
        pipeline = self.get_pipeline(name)
        
        # Select only numeric columns
        numeric_df = data.select_dtypes(include=[np.number])
        
        if numeric_df.empty:
            logger.warning("No numeric columns found for pipeline application.")
            return data
        
        # Apply pipeline
        if fit:
            transformed = pipeline.fit_transform(numeric_df)
        else:
            transformed = pipeline.transform(numeric_df)
        
        # Create DataFrame with transformed data
        transformed_df = pd.DataFrame(
            transformed, 
            index=data.index, 
            columns=numeric_df.columns
        )
        
        # Combine with non-numeric columns
        non_numeric_cols = [col for col in data.columns if col not in numeric_df.columns]
        result = pd.concat([data[non_numeric_cols], transformed_df], axis=1)
        
        return result


# Create the global preprocessor instance
preprocessor = DataPreprocessor()

# Export functions for easier access
def clean_market_data(data: pd.DataFrame, handle_missing: str = 'ffill',
                     handle_outliers: bool = True,
                     min_date: Optional[str] = None,
                     max_date: Optional[str] = None) -> pd.DataFrame:
    """Clean market data by handling missing values, outliers, and filtering by date."""
    return preprocessor.clean_market_data(data, handle_missing, handle_outliers, min_date, max_date)

def calculate_technical_indicators(data: pd.DataFrame, 
                                  indicators: List[str] = None) -> pd.DataFrame:
    """Calculate technical indicators for market data."""
    return preprocessor.calculate_technical_indicators(data, indicators)

def normalize_data(data: pd.DataFrame, method: str = 'standard',
                  columns: List[str] = None) -> pd.DataFrame:
    """Normalize numerical data using various scaling methods."""
    return preprocessor.normalize_data(data, method, columns)

def create_time_features(data: pd.DataFrame) -> pd.DataFrame:
    """Create time-based features from a DataFrame with a datetime index."""
    return preprocessor.create_time_features(data)

def create_lagged_features(data: pd.DataFrame, columns: List[str] = None,
                          lags: List[int] = [1, 5, 10]) -> pd.DataFrame:
    """Create lagged features for time series data."""
    return preprocessor.create_lagged_features(data, columns, lags)

def create_rolling_features(data: pd.DataFrame, columns: List[str] = None,
                           windows: List[int] = [5, 10, 20],
                           functions: List[str] = ['mean', 'std', 'min', 'max']) -> pd.DataFrame:
    """Create rolling window features for time series data."""
    return preprocessor.create_rolling_features(data, columns, windows, functions)

def create_return_features(data: pd.DataFrame, price_col: str = 'close',
                          periods: List[int] = [1, 5, 10, 20]) -> pd.DataFrame:
    """Create return-based features for financial time series."""
    return preprocessor.create_return_features(data, price_col, periods)

def reduce_dimensions(data: pd.DataFrame, method: str = 'pca',
                     n_components: int = None, variance_threshold: float = 0.95) -> pd.DataFrame:
    """Reduce dimensionality of the dataset."""
    return preprocessor.reduce_dimensions(data, method, n_components, variance_threshold)