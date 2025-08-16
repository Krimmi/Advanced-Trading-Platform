import { EventEmitter } from 'events';

/**
 * Connection states for WebSocket
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Configuration options for WebSocketService
 */
export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: any;
  protocols?: string | string[];
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: ConnectionState) => void;
}

/**
 * Subscription information
 */
export interface Subscription {
  id: string;
  channel: string;
  symbols: string[];
  params?: Record<string, any>;
}

/**
 * WebSocketService provides a robust WebSocket connection with automatic reconnection,
 * subscription management, and heartbeat functionality.
 */
export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageBuffer: any[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  /**
   * Creates a new WebSocketService instance
   * @param config WebSocket configuration options
   */
  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatMessage: { type: 'ping' },
      ...config
    };
  }

  /**
   * Connects to the WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket is already connecting or connected');
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      this.handleError(error as Event);
    }
  }

  /**
   * Disconnects from the WebSocket server
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      
      this.ws = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
  }

  /**
   * Sends data through the WebSocket connection
   * @param data Data to send
   * @returns True if data was sent, false otherwise
   */
  public send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, WebSocket is not open');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Subscribes to a specific channel for given symbols
   * @param channel Channel name
   * @param symbols Array of symbols to subscribe to
   * @param params Additional parameters for the subscription
   * @returns Subscription ID
   */
  public subscribe(channel: string, symbols: string[], params: Record<string, any> = {}): string {
    const id = `${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: Subscription = {
      id,
      channel,
      symbols,
      params
    };
    
    this.subscriptions.set(id, subscription);
    
    // If connected, send the subscription request immediately
    if (this.isConnected()) {
      this.sendSubscription(subscription);
    }
    
    return id;
  }

  /**
   * Unsubscribes from a specific subscription
   * @param id Subscription ID
   * @returns True if unsubscribed successfully, false otherwise
   */
  public unsubscribe(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    
    if (!subscription) {
      return false;
    }
    
    // If connected, send the unsubscription request
    if (this.isConnected()) {
      this.sendUnsubscription(subscription);
    }
    
    this.subscriptions.delete(id);
    return true;
  }

  /**
   * Checks if the WebSocket is currently connected
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Gets the current connection state
   * @returns Current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Gets all active subscriptions
   * @returns Array of active subscriptions
   */
  public getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Handles WebSocket open event
   */
  private handleOpen(): void {
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    
    // Resubscribe to all channels
    this.subscriptions.forEach(subscription => {
      this.sendSubscription(subscription);
    });
    
    // Process any buffered messages
    this.processMessageBuffer();
    
    this.emit('open');
  }

  /**
   * Handles WebSocket message event
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      // Call the onMessage callback if provided
      if (this.config.onMessage) {
        this.config.onMessage(data);
      }
      
      // Emit the message event
      this.emit('message', data);
      
      // Emit specific events based on message type or channel
      if (data.type) {
        this.emit(`message:${data.type}`, data);
      }
      
      if (data.channel) {
        this.emit(`message:${data.channel}`, data);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  /**
   * Handles WebSocket error event
   * @param event Error event
   */
  private handleError(event: Event): void {
    this.setConnectionState(ConnectionState.ERROR);
    
    const error = new Error('WebSocket error');
    
    // Call the onError callback if provided
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    this.emit('error', error);
  }

  /**
   * Handles WebSocket close event
   * @param event Close event
   */
  private handleClose(event: CloseEvent): void {
    this.clearTimers();
    
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      this.attemptReconnect();
    }
    
    this.emit('close', event);
  }

  /**
   * Attempts to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    const { maxReconnectAttempts, reconnectInterval } = this.config;
    
    if (maxReconnectAttempts !== undefined && this.reconnectAttempts >= maxReconnectAttempts) {
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.emit('reconnect_failed');
      return;
    }
    
    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect();
    }, reconnectInterval);
  }

  /**
   * Starts the heartbeat timer
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval || !this.config.heartbeatMessage) {
      return;
    }
    
    this.clearHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(this.config.heartbeatMessage);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clears the heartbeat timer
   */
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clears all timers
   */
  private clearTimers(): void {
    this.clearHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Sets the connection state and notifies listeners
   * @param state New connection state
   */
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    
    // Call the onStateChange callback if provided
    if (this.config.onStateChange) {
      this.config.onStateChange(state);
    }
    
    this.emit('state_change', state);
  }

  /**
   * Sends a subscription request
   * @param subscription Subscription to send
   */
  private sendSubscription(subscription: Subscription): void {
    const { channel, symbols, params } = subscription;
    
    const subscriptionMessage = {
      type: 'subscribe',
      channel,
      symbols,
      ...params
    };
    
    this.send(subscriptionMessage);
  }

  /**
   * Sends an unsubscription request
   * @param subscription Subscription to unsubscribe from
   */
  private sendUnsubscription(subscription: Subscription): void {
    const { channel, symbols } = subscription;
    
    const unsubscriptionMessage = {
      type: 'unsubscribe',
      channel,
      symbols
    };
    
    this.send(unsubscriptionMessage);
  }

  /**
   * Adds a message to the buffer
   * @param message Message to buffer
   */
  public bufferMessage(message: any): void {
    // Implement FIFO queue with size limit
    if (this.messageBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.messageBuffer.shift(); // Remove oldest message
    }
    
    this.messageBuffer.push(message);
  }

  /**
   * Processes all messages in the buffer
   */
  private processMessageBuffer(): void {
    if (this.messageBuffer.length === 0) {
      return;
    }
    
    console.log(`Processing ${this.messageBuffer.length} buffered messages`);
    
    // Process all buffered messages
    const messages = [...this.messageBuffer];
    this.messageBuffer = [];
    
    messages.forEach(message => {
      this.send(message);
    });
  }
}