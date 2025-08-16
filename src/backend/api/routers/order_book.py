"""
Router for order book and high-frequency data endpoints.
This module provides API endpoints for accessing order book data and high-frequency analytics.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, Path, Body
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import json
import os
import sys
import pandas as pd
from pydantic import BaseModel

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from src.ml_models.order_book import (
    OrderType,
    OrderSide,
    Order,
    OrderBook,
    OrderBookManager,
    OrderBookAnalytics,
    OrderBookTimeSeriesAnalytics
)

# Configure router
router = APIRouter()

# Initialize order book manager
order_book_manager = OrderBookManager()

# Initialize time series analytics manager
time_series_analytics = {}

# Models
class OrderBookSnapshotRequest(BaseModel):
    symbol: str
    bids: List[Dict[str, float]]
    asks: List[Dict[str, float]]
    timestamp: Optional[str] = None
    sequence: Optional[int] = None

class OrderEventRequest(BaseModel):
    type: str  # add, cancel, update, trade
    symbol: str
    order_id: Optional[str] = None
    price: Optional[float] = None
    size: Optional[float] = None
    side: Optional[str] = None
    order_type: Optional[str] = None
    timestamp: Optional[str] = None
    aggressor_side: Optional[str] = None

class MarketOrderRequest(BaseModel):
    symbol: str
    side: str
    size: float

# Helper function to generate mock order book data
def generate_mock_order_book(symbol: str) -> OrderBook:
    """
    Generate a mock order book for the specified symbol.
    
    Args:
        symbol: Symbol to generate order book for
        
    Returns:
        Mock order book
    """
    # Create order book
    order_book = OrderBook(symbol)
    
    # Generate random seed based on symbol
    seed = sum(ord(c) for c in symbol)
    np.random.seed(seed)
    
    # Generate mock mid price
    mid_price = np.random.uniform(10.0, 1000.0)
    
    # Generate mock bid orders
    for i in range(20):
        price = mid_price * (1 - np.random.uniform(0.001, 0.05))
        size = np.random.uniform(1.0, 100.0)
        
        order = Order(
            id=f"bid_{i}_{datetime.now().timestamp()}",
            price=price,
            size=size,
            side=OrderSide.BUY,
            type=OrderType.LIMIT,
            timestamp=datetime.now()
        )
        
        order_book.add_order(order)
    
    # Generate mock ask orders
    for i in range(20):
        price = mid_price * (1 + np.random.uniform(0.001, 0.05))
        size = np.random.uniform(1.0, 100.0)
        
        order = Order(
            id=f"ask_{i}_{datetime.now().timestamp()}",
            price=price,
            size=size,
            side=OrderSide.SELL,
            type=OrderType.LIMIT,
            timestamp=datetime.now()
        )
        
        order_book.add_order(order)
    
    return order_book

# API Endpoints

@router.get("/symbols")
async def get_symbols():
    """
    Get all symbols with order books.
    """
    try:
        symbols = order_book_manager.get_all_symbols()
        
        # If no symbols, add some mock data
        if not symbols:
            mock_symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "META"]
            for symbol in mock_symbols:
                mock_order_book = generate_mock_order_book(symbol)
                order_book_manager.order_books[symbol] = mock_order_book
                
                # Initialize time series analytics
                if symbol not in time_series_analytics:
                    time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
                
                # Add snapshot to time series
                time_series_analytics[symbol].add_snapshot(mock_order_book)
            
            symbols = mock_symbols
        
        return {
            "symbols": symbols,
            "count": len(symbols),
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching symbols: {str(e)}")

@router.get("/snapshot/{symbol}")
async def get_order_book_snapshot(symbol: str, depth: int = Query(10, ge=1, le=100)):
    """
    Get a snapshot of the order book for the specified symbol.
    """
    try:
        # Check if symbol exists
        if symbol not in order_book_manager.order_books:
            # Generate mock order book
            mock_order_book = generate_mock_order_book(symbol)
            order_book_manager.order_books[symbol] = mock_order_book
            
            # Initialize time series analytics
            if symbol not in time_series_analytics:
                time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            
            # Add snapshot to time series
            time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        # Get snapshot
        snapshot = order_book_manager.get_order_book_snapshot(symbol, depth)
        
        return snapshot
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching order book snapshot: {str(e)}")

@router.post("/snapshot")
async def process_order_book_snapshot(snapshot: OrderBookSnapshotRequest):
    """
    Process an order book snapshot.
    """
    try:
        # Convert to format expected by order book manager
        snapshot_dict = {
            "symbol": snapshot.symbol,
            "bids": snapshot.bids,
            "asks": snapshot.asks
        }
        
        if snapshot.timestamp:
            snapshot_dict["timestamp"] = snapshot.timestamp
        
        if snapshot.sequence is not None:
            snapshot_dict["sequence"] = snapshot.sequence
        
        # Process snapshot
        success = order_book_manager.process_snapshot(snapshot_dict)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to process order book snapshot")
        
        # Add to time series analytics
        if snapshot.symbol not in time_series_analytics:
            time_series_analytics[snapshot.symbol] = OrderBookTimeSeriesAnalytics(snapshot.symbol)
        
        time_series_analytics[snapshot.symbol].add_snapshot(order_book_manager.order_books[snapshot.symbol])
        
        return {
            "success": True,
            "symbol": snapshot.symbol,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing order book snapshot: {str(e)}")

@router.post("/event")
async def process_order_event(event: OrderEventRequest):
    """
    Process an order event.
    """
    try:
        # Convert to format expected by order book manager
        event_dict = {
            "type": event.type,
            "symbol": event.symbol
        }
        
        if event.order_id:
            event_dict["order_id"] = event.order_id
        
        if event.price is not None:
            event_dict["price"] = event.price
        
        if event.size is not None:
            event_dict["size"] = event.size
        
        if event.side:
            event_dict["side"] = event.side
        
        if event.order_type:
            event_dict["order_type"] = event.order_type
        
        if event.timestamp:
            event_dict["timestamp"] = event.timestamp
        
        if event.aggressor_side:
            event_dict["aggressor_side"] = event.aggressor_side
        
        # Process event
        success = order_book_manager.process_order_event(event_dict)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to process order event")
        
        # Add to time series analytics
        if event.symbol in order_book_manager.order_books:
            if event.symbol not in time_series_analytics:
                time_series_analytics[event.symbol] = OrderBookTimeSeriesAnalytics(event.symbol)
            
            time_series_analytics[event.symbol].add_snapshot(order_book_manager.order_books[event.symbol])
        
        return {
            "success": True,
            "symbol": event.symbol,
            "event_type": event.type,
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing order event: {str(e)}")

@router.post("/market-order")
async def simulate_market_order(order: MarketOrderRequest):
    """
    Simulate a market order.
    """
    try:
        # Check if symbol exists
        if order.symbol not in order_book_manager.order_books:
            raise HTTPException(status_code=404, detail=f"Order book for symbol {order.symbol} not found")
        
        # Get order book
        order_book = order_book_manager.order_books[order.symbol]
        
        # Parse side
        try:
            side = OrderSide(order.side)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid order side: {order.side}")
        
        # Simulate market order
        matched_size, avg_price, filled_orders = order_book.match_market_order(side, order.size)
        
        # Add to time series analytics
        if order.symbol not in time_series_analytics:
            time_series_analytics[order.symbol] = OrderBookTimeSeriesAnalytics(order.symbol)
        
        time_series_analytics[order.symbol].add_snapshot(order_book)
        
        return {
            "symbol": order.symbol,
            "side": order.side,
            "size": order.size,
            "matched_size": matched_size,
            "avg_price": avg_price,
            "filled_orders": len(filled_orders),
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating market order: {str(e)}")

@router.get("/analytics/{symbol}")
async def get_order_book_analytics(symbol: str):
    """
    Get analytics for the specified symbol's order book.
    """
    try:
        # Check if symbol exists
        if symbol not in order_book_manager.order_books:
            # Generate mock order book
            mock_order_book = generate_mock_order_book(symbol)
            order_book_manager.order_books[symbol] = mock_order_book
            
            # Initialize time series analytics
            if symbol not in time_series_analytics:
                time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            
            # Add snapshot to time series
            time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        # Get order book
        order_book = order_book_manager.order_books[symbol]
        
        # Create analytics
        analytics = OrderBookAnalytics(order_book)
        
        # Calculate metrics
        basic_metrics = analytics.calculate_basic_metrics()
        market_depth = analytics.calculate_market_depth()
        liquidity_metrics = analytics.calculate_liquidity_metrics()
        imbalance_metrics = analytics.calculate_order_book_imbalance()
        
        # Generate visualizations
        order_book_viz = analytics.generate_order_book_visualization()
        depth_chart = analytics.generate_depth_chart()
        price_impact_chart = analytics.generate_price_impact_chart()
        
        # Calculate trading signals
        signals = analytics.calculate_trading_signals()
        
        return {
            "symbol": symbol,
            "basic_metrics": basic_metrics,
            "market_depth": market_depth,
            "liquidity_metrics": liquidity_metrics,
            "imbalance_metrics": imbalance_metrics,
            "visualizations": {
                "order_book": order_book_viz,
                "depth_chart": depth_chart,
                "price_impact": price_impact_chart
            },
            "signals": signals,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating order book analytics: {str(e)}")

@router.get("/time-series/{symbol}")
async def get_time_series_analytics(symbol: str):
    """
    Get time series analytics for the specified symbol.
    """
    try:
        # Check if symbol exists
        if symbol not in time_series_analytics:
            # Check if order book exists
            if symbol not in order_book_manager.order_books:
                # Generate mock order book
                mock_order_book = generate_mock_order_book(symbol)
                order_book_manager.order_books[symbol] = mock_order_book
            
            # Initialize time series analytics
            time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            
            # Add snapshot to time series
            time_series_analytics[symbol].add_snapshot(order_book_manager.order_books[symbol])
            
            # Add some historical snapshots for better visualization
            for i in range(10):
                # Generate slightly different order book
                mock_order_book = generate_mock_order_book(symbol)
                
                # Add to time series
                time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        # Calculate time series metrics
        ts_metrics = time_series_analytics[symbol].calculate_time_series_metrics()
        
        # Generate visualizations
        mid_price_chart = time_series_analytics[symbol].generate_time_series_chart("mid_price")
        volume_imbalance_chart = time_series_analytics[symbol].generate_volume_imbalance_chart()
        spread_chart = time_series_analytics[symbol].generate_time_series_chart("relative_spread")
        
        # Calculate trading signals
        signals = time_series_analytics[symbol].calculate_trading_signals()
        
        return {
            "symbol": symbol,
            "metrics": ts_metrics["metrics"],
            "visualizations": {
                "mid_price": mid_price_chart,
                "volume_imbalance": volume_imbalance_chart,
                "spread": spread_chart
            },
            "signals": signals,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating time series analytics: {str(e)}")

@router.get("/signals/{symbol}")
async def get_trading_signals(symbol: str):
    """
    Get trading signals for the specified symbol.
    """
    try:
        # Get order book analytics signals
        if symbol not in order_book_manager.order_books:
            # Generate mock order book
            mock_order_book = generate_mock_order_book(symbol)
            order_book_manager.order_books[symbol] = mock_order_book
            
            # Initialize time series analytics
            if symbol not in time_series_analytics:
                time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            
            # Add snapshot to time series
            time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        # Get order book
        order_book = order_book_manager.order_books[symbol]
        
        # Create analytics
        analytics = OrderBookAnalytics(order_book)
        
        # Calculate trading signals
        ob_signals = analytics.calculate_trading_signals()
        
        # Get time series signals
        if symbol not in time_series_analytics:
            time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            time_series_analytics[symbol].add_snapshot(order_book)
            
            # Add some historical snapshots for better signals
            for i in range(10):
                # Generate slightly different order book
                mock_order_book = generate_mock_order_book(symbol)
                
                # Add to time series
                time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        ts_signals = time_series_analytics[symbol].calculate_trading_signals()
        
        # Combine signals
        ob_strength = ob_signals["overall_signal"]["strength"]
        ts_strength = ts_signals["overall_signal"]["strength"]
        
        ob_signal = ob_signals["overall_signal"]["signal"]
        ts_signal = ts_signals["overall_signal"]["signal"]
        
        # Calculate combined signal
        if ob_signal == ts_signal and ob_signal != "neutral":
            # Both signals agree
            combined_signal = {
                "signal": ob_signal,
                "strength": (ob_strength + ts_strength) / 2,
                "confidence": 0.8
            }
        elif ob_signal != "neutral" and ts_signal != "neutral" and ob_signal != ts_signal:
            # Signals disagree
            if ob_strength > ts_strength:
                combined_signal = {
                    "signal": ob_signal,
                    "strength": ob_strength * 0.7 + ts_strength * 0.3,
                    "confidence": 0.5
                }
            else:
                combined_signal = {
                    "signal": ts_signal,
                    "strength": ts_strength * 0.7 + ob_strength * 0.3,
                    "confidence": 0.5
                }
        elif ob_signal != "neutral":
            # Only order book signal is non-neutral
            combined_signal = {
                "signal": ob_signal,
                "strength": ob_strength * 0.8,
                "confidence": 0.6
            }
        elif ts_signal != "neutral":
            # Only time series signal is non-neutral
            combined_signal = {
                "signal": ts_signal,
                "strength": ts_strength * 0.8,
                "confidence": 0.6
            }
        else:
            # Both signals are neutral
            combined_signal = {
                "signal": "neutral",
                "strength": 0.5,
                "confidence": 0.7
            }
        
        return {
            "symbol": symbol,
            "order_book_signals": ob_signals["signals"],
            "time_series_signals": ts_signals["signals"],
            "order_book_overall": ob_signals["overall_signal"],
            "time_series_overall": ts_signals["overall_signal"],
            "combined_signal": combined_signal,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating trading signals: {str(e)}")

@router.get("/market-microstructure/{symbol}")
async def get_market_microstructure(symbol: str):
    """
    Get market microstructure metrics for the specified symbol.
    """
    try:
        # Check if symbol exists
        if symbol not in order_book_manager.order_books:
            # Generate mock order book
            mock_order_book = generate_mock_order_book(symbol)
            order_book_manager.order_books[symbol] = mock_order_book
            
            # Initialize time series analytics
            if symbol not in time_series_analytics:
                time_series_analytics[symbol] = OrderBookTimeSeriesAnalytics(symbol)
            
            # Add snapshot to time series
            time_series_analytics[symbol].add_snapshot(mock_order_book)
        
        # Get order book
        order_book = order_book_manager.order_books[symbol]
        
        # Create analytics
        analytics = OrderBookAnalytics(order_book)
        
        # Calculate metrics
        basic_metrics = analytics.calculate_basic_metrics()
        liquidity_metrics = analytics.calculate_liquidity_metrics()
        imbalance_metrics = analytics.calculate_order_book_imbalance()
        
        # Calculate additional microstructure metrics
        
        # Order flow imbalance
        order_flow_imbalance = analytics.calculate_order_flow_imbalance()
        
        # Price impact for standard sizes
        price_impact_buy_1pct = analytics.calculate_price_impact(OrderSide.BUY, basic_metrics["bid_volume"] * 0.01)
        price_impact_buy_5pct = analytics.calculate_price_impact(OrderSide.BUY, basic_metrics["bid_volume"] * 0.05)
        price_impact_buy_10pct = analytics.calculate_price_impact(OrderSide.BUY, basic_metrics["bid_volume"] * 0.1)
        
        price_impact_sell_1pct = analytics.calculate_price_impact(OrderSide.SELL, basic_metrics["ask_volume"] * 0.01)
        price_impact_sell_5pct = analytics.calculate_price_impact(OrderSide.SELL, basic_metrics["ask_volume"] * 0.05)
        price_impact_sell_10pct = analytics.calculate_price_impact(OrderSide.SELL, basic_metrics["ask_volume"] * 0.1)
        
        # Time series metrics if available
        ts_metrics = {}
        if symbol in time_series_analytics and len(time_series_analytics[symbol].metrics_history) > 1:
            ts_metrics = time_series_analytics[symbol].calculate_time_series_metrics()["metrics"]
        
        return {
            "symbol": symbol,
            "basic_metrics": {
                "mid_price": basic_metrics["mid_price"],
                "spread": basic_metrics["spread"],
                "relative_spread": basic_metrics["relative_spread"],
                "bid_volume": basic_metrics["bid_volume"],
                "ask_volume": basic_metrics["ask_volume"]
            },
            "liquidity_metrics": liquidity_metrics,
            "imbalance_metrics": imbalance_metrics,
            "order_flow_imbalance": order_flow_imbalance,
            "price_impact": {
                "buy_1pct": price_impact_buy_1pct,
                "buy_5pct": price_impact_buy_5pct,
                "buy_10pct": price_impact_buy_10pct,
                "sell_1pct": price_impact_sell_1pct,
                "sell_5pct": price_impact_sell_5pct,
                "sell_10pct": price_impact_sell_10pct
            },
            "time_series_metrics": ts_metrics,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating market microstructure metrics: {str(e)}")