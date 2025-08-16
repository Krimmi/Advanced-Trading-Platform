/**
 * WebSocket service for real-time data updates in the Ultimate Hedge Fund & Trading Application.
 * Handles connection management, message routing, and subscription handling.
 */
import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { updateStockPrice } from '../store/slices/marketSlice';
import { updatePortfolioValue } from '../store/slices/portfolioSlice';
import authService from './authService';

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

  /**
   * Initialize the WebSocket connection
   */
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection is in progress');
      return;
    }

    this.isConnecting = true;

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
      this.scheduleReconnect();
    }
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
  }

  /**
   * Send a message through the WebSocket
   */
  public send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      // Store message to send after reconnection
      this.connect();
    }
  }

  /**
   * Subscribe to market data for specific symbols
   * @param symbols List of symbols to subscribe to
   */
  public subscribeToMarketData(symbols: string[]): void {
    if (!symbols || symbols.length === 0) {
      return;
    }
    
    // Add symbols to subscribed set
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'subscribe',
        symbols: symbols
      }));
    } else {
      this.connect();
    }
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
      this.socket.send(JSON.stringify({
        action: 'unsubscribe',
        symbols: symbols
      }));
    }
  }

  /**
   * Subscribe to a channel
   */
  public subscribe(channel: string, params?: Record<string, any>): string {
    const id = this.generateSubscriptionId();
    const subscription: Subscription = {
      id,
      channel,
      params,
    };

    this.subscriptions.push(subscription);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        data: subscription,
      });
    } else {
      this.connect();
    }

    return id;
  }

  /**
   * Unsubscribe from a channel
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
   * Resubscribe to all active subscriptions
   */
  private resubscribeAll(): void {
    // Resubscribe to symbols
    if (this.subscribedSymbols.size > 0) {
      this.subscribeToMarketData(Array.from(this.subscribedSymbols));
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

    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', data: {} });
    }, 30000);

    // Resubscribe to all channels
    this.resubscribeAll();
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
          this.handleMarketDataUpdate(message.data);
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
          console.log('Unhandled WebSocket message type:', message.type, message.data);
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

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
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
        this.connect();
      }, delay);
    } else {
      console.error('Maximum WebSocket reconnect attempts reached');
      
      // Notify user about connection issues
      store.dispatch(addNotification({
        message: 'Unable to connect to real-time data service. Please refresh the page.',
        type: 'error',
      }));
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
  }

  /**
   * Handle alert triggered message
   */
  private handleAlertTriggered(data: any): void {
    store.dispatch(addNotification({
      message: data.message,
      type: data.severity || 'info',
    }));
  }
}

// Create WebSocket service instance
const websocketService = new WebSocketService();

export default websocketService;