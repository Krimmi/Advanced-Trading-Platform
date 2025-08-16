"""
Order Book Analytics Module

This module provides classes and functions for analyzing order book data and extracting trading signals.
"""

from typing import Dict, List, Any, Optional, Union, Tuple
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
from enum import Enum
from dataclasses import dataclass
import matplotlib.pyplot as plt
import io
import base64
from scipy import stats

from .order_book_model import OrderBook, OrderSide, OrderType, Order, PriceLevel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("order_book_analytics")

class OrderBookAnalytics:
    """
    Provides analytics for order book data.
    """
    
    def __init__(self, order_book: OrderBook):
        """
        Initialize the order book analytics.
        
        Args:
            order_book: Order book to analyze
        """
        self.order_book = order_book
        self.logger = logger
    
    def calculate_basic_metrics(self) -> Dict[str, float]:
        """
        Calculate basic order book metrics.
        
        Returns:
            Dictionary with basic metrics
        """
        mid_price = self.order_book.calculate_mid_price()
        spread = self.order_book.calculate_spread()
        
        # Calculate bid and ask volumes
        bid_volume = sum(level.total_size for level in self.order_book.bids.values())
        ask_volume = sum(level.total_size for level in self.order_book.asks.values())
        
        # Calculate bid and ask counts
        bid_count = sum(len(level.orders) for level in self.order_book.bids.values())
        ask_count = sum(len(level.orders) for level in self.order_book.asks.values())
        
        # Calculate volume imbalance
        volume_imbalance = (bid_volume - ask_volume) / (bid_volume + ask_volume) if (bid_volume + ask_volume) > 0 else 0.0
        
        # Calculate order count imbalance
        order_imbalance = (bid_count - ask_count) / (bid_count + ask_count) if (bid_count + ask_count) > 0 else 0.0
        
        # Calculate relative spread
        relative_spread = spread / mid_price if mid_price > 0 else 0.0
        
        # Calculate best bid and ask
        best_bid = max(self.order_book.bids.keys()) if self.order_book.bids else 0.0
        best_ask = min(self.order_book.asks.keys()) if self.order_book.asks else float('inf')
        
        # Calculate best bid and ask volumes
        best_bid_volume = self.order_book.bids[best_bid].total_size if best_bid > 0.0 else 0.0
        best_ask_volume = self.order_book.asks[best_ask].total_size if best_ask < float('inf') else 0.0
        
        # Calculate best bid/ask volume imbalance
        best_volume_imbalance = (best_bid_volume - best_ask_volume) / (best_bid_volume + best_ask_volume) if (best_bid_volume + best_ask_volume) > 0 else 0.0
        
        return {
            "mid_price": mid_price,
            "spread": spread,
            "relative_spread": relative_spread,
            "bid_volume": bid_volume,
            "ask_volume": ask_volume,
            "volume_imbalance": volume_imbalance,
            "bid_count": bid_count,
            "ask_count": ask_count,
            "order_imbalance": order_imbalance,
            "best_bid": best_bid,
            "best_ask": best_ask,
            "best_bid_volume": best_bid_volume,
            "best_ask_volume": best_ask_volume,
            "best_volume_imbalance": best_volume_imbalance
        }
    
    def calculate_market_depth(self, levels: int = 10) -> Dict[str, Any]:
        """
        Calculate market depth metrics.
        
        Args:
            levels: Number of price levels to include
            
        Returns:
            Dictionary with market depth metrics
        """
        # Get price levels
        bid_levels = self.order_book.get_price_levels(OrderSide.BUY, levels)
        ask_levels = self.order_book.get_price_levels(OrderSide.SELL, levels)
        
        # Calculate cumulative volumes
        bid_cumulative = []
        running_total = 0.0
        for level in bid_levels:
            running_total += level["size"]
            bid_cumulative.append({
                "price": level["price"],
                "size": level["size"],
                "cumulative": running_total
            })
        
        ask_cumulative = []
        running_total = 0.0
        for level in ask_levels:
            running_total += level["size"]
            ask_cumulative.append({
                "price": level["price"],
                "size": level["size"],
                "cumulative": running_total
            })
        
        # Calculate price impact for standard order sizes
        mid_price = self.order_book.calculate_mid_price()
        
        # Define standard order sizes as percentages of total volume
        total_volume = sum(level["size"] for level in bid_levels) + sum(level["size"] for level in ask_levels)
        standard_sizes = [0.01, 0.05, 0.1, 0.25, 0.5]
        standard_volumes = [total_volume * size for size in standard_sizes]
        
        # Calculate price impact for buy orders
        buy_impact = []
        for size in standard_volumes:
            impact = self.calculate_price_impact(OrderSide.BUY, size)
            buy_impact.append({
                "size": size,
                "size_percent": size / total_volume if total_volume > 0 else 0.0,
                "price_impact": impact,
                "price_impact_bps": impact * 10000 if mid_price > 0 else 0.0
            })
        
        # Calculate price impact for sell orders
        sell_impact = []
        for size in standard_volumes:
            impact = self.calculate_price_impact(OrderSide.SELL, size)
            sell_impact.append({
                "size": size,
                "size_percent": size / total_volume if total_volume > 0 else 0.0,
                "price_impact": impact,
                "price_impact_bps": impact * 10000 if mid_price > 0 else 0.0
            })
        
        return {
            "bid_levels": bid_cumulative,
            "ask_levels": ask_cumulative,
            "buy_impact": buy_impact,
            "sell_impact": sell_impact
        }
    
    def calculate_price_impact(self, side: OrderSide, size: float) -> float:
        """
        Calculate the price impact of a market order.
        
        Args:
            side: Side of the market order
            size: Size of the market order
            
        Returns:
            Price impact as a percentage of mid price
        """
        mid_price = self.order_book.calculate_mid_price()
        if mid_price == 0.0:
            return 0.0
        
        # Get price levels
        if side == OrderSide.BUY:
            levels = sorted(self.order_book.asks.items())
        else:
            levels = sorted(self.order_book.bids.items(), reverse=True)
        
        # Calculate execution price
        remaining_size = size
        execution_value = 0.0
        
        for price, level in levels:
            if remaining_size <= 0:
                break
            
            matched_size = min(remaining_size, level.total_size)
            execution_value += matched_size * price
            remaining_size -= matched_size
        
        # If we couldn't fill the entire order, use the last price
        if remaining_size > 0 and levels:
            execution_value += remaining_size * levels[-1][0]
        
        # Calculate average execution price
        avg_price = execution_value / size if size > 0 else 0.0
        
        # Calculate price impact
        if side == OrderSide.BUY:
            return (avg_price - mid_price) / mid_price if mid_price > 0 else 0.0
        else:
            return (mid_price - avg_price) / mid_price if mid_price > 0 else 0.0
    
    def calculate_order_flow_imbalance(self, window_size: int = 100) -> float:
        """
        Calculate order flow imbalance.
        
        Args:
            window_size: Number of recent orders to consider
            
        Returns:
            Order flow imbalance (-1.0 to 1.0)
        """
        # In a real implementation, this would use a history of order events
        # For now, we'll use a simplified approach based on current book state
        
        bid_volume = sum(level.total_size for level in self.order_book.bids.values())
        ask_volume = sum(level.total_size for level in self.order_book.asks.values())
        
        total_volume = bid_volume + ask_volume
        if total_volume == 0:
            return 0.0
        
        return (bid_volume - ask_volume) / total_volume
    
    def calculate_liquidity_metrics(self) -> Dict[str, float]:
        """
        Calculate liquidity metrics.
        
        Returns:
            Dictionary with liquidity metrics
        """
        mid_price = self.order_book.calculate_mid_price()
        if mid_price == 0.0:
            return {
                "spread": 0.0,
                "relative_spread": 0.0,
                "depth_1pct": 0.0,
                "depth_2pct": 0.0,
                "depth_5pct": 0.0,
                "liquidity_at_mid": 0.0,
                "resiliency": 0.0
            }
        
        # Calculate spread
        spread = self.order_book.calculate_spread()
        relative_spread = spread / mid_price
        
        # Calculate depth at different price levels
        price_range_1pct = mid_price * 0.01
        price_range_2pct = mid_price * 0.02
        price_range_5pct = mid_price * 0.05
        
        depth_1pct = self._calculate_depth_at_price_range(price_range_1pct)
        depth_2pct = self._calculate_depth_at_price_range(price_range_2pct)
        depth_5pct = self._calculate_depth_at_price_range(price_range_5pct)
        
        # Calculate liquidity at mid price
        liquidity_at_mid = self._calculate_liquidity_at_mid()
        
        # Calculate resiliency (simplified)
        resiliency = self._calculate_resiliency()
        
        return {
            "spread": spread,
            "relative_spread": relative_spread,
            "depth_1pct": depth_1pct,
            "depth_2pct": depth_2pct,
            "depth_5pct": depth_5pct,
            "liquidity_at_mid": liquidity_at_mid,
            "resiliency": resiliency
        }
    
    def _calculate_depth_at_price_range(self, price_range: float) -> float:
        """
        Calculate market depth within a price range from the mid price.
        
        Args:
            price_range: Price range from mid price
            
        Returns:
            Total depth (bid + ask) within the price range
        """
        mid_price = self.order_book.calculate_mid_price()
        
        bid_depth = sum(
            level.total_size
            for price, level in self.order_book.bids.items()
            if price >= mid_price - price_range
        )
        
        ask_depth = sum(
            level.total_size
            for price, level in self.order_book.asks.items()
            if price <= mid_price + price_range
        )
        
        return bid_depth + ask_depth
    
    def _calculate_liquidity_at_mid(self) -> float:
        """
        Calculate liquidity at mid price.
        
        Returns:
            Liquidity at mid price
        """
        mid_price = self.order_book.calculate_mid_price()
        
        # Find closest bid and ask to mid price
        closest_bid = max(self.order_book.bids.keys()) if self.order_book.bids else 0.0
        closest_ask = min(self.order_book.asks.keys()) if self.order_book.asks else float('inf')
        
        # Get volumes at closest prices
        bid_volume = self.order_book.bids[closest_bid].total_size if closest_bid > 0.0 else 0.0
        ask_volume = self.order_book.asks[closest_ask].total_size if closest_ask < float('inf') else 0.0
        
        # Calculate liquidity at mid
        return bid_volume + ask_volume
    
    def _calculate_resiliency(self) -> float:
        """
        Calculate order book resiliency.
        
        Returns:
            Resiliency metric
        """
        # In a real implementation, this would use time series data
        # For now, we'll use a simplified approach based on current book state
        
        # Calculate volume distribution
        bid_prices = sorted(self.order_book.bids.keys(), reverse=True)
        ask_prices = sorted(self.order_book.asks.keys())
        
        if not bid_prices or not ask_prices:
            return 0.0
        
        # Calculate volume-weighted price standard deviation
        bid_volumes = [self.order_book.bids[price].total_size for price in bid_prices]
        ask_volumes = [self.order_book.asks[price].total_size for price in ask_prices]
        
        total_bid_volume = sum(bid_volumes)
        total_ask_volume = sum(ask_volumes)
        
        if total_bid_volume == 0 or total_ask_volume == 0:
            return 0.0
        
        # Calculate volume-weighted average price
        bid_vwap = sum(price * volume for price, volume in zip(bid_prices, bid_volumes)) / total_bid_volume
        ask_vwap = sum(price * volume for price, volume in zip(ask_prices, ask_volumes)) / total_ask_volume
        
        # Calculate volume-weighted standard deviation
        bid_std = np.sqrt(sum(((price - bid_vwap) ** 2) * volume for price, volume in zip(bid_prices, bid_volumes)) / total_bid_volume)
        ask_std = np.sqrt(sum(((price - ask_vwap) ** 2) * volume for price, volume in zip(ask_prices, ask_volumes)) / total_ask_volume)
        
        # Calculate resiliency as inverse of standard deviation
        return 1.0 / (bid_std + ask_std) if (bid_std + ask_std) > 0 else 0.0
    
    def calculate_order_book_imbalance(self) -> Dict[str, float]:
        """
        Calculate order book imbalance metrics.
        
        Returns:
            Dictionary with imbalance metrics
        """
        # Calculate volume imbalance
        bid_volume = sum(level.total_size for level in self.order_book.bids.values())
        ask_volume = sum(level.total_size for level in self.order_book.asks.values())
        
        volume_imbalance = (bid_volume - ask_volume) / (bid_volume + ask_volume) if (bid_volume + ask_volume) > 0 else 0.0
        
        # Calculate order count imbalance
        bid_count = sum(len(level.orders) for level in self.order_book.bids.values())
        ask_count = sum(len(level.orders) for level in self.order_book.asks.values())
        
        order_imbalance = (bid_count - ask_count) / (bid_count + ask_count) if (bid_count + ask_count) > 0 else 0.0
        
        # Calculate price level imbalance
        bid_levels = len(self.order_book.bids)
        ask_levels = len(self.order_book.asks)
        
        level_imbalance = (bid_levels - ask_levels) / (bid_levels + ask_levels) if (bid_levels + ask_levels) > 0 else 0.0
        
        # Calculate weighted imbalance
        mid_price = self.order_book.calculate_mid_price()
        
        if mid_price > 0:
            # Calculate volume-weighted average distance from mid price
            bid_weighted_distance = sum(
                (mid_price - price) * level.total_size
                for price, level in self.order_book.bids.items()
            ) / bid_volume if bid_volume > 0 else 0.0
            
            ask_weighted_distance = sum(
                (price - mid_price) * level.total_size
                for price, level in self.order_book.asks.items()
            ) / ask_volume if ask_volume > 0 else 0.0
            
            # Calculate weighted imbalance
            weighted_imbalance = (bid_weighted_distance - ask_weighted_distance) / (bid_weighted_distance + ask_weighted_distance) if (bid_weighted_distance + ask_weighted_distance) > 0 else 0.0
        else:
            weighted_imbalance = 0.0
        
        return {
            "volume_imbalance": volume_imbalance,
            "order_imbalance": order_imbalance,
            "level_imbalance": level_imbalance,
            "weighted_imbalance": weighted_imbalance
        }
    
    def generate_order_book_visualization(self) -> str:
        """
        Generate a visualization of the order book.
        
        Returns:
            Base64-encoded PNG image of the order book visualization
        """
        # Convert order book to DataFrames
        dfs = self.order_book.to_dataframe()
        bid_df = dfs["bids"]
        ask_df = dfs["asks"]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot bids
        if not bid_df.empty:
            ax.barh(
                bid_df["price"],
                bid_df["size"],
                height=bid_df["price"].diff().median() * 0.8,
                color="green",
                alpha=0.6,
                label="Bids"
            )
        
        # Plot asks
        if not ask_df.empty:
            ax.barh(
                ask_df["price"],
                ask_df["size"],
                height=ask_df["price"].diff().median() * 0.8,
                color="red",
                alpha=0.6,
                label="Asks"
            )
        
        # Add mid price line
        mid_price = self.order_book.calculate_mid_price()
        if mid_price > 0:
            ax.axhline(mid_price, color="black", linestyle="--", alpha=0.5, label=f"Mid Price: {mid_price:.2f}")
        
        # Set labels and title
        ax.set_xlabel("Size")
        ax.set_ylabel("Price")
        ax.set_title(f"Order Book for {self.order_book.symbol}")
        
        # Add legend
        ax.legend()
        
        # Add grid
        ax.grid(True, alpha=0.3)
        
        # Tight layout
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)
        
        return img_str
    
    def generate_depth_chart(self) -> str:
        """
        Generate a depth chart of the order book.
        
        Returns:
            Base64-encoded PNG image of the depth chart
        """
        # Get market depth
        depth = self.calculate_market_depth(levels=20)
        
        # Create DataFrames
        bid_df = pd.DataFrame(depth["bid_levels"])
        ask_df = pd.DataFrame(depth["ask_levels"])
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot bids
        if not bid_df.empty:
            ax.step(
                bid_df["price"],
                bid_df["cumulative"],
                where="post",
                color="green",
                alpha=0.8,
                label="Bids"
            )
            ax.fill_between(
                bid_df["price"],
                bid_df["cumulative"],
                step="post",
                alpha=0.2,
                color="green"
            )
        
        # Plot asks
        if not ask_df.empty:
            ax.step(
                ask_df["price"],
                ask_df["cumulative"],
                where="pre",
                color="red",
                alpha=0.8,
                label="Asks"
            )
            ax.fill_between(
                ask_df["price"],
                ask_df["cumulative"],
                step="pre",
                alpha=0.2,
                color="red"
            )
        
        # Add mid price line
        mid_price = self.order_book.calculate_mid_price()
        if mid_price > 0:
            ax.axvline(mid_price, color="black", linestyle="--", alpha=0.5, label=f"Mid Price: {mid_price:.2f}")
        
        # Set labels and title
        ax.set_xlabel("Price")
        ax.set_ylabel("Cumulative Size")
        ax.set_title(f"Depth Chart for {self.order_book.symbol}")
        
        # Add legend
        ax.legend()
        
        # Add grid
        ax.grid(True, alpha=0.3)
        
        # Tight layout
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)
        
        return img_str
    
    def generate_price_impact_chart(self) -> str:
        """
        Generate a price impact chart.
        
        Returns:
            Base64-encoded PNG image of the price impact chart
        """
        # Get market depth
        depth = self.calculate_market_depth(levels=20)
        
        # Create DataFrames
        buy_impact_df = pd.DataFrame(depth["buy_impact"])
        sell_impact_df = pd.DataFrame(depth["sell_impact"])
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot buy impact
        ax.plot(
            buy_impact_df["size_percent"] * 100,
            buy_impact_df["price_impact_bps"],
            marker="o",
            color="green",
            alpha=0.8,
            label="Buy Impact"
        )
        
        # Plot sell impact
        ax.plot(
            sell_impact_df["size_percent"] * 100,
            sell_impact_df["price_impact_bps"],
            marker="o",
            color="red",
            alpha=0.8,
            label="Sell Impact"
        )
        
        # Set labels and title
        ax.set_xlabel("Order Size (% of Book)")
        ax.set_ylabel("Price Impact (bps)")
        ax.set_title(f"Price Impact Analysis for {self.order_book.symbol}")
        
        # Add legend
        ax.legend()
        
        # Add grid
        ax.grid(True, alpha=0.3)
        
        # Tight layout
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)
        
        return img_str
    
    def calculate_trading_signals(self) -> Dict[str, Any]:
        """
        Calculate trading signals based on order book analysis.
        
        Returns:
            Dictionary with trading signals
        """
        # Calculate basic metrics
        basic_metrics = self.calculate_basic_metrics()
        
        # Calculate imbalance metrics
        imbalance_metrics = self.calculate_order_book_imbalance()
        
        # Calculate liquidity metrics
        liquidity_metrics = self.calculate_liquidity_metrics()
        
        # Calculate signals
        signals = {}
        
        # Volume imbalance signal
        volume_imbalance = imbalance_metrics["volume_imbalance"]
        if volume_imbalance > 0.2:
            signals["volume_imbalance"] = {
                "signal": "buy",
                "strength": min(1.0, volume_imbalance * 2),
                "description": f"Strong buying pressure with volume imbalance of {volume_imbalance:.2f}"
            }
        elif volume_imbalance < -0.2:
            signals["volume_imbalance"] = {
                "signal": "sell",
                "strength": min(1.0, -volume_imbalance * 2),
                "description": f"Strong selling pressure with volume imbalance of {volume_imbalance:.2f}"
            }
        
        # Weighted imbalance signal
        weighted_imbalance = imbalance_metrics["weighted_imbalance"]
        if weighted_imbalance > 0.15:
            signals["weighted_imbalance"] = {
                "signal": "buy",
                "strength": min(1.0, weighted_imbalance * 3),
                "description": f"Bid side has stronger depth with weighted imbalance of {weighted_imbalance:.2f}"
            }
        elif weighted_imbalance < -0.15:
            signals["weighted_imbalance"] = {
                "signal": "sell",
                "strength": min(1.0, -weighted_imbalance * 3),
                "description": f"Ask side has stronger depth with weighted imbalance of {weighted_imbalance:.2f}"
            }
        
        # Spread signal
        relative_spread = liquidity_metrics["relative_spread"]
        if relative_spread < 0.0001:  # Less than 1 bps
            signals["spread"] = {
                "signal": "high_liquidity",
                "strength": 0.8,
                "description": f"Very tight spread of {relative_spread * 10000:.2f} bps indicates high liquidity"
            }
        elif relative_spread > 0.001:  # More than 10 bps
            signals["spread"] = {
                "signal": "low_liquidity",
                "strength": min(1.0, relative_spread * 500),
                "description": f"Wide spread of {relative_spread * 10000:.2f} bps indicates low liquidity"
            }
        
        # Best bid/ask volume imbalance signal
        best_volume_imbalance = basic_metrics["best_volume_imbalance"]
        if best_volume_imbalance > 0.3:
            signals["best_volume_imbalance"] = {
                "signal": "buy",
                "strength": min(1.0, best_volume_imbalance * 1.5),
                "description": f"Strong buying at the top of the book with imbalance of {best_volume_imbalance:.2f}"
            }
        elif best_volume_imbalance < -0.3:
            signals["best_volume_imbalance"] = {
                "signal": "sell",
                "strength": min(1.0, -best_volume_imbalance * 1.5),
                "description": f"Strong selling at the top of the book with imbalance of {best_volume_imbalance:.2f}"
            }
        
        # Liquidity signal
        depth_5pct = liquidity_metrics["depth_5pct"]
        total_volume = basic_metrics["bid_volume"] + basic_metrics["ask_volume"]
        
        if depth_5pct > 0.8 * total_volume:
            signals["liquidity"] = {
                "signal": "high_liquidity",
                "strength": 0.9,
                "description": f"High liquidity with {depth_5pct / total_volume * 100:.1f}% of volume within 5% of mid price"
            }
        elif depth_5pct < 0.2 * total_volume:
            signals["liquidity"] = {
                "signal": "low_liquidity",
                "strength": 0.8,
                "description": f"Low liquidity with only {depth_5pct / total_volume * 100:.1f}% of volume within 5% of mid price"
            }
        
        # Calculate overall signal
        buy_signals = [s for s in signals.values() if s["signal"] == "buy"]
        sell_signals = [s for s in signals.values() if s["signal"] == "sell"]
        
        buy_strength = sum(s["strength"] for s in buy_signals) / max(1, len(buy_signals))
        sell_strength = sum(s["strength"] for s in sell_signals) / max(1, len(sell_signals))
        
        if buy_strength > sell_strength and buy_strength > 0.5:
            overall_signal = {
                "signal": "buy",
                "strength": buy_strength,
                "confidence": buy_strength / (buy_strength + sell_strength) if (buy_strength + sell_strength) > 0 else 0.5
            }
        elif sell_strength > buy_strength and sell_strength > 0.5:
            overall_signal = {
                "signal": "sell",
                "strength": sell_strength,
                "confidence": sell_strength / (buy_strength + sell_strength) if (buy_strength + sell_strength) > 0 else 0.5
            }
        else:
            overall_signal = {
                "signal": "neutral",
                "strength": 0.5,
                "confidence": 0.5
            }
        
        return {
            "signals": signals,
            "overall_signal": overall_signal,
            "timestamp": datetime.now().isoformat()
        }

class OrderBookTimeSeriesAnalytics:
    """
    Provides time series analytics for order book data.
    """
    
    def __init__(self, symbol: str, max_history: int = 100):
        """
        Initialize the order book time series analytics.
        
        Args:
            symbol: Symbol to analyze
            max_history: Maximum number of snapshots to keep in history
        """
        self.symbol = symbol
        self.max_history = max_history
        self.snapshots = []
        self.metrics_history = []
        self.logger = logger
    
    def add_snapshot(self, order_book: OrderBook) -> None:
        """
        Add an order book snapshot to the history.
        
        Args:
            order_book: Order book snapshot
        """
        # Create analytics for the snapshot
        analytics = OrderBookAnalytics(order_book)
        
        # Calculate metrics
        basic_metrics = analytics.calculate_basic_metrics()
        imbalance_metrics = analytics.calculate_order_book_imbalance()
        liquidity_metrics = analytics.calculate_liquidity_metrics()
        
        # Combine metrics
        metrics = {
            "timestamp": datetime.now(),
            "mid_price": basic_metrics["mid_price"],
            "spread": basic_metrics["spread"],
            "relative_spread": basic_metrics["relative_spread"],
            "bid_volume": basic_metrics["bid_volume"],
            "ask_volume": basic_metrics["ask_volume"],
            "volume_imbalance": imbalance_metrics["volume_imbalance"],
            "weighted_imbalance": imbalance_metrics["weighted_imbalance"],
            "depth_5pct": liquidity_metrics["depth_5pct"],
            "resiliency": liquidity_metrics["resiliency"]
        }
        
        # Add to history
        self.snapshots.append({
            "order_book": order_book,
            "metrics": metrics
        })
        
        self.metrics_history.append(metrics)
        
        # Trim history if needed
        if len(self.snapshots) > self.max_history:
            self.snapshots.pop(0)
            self.metrics_history.pop(0)
    
    def calculate_time_series_metrics(self) -> Dict[str, Any]:
        """
        Calculate time series metrics.
        
        Returns:
            Dictionary with time series metrics
        """
        if not self.metrics_history:
            return {
                "symbol": self.symbol,
                "metrics": {},
                "timestamp": datetime.now().isoformat()
            }
        
        # Convert metrics history to DataFrame
        df = pd.DataFrame(self.metrics_history)
        
        # Calculate time series metrics
        metrics = {}
        
        # Price volatility
        if len(df) > 1:
            price_returns = df["mid_price"].pct_change().dropna()
            metrics["price_volatility"] = price_returns.std() * np.sqrt(len(df))  # Annualized
        else:
            metrics["price_volatility"] = 0.0
        
        # Spread volatility
        if len(df) > 1:
            spread_changes = df["relative_spread"].diff().dropna()
            metrics["spread_volatility"] = spread_changes.std()
        else:
            metrics["spread_volatility"] = 0.0
        
        # Volume imbalance trend
        if len(df) > 1:
            # Calculate linear regression
            x = np.arange(len(df))
            y = df["volume_imbalance"].values
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            
            metrics["volume_imbalance_trend"] = slope
            metrics["volume_imbalance_trend_significance"] = r_value ** 2
        else:
            metrics["volume_imbalance_trend"] = 0.0
            metrics["volume_imbalance_trend_significance"] = 0.0
        
        # Liquidity trend
        if len(df) > 1:
            # Calculate linear regression
            x = np.arange(len(df))
            y = df["depth_5pct"].values
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            
            metrics["liquidity_trend"] = slope
            metrics["liquidity_trend_significance"] = r_value ** 2
        else:
            metrics["liquidity_trend"] = 0.0
            metrics["liquidity_trend_significance"] = 0.0
        
        # Calculate autocorrelation of volume imbalance
        if len(df) > 5:
            acf = np.correlate(df["volume_imbalance"].values, df["volume_imbalance"].values, mode="full")
            acf = acf[len(acf)//2:] / acf[len(acf)//2]
            metrics["volume_imbalance_autocorrelation"] = acf[1] if len(acf) > 1 else 0.0
        else:
            metrics["volume_imbalance_autocorrelation"] = 0.0
        
        # Calculate mean reversion strength
        if len(df) > 5:
            # Calculate AR(1) coefficient
            y = df["mid_price"].values
            y_lag = np.roll(y, 1)[1:]
            y = y[1:]
            
            if len(y) > 1:
                slope, intercept, r_value, p_value, std_err = stats.linregress(y_lag, y)
                metrics["mean_reversion_strength"] = 1 - slope
            else:
                metrics["mean_reversion_strength"] = 0.0
        else:
            metrics["mean_reversion_strength"] = 0.0
        
        return {
            "symbol": self.symbol,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
    
    def generate_time_series_chart(self, metric: str = "mid_price") -> str:
        """
        Generate a time series chart.
        
        Args:
            metric: Metric to plot
            
        Returns:
            Base64-encoded PNG image of the time series chart
        """
        if not self.metrics_history:
            # Create empty chart
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.set_title(f"No data available for {self.symbol}")
            ax.set_xlabel("Time")
            ax.set_ylabel(metric)
            plt.tight_layout()
            
            # Convert to base64
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=100)
            buf.seek(0)
            img_str = base64.b64encode(buf.read()).decode("utf-8")
            plt.close(fig)
            
            return img_str
        
        # Convert metrics history to DataFrame
        df = pd.DataFrame(self.metrics_history)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot metric
        ax.plot(
            df["timestamp"],
            df[metric],
            marker="o",
            markersize=4,
            alpha=0.8
        )
        
        # Set labels and title
        ax.set_xlabel("Time")
        ax.set_ylabel(metric)
        ax.set_title(f"{metric} for {self.symbol}")
        
        # Format x-axis
        plt.xticks(rotation=45)
        fig.autofmt_xdate()
        
        # Add grid
        ax.grid(True, alpha=0.3)
        
        # Tight layout
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)
        
        return img_str
    
    def generate_volume_imbalance_chart(self) -> str:
        """
        Generate a volume imbalance chart.
        
        Returns:
            Base64-encoded PNG image of the volume imbalance chart
        """
        if not self.metrics_history:
            # Create empty chart
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.set_title(f"No data available for {self.symbol}")
            ax.set_xlabel("Time")
            ax.set_ylabel("Volume Imbalance")
            plt.tight_layout()
            
            # Convert to base64
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=100)
            buf.seek(0)
            img_str = base64.b64encode(buf.read()).decode("utf-8")
            plt.close(fig)
            
            return img_str
        
        # Convert metrics history to DataFrame
        df = pd.DataFrame(self.metrics_history)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot volume imbalance
        ax.fill_between(
            df["timestamp"],
            df["volume_imbalance"],
            0,
            where=(df["volume_imbalance"] >= 0),
            color="green",
            alpha=0.5,
            label="Buy Imbalance"
        )
        
        ax.fill_between(
            df["timestamp"],
            df["volume_imbalance"],
            0,
            where=(df["volume_imbalance"] <= 0),
            color="red",
            alpha=0.5,
            label="Sell Imbalance"
        )
        
        # Plot mid price on secondary axis
        ax2 = ax.twinx()
        ax2.plot(
            df["timestamp"],
            df["mid_price"],
            color="black",
            alpha=0.7,
            label="Mid Price"
        )
        
        # Set labels and title
        ax.set_xlabel("Time")
        ax.set_ylabel("Volume Imbalance")
        ax2.set_ylabel("Mid Price")
        ax.set_title(f"Volume Imbalance vs Price for {self.symbol}")
        
        # Set y-axis limits for imbalance
        ax.set_ylim(-1, 1)
        
        # Format x-axis
        plt.xticks(rotation=45)
        fig.autofmt_xdate()
        
        # Add grid
        ax.grid(True, alpha=0.3)
        
        # Add legend
        lines1, labels1 = ax.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax.legend(lines1 + lines2, labels1 + labels2, loc="upper left")
        
        # Tight layout
        plt.tight_layout()
        
        # Convert to base64
        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100)
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)
        
        return img_str
    
    def calculate_trading_signals(self) -> Dict[str, Any]:
        """
        Calculate trading signals based on time series analysis.
        
        Returns:
            Dictionary with trading signals
        """
        if len(self.metrics_history) < 5:
            return {
                "symbol": self.symbol,
                "signals": {},
                "overall_signal": {
                    "signal": "neutral",
                    "strength": 0.5,
                    "confidence": 0.0
                },
                "timestamp": datetime.now().isoformat()
            }
        
        # Calculate time series metrics
        ts_metrics = self.calculate_time_series_metrics()["metrics"]
        
        # Get latest metrics
        latest_metrics = self.metrics_history[-1]
        
        # Calculate signals
        signals = {}
        
        # Volume imbalance trend signal
        volume_imbalance_trend = ts_metrics["volume_imbalance_trend"]
        if abs(volume_imbalance_trend) > 0.01 and ts_metrics["volume_imbalance_trend_significance"] > 0.3:
            if volume_imbalance_trend > 0:
                signals["volume_imbalance_trend"] = {
                    "signal": "buy",
                    "strength": min(1.0, volume_imbalance_trend * 50),
                    "description": f"Increasing buy pressure with trend of {volume_imbalance_trend:.4f}"
                }
            else:
                signals["volume_imbalance_trend"] = {
                    "signal": "sell",
                    "strength": min(1.0, -volume_imbalance_trend * 50),
                    "description": f"Increasing sell pressure with trend of {volume_imbalance_trend:.4f}"
                }
        
        # Liquidity trend signal
        liquidity_trend = ts_metrics["liquidity_trend"]
        if abs(liquidity_trend) > 0.01 and ts_metrics["liquidity_trend_significance"] > 0.3:
            if liquidity_trend > 0:
                signals["liquidity_trend"] = {
                    "signal": "high_liquidity",
                    "strength": min(1.0, liquidity_trend * 50),
                    "description": f"Increasing liquidity with trend of {liquidity_trend:.4f}"
                }
            else:
                signals["liquidity_trend"] = {
                    "signal": "low_liquidity",
                    "strength": min(1.0, -liquidity_trend * 50),
                    "description": f"Decreasing liquidity with trend of {liquidity_trend:.4f}"
                }
        
        # Mean reversion signal
        mean_reversion = ts_metrics["mean_reversion_strength"]
        if mean_reversion > 0.5:
            # Get recent price movement
            recent_prices = [m["mid_price"] for m in self.metrics_history[-5:]]
            recent_change = (recent_prices[-1] / recent_prices[0]) - 1
            
            if recent_change > 0.005:  # 0.5% up
                signals["mean_reversion"] = {
                    "signal": "sell",
                    "strength": min(1.0, mean_reversion * recent_change * 100),
                    "description": f"Mean reversion signal after {recent_change * 100:.2f}% price increase"
                }
            elif recent_change < -0.005:  # 0.5% down
                signals["mean_reversion"] = {
                    "signal": "buy",
                    "strength": min(1.0, mean_reversion * -recent_change * 100),
                    "description": f"Mean reversion signal after {-recent_change * 100:.2f}% price decrease"
                }
        
        # Current volume imbalance signal
        volume_imbalance = latest_metrics["volume_imbalance"]
        if abs(volume_imbalance) > 0.2:
            if volume_imbalance > 0:
                signals["current_volume_imbalance"] = {
                    "signal": "buy",
                    "strength": min(1.0, volume_imbalance * 2),
                    "description": f"Current buy pressure with imbalance of {volume_imbalance:.2f}"
                }
            else:
                signals["current_volume_imbalance"] = {
                    "signal": "sell",
                    "strength": min(1.0, -volume_imbalance * 2),
                    "description": f"Current sell pressure with imbalance of {volume_imbalance:.2f}"
                }
        
        # Price volatility signal
        price_volatility = ts_metrics["price_volatility"]
        if price_volatility > 0.02:  # More than 2% annualized volatility
            signals["price_volatility"] = {
                "signal": "high_volatility",
                "strength": min(1.0, price_volatility * 10),
                "description": f"High price volatility of {price_volatility * 100:.2f}%"
            }
        elif price_volatility < 0.005:  # Less than 0.5% annualized volatility
            signals["price_volatility"] = {
                "signal": "low_volatility",
                "strength": min(1.0, (0.01 - price_volatility) * 200),
                "description": f"Low price volatility of {price_volatility * 100:.2f}%"
            }
        
        # Calculate overall signal
        buy_signals = [s for s in signals.values() if s["signal"] == "buy"]
        sell_signals = [s for s in signals.values() if s["signal"] == "sell"]
        
        buy_strength = sum(s["strength"] for s in buy_signals) / max(1, len(buy_signals))
        sell_strength = sum(s["strength"] for s in sell_signals) / max(1, len(sell_signals))
        
        if buy_strength > sell_strength and buy_strength > 0.5:
            overall_signal = {
                "signal": "buy",
                "strength": buy_strength,
                "confidence": buy_strength / (buy_strength + sell_strength) if (buy_strength + sell_strength) > 0 else 0.5
            }
        elif sell_strength > buy_strength and sell_strength > 0.5:
            overall_signal = {
                "signal": "sell",
                "strength": sell_strength,
                "confidence": sell_strength / (buy_strength + sell_strength) if (buy_strength + sell_strength) > 0 else 0.5
            }
        else:
            overall_signal = {
                "signal": "neutral",
                "strength": 0.5,
                "confidence": 0.5
            }
        
        return {
            "symbol": self.symbol,
            "signals": signals,
            "overall_signal": overall_signal,
            "timestamp": datetime.now().isoformat()
        }