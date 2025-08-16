"""
Order Book Model Module

This module provides classes and functions for representing and analyzing order book data.
"""

from typing import Dict, List, Any, Optional, Union, Tuple
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
from enum import Enum
from dataclasses import dataclass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("order_book_model")

class OrderType(Enum):
    """Order types in the order book."""
    LIMIT = "limit"
    MARKET = "market"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    IOC = "ioc"  # Immediate or Cancel
    FOK = "fok"  # Fill or Kill
    POST_ONLY = "post_only"

class OrderSide(Enum):
    """Order sides in the order book."""
    BUY = "buy"
    SELL = "sell"

@dataclass
class Order:
    """
    Represents an individual order in the order book.
    """
    id: str
    price: float
    size: float
    side: OrderSide
    type: OrderType
    timestamp: datetime
    status: str = "active"
    filled: float = 0.0
    
    def __post_init__(self):
        """Convert string enums to actual enum values if needed."""
        if isinstance(self.side, str):
            self.side = OrderSide(self.side)
        if isinstance(self.type, str):
            self.type = OrderType(self.type)
    
    def fill(self, amount: float) -> float:
        """
        Fill the order with the specified amount.
        
        Args:
            amount: Amount to fill
            
        Returns:
            Amount actually filled
        """
        if self.status != "active":
            return 0.0
        
        fill_amount = min(amount, self.size - self.filled)
        self.filled += fill_amount
        
        if self.filled >= self.size:
            self.status = "filled"
        
        return fill_amount
    
    def cancel(self) -> bool:
        """
        Cancel the order.
        
        Returns:
            True if the order was successfully canceled, False otherwise
        """
        if self.status == "active":
            self.status = "canceled"
            return True
        return False
    
    def remaining_size(self) -> float:
        """
        Get the remaining size of the order.
        
        Returns:
            Remaining size
        """
        return self.size - self.filled

class PriceLevel:
    """
    Represents a price level in the order book.
    """
    def __init__(self, price: float):
        self.price = price
        self.orders: List[Order] = []
        self.total_size: float = 0.0
    
    def add_order(self, order: Order) -> None:
        """
        Add an order to this price level.
        
        Args:
            order: Order to add
        """
        self.orders.append(order)
        self.total_size += order.remaining_size()
    
    def remove_order(self, order_id: str) -> Optional[Order]:
        """
        Remove an order from this price level.
        
        Args:
            order_id: ID of the order to remove
            
        Returns:
            Removed order, or None if not found
        """
        for i, order in enumerate(self.orders):
            if order.id == order_id:
                removed_order = self.orders.pop(i)
                self.total_size -= removed_order.remaining_size()
                return removed_order
        return None
    
    def update_order(self, order_id: str, new_size: float) -> bool:
        """
        Update an order's size at this price level.
        
        Args:
            order_id: ID of the order to update
            new_size: New size of the order
            
        Returns:
            True if the order was successfully updated, False otherwise
        """
        for order in self.orders:
            if order.id == order_id:
                size_diff = new_size - order.remaining_size()
                order.size = new_size + order.filled
                self.total_size += size_diff
                return True
        return False
    
    def match(self, size: float) -> Tuple[float, List[Order]]:
        """
        Match orders at this price level with the specified size.
        
        Args:
            size: Size to match
            
        Returns:
            Tuple of (matched size, list of filled orders)
        """
        matched_size = 0.0
        filled_orders = []
        
        for order in self.orders[:]:  # Create a copy to iterate
            if matched_size >= size:
                break
            
            remaining = size - matched_size
            fill_amount = order.fill(remaining)
            matched_size += fill_amount
            
            if order.status == "filled":
                filled_orders.append(order)
                self.orders.remove(order)
        
        self.total_size -= matched_size
        return matched_size, filled_orders

class OrderBook:
    """
    Represents a complete order book for a trading instrument.
    """
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.bids: Dict[float, PriceLevel] = {}  # Buy orders, keyed by price
        self.asks: Dict[float, PriceLevel] = {}  # Sell orders, keyed by price
        self.orders: Dict[str, Order] = {}  # All orders, keyed by ID
        self.last_update_time = datetime.now()
        self.sequence_number = 0
        self.logger = logger
    
    def add_order(self, order: Order) -> bool:
        """
        Add an order to the order book.
        
        Args:
            order: Order to add
            
        Returns:
            True if the order was successfully added, False otherwise
        """
        if order.id in self.orders:
            self.logger.warning(f"Order {order.id} already exists in the order book")
            return False
        
        # Add to orders dictionary
        self.orders[order.id] = order
        
        # Add to appropriate side
        if order.side == OrderSide.BUY:
            price_levels = self.bids
        else:
            price_levels = self.asks
        
        # Get or create price level
        if order.price not in price_levels:
            price_levels[order.price] = PriceLevel(order.price)
        
        # Add order to price level
        price_levels[order.price].add_order(order)
        
        # Update metadata
        self.last_update_time = datetime.now()
        self.sequence_number += 1
        
        return True
    
    def cancel_order(self, order_id: str) -> bool:
        """
        Cancel an order in the order book.
        
        Args:
            order_id: ID of the order to cancel
            
        Returns:
            True if the order was successfully canceled, False otherwise
        """
        if order_id not in self.orders:
            self.logger.warning(f"Order {order_id} not found in the order book")
            return False
        
        order = self.orders[order_id]
        
        # Cancel the order
        if not order.cancel():
            return False
        
        # Remove from price level
        price_levels = self.bids if order.side == OrderSide.BUY else self.asks
        if order.price in price_levels:
            price_levels[order.price].remove_order(order_id)
            
            # Remove price level if empty
            if len(price_levels[order.price].orders) == 0:
                del price_levels[order.price]
        
        # Update metadata
        self.last_update_time = datetime.now()
        self.sequence_number += 1
        
        return True
    
    def update_order(self, order_id: str, new_size: float) -> bool:
        """
        Update an order's size in the order book.
        
        Args:
            order_id: ID of the order to update
            new_size: New size of the order
            
        Returns:
            True if the order was successfully updated, False otherwise
        """
        if order_id not in self.orders:
            self.logger.warning(f"Order {order_id} not found in the order book")
            return False
        
        order = self.orders[order_id]
        
        # Update order size
        if new_size <= order.filled:
            self.logger.warning(f"New size {new_size} is less than or equal to filled size {order.filled}")
            return False
        
        # Update in price level
        price_levels = self.bids if order.side == OrderSide.BUY else self.asks
        if order.price in price_levels:
            if not price_levels[order.price].update_order(order_id, new_size):
                return False
        
        # Update metadata
        self.last_update_time = datetime.now()
        self.sequence_number += 1
        
        return True
    
    def match_market_order(self, side: OrderSide, size: float) -> Tuple[float, float, List[Order]]:
        """
        Match a market order against the order book.
        
        Args:
            side: Side of the market order
            size: Size of the market order
            
        Returns:
            Tuple of (matched size, average price, list of filled orders)
        """
        matched_size = 0.0
        matched_value = 0.0
        filled_orders = []
        
        # Determine which side to match against
        if side == OrderSide.BUY:
            price_levels = sorted(self.asks.keys())
            levels = self.asks
        else:
            price_levels = sorted(self.bids.keys(), reverse=True)
            levels = self.bids
        
        # Match against price levels
        for price in price_levels:
            if matched_size >= size:
                break
            
            level = levels[price]
            remaining = size - matched_size
            level_matched, level_filled = level.match(remaining)
            
            matched_size += level_matched
            matched_value += level_matched * price
            filled_orders.extend(level_filled)
            
            # Remove price level if empty
            if len(level.orders) == 0:
                del levels[price]
        
        # Calculate average price
        avg_price = matched_value / matched_size if matched_size > 0 else 0.0
        
        # Update metadata
        self.last_update_time = datetime.now()
        self.sequence_number += 1
        
        return matched_size, avg_price, filled_orders
    
    def get_price_levels(self, side: OrderSide, depth: int = 10) -> List[Dict[str, float]]:
        """
        Get price levels for the specified side.
        
        Args:
            side: Side to get price levels for
            depth: Number of price levels to return
            
        Returns:
            List of price levels with price and size
        """
        if side == OrderSide.BUY:
            prices = sorted(self.bids.keys(), reverse=True)
            levels = self.bids
        else:
            prices = sorted(self.asks.keys())
            levels = self.asks
        
        result = []
        for price in prices[:depth]:
            result.append({
                "price": price,
                "size": levels[price].total_size
            })
        
        return result
    
    def get_order_book_snapshot(self, depth: int = 10) -> Dict[str, Any]:
        """
        Get a snapshot of the order book.
        
        Args:
            depth: Number of price levels to include
            
        Returns:
            Dictionary with order book snapshot
        """
        return {
            "symbol": self.symbol,
            "bids": self.get_price_levels(OrderSide.BUY, depth),
            "asks": self.get_price_levels(OrderSide.SELL, depth),
            "timestamp": self.last_update_time.isoformat(),
            "sequence": self.sequence_number
        }
    
    def calculate_mid_price(self) -> float:
        """
        Calculate the mid price of the order book.
        
        Returns:
            Mid price
        """
        if not self.bids or not self.asks:
            return 0.0
        
        best_bid = max(self.bids.keys()) if self.bids else 0.0
        best_ask = min(self.asks.keys()) if self.asks else float('inf')
        
        if best_bid == 0.0 or best_ask == float('inf'):
            return 0.0
        
        return (best_bid + best_ask) / 2.0
    
    def calculate_spread(self) -> float:
        """
        Calculate the spread of the order book.
        
        Returns:
            Spread
        """
        if not self.bids or not self.asks:
            return 0.0
        
        best_bid = max(self.bids.keys()) if self.bids else 0.0
        best_ask = min(self.asks.keys()) if self.asks else float('inf')
        
        if best_bid == 0.0 or best_ask == float('inf'):
            return 0.0
        
        return best_ask - best_bid
    
    def calculate_market_depth(self, price_range: float = 0.01) -> Dict[str, float]:
        """
        Calculate market depth within a price range from the mid price.
        
        Args:
            price_range: Price range as a percentage of mid price
            
        Returns:
            Dictionary with bid and ask depth
        """
        mid_price = self.calculate_mid_price()
        if mid_price == 0.0:
            return {"bid_depth": 0.0, "ask_depth": 0.0}
        
        price_delta = mid_price * price_range
        lower_bound = mid_price - price_delta
        upper_bound = mid_price + price_delta
        
        bid_depth = sum(level.total_size for price, level in self.bids.items() if price >= lower_bound)
        ask_depth = sum(level.total_size for price, level in self.asks.items() if price <= upper_bound)
        
        return {
            "bid_depth": bid_depth,
            "ask_depth": ask_depth,
            "bid_ask_ratio": bid_depth / ask_depth if ask_depth > 0 else float('inf')
        }
    
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
        
        bid_volume = sum(level.total_size for level in self.bids.values())
        ask_volume = sum(level.total_size for level in self.asks.values())
        
        total_volume = bid_volume + ask_volume
        if total_volume == 0:
            return 0.0
        
        return (bid_volume - ask_volume) / total_volume
    
    def calculate_price_impact(self, side: OrderSide, size: float) -> float:
        """
        Calculate the price impact of a market order.
        
        Args:
            side: Side of the market order
            size: Size of the market order
            
        Returns:
            Price impact as a percentage of mid price
        """
        mid_price = self.calculate_mid_price()
        if mid_price == 0.0:
            return 0.0
        
        # Simulate market order execution
        matched_size, avg_price, _ = self.match_market_order(side, size)
        
        # Calculate price impact
        if side == OrderSide.BUY:
            return (avg_price - mid_price) / mid_price
        else:
            return (mid_price - avg_price) / mid_price
    
    def to_dataframe(self) -> Dict[str, pd.DataFrame]:
        """
        Convert the order book to DataFrames.
        
        Returns:
            Dictionary with bid and ask DataFrames
        """
        bid_data = []
        for price, level in self.bids.items():
            bid_data.append({
                "price": price,
                "size": level.total_size,
                "orders": len(level.orders)
            })
        
        ask_data = []
        for price, level in self.asks.items():
            ask_data.append({
                "price": price,
                "size": level.total_size,
                "orders": len(level.orders)
            })
        
        bid_df = pd.DataFrame(bid_data).sort_values("price", ascending=False) if bid_data else pd.DataFrame(columns=["price", "size", "orders"])
        ask_df = pd.DataFrame(ask_data).sort_values("price") if ask_data else pd.DataFrame(columns=["price", "size", "orders"])
        
        return {
            "bids": bid_df,
            "asks": ask_df
        }

class OrderBookManager:
    """
    Manages multiple order books.
    """
    def __init__(self):
        self.order_books: Dict[str, OrderBook] = {}
        self.logger = logger
    
    def get_order_book(self, symbol: str) -> OrderBook:
        """
        Get the order book for the specified symbol.
        
        Args:
            symbol: Symbol to get order book for
            
        Returns:
            Order book for the specified symbol
        """
        if symbol not in self.order_books:
            self.order_books[symbol] = OrderBook(symbol)
        
        return self.order_books[symbol]
    
    def process_order_event(self, event: Dict[str, Any]) -> bool:
        """
        Process an order event.
        
        Args:
            event: Order event
            
        Returns:
            True if the event was successfully processed, False otherwise
        """
        event_type = event.get("type")
        symbol = event.get("symbol")
        
        if not symbol:
            self.logger.error("Event missing symbol")
            return False
        
        order_book = self.get_order_book(symbol)
        
        if event_type == "add":
            # Add order
            order = Order(
                id=event.get("order_id"),
                price=event.get("price"),
                size=event.get("size"),
                side=OrderSide(event.get("side")),
                type=OrderType(event.get("order_type", "limit")),
                timestamp=datetime.fromisoformat(event.get("timestamp")) if "timestamp" in event else datetime.now()
            )
            return order_book.add_order(order)
        
        elif event_type == "cancel":
            # Cancel order
            return order_book.cancel_order(event.get("order_id"))
        
        elif event_type == "update":
            # Update order
            return order_book.update_order(event.get("order_id"), event.get("size"))
        
        elif event_type == "trade":
            # Process trade
            side = OrderSide.SELL if event.get("aggressor_side") == "buy" else OrderSide.BUY
            matched_size, avg_price, filled_orders = order_book.match_market_order(side, event.get("size"))
            return matched_size > 0
        
        else:
            self.logger.error(f"Unknown event type: {event_type}")
            return False
    
    def process_snapshot(self, snapshot: Dict[str, Any]) -> bool:
        """
        Process an order book snapshot.
        
        Args:
            snapshot: Order book snapshot
            
        Returns:
            True if the snapshot was successfully processed, False otherwise
        """
        symbol = snapshot.get("symbol")
        
        if not symbol:
            self.logger.error("Snapshot missing symbol")
            return False
        
        # Create new order book
        order_book = OrderBook(symbol)
        
        # Process bids
        for bid in snapshot.get("bids", []):
            order = Order(
                id=f"bid_{bid['price']}_{datetime.now().timestamp()}",
                price=bid["price"],
                size=bid["size"],
                side=OrderSide.BUY,
                type=OrderType.LIMIT,
                timestamp=datetime.now()
            )
            order_book.add_order(order)
        
        # Process asks
        for ask in snapshot.get("asks", []):
            order = Order(
                id=f"ask_{ask['price']}_{datetime.now().timestamp()}",
                price=ask["price"],
                size=ask["size"],
                side=OrderSide.SELL,
                type=OrderType.LIMIT,
                timestamp=datetime.now()
            )
            order_book.add_order(order)
        
        # Update sequence number
        if "sequence" in snapshot:
            order_book.sequence_number = snapshot["sequence"]
        
        # Update timestamp
        if "timestamp" in snapshot:
            order_book.last_update_time = datetime.fromisoformat(snapshot["timestamp"])
        
        # Replace existing order book
        self.order_books[symbol] = order_book
        
        return True
    
    def get_all_symbols(self) -> List[str]:
        """
        Get all symbols with order books.
        
        Returns:
            List of symbols
        """
        return list(self.order_books.keys())
    
    def get_order_book_snapshot(self, symbol: str, depth: int = 10) -> Dict[str, Any]:
        """
        Get a snapshot of the order book for the specified symbol.
        
        Args:
            symbol: Symbol to get order book snapshot for
            depth: Number of price levels to include
            
        Returns:
            Dictionary with order book snapshot
        """
        if symbol not in self.order_books:
            return {
                "symbol": symbol,
                "bids": [],
                "asks": [],
                "timestamp": datetime.now().isoformat(),
                "sequence": 0
            }
        
        return self.order_books[symbol].get_order_book_snapshot(depth)