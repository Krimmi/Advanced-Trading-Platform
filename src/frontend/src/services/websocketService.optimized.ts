/**
 * Optimized WebSocket service for real-time data updates in the Ultimate Hedge Fund & Trading Application.
 * Handles connection management, message routing, subscription handling, and performance optimizations.
 */
import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { updateStockPrice } from '../store/slices/marketSlice';
import { updatePortfolioValue } from '../store/slices/portfolioSlice';
import authService from './authService';
import { throttle, debounce } from 'lodash';

// Types
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface Subscription {
  id: string;
  channel: string;
  params?: Record<string, any>;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  last_update: string;
}

// Event emitter interface
type EventCallback = (data: any) => void;
interface EventHandlers {
  [eventName: string]: EventCallback[];
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 1000;
  private subscriptions: Subscription[] = [];
  private subscribedSymbols: Set<string> = new Set();
  private isConnecting: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private clientId: string | null = null;
  private eventHandlers: EventHandlers = {};
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private processingQueue: boolean = false;
  private lastMarketData: Map<string, MarketData> = new Map();
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  // Throttled and debounced handlers for high-frequency events
  private throttledHandleMarketDataUpdate = throttle(this.handleMarketDataUpdate.bind(this), 100, { leading: true, trailing: true });
  private debouncedReconnect = debounce(this.connect.bind(this), 1000, { leading: false, trailing: true });
  private throttledEmitEvent = throttle(this.emitEvent.bind(this), 50, { leading: true, trailing: true });

  /**
   * Initialize the WebSocket connection
   * @returns Promise that resolves when connection is established
   */
  public connect(): Promise<void> {
    // Return existing promise if connection is in progress
    if (this.connectionPromise && this.isConnecting) {
      return this.connectionPromise;
    }

    // Create new connection promise
    this.connectionPromise = new Promise<void>((resolve) => {
      this.connectionResolve = resolve;
    });

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      if (this.connectionResolve && this.socket.readyState === WebSocket.OPEN) {
        this.connectionResolve();
        this.connectionResolve = null;
      }
      return this.connectionPromise;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection is in progress');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    try {
      // Get authentication token
      const token = authService.getToken();
      
      // Generate client ID if not exists
      if (!this.clientId) {
        this.clientId = this.generateClientId();
      }
      
      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.REACT_APP_API_HOST || window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/ws/${this.clientId}`;
      
      // Add token if available
      const connectionUrl = token ? `${wsUrl}?token=${token}` : wsUrl;
      
      this.socket = new WebSocket(connectionUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.connectionStatus = 'disconnected';
      this.scheduleReconnect();
      
      // Reject the connection promise
      if (this.connectionResolve) {
        this.connectionResolve();
        this.connectionResolve = null;
      }
    }

    return this.connectionPromise;
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionStatus = 'disconnected';
    
    // Clear message queue
    this.messageQueue = [];
    this.processingQueue = false;
  }

  /**
   * Send a message through the WebSocket
   * @param message The message to send
   * @param priority Whether this is a high-priority message
   */
  public send(message: WebSocketMessage, priority: boolean = false): void {
    // Add message to queue
    if (priority) {
      this.messageQueue.unshift(message);
    } else {
      this.messageQueue.push(message);
    }

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process message queue with batching for efficiency
   */
  private async processMessageQueue(): Promise<void> {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    // Ensure connection is established
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (error) {
        console.error('Failed to connect for message sending:', error);
        this.processingQueue = false;
        return;
      }
    }

    // Process messages in batches
    const batchSize = 10;
    while (this.messageQueue.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const batch = this.messageQueue.splice(0, batchSize);
      
      // If batch contains only one message, send it directly
      if (batch.length === 1) {
        this.socket.send(JSON.stringify(batch[0]));
      } 
      // Otherwise, batch messages when possible
      else {
        // Group messages by type
        const groupedMessages: Record<string, any[]> = {};
        
        batch.forEach(msg => {
          if (!groupedMessages[msg.type]) {
            groupedMessages[msg.type] = [];
          }
          groupedMessages[msg.type].push(msg.data);
        });
        
        // Send batched messages
        Object.entries(groupedMessages).forEach(([type, dataArray]) => {
          this.socket?.send(JSON.stringify({
            type,
            data: dataArray,
            batch: true
          }));
        });
      }
      
      // Small delay between batches to prevent overwhelming the server
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    this.processingQueue = false;
  }

  /**
   * Subscribe to market data for specific symbols
   * @param symbols List of symbols to subscribe to
   * @returns Promise that resolves when subscription is complete
   */
  public async subscribeToMarketData(symbols: string[]): Promise<void> {
    if (!symbols || symbols.length === 0) {
      return;
    }
    
    // Filter out symbols that are already subscribed
    const newSymbols = symbols.filter(symbol => !this.subscribedSymbols.has(symbol));
    
    if (newSymbols.length === 0) {
      return;
    }
    
    // Add symbols to subscribed set
    newSymbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    
    // Ensure connection is established before subscribing
    await this.connect();
    
    // Send subscription message
    this.send({
      action: 'subscribe',
      symbols: newSymbols
    }, true); // High priority
  }

  /**
   * Unsubscribe from market data for specific symbols
   * @param symbols List of symbols to unsubscribe from
   */
  public unsubscribeFromMarketData(symbols: string[]): void {
    if (!symbols || symbols.length === 0) {
      return;
    }
    
    // Remove symbols from subscribed set
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        action: 'unsubscribe',
        symbols: symbols
      });
    }
  }

  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @param params Optional parameters
   * @returns Subscription ID
   */
  public subscribe(channel: string, params?: Record<string, any>): string {
    const id = this.generateSubscriptionId();
    const subscription: Subscription = {
      id,
      channel,
      params,
    };

    this.subscriptions.push(subscription);

    // Connect and send subscription
    this.connect().then(() => {
      this.send({
        type: 'subscribe',
        data: subscription,
      });
    });

    return id;
  }

  /**
   * Unsubscribe from a channel
   * @param id Subscription ID
   */
  public unsubscribe(id: string): void {
    const subscription = this.subscriptions.find(sub => sub.id === id);
    
    if (subscription) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'unsubscribe',
          data: { id },
        });
      }

      this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
    }
  }

  /**
   * Get current connection status
   * @returns Connection status
   */
  public getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.connectionStatus;
  }

  /**
   * Get last known market data for a symbol
   * @param symbol Stock symbol
   * @returns Market data or null if not available
   */
  public getLastMarketData(symbol: string): MarketData | null {
    return this.lastMarketData.get(symbol) || null;
  }

  /**
   * Add event listener
   * @param event Event name
   * @param callback Callback function
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  /**
   * Remove event listener
   * @param event Event name
   * @param callback Callback function
   */
  public off(event: string, callback: EventCallback): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event to listeners
   * @param event Event name
   * @param data Event data
   */
  private emitEvent(event: string, data: any): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    this.eventHandlers[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribeAll(): void {
    // Resubscribe to symbols in batches to avoid overwhelming the server
    const batchSize = 50;
    const symbolsArray = Array.from(this.subscribedSymbols);
    
    for (let i = 0; i < symbolsArray.length; i += batchSize) {
      const batch = symbolsArray.slice(i, i + batchSize);
      this.send({
        action: 'subscribe',
        symbols: batch
      });
    }
    
    // Resubscribe to channels
    if (this.subscriptions.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach(subscription => {
        this.send({
          type: 'subscribe',
          data: subscription,
        });
      });
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.connectionStatus = 'connected';

    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', data: {} });
    }, 30000);

    // Resubscribe to all channels
    this.resubscribeAll();
    
    // Resolve connection promise
    if (this.connectionResolve) {
      this.connectionResolve();
      this.connectionResolve = null;
    }
    
    // Process any queued messages
    this.processMessageQueue();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Route message to appropriate handler
      switch (message.type) {
        case 'market_data':
          this.throttledHandleMarketDataUpdate(message.data);
          break;
        case 'price_update':
          this.handlePriceUpdate(message.data);
          break;
        case 'portfolio_update':
          this.handlePortfolioUpdate(message.data);
          break;
        case 'alert_triggered':
          this.handleAlertTriggered(message.data);
          break;
        case 'pong':
          // Ping response, do nothing
          break;
        default:
          // Emit event for custom handlers
          this.throttledEmitEvent(message.type, message.data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.socket = null;
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
    
    // Emit disconnection event
    this.emitEvent('disconnected', { code: event.code, reason: event.reason });
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    
    // Emit error event
    this.emitEvent('error', event);
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.calculateReconnectDelay();
      console.log(`Scheduling WebSocket reconnect in ${delay}ms`);
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.debouncedReconnect();
      }, delay);
    } else {
      console.error('Maximum WebSocket reconnect attempts reached');
      
      // Notify user about connection issues
      store.dispatch(addNotification({
        message: 'Unable to connect to real-time data service. Please refresh the page.',
        type: 'error',
      }));
      
      // Emit max reconnect event
      this.emitEvent('maxReconnectAttemptsReached', null);
    }
  }

  /**
   * Calculate reconnect delay with exponential backoff
   */
  private calculateReconnectDelay(): number {
    return Math.min(30000, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
  }

  /**
   * Generate a unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Handle market data update message
   */
  private handleMarketDataUpdate(data: MarketData[]): void {
    if (!Array.isArray(data)) {
      console.error('Invalid market data format:', data);
      return;
    }

    // Update local cache
    data.forEach(item => {
      this.lastMarketData.set(item.symbol, item);
    });

    // Process each market data item
    data.forEach(item => {
      store.dispatch(updateStockPrice({
        symbol: item.symbol,
        price: item.price,
        change: item.change,
        changePercent: item.change_percent,
        volume: item.volume,
        timestamp: item.last_update,
      }));
    });
    
    // Emit market data event
    this.emitEvent('market_data', data);
  }

  /**
   * Handle price update message
   */
  private handlePriceUpdate(data: any): void {
    store.dispatch(updateStockPrice({
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      timestamp: data.timestamp,
    }));
    
    // Update local cache
    this.lastMarketData.set(data.symbol, {
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      change_percent: data.changePercent,
      volume: data.volume,
      last_update: data.timestamp
    });
    
    // Emit price update event
    this.emitEvent('price_update', data);
  }

  /**
   * Handle portfolio update message
   */
  private handlePortfolioUpdate(data: any): void {
    store.dispatch(updatePortfolioValue({
      portfolioId: data.portfolioId,
      value: data.value,
      change: data.change,
      changePercent: data.changePercent,
      positions: data.positions,
    }));
    
    // Emit portfolio update event
    this.emitEvent('portfolio_update', data);
  }

  /**
   * Handle alert triggered message
   */
  private handleAlertTriggered(data: any): void {
    store.dispatch(addNotification({
      message: data.message,
      type: data.severity || 'info',
    }));
    
    // Emit alert event
    this.emitEvent('alert_triggered', data);
  }
}

// Create WebSocket service instance
const websocketService = new WebSocketService();

export default websocketService;