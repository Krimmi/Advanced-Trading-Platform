"""
Correlation Analysis Module
This module provides tools for analyzing correlations between events and fundamental data.
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Union, Tuple
import logging
from datetime import datetime, timedelta
from scipy import stats
from sklearn.linear_model import LinearRegression
import statsmodels.api as sm

# Import event detection module
from .event_detection import FinancialEvent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("correlation_analysis")

class EventFundamentalCorrelation:
    """
    Class for analyzing correlations between events and fundamental data.
    """
    
    def __init__(self):
        """
        Initialize the correlation analysis.
        """
        self.logger = logger
    
    def prepare_event_data(
        self,
        events: List[FinancialEvent],
        event_types: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Prepare event data for correlation analysis.
        
        Args:
            events: List of financial events
            event_types: List of event types to include (optional)
            
        Returns:
            DataFrame with event data
        """
        try:
            # Filter events by type if specified
            if event_types:
                filtered_events = [e for e in events if e.event_type in event_types]
            else:
                filtered_events = events
            
            # Create DataFrame from events
            event_data = []
            for event in filtered_events:
                event_dict = event.to_dict()
                event_dict["date"] = pd.to_datetime(event_dict["date"])
                event_data.append(event_dict)
            
            if not event_data:
                return pd.DataFrame()
            
            df = pd.DataFrame(event_data)
            df.set_index("date", inplace=True)
            df.sort_index(inplace=True)
            
            return df
        except Exception as e:
            self.logger.error(f"Error preparing event data: {e}")
            return pd.DataFrame()
    
    def prepare_fundamental_data(
        self,
        financial_data: List[Dict[str, Any]],
        metrics: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Prepare fundamental data for correlation analysis.
        
        Args:
            financial_data: List of financial data dictionaries
            metrics: List of metrics to include (optional)
            
        Returns:
            DataFrame with fundamental data
        """
        try:
            # Default metrics if not specified
            if metrics is None:
                metrics = [
                    "revenue", "grossProfit", "operatingIncome", "netIncome", "ebitda",
                    "totalAssets", "totalLiabilities", "totalEquity",
                    "operatingCashFlow", "freeCashFlow"
                ]
            
            # Extract metrics from financial data
            fundamental_data = []
            
            for period_data in financial_data:
                date = period_data.get("date", "")
                if not date:
                    continue
                
                data_point = {"date": pd.to_datetime(date)}
                
                # Extract metrics from different financial statements
                for metric in metrics:
                    value = None
                    
                    # Check income statement
                    if "income_statement" in period_data and metric in period_data["income_statement"]:
                        value = period_data["income_statement"][metric]
                    
                    # Check balance sheet
                    elif "balance_sheet" in period_data and metric in period_data["balance_sheet"]:
                        value = period_data["balance_sheet"][metric]
                    
                    # Check cash flow statement
                    elif "cash_flow_statement" in period_data and metric in period_data["cash_flow_statement"]:
                        value = period_data["cash_flow_statement"][metric]
                    
                    # Check key metrics
                    elif "key_metrics" in period_data and metric in period_data["key_metrics"]:
                        value = period_data["key_metrics"][metric]
                    
                    data_point[metric] = value
                
                fundamental_data.append(data_point)
            
            if not fundamental_data:
                return pd.DataFrame()
            
            df = pd.DataFrame(fundamental_data)
            df.set_index("date", inplace=True)
            df.sort_index(inplace=True)
            
            return df
        except Exception as e:
            self.logger.error(f"Error preparing fundamental data: {e}")
            return pd.DataFrame()
    
    def prepare_price_data(
        self,
        price_data: pd.DataFrame,
        window_days: int = 30
    ) -> pd.DataFrame:
        """
        Prepare price data for correlation analysis.
        
        Args:
            price_data: DataFrame with price data
            window_days: Number of days for rolling calculations
            
        Returns:
            DataFrame with processed price data
        """
        try:
            # Make a copy to avoid modifying the original
            df = price_data.copy()
            
            # Ensure date index
            if not isinstance(df.index, pd.DatetimeIndex):
                if "date" in df.columns:
                    df["date"] = pd.to_datetime(df["date"])
                    df.set_index("date", inplace=True)
                else:
                    raise ValueError("Price data must have a date column or DatetimeIndex")
            
            # Sort by date
            df.sort_index(inplace=True)
            
            # Calculate returns
            df["daily_return"] = df["close"].pct_change()
            
            # Calculate rolling metrics
            df["rolling_volatility"] = df["daily_return"].rolling(window=window_days).std()
            df["rolling_return"] = df["close"].pct_change(periods=window_days)
            
            # Calculate moving averages
            df["ma_20"] = df["close"].rolling(window=20).mean()
            df["ma_50"] = df["close"].rolling(window=50).mean()
            df["ma_200"] = df["close"].rolling(window=200).mean()
            
            # Calculate relative strength
            df["rs_20"] = df["close"] / df["ma_20"]
            df["rs_50"] = df["close"] / df["ma_50"]
            df["rs_200"] = df["close"] / df["ma_200"]
            
            return df
        except Exception as e:
            self.logger.error(f"Error preparing price data: {e}")
            return pd.DataFrame()
    
    def calculate_event_impact(
        self,
        events: List[FinancialEvent],
        price_data: pd.DataFrame,
        windows: List[int] = [1, 5, 10, 20]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate the price impact of events.
        
        Args:
            events: List of financial events
            price_data: DataFrame with price data
            windows: List of time windows (in days) to analyze
            
        Returns:
            Dictionary with event impact analysis
        """
        try:
            # Prepare price data
            price_df = self.prepare_price_data(price_data)
            
            # Group events by type
            events_by_type = {}
            for event in events:
                if event.event_type not in events_by_type:
                    events_by_type[event.event_type] = []
                events_by_type[event.event_type].append(event)
            
            # Calculate impact for each event type
            impact_analysis = {}
            
            for event_type, type_events in events_by_type.items():
                # Skip if too few events
                if len(type_events) < 3:
                    continue
                
                impact_analysis[event_type] = {
                    "count": len(type_events),
                    "windows": {}
                }
                
                # Calculate impact for each window
                for window in windows:
                    returns = []
                    volatilities = []
                    volumes = []
                    
                    for event in type_events:
                        event_date = event.date
                        
                        # Find the closest date in price data
                        try:
                            closest_idx = price_df.index.get_indexer([event_date], method="nearest")[0]
                            event_idx = closest_idx
                            
                            # Skip if not enough data after the event
                            if event_idx + window >= len(price_df):
                                continue
                            
                            # Calculate return
                            start_price = price_df["close"].iloc[event_idx]
                            end_price = price_df["close"].iloc[event_idx + window]
                            event_return = (end_price - start_price) / start_price
                            
                            # Calculate volatility
                            event_volatility = price_df["daily_return"].iloc[event_idx:event_idx + window].std()
                            
                            # Calculate volume change
                            if "volume" in price_df.columns:
                                pre_event_volume = price_df["volume"].iloc[max(0, event_idx - window):event_idx].mean()
                                post_event_volume = price_df["volume"].iloc[event_idx:event_idx + window].mean()
                                
                                if pre_event_volume > 0:
                                    volume_change = (post_event_volume - pre_event_volume) / pre_event_volume
                                    volumes.append(volume_change)
                            
                            returns.append(event_return)
                            volatilities.append(event_volatility)
                        except:
                            continue
                    
                    # Calculate statistics
                    if returns:
                        avg_return = sum(returns) / len(returns)
                        median_return = sorted(returns)[len(returns) // 2]
                        std_dev = np.std(returns)
                        
                        # Perform t-test to check if returns are significantly different from zero
                        t_stat, p_value = stats.ttest_1samp(returns, 0)
                        
                        window_analysis = {
                            "avg_return": avg_return,
                            "median_return": median_return,
                            "std_dev": std_dev,
                            "positive_count": sum(1 for r in returns if r > 0),
                            "negative_count": sum(1 for r in returns if r < 0),
                            "t_statistic": t_stat,
                            "p_value": p_value,
                            "significant": p_value < 0.05,
                            "avg_volatility": sum(volatilities) / len(volatilities) if volatilities else None
                        }
                        
                        if volumes:
                            window_analysis["avg_volume_change"] = sum(volumes) / len(volumes)
                        
                        impact_analysis[event_type]["windows"][window] = window_analysis
            
            return impact_analysis
        except Exception as e:
            self.logger.error(f"Error calculating event impact: {e}")
            return {}
    
    def calculate_event_fundamental_correlation(
        self,
        events: List[FinancialEvent],
        financial_data: List[Dict[str, Any]],
        event_types: Optional[List[str]] = None,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, float]]:
        """
        Calculate correlations between events and fundamental metrics.
        
        Args:
            events: List of financial events
            financial_data: List of financial data dictionaries
            event_types: List of event types to include (optional)
            metrics: List of metrics to include (optional)
            
        Returns:
            Dictionary with correlation results
        """
        try:
            # Prepare event data
            event_df = self.prepare_event_data(events, event_types)
            if event_df.empty:
                return {}
            
            # Prepare fundamental data
            fundamental_df = self.prepare_fundamental_data(financial_data, metrics)
            if fundamental_df.empty:
                return {}
            
            # Count events by quarter
            event_df["year"] = event_df.index.year
            event_df["quarter"] = event_df.index.quarter
            
            # Group events by quarter
            event_counts = event_df.groupby(["year", "quarter"]).size().reset_index()
            event_counts.columns = ["year", "quarter", "event_count"]
            
            # Create quarterly event counts by type
            event_type_counts = {}
            for event_type in event_df["event_type"].unique():
                type_df = event_df[event_df["event_type"] == event_type]
                counts = type_df.groupby(["year", "quarter"]).size().reset_index()
                counts.columns = ["year", "quarter", f"{event_type}_count"]
                event_type_counts[event_type] = counts
            
            # Add quarter to fundamental data
            fundamental_df["year"] = fundamental_df.index.year
            fundamental_df["quarter"] = fundamental_df.index.quarter
            
            # Merge event counts with fundamental data
            merged_df = fundamental_df.reset_index().merge(
                event_counts, on=["year", "quarter"], how="left"
            )
            merged_df["event_count"].fillna(0, inplace=True)
            
            # Merge event type counts
            for event_type, counts_df in event_type_counts.items():
                merged_df = merged_df.merge(
                    counts_df, on=["year", "quarter"], how="left"
                )
                merged_df[f"{event_type}_count"].fillna(0, inplace=True)
            
            # Calculate correlations
            correlations = {}
            
            # Overall event count correlations
            event_corr = {}
            for metric in fundamental_df.columns:
                if metric not in ["year", "quarter", "date"]:
                    corr = merged_df[["event_count", metric]].corr().iloc[0, 1]
                    if not pd.isna(corr):
                        event_corr[metric] = corr
            
            correlations["all_events"] = event_corr
            
            # Event type correlations
            for event_type in event_type_counts.keys():
                type_corr = {}
                for metric in fundamental_df.columns:
                    if metric not in ["year", "quarter", "date"]:
                        corr = merged_df[[f"{event_type}_count", metric]].corr().iloc[0, 1]
                        if not pd.isna(corr):
                            type_corr[metric] = corr
                
                correlations[event_type] = type_corr
            
            return correlations
        except Exception as e:
            self.logger.error(f"Error calculating event-fundamental correlation: {e}")
            return {}
    
    def predict_event_outcome(
        self,
        events: List[FinancialEvent],
        price_data: pd.DataFrame,
        financial_data: List[Dict[str, Any]],
        event_type: str,
        prediction_window: int = 5,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Build a model to predict event outcomes based on fundamental data.
        
        Args:
            events: List of financial events
            price_data: DataFrame with price data
            financial_data: List of financial data dictionaries
            event_type: Type of event to analyze
            prediction_window: Number of days for outcome prediction
            metrics: List of fundamental metrics to use as predictors
            
        Returns:
            Dictionary with prediction model results
        """
        try:
            # Filter events by type
            filtered_events = [e for e in events if e.event_type == event_type]
            if not filtered_events:
                return {"error": f"No events found for type: {event_type}"}
            
            # Prepare price data
            price_df = self.prepare_price_data(price_data)
            if price_df.empty:
                return {"error": "Failed to prepare price data"}
            
            # Calculate returns after events
            event_returns = []
            event_dates = []
            
            for event in filtered_events:
                event_date = event.date
                event_dates.append(event_date)
                
                # Find the closest date in price data
                try:
                    closest_idx = price_df.index.get_indexer([event_date], method="nearest")[0]
                    event_idx = closest_idx
                    
                    # Skip if not enough data after the event
                    if event_idx + prediction_window >= len(price_df):
                        continue
                    
                    # Calculate return
                    start_price = price_df["close"].iloc[event_idx]
                    end_price = price_df["close"].iloc[event_idx + prediction_window]
                    event_return = (end_price - start_price) / start_price
                    
                    event_returns.append({
                        "date": event_date,
                        "return": event_return,
                        "positive": event_return > 0
                    })
                except:
                    continue
            
            if not event_returns:
                return {"error": "Failed to calculate event returns"}
            
            # Create DataFrame of event returns
            returns_df = pd.DataFrame(event_returns)
            returns_df.set_index("date", inplace=True)
            
            # Prepare fundamental data
            fundamental_df = self.prepare_fundamental_data(financial_data, metrics)
            if fundamental_df.empty:
                return {"error": "Failed to prepare fundamental data"}
            
            # For each event, find the most recent fundamental data
            event_fundamentals = []
            
            for event_date in returns_df.index:
                # Find the most recent fundamental data before the event
                prior_fundamentals = fundamental_df[fundamental_df.index < event_date]
                if prior_fundamentals.empty:
                    continue
                
                most_recent = prior_fundamentals.iloc[-1].to_dict()
                most_recent["event_date"] = event_date
                event_fundamentals.append(most_recent)
            
            if not event_fundamentals:
                return {"error": "Failed to match events with fundamental data"}
            
            # Create DataFrame of event fundamentals
            fundamentals_df = pd.DataFrame(event_fundamentals)
            fundamentals_df.set_index("event_date", inplace=True)
            
            # Merge returns with fundamentals
            merged_df = returns_df.join(fundamentals_df, how="inner")
            
            if merged_df.empty or len(merged_df) < 5:
                return {"error": "Insufficient data for modeling"}
            
            # Prepare features and target
            X = merged_df.drop(["return", "positive"], axis=1)
            y_return = merged_df["return"]
            y_direction = merged_df["positive"].astype(int)
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Add constant for statsmodels
            X_sm = sm.add_constant(X)
            
            # Build linear regression model for returns
            model_return = sm.OLS(y_return, X_sm).fit()
            
            # Build logistic regression model for direction
            model_direction = sm.Logit(y_direction, X_sm).fit(disp=0)
            
            # Calculate feature importance
            return_importance = pd.Series(abs(model_return.params[1:]), index=X.columns)
            return_importance = return_importance / return_importance.sum()
            
            direction_importance = pd.Series(abs(model_direction.params[1:]), index=X.columns)
            direction_importance = direction_importance / direction_importance.sum()
            
            # Prepare results
            results = {
                "event_type": event_type,
                "sample_size": len(merged_df),
                "prediction_window": prediction_window,
                "return_model": {
                    "r_squared": model_return.rsquared,
                    "adj_r_squared": model_return.rsquared_adj,
                    "p_value": model_return.f_pvalue,
                    "feature_importance": return_importance.to_dict()
                },
                "direction_model": {
                    "accuracy": (model_direction.pred_table()[0, 0] + model_direction.pred_table()[1, 1]) / model_direction.pred_table().sum(),
                    "pseudo_r_squared": model_direction.prsquared,
                    "feature_importance": direction_importance.to_dict()
                },
                "significant_features": {}
            }
            
            # Add significant features
            for feature in X.columns:
                if feature in model_return.pvalues and model_return.pvalues[feature] < 0.1:
                    results["significant_features"][feature] = {
                        "coefficient": model_return.params[feature],
                        "p_value": model_return.pvalues[feature],
                        "direction": "positive" if model_return.params[feature] > 0 else "negative"
                    }
            
            return results
        except Exception as e:
            self.logger.error(f"Error building prediction model: {e}")
            return {"error": str(e)}
    
    def analyze_event_clusters(
        self,
        events: List[FinancialEvent],
        price_data: pd.DataFrame,
        max_days_between: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze clusters of events and their combined impact.
        
        Args:
            events: List of financial events
            price_data: DataFrame with price data
            max_days_between: Maximum days between events to be considered a cluster
            
        Returns:
            Dictionary with cluster analysis results
        """
        try:
            # Sort events by date
            sorted_events = sorted(events, key=lambda e: e.date)
            
            # Find clusters
            clusters = []
            current_cluster = []
            
            for i, event in enumerate(sorted_events):
                if not current_cluster:
                    current_cluster.append(event)
                else:
                    # Check if this event is within max_days_between of the last event in the cluster
                    last_event = current_cluster[-1]
                    days_between = (event.date - last_event.date).days
                    
                    if days_between <= max_days_between:
                        current_cluster.append(event)
                    else:
                        # Save current cluster and start a new one
                        if len(current_cluster) > 1:
                            clusters.append(current_cluster)
                        current_cluster = [event]
            
            # Add the last cluster if it has more than one event
            if len(current_cluster) > 1:
                clusters.append(current_cluster)
            
            # Analyze each cluster
            cluster_analysis = []
            
            for i, cluster in enumerate(clusters):
                # Get cluster details
                start_date = cluster[0].date
                end_date = cluster[-1].date
                duration = (end_date - start_date).days
                event_types = [e.event_type for e in cluster]
                
                # Calculate price impact
                try:
                    # Find the closest date in price data for start and end
                    price_df = price_data.copy()
                    if not isinstance(price_df.index, pd.DatetimeIndex):
                        if "date" in price_df.columns:
                            price_df["date"] = pd.to_datetime(price_df["date"])
                            price_df.set_index("date", inplace=True)
                    
                    start_idx = price_df.index.get_indexer([start_date], method="nearest")[0]
                    
                    # Look at returns 1, 5, 10, 20 days after the cluster ends
                    windows = [1, 5, 10, 20]
                    returns = {}
                    
                    for window in windows:
                        end_idx = price_df.index.get_indexer([end_date], method="nearest")[0]
                        
                        # Skip if not enough data after the cluster
                        if end_idx + window >= len(price_df):
                            continue
                        
                        # Calculate return
                        start_price = price_df["close"].iloc[end_idx]
                        end_price = price_df["close"].iloc[end_idx + window]
                        window_return = (end_price - start_price) / start_price
                        
                        returns[f"{window}_day"] = window_return
                    
                    # Calculate return during the cluster
                    cluster_start_price = price_df["close"].iloc[start_idx]
                    cluster_end_price = price_df["close"].iloc[end_idx]
                    cluster_return = (cluster_end_price - cluster_start_price) / cluster_start_price
                    
                    # Calculate volatility during the cluster
                    if start_idx < end_idx:
                        cluster_volatility = price_df["close"].iloc[start_idx:end_idx+1].pct_change().std()
                    else:
                        cluster_volatility = None
                    
                    # Calculate volume change during the cluster
                    if "volume" in price_df.columns and start_idx < end_idx:
                        pre_cluster_volume = price_df["volume"].iloc[max(0, start_idx - duration):start_idx].mean() if start_idx > 0 else None
                        cluster_volume = price_df["volume"].iloc[start_idx:end_idx+1].mean()
                        
                        if pre_cluster_volume and pre_cluster_volume > 0:
                            volume_change = (cluster_volume - pre_cluster_volume) / pre_cluster_volume
                        else:
                            volume_change = None
                    else:
                        volume_change = None
                    
                    cluster_analysis.append({
                        "cluster_id": i + 1,
                        "start_date": start_date.isoformat(),
                        "end_date": end_date.isoformat(),
                        "duration_days": duration,
                        "num_events": len(cluster),
                        "event_types": event_types,
                        "event_type_counts": {event_type: event_types.count(event_type) for event_type in set(event_types)},
                        "cluster_return": cluster_return,
                        "cluster_volatility": cluster_volatility,
                        "volume_change": volume_change,
                        "post_cluster_returns": returns
                    })
                except:
                    # Skip clusters with price data issues
                    continue
            
            # Analyze cluster statistics
            if cluster_analysis:
                avg_duration = sum(c["duration_days"] for c in cluster_analysis) / len(cluster_analysis)
                avg_num_events = sum(c["num_events"] for c in cluster_analysis) / len(cluster_analysis)
                avg_cluster_return = sum(c["cluster_return"] for c in cluster_analysis if c["cluster_return"] is not None) / sum(1 for c in cluster_analysis if c["cluster_return"] is not None)
                
                # Count clusters with positive returns
                positive_clusters = sum(1 for c in cluster_analysis if c["cluster_return"] is not None and c["cluster_return"] > 0)
                negative_clusters = sum(1 for c in cluster_analysis if c["cluster_return"] is not None and c["cluster_return"] <= 0)
                
                # Analyze post-cluster returns
                post_returns = {}
                for window in [1, 5, 10, 20]:
                    window_key = f"{window}_day"
                    window_returns = [c["post_cluster_returns"].get(window_key) for c in cluster_analysis if window_key in c["post_cluster_returns"]]
                    
                    if window_returns:
                        avg_return = sum(window_returns) / len(window_returns)
                        positive_count = sum(1 for r in window_returns if r > 0)
                        negative_count = sum(1 for r in window_returns if r <= 0)
                        
                        post_returns[window_key] = {
                            "avg_return": avg_return,
                            "positive_count": positive_count,
                            "negative_count": negative_count,
                            "positive_ratio": positive_count / len(window_returns)
                        }
                
                # Analyze most common event type combinations
                event_combinations = {}
                for cluster in cluster_analysis:
                    event_types = frozenset(cluster["event_type_counts"].keys())
                    if event_types in event_combinations:
                        event_combinations[event_types] += 1
                    else:
                        event_combinations[event_types] = 1
                
                top_combinations = sorted(
                    [(list(combo), count) for combo, count in event_combinations.items()],
                    key=lambda x: x[1],
                    reverse=True
                )[:5]
                
                statistics = {
                    "total_clusters": len(cluster_analysis),
                    "avg_duration_days": avg_duration,
                    "avg_events_per_cluster": avg_num_events,
                    "avg_cluster_return": avg_cluster_return,
                    "positive_clusters": positive_clusters,
                    "negative_clusters": negative_clusters,
                    "positive_ratio": positive_clusters / (positive_clusters + negative_clusters) if (positive_clusters + negative_clusters) > 0 else None,
                    "post_cluster_returns": post_returns,
                    "top_event_combinations": [{"types": combo, "count": count} for combo, count in top_combinations]
                }
            else:
                statistics = {"total_clusters": 0}
            
            return {
                "clusters": cluster_analysis,
                "statistics": statistics
            }
        except Exception as e:
            self.logger.error(f"Error analyzing event clusters: {e}")
            return {"error": str(e)}