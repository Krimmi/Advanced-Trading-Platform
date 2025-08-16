"""
WebSocket router for real-time data streaming
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from typing import List, Optional
import uuid
import logging
from src.backend.services.websocket_service import handle_websocket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure router
router = APIRouter()

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: Optional[str] = None
):
    """
    WebSocket endpoint for real-time market data
    
    Args:
        websocket: The WebSocket connection
        client_id: Optional client identifier. If not provided, a UUID will be generated.
    """
    # Generate client ID if not provided
    if not client_id:
        client_id = str(uuid.uuid4())
    
    logger.info(f"WebSocket connection request from client {client_id}")
    
    # Handle the WebSocket connection
    await handle_websocket(websocket, client_id)