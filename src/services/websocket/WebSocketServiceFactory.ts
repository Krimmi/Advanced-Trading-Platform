import { WebSocketService, WebSocketConfig } from './WebSocketService';
import { MarketDataWebSocketService, MarketDataWebSocketConfig } from './MarketDataWebSocketService';

/**
 * Provider configuration for WebSocket services
 */
export interface WebSocketProviderConfig {
  name: string;
  url: string;
  priority: number;
  apiKey?: string;
  authToken?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: any;
  protocols?: string | string[];
}

/**
 * Factory for creating and managing WebSocket services
 */
export class WebSocketServiceFactory {
  private static instance: WebSocketServiceFactory;
  private providers: Map<string, WebSocketProviderConfig> = new Map();
  private services: Map<string, WebSocketService> = new Map();
  private defaultProvider: string | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Initialize with default providers
    this.registerDefaultProviders();
  }

  /**
   * Gets the singleton instance of WebSocketServiceFactory
   * @returns WebSocketServiceFactory instance
   */
  public static getInstance(): WebSocketServiceFactory {
    if (!WebSocketServiceFactory.instance) {
      WebSocketServiceFactory.instance = new WebSocketServiceFactory();
    }
    return WebSocketServiceFactory.instance;
  }

  /**
   * Registers a WebSocket provider configuration
   * @param config Provider configuration
   */
  public registerProvider(config: WebSocketProviderConfig): void {
    this.providers.set(config.name, config);
    
    // Set as default if it's the first provider or has higher priority
    if (
      this.defaultProvider === null || 
      (config.priority > (this.providers.get(this.defaultProvider)?.priority || 0))
    ) {
      this.defaultProvider = config.name;
    }
  }

  /**
   * Gets a WebSocket service for a specific provider
   * @param providerName Provider name
   * @returns WebSocket service instance
   */
  public getService(providerName?: string): WebSocketService {
    // Use default provider if not specified
    const provider = providerName || this.defaultProvider;
    
    if (!provider) {
      throw new Error('No WebSocket provider available');
    }
    
    // Return existing service if available
    if (this.services.has(provider)) {
      return this.services.get(provider)!;
    }
    
    // Create new service
    const config = this.providers.get(provider);
    
    if (!config) {
      throw new Error(`WebSocket provider '${provider}' not registered`);
    }
    
    const service = this.createService(config);
    this.services.set(provider, service);
    
    return service;
  }

  /**
   * Gets a market data WebSocket service for a specific provider
   * @param providerName Provider name
   * @returns MarketDataWebSocketService instance
   */
  public getMarketDataService(providerName?: string): MarketDataWebSocketService {
    const service = this.getService(providerName);
    
    if (!(service instanceof MarketDataWebSocketService)) {
      throw new Error(`Service for provider '${providerName || this.defaultProvider}' is not a MarketDataWebSocketService`);
    }
    
    return service;
  }

  /**
   * Creates a WebSocket service based on provider configuration
   * @param config Provider configuration
   * @returns WebSocket service instance
   */
  private createService(config: WebSocketProviderConfig): WebSocketService {
    // Create service based on provider type
    switch (config.name) {
      case 'alpaca':
      case 'finnhub':
      case 'iex':
      case 'polygon':
        return this.createMarketDataService(config);
      default:
        return this.createGenericService(config);
    }
  }

  /**
   * Creates a generic WebSocket service
   * @param config Provider configuration
   * @returns WebSocket service instance
   */
  private createGenericService(config: WebSocketProviderConfig): WebSocketService {
    const wsConfig: WebSocketConfig = {
      url: config.url,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts,
      heartbeatInterval: config.heartbeatInterval,
      heartbeatMessage: config.heartbeatMessage,
      protocols: config.protocols
    };
    
    return new WebSocketService(wsConfig);
  }

  /**
   * Creates a market data WebSocket service
   * @param config Provider configuration
   * @returns MarketDataWebSocketService instance
   */
  private createMarketDataService(config: WebSocketProviderConfig): MarketDataWebSocketService {
    const wsConfig: MarketDataWebSocketConfig = {
      url: config.url,
      provider: config.name,
      apiKey: config.apiKey,
      authToken: config.authToken,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts,
      heartbeatInterval: config.heartbeatInterval,
      heartbeatMessage: config.heartbeatMessage,
      protocols: config.protocols
    };
    
    return new MarketDataWebSocketService(wsConfig);
  }

  /**
   * Registers default WebSocket providers
   */
  private registerDefaultProviders(): void {
    // Alpaca
    this.registerProvider({
      name: 'alpaca',
      url: 'wss://stream.data.alpaca.markets/v2/iex',
      priority: 100,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      heartbeatMessage: { action: 'ping' }
    });
    
    // Finnhub
    this.registerProvider({
      name: 'finnhub',
      url: 'wss://ws.finnhub.io',
      priority: 90,
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatMessage: { type: 'ping' }
    });
    
    // Polygon
    this.registerProvider({
      name: 'polygon',
      url: 'wss://socket.polygon.io/stocks',
      priority: 80,
      reconnectInterval: 2000,
      maxReconnectAttempts: 5
    });
    
    // IEX Cloud
    this.registerProvider({
      name: 'iex',
      url: 'wss://ws-api.iextrading.com/1.0/tops',
      priority: 70,
      reconnectInterval: 2000,
      maxReconnectAttempts: 5
    });
  }

  /**
   * Gets all registered providers
   * @returns Array of provider configurations
   */
  public getProviders(): WebSocketProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Gets the default provider name
   * @returns Default provider name
   */
  public getDefaultProvider(): string | null {
    return this.defaultProvider;
  }

  /**
   * Sets the default provider
   * @param providerName Provider name
   */
  public setDefaultProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`WebSocket provider '${providerName}' not registered`);
    }
    
    this.defaultProvider = providerName;
  }

  /**
   * Disconnects all WebSocket services
   */
  public disconnectAll(): void {
    this.services.forEach(service => {
      service.disconnect();
    });
  }

  /**
   * Disconnects a specific WebSocket service
   * @param providerName Provider name
   */
  public disconnect(providerName: string): void {
    const service = this.services.get(providerName);
    
    if (service) {
      service.disconnect();
      this.services.delete(providerName);
    }
  }
}