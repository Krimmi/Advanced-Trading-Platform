"""
Router for event-fundamental correlation analysis endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from scipy import stats

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import event detection and financial analysis modules
from src.ml_models.fundamental_analysis.event_detection import (
    EventDetectionService, FinancialEvent
)
from src.ml_models.fundamental_analysis.financial_analysis import FinancialStatementAnalysis

# Import fundamental data router for FMP API access
from .fundamental_data import get_fmp_data
from .event_detection_router import get_all_events

router = APIRouter()

# Initialize services
event_detection_service = EventDetectionService()
financial_analysis_service = FinancialStatementAnalysis()

async def get_financial_metrics(
    symbol: str,
    period: str = "quarter",
    limit: int = 12
) -> Dict[str, pd.Series]:
    """
    Helper function to get financial metrics time series.
    """
    try:
        # Get income statements
        income_statements = await get_fmp_data(f"income-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get balance sheets
        balance_sheets = await get_fmp_data(f"balance-sheet-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get cash flow statements
        cash_flows = await get_fmp_data(f"cash-flow-statement/{symbol}", {"period": period, "limit": limit})
        
        # Get key metrics
        key_metrics = await get_fmp_data(f"key-metrics/{symbol}", {"period": period, "limit": limit})
        
        # Get financial ratios
        financial_ratios = await get_fmp_data(f"ratios/{symbol}", {"period": period, "limit": limit})
        
        # Combine data for each period
        financial_data = []
        
        # Process each period's data
        for i in range(min(len(income_statements), len(balance_sheets), len(cash_flows))):
            period_data = {
                "date": income_statements[i]["date"],
                "income_statement": income_statements[i],
                "balance_sheet": balance_sheets[i],
                "cash_flow_statement": cash_flows[i],
            }
            
            # Add key metrics if available
            if i < len(key_metrics):
                period_data["key_metrics"] = key_metrics[i]
            
            # Add financial ratios if available
            if i < len(financial_ratios):
                period_data["financial_ratios"] = financial_ratios[i]
            
            financial_data.append(period_data)
        
        # Analyze financial trends
        trend_series = financial_analysis_service.analyze_financial_trends(financial_data)
        
        return trend_series
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting financial metrics: {str(e)}")

@router.get("/event-metric-correlation/{symbol}")
async def analyze_event_metric_correlation(
    symbol: str,
    event_type: str = Query(..., description="Type of event to analyze"),
    metrics: List[str] = Query(..., description="List of financial metrics to correlate with events"),
    window_days: int = Query(30, description="Number of days around events to analyze"),
    lookback_days: int = Query(365, description="Number of days to look back for events")
) -> Dict[str, Any]:
    """
    Analyze correlation between events and financial metrics.
    """
    try:
        # Get events
        events_response = await get_all_events(symbol, lookback_days)
        
        # Convert dictionary events back to FinancialEvent objects
        all_events = [FinancialEvent.from_dict(event_dict) for event_dict in events_response]
        
        # Filter by event type if specified
        if event_type != "all":
            events = [event for event in all_events if event.event_type == event_type]
        else:
            events = all_events
        
        if not events:
            raise HTTPException(status_code=404, detail=f"No {event_type} events found for symbol: {symbol}")
        
        # Get financial metrics
        financial_metrics = await get_financial_metrics(symbol, "quarter", 20)
        
        # Filter metrics to only include requested ones
        if metrics[0] != "all":
            filtered_metrics = {}
            for metric in metrics:
                if metric in financial_metrics:
                    filtered_metrics[metric] = financial_metrics[metric]
            financial_metrics = filtered_metrics
        
        if not financial_metrics:
            raise HTTPException(status_code=404, detail=f"No financial metrics found for symbol: {symbol}")
        
        # Get price data
        price_data_response = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": lookback_days})
        
        if not price_data_response or "historical" not in price_data_response:
            raise HTTPException(status_code=404, detail=f"Price data not found for symbol: {symbol}")
        
        # Convert to pandas DataFrame
        historical = price_data_response["historical"]
        price_df = pd.DataFrame(historical)
        price_df['date'] = pd.to_datetime(price_df['date'])
        price_df.set_index('date', inplace=True)
        price_df.sort_index(inplace=True)
        
        # Analyze correlation between events and metrics
        correlations = {}
        
        for metric_name, metric_series in financial_metrics.items():
            # Convert metric series to datetime index if it's not already
            if not isinstance(metric_series.index, pd.DatetimeIndex):
                try:
                    metric_series.index = pd.to_datetime(metric_series.index)
                except:
                    continue
            
            # Sort by date
            metric_series = metric_series.sort_index()
            
            # For each event, find the nearest metric value
            event_metric_values = []
            
            for event in events:
                event_date = pd.to_datetime(event.date)
                
                # Find the nearest metric date after the event
                try:
                    nearest_date = metric_series.index[metric_series.index >= event_date][0]
                    event_metric_values.append((event, metric_series[nearest_date]))
                except IndexError:
                    # No metric value after this event
                    continue
            
            if not event_metric_values:
                continue
            
            # Calculate price changes after events
            price_changes = []
            
            for event, metric_value in event_metric_values:
                event_date = pd.to_datetime(event.date)
                
                # Find the event date in the price data
                try:
                    event_idx = price_df.index.get_indexer([event_date], method='nearest')[0]
                except:
                    continue
                
                # Skip if not enough data after the event
                if event_idx + window_days >= len(price_df):
                    continue
                
                # Calculate price change
                event_price = price_df['close'].iloc[event_idx]
                after_price = price_df['close'].iloc[event_idx + window_days]
                
                price_change = (after_price - event_price) / event_price
                price_changes.append(price_change)
            
            # Skip if not enough data points
            if len(price_changes) < 3 or len(event_metric_values) < 3:
                continue
            
            # Extract metric values
            metric_values = [mv for _, mv in event_metric_values[:len(price_changes)]]
            
            # Calculate correlation
            correlation, p_value = stats.pearsonr(metric_values, price_changes)
            
            correlations[metric_name] = {
                "correlation": correlation,
                "p_value": p_value,
                "significant": p_value < 0.05,
                "sample_size": len(price_changes)
            }
        
        # Sort correlations by absolute value
        sorted_correlations = dict(sorted(
            correlations.items(),
            key=lambda item: abs(item[1]["correlation"]),
            reverse=True
        ))
        
        return {
            "symbol": symbol,
            "event_type": event_type,
            "correlations": sorted_correlations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing event-metric correlation: {str(e)}")

@router.get("/event-impact-by-metric/{symbol}")
async def analyze_event_impact_by_metric(
    symbol: str,
    event_type: str = Query(..., description="Type of event to analyze"),
    metric: str = Query(..., description="Financial metric to segment events by"),
    window_days: int = Query(30, description="Number of days after events to analyze"),
    lookback_days: int = Query(365, description="Number of days to look back for events")
) -> Dict[str, Any]:
    """
    Analyze event impact segmented by a financial metric.
    """
    try:
        # Get events
        events_response = await get_all_events(symbol, lookback_days)
        
        # Convert dictionary events back to FinancialEvent objects
        all_events = [FinancialEvent.from_dict(event_dict) for event_dict in events_response]
        
        # Filter by event type if specified
        if event_type != "all":
            events = [event for event in all_events if event.event_type == event_type]
        else:
            events = all_events
        
        if not events:
            raise HTTPException(status_code=404, detail=f"No {event_type} events found for symbol: {symbol}")
        
        # Get financial metrics
        financial_metrics = await get_financial_metrics(symbol, "quarter", 20)
        
        if metric not in financial_metrics:
            raise HTTPException(status_code=404, detail=f"Metric {metric} not found for symbol: {symbol}")
        
        metric_series = financial_metrics[metric]
        
        # Convert metric series to datetime index if it's not already
        if not isinstance(metric_series.index, pd.DatetimeIndex):
            try:
                metric_series.index = pd.to_datetime(metric_series.index)
            except:
                raise HTTPException(status_code=500, detail=f"Error converting metric dates to datetime")
        
        # Sort by date
        metric_series = metric_series.sort_index()
        
        # Get price data
        price_data_response = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": lookback_days})
        
        if not price_data_response or "historical" not in price_data_response:
            raise HTTPException(status_code=404, detail=f"Price data not found for symbol: {symbol}")
        
        # Convert to pandas DataFrame
        historical = price_data_response["historical"]
        price_df = pd.DataFrame(historical)
        price_df['date'] = pd.to_datetime(price_df['date'])
        price_df.set_index('date', inplace=True)
        price_df.sort_index(inplace=True)
        
        # For each event, find the nearest metric value
        event_data = []
        
        for event in events:
            event_date = pd.to_datetime(event.date)
            
            # Find the nearest metric date before or on the event date
            try:
                nearest_dates = metric_series.index[metric_series.index <= event_date]
                if len(nearest_dates) > 0:
                    nearest_date = nearest_dates[-1]
                    metric_value = metric_series[nearest_date]
                else:
                    continue
            except:
                continue
            
            # Find the event date in the price data
            try:
                event_idx = price_df.index.get_indexer([event_date], method='nearest')[0]
            except:
                continue
            
            # Skip if not enough data after the event
            if event_idx + window_days >= len(price_df):
                continue
            
            # Calculate price change
            event_price = price_df['close'].iloc[event_idx]
            after_price = price_df['close'].iloc[event_idx + window_days]
            
            price_change = (after_price - event_price) / event_price
            
            event_data.append({
                "event_id": event.id,
                "event_type": event.event_type,
                "date": event.date.isoformat(),
                "metric_value": metric_value,
                "price_change": price_change
            })
        
        if not event_data:
            raise HTTPException(status_code=404, detail=f"No valid events with metric data found")
        
        # Sort events by metric value
        event_data.sort(key=lambda x: x["metric_value"])
        
        # Divide into quartiles
        n = len(event_data)
        quartile_size = n // 4
        
        quartiles = {
            "Q1 (Lowest)": event_data[:quartile_size],
            "Q2": event_data[quartile_size:2*quartile_size],
            "Q3": event_data[2*quartile_size:3*quartile_size],
            "Q4 (Highest)": event_data[3*quartile_size:]
        }
        
        # Calculate average price change for each quartile
        quartile_results = {}
        
        for quartile_name, quartile_events in quartiles.items():
            if not quartile_events:
                continue
                
            price_changes = [event["price_change"] for event in quartile_events]
            avg_change = sum(price_changes) / len(price_changes)
            median_change = sorted(price_changes)[len(price_changes) // 2]
            positive_count = sum(1 for x in price_changes if x > 0)
            negative_count = sum(1 for x in price_changes if x < 0)
            
            quartile_results[quartile_name] = {
                "avg_price_change": avg_change,
                "median_price_change": median_change,
                "positive_count": positive_count,
                "negative_count": negative_count,
                "total_count": len(price_changes),
                "events": quartile_events
            }
        
        return {
            "symbol": symbol,
            "event_type": event_type,
            "metric": metric,
            "window_days": window_days,
            "quartile_results": quartile_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing event impact by metric: {str(e)}")

@router.get("/event-prediction/{symbol}")
async def predict_event_outcome(
    symbol: str,
    event_type: str = Query(..., description="Type of event to predict"),
    metrics: List[str] = Query(..., description="List of financial metrics to use for prediction"),
    window_days: int = Query(30, description="Number of days after events to analyze"),
    lookback_days: int = Query(730, description="Number of days to look back for events")
) -> Dict[str, Any]:
    """
    Predict the outcome of an event based on financial metrics.
    """
    try:
        # Get events
        events_response = await get_all_events(symbol, lookback_days)
        
        # Convert dictionary events back to FinancialEvent objects
        all_events = [FinancialEvent.from_dict(event_dict) for event_dict in events_response]
        
        # Filter by event type
        events = [event for event in all_events if event.event_type == event_type]
        
        if not events:
            raise HTTPException(status_code=404, detail=f"No {event_type} events found for symbol: {symbol}")
        
        # Get financial metrics
        financial_metrics = await get_financial_metrics(symbol, "quarter", 20)
        
        # Filter metrics to only include requested ones
        filtered_metrics = {}
        for metric in metrics:
            if metric in financial_metrics:
                filtered_metrics[metric] = financial_metrics[metric]
        
        if not filtered_metrics:
            raise HTTPException(status_code=404, detail=f"No requested financial metrics found for symbol: {symbol}")
        
        # Get price data
        price_data_response = await get_fmp_data(f"historical-price-full/{symbol}", {"timeseries": lookback_days})
        
        if not price_data_response or "historical" not in price_data_response:
            raise HTTPException(status_code=404, detail=f"Price data not found for symbol: {symbol}")
        
        # Convert to pandas DataFrame
        historical = price_data_response["historical"]
        price_df = pd.DataFrame(historical)
        price_df['date'] = pd.to_datetime(price_df['date'])
        price_df.set_index('date', inplace=True)
        price_df.sort_index(inplace=True)
        
        # Prepare data for prediction model
        X = []  # Features (metrics)
        y = []  # Target (price change)
        
        for event in events:
            event_date = pd.to_datetime(event.date)
            
            # Get metric values for this event
            event_metrics = {}
            for metric_name, metric_series in filtered_metrics.items():
                # Convert metric series to datetime index if it's not already
                if not isinstance(metric_series.index, pd.DatetimeIndex):
                    try:
                        metric_series.index = pd.to_datetime(metric_series.index)
                    except:
                        continue
                
                # Find the nearest metric date before or on the event date
                try:
                    nearest_dates = metric_series.index[metric_series.index <= event_date]
                    if len(nearest_dates) > 0:
                        nearest_date = nearest_dates[-1]
                        event_metrics[metric_name] = metric_series[nearest_date]
                    else:
                        event_metrics[metric_name] = None
                except:
                    event_metrics[metric_name] = None
            
            # Skip if any metric is missing
            if None in event_metrics.values():
                continue
            
            # Find the event date in the price data
            try:
                event_idx = price_df.index.get_indexer([event_date], method='nearest')[0]
            except:
                continue
            
            # Skip if not enough data after the event
            if event_idx + window_days >= len(price_df):
                continue
            
            # Calculate price change
            event_price = price_df['close'].iloc[event_idx]
            after_price = price_df['close'].iloc[event_idx + window_days]
            
            price_change = (after_price - event_price) / event_price
            
            # Add to training data
            X.append(list(event_metrics.values()))
            y.append(1 if price_change > 0 else 0)  # Binary classification: positive or negative return
        
        # Skip if not enough data points
        if len(X) < 10:
            raise HTTPException(status_code=400, detail=f"Not enough events with complete data for prediction (need at least 10, got {len(X)})")
        
        # Convert to numpy arrays
        X = np.array(X)
        y = np.array(y)
        
        # Train a simple logistic regression model
        from sklearn.linear_model import LogisticRegression
        from sklearn.model_selection import cross_val_score
        
        model = LogisticRegression(random_state=42)
        
        # Perform cross-validation
        cv_scores = cross_val_score(model, X, y, cv=min(5, len(X)), scoring='accuracy')
        
        # Train on all data
        model.fit(X, y)
        
        # Get feature importance
        feature_importance = dict(zip(metrics, model.coef_[0]))
        
        # Sort by absolute importance
        feature_importance = dict(sorted(
            feature_importance.items(),
            key=lambda item: abs(item[1]),
            reverse=True
        ))
        
        # Get the most recent metrics for prediction
        latest_metrics = {}
        for metric_name, metric_series in filtered_metrics.items():
            if len(metric_series) > 0:
                latest_metrics[metric_name] = metric_series.iloc[-1]
        
        # Make prediction for next event
        if len(latest_metrics) == len(metrics):
            latest_X = np.array([[latest_metrics[m] for m in metrics]])
            prediction = model.predict(latest_X)[0]
            probability = model.predict_proba(latest_X)[0][prediction]
        else:
            prediction = None
            probability = None
        
        return {
            "symbol": symbol,
            "event_type": event_type,
            "metrics": metrics,
            "model_accuracy": {
                "mean": cv_scores.mean(),
                "std": cv_scores.std(),
                "scores": cv_scores.tolist()
            },
            "feature_importance": feature_importance,
            "sample_size": len(X),
            "positive_outcome_ratio": y.mean(),
            "next_event_prediction": {
                "outcome": "positive" if prediction == 1 else "negative" if prediction == 0 else None,
                "probability": probability,
                "latest_metrics": latest_metrics
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting event outcome: {str(e)}")