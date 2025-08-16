"""
WebSocket Service for Real-Time Market Data
This service manages WebSocket connections for real-time market data updates.
"""
import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional, Callable
import websockets
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    WebSocket connection manager for handling real-time data streams.
    """
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.subscriptions: Dict[str, Set[str]] = {}
        self.symbol_data: Dict[str, Dict[str, Any]] = {}
        self.running = False
        self.data_update_task = None

    async def connect(self, websocket: WebSocket, client_id: str):
        """
        Connect a new WebSocket client
        
        Args:
            websocket: The WebSocket connection
            client_id: Unique identifier for the client
        """
        await websocket.accept()
        
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        
        self.active_connections[client_id].append(websocket)
        self.subscriptions[client_id] = set()
        
        logger.info(f"Client {client_id} connected. Active connections: {len(self.active_connections)}")
        
        # Start data simulation if not already running
        if not self.running:
            self.running = True
            self.data_update_task = asyncio.create_task(self.simulate_market_data())

    async def disconnect(self, websocket: WebSocket, client_id: str):
        """
        Disconnect a WebSocket client
        
        Args:
            websocket: The WebSocket connection
            client_id: Unique identifier for the client
        """
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
            
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
                if client_id in self.subscriptions:
                    del self.subscriptions[client_id]
        
        logger.info(f"Client {client_id} disconnected. Active connections: {len(self.active_connections)}")
        
        # Stop data simulation if no more connections
        if not self.active_connections and self.running:
            self.running = False
            if self.data_update_task:
                self.data_update_task.cancel()
                try:
                    await self.data_update_task
                except asyncio.CancelledError:
                    logger.info("Data update task cancelled")

    async def subscribe(self, client_id: str, symbols: List[str]):
        """
        Subscribe a client to symbols
        
        Args:
            client_id: Unique identifier for the client
            symbols: List of symbols to subscribe to
        """
        if client_id in self.subscriptions:
            self.subscriptions[client_id].update(symbols)
            
            # Initialize symbol data if not exists
            for symbol in symbols:
                if symbol not in self.symbol_data:
                    self.symbol_data[symbol] = {
                        "symbol": symbol,
                        "price": 100.0 + hash(symbol) % 900,  # Random initial price between 100 and 1000
                        "change": 0.0,
                        "change_percent": 0.0,
                        "volume": 1000 + hash(symbol) % 10000,
                        "last_update": datetime.now().isoformat()
                    }
            
            logger.info(f"Client {client_id} subscribed to {symbols}")
            
            # Send initial data
            await self.send_data_to_client(client_id, symbols)

    async def unsubscribe(self, client_id: str, symbols: List[str]):
        """
        Unsubscribe a client from symbols
        
        Args:
            client_id: Unique identifier for the client
            symbols: List of symbols to unsubscribe from
        """
        if client_id in self.subscriptions:
            self.subscriptions[client_id].difference_update(symbols)
            logger.info(f"Client {client_id} unsubscribed from {symbols}")

    async def send_data_to_client(self, client_id: str, symbols: Optional[List[str]] = None):
        """
        Send data to a specific client
        
        Args:
            client_id: Unique identifier for the client
            symbols: Optional list of symbols to send data for. If None, send all subscribed symbols.
        """
        if client_id not in self.active_connections:
            return
        
        if symbols is None and client_id in self.subscriptions:
            symbols = list(self.subscriptions[client_id])
        
        if not symbols:
            return
        
        data = {
            "type": "market_data",
            "data": [self.symbol_data[symbol] for symbol in symbols if symbol in self.symbol_data]
        }
        
        for websocket in self.active_connections[client_id]:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error sending data to client {client_id}: {e}")

    async def broadcast_data(self, symbols: List[str]):
        """
        Broadcast data to all clients that are subscribed to the symbols
        
        Args:
            symbols: List of symbols to broadcast data for
        """
        for client_id, subscribed_symbols in self.subscriptions.items():
            # Filter symbols that the client is subscribed to
            symbols_to_send = [symbol for symbol in symbols if symbol in subscribed_symbols]
            if symbols_to_send:
                await self.send_data_to_client(client_id, symbols_to_send)

    async def simulate_market_data(self):
        """
        Simulate market data updates for testing purposes
        In a real implementation, this would be replaced with actual market data source
        """
        import random
        
        try:
            while self.running:
                # Update random subset of symbols
                all_symbols = list(self.symbol_data.keys())
                if not all_symbols:
                    await asyncio.sleep(1)
                    continue
                
                # Update 20% of symbols each time
                symbols_to_update = random.sample(
                    all_symbols, 
                    max(1, int(len(all_symbols) * 0.2))
                )
                
                for symbol in symbols_to_update:
                    # Generate random price change (-0.5% to +0.5%)
                    price_change_percent = (random.random() - 0.45) * 1.0
                    old_price = self.symbol_data[symbol]["price"]
                    new_price = old_price * (1 + price_change_percent / 100)
                    
                    # Update symbol data
                    self.symbol_data[symbol].update({
                        "price": new_price,
                        "change": new_price - old_price,
                        "change_percent": price_change_percent,
                        "volume": self.symbol_data[symbol]["volume"] + random.randint(-100, 100),
                        "last_update": datetime.now().isoformat()
                    })
                
                # Broadcast updated data
                await self.broadcast_data(symbols_to_update)
                
                # Wait before next update
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            logger.info("Market data simulation cancelled")
        except Exception as e:
            logger.error(f"Error in market data simulation: {e}")

# Create a global instance of the WebSocket manager
websocket_manager = WebSocketManager()

async def handle_websocket(websocket: WebSocket, client_id: str):
    """
    Handle WebSocket connection and messages
    
    Args:
        websocket: The WebSocket connection
        client_id: Unique identifier for the client
    """
    await websocket_manager.connect(websocket, client_id)
    
    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                action = data.get("action")
                
                if action == "subscribe" and "symbols" in data:
                    await websocket_manager.subscribe(client_id, data["symbols"])
                elif action == "unsubscribe" and "symbols" in data:
                    await websocket_manager.unsubscribe(client_id, data["symbols"])
                else:
                    logger.warning(f"Unknown action: {action}")
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON message: {message}")
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket, client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket_manager.disconnect(websocket, client_id)