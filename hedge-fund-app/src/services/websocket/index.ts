import { store } from '../../store';
import { addNotification } from '../../store/slices/uiSlice';
import { updateMarketData } from '../../store/slices/marketSlice';
import { updatePortfolioData } from '../../store/slices/portfolioSlice';
import { updateTradingData } from '../../store/slices/tradingSlice';

// WebSocket connection URL
const WS_URL = process.env.REACT_APP_WS_URL || 'wss://api.ninjatech-trading.com/ws';

// Message types
export enum MessageType {
  MARKET_DATA = 'MARKET_DATA',
  PORTFOLIO_UPDATE = 'PORTFOLIO_UPDATE',
  TRADE_EXECUTION = 'TRADE_EXECUTION',
  ALERT = 'ALERT',
  SYSTEM = 'SYSTEM',
  AUTH = 'AUTH',
}

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}

// WebSocket message interface
export interface WebSocketMessage {
  type: MessageType;
  data: any;
  timestamp: number;
}

/**
 * WebSocket Service for real-time data
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageHandlers: Map<MessageType, ((data: any) => void)[]> = new Map();
  private connectionStateHandlers: ((state: ConnectionState) => void)[] = [];

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        resolve();
        return;
      }

      this.setConnectionState(ConnectionState.CONNECTING);

      try {
        this.socket = new WebSocket(WS_URL);

        // Connection opened
        this.socket.addEventListener('open', () => {
          this.onConnected();
          resolve();
        });

        // Connection error
        this.socket.addEventListener('error', (error) => {
          this.onError(error);
          reject(error);
        });

        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          this.onMessage(event);
        });

        // Connection closed
        this.socket.addEventListener('close', () => {
          this.onDisconnected();
        });
      } catch (error) {
        this.onError(error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.subscriptions.clear();
  }

  /**
   * Subscribe to a data channel
   */
  subscribe(channel: string): void {
    if (!this.isConnected()) {
      this.connect().then(() => {
        this.sendSubscription(channel);
      });
      return;
    }

    this.sendSubscription(channel);
  }

  /**
   * Unsubscribe from a data channel
   */
  unsubscribe(channel: string): void {
    if (!this.isConnected() || !this.subscriptions.has(channel)) {
      return;
    }

    this.sendMessage({
      type: MessageType.SYSTEM,
      data: {
        action: 'unsubscribe',
        channel,
      },
      timestamp: Date.now(),
    });

    this.subscriptions.delete(channel);
  }

  /**
   * Send a message to the WebSocket server
   */
  sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    this.socket!.send(JSON.stringify(message));
  }

  /**
   * Register a message handler
   */
  onMessage(messageType: MessageType, handler: (data: any) => void): () => void;
  onMessage(event: MessageEvent): void;
  onMessage(messageTypeOrEvent: MessageType | MessageEvent, handler?: (data: any) => void): void | (() => void) {
    // Handle incoming WebSocket message
    if (messageTypeOrEvent instanceof MessageEvent) {
      try {
        const message: WebSocketMessage = JSON.parse(messageTypeOrEvent.data);
        
        // Process message based on type
        switch (message.type) {
          case MessageType.MARKET_DATA:
            store.dispatch(updateMarketData(message.data));
            break;
            
          case MessageType.PORTFOLIO_UPDATE:
            store.dispatch(updatePortfolioData(message.data));
            break;
            
          case MessageType.TRADE_EXECUTION:
            store.dispatch(updateTradingData(message.data));
            break;
            
          case MessageType.ALERT:
            store.dispatch(addNotification({
              type: message.data.severity || 'info',
              title: message.data.title,
              message: message.data.message,
              autoHideDuration: 5000,
            }));
            break;
            
          case MessageType.SYSTEM:
            this.handleSystemMessage(message.data);
            break;
        }
        
        // Call registered handlers for this message type
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(h => h(message.data));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
      return;
    }
    
    // Register message handler
    if (!handler) return;
    
    const messageType = messageTypeOrEvent;
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Register a connection state handler
   */
  onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateHandlers.push(handler);
    
    // Immediately call with current state
    handler(this.connectionState);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionStateHandlers.indexOf(handler);
      if (index !== -1) {
        this.connectionStateHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket connection established
   */
  private onConnected(): void {
    this.reconnectAttempts = 0;
    this.setConnectionState(ConnectionState.CONNECTED);
    
    // Authenticate
    this.authenticate();
    
    // Resubscribe to channels
    this.resubscribe();
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
    
    console.log('WebSocket connected');
  }

  /**
   * Handle WebSocket disconnection
   */
  private onDisconnected(): void {
    this.clearTimers();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    
    // Attempt to reconnect
    this.attemptReconnect();
    
    console.log('WebSocket disconnected');
  }

  /**
   * Handle WebSocket error
   */
  private onError(error: any): void {
    this.setConnectionState(ConnectionState.ERROR);
    console.error('WebSocket error:', error);
    
    // Attempt to reconnect
    this.attemptReconnect();
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);
      
      store.dispatch(addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to real-time data service. Please refresh the page.',
        autoHideDuration: 0, // Don't auto-hide this critical error
      }));
      
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff with max 30s
    
    this.setConnectionState(ConnectionState.RECONNECTING);
    console.log(`Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // Error handling is done in onError
      });
    }, delay);
  }

  /**
   * Authenticate with WebSocket server
   */
  private authenticate(): void {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No authentication token available for WebSocket');
      return;
    }
    
    this.sendMessage({
      type: MessageType.AUTH,
      data: {
        token,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Resubscribe to all previously subscribed channels
   */
  private resubscribe(): void {
    this.subscriptions.forEach(channel => {
      this.sendSubscription(channel);
    });
  }

  /**
   * Send subscription message
   */
  private sendSubscription(channel: string): void {
    this.sendMessage({
      type: MessageType.SYSTEM,
      data: {
        action: 'subscribe',
        channel,
      },
      timestamp: Date.now(),
    });
    
    this.subscriptions.add(channel);
  }

  /**
   * Handle system messages
   */
  private handleSystemMessage(data: any): void {
    if (data.action === 'ping') {
      this.sendMessage({
        type: MessageType.SYSTEM,
        data: {
          action: 'pong',
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.clearTimers();
    
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: MessageType.SYSTEM,
          data: {
            action: 'ping',
          },
          timestamp: Date.now(),
        });
      }
    }, 30000);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    
    // Notify all handlers
    this.connectionStateHandlers.forEach(handler => {
      handler(state);
    });
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();
export default websocketService;