import { EventEmitter } from 'events';
import { WebSocketServiceFactory } from '../websocket/WebSocketServiceFactory';
import { MarketDataWebSocketService, MarketDataType, MarketDataMessage } from '../websocket/MarketDataWebSocketService';
import { DataStreamingPipeline, DataProcessorFactory, DataProcessor } from './DataStreamingPipeline';

/**
 * Market data subscription options
 */
export interface MarketDataSubscriptionOptions {
  dataTypes: MarketDataType[];
  symbols: string[];
  throttleRate?: number;
  bufferSize?: number;
  priority?: number;
  deduplicationWindow?: number;
}

/**
 * Market data subscription information
 */
export interface MarketDataSubscription {
  id: string;
  options: MarketDataSubscriptionOptions;
  pipelines: Map<MarketDataType, DataStreamingPipeline<MarketDataMessage>>;
  listeners: Map<MarketDataType, Set<(data: any) => void>>;
}

/**
 * MarketDataStreamingService provides a high-level interface for subscribing to
 * real-time market data with advanced features like throttling, buffering,
 * and backpressure handling.
 */
export class MarketDataStreamingService extends EventEmitter {
  private static instance: MarketDataStreamingService;
  private wsFactory: WebSocketServiceFactory;
  private subscriptions: Map<string, MarketDataSubscription> = new Map();
  private dataTypeProviders: Map<MarketDataType, string> = new Map();
  private defaultProvider: string;
  private isInitialized: boolean = false;
  private connectionStatus: Map<string, boolean> = new Map();
  private customProcessors: Map<string, DataProcessor<any, any>[]> = new Map();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.wsFactory = WebSocketServiceFactory.getInstance();
    this.defaultProvider = this.wsFactory.getDefaultProvider() || 'alpaca';
    
    // Set default providers for each data type
    this.dataTypeProviders.set(MarketDataType.QUOTES, 'alpaca');
    this.dataTypeProviders.set(MarketDataType.TRADES, 'alpaca');
    this.dataTypeProviders.set(MarketDataType.BARS, 'alpaca');
    this.dataTypeProviders.set(MarketDataType.LEVEL2, 'polygon');
    this.dataTypeProviders.set(MarketDataType.NEWS, 'finnhub');
    this.dataTypeProviders.set(MarketDataType.SENTIMENT, 'finnhub');
  }

  /**
   * Gets the singleton instance of MarketDataStreamingService
   * @returns MarketDataStreamingService instance
   */
  public static getInstance(): MarketDataStreamingService {
    if (!MarketDataStreamingService.instance) {
      MarketDataStreamingService.instance = new MarketDataStreamingService();
    }
    return MarketDataStreamingService.instance;
  }

  /**
   * Initializes the service and connects to WebSocket providers
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Connect to all providers
    const providers = this.wsFactory.getProviders();
    
    for (const provider of providers) {
      try {
        const service = this.wsFactory.getMarketDataService(provider.name);
        
        // Set up event listeners
        service.on('state_change', (state) => {
          const isConnected = state === 'connected';
          this.connectionStatus.set(provider.name, isConnected);
          this.emit('providerConnectionChange', { provider: provider.name, connected: isConnected });
        });
        
        service.on('error', (error) => {
          this.emit('providerError', { provider: provider.name, error });
        });
        
        // Connect to the service
        service.connect();
        
        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection timeout for provider ${provider.name}`));
          }, 10000);
          
          service.once('open', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          service.once('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
        
        this.connectionStatus.set(provider.name, true);
        this.emit('providerConnected', provider.name);
      } catch (error) {
        console.error(`Failed to connect to provider ${provider.name}:`, error);
        this.connectionStatus.set(provider.name, false);
        this.emit('providerConnectionFailed', { provider: provider.name, error });
      }
    }
    
    this.isInitialized = true;
    this.emit('initialized');
  }

  /**
   * Subscribes to market data for specific symbols and data types
   * @param options Subscription options
   * @returns Subscription ID
   */
  public subscribe(options: MarketDataSubscriptionOptions): string {
    if (!this.isInitialized) {
      throw new Error('MarketDataStreamingService not initialized');
    }
    
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pipelines = new Map<MarketDataType, DataStreamingPipeline<MarketDataMessage>>();
    const listeners = new Map<MarketDataType, Set<(data: any) => void>>();
    
    // Create subscription
    const subscription: MarketDataSubscription = {
      id: subscriptionId,
      options,
      pipelines,
      listeners
    };
    
    // Set up pipelines for each data type
    for (const dataType of options.dataTypes) {
      // Create pipeline
      const pipeline = this.createPipeline(dataType, options);
      pipelines.set(dataType, pipeline);
      
      // Create listener set
      listeners.set(dataType, new Set());
      
      // Get provider for this data type
      const provider = this.dataTypeProviders.get(dataType) || this.defaultProvider;
      const service = this.wsFactory.getMarketDataService(provider);
      
      // Subscribe to the service
      service.subscribeMarketData(dataType, options.symbols, (data) => {
        pipeline.push(data, options.priority || 0);
      });
      
      // Start the pipeline
      pipeline.start();
    }
    
    // Store the subscription
    this.subscriptions.set(subscriptionId, subscription);
    
    return subscriptionId;
  }

  /**
   * Unsubscribes from market data
   * @param subscriptionId Subscription ID
   * @returns True if unsubscribed successfully
   */
  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      return false;
    }
    
    // Stop all pipelines
    subscription.pipelines.forEach(pipeline => {
      pipeline.stop();
      pipeline.clear();
      pipeline.removeAllListeners();
    });
    
    // Unsubscribe from WebSocket services
    for (const dataType of subscription.options.dataTypes) {
      const provider = this.dataTypeProviders.get(dataType) || this.defaultProvider;
      const service = this.wsFactory.getMarketDataService(provider);
      
      // Find and unsubscribe from the service
      const wsSubscriptions = service.getSubscriptions();
      for (const wsSub of wsSubscriptions) {
        if (wsSub.channel === dataType && this.arraysOverlap(wsSub.symbols, subscription.options.symbols)) {
          service.unsubscribe(wsSub.id);
        }
      }
    }
    
    // Remove the subscription
    this.subscriptions.delete(subscriptionId);
    
    return true;
  }

  /**
   * Adds a listener for a specific subscription and data type
   * @param subscriptionId Subscription ID
   * @param dataType Data type to listen for
   * @param listener Listener function
   * @returns True if listener was added
   */
  public addListener(
    subscriptionId: string, 
    dataType: MarketDataType, 
    listener: (data: any) => void
  ): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription || !subscription.options.dataTypes.includes(dataType)) {
      return false;
    }
    
    // Add to listeners
    if (!subscription.listeners.has(dataType)) {
      subscription.listeners.set(dataType, new Set());
    }
    
    subscription.listeners.get(dataType)!.add(listener);
    
    // Connect pipeline to listener
    const pipeline = subscription.pipelines.get(dataType);
    if (pipeline) {
      pipeline.on('data', listener);
    }
    
    return true;
  }

  /**
   * Removes a listener for a specific subscription and data type
   * @param subscriptionId Subscription ID
   * @param dataType Data type
   * @param listener Listener function
   * @returns True if listener was removed
   */
  public removeListener(
    subscriptionId: string, 
    dataType: MarketDataType, 
    listener: (data: any) => void
  ): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription || !subscription.listeners.has(dataType)) {
      return false;
    }
    
    // Remove from listeners
    const listeners = subscription.listeners.get(dataType)!;
    const removed = listeners.delete(listener);
    
    // Disconnect pipeline from listener
    if (removed) {
      const pipeline = subscription.pipelines.get(dataType);
      if (pipeline) {
        pipeline.removeListener('data', listener);
      }
    }
    
    return removed;
  }

  /**
   * Sets the provider for a specific data type
   * @param dataType Data type
   * @param provider Provider name
   */
  public setProviderForDataType(dataType: MarketDataType, provider: string): void {
    if (!this.wsFactory.getProviders().find(p => p.name === provider)) {
      throw new Error(`Provider '${provider}' not registered`);
    }
    
    this.dataTypeProviders.set(dataType, provider);
    
    // Update existing subscriptions
    this.subscriptions.forEach((subscription, id) => {
      if (subscription.options.dataTypes.includes(dataType)) {
        // Unsubscribe and resubscribe with new provider
        this.unsubscribe(id);
        this.subscribe(subscription.options);
      }
    });
  }

  /**
   * Gets the provider for a specific data type
   * @param dataType Data type
   * @returns Provider name
   */
  public getProviderForDataType(dataType: MarketDataType): string {
    return this.dataTypeProviders.get(dataType) || this.defaultProvider;
  }

  /**
   * Sets the default provider
   * @param provider Provider name
   */
  public setDefaultProvider(provider: string): void {
    if (!this.wsFactory.getProviders().find(p => p.name === provider)) {
      throw new Error(`Provider '${provider}' not registered`);
    }
    
    this.defaultProvider = provider;
  }

  /**
   * Gets the default provider
   * @returns Default provider name
   */
  public getDefaultProvider(): string {
    return this.defaultProvider;
  }

  /**
   * Gets all active subscriptions
   * @returns Map of subscription IDs to subscriptions
   */
  public getSubscriptions(): Map<string, MarketDataSubscription> {
    return new Map(this.subscriptions);
  }

  /**
   * Gets the connection status for all providers
   * @returns Map of provider names to connection status
   */
  public getConnectionStatus(): Map<string, boolean> {
    return new Map(this.connectionStatus);
  }

  /**
   * Registers a custom processor for a specific data type
   * @param dataType Data type
   * @param processor Data processor
   * @param position Position in the pipeline (0 = first)
   */
  public registerProcessor(
    dataType: MarketDataType, 
    processor: DataProcessor<any, any>, 
    position?: number
  ): void {
    if (!this.customProcessors.has(dataType)) {
      this.customProcessors.set(dataType, []);
    }
    
    const processors = this.customProcessors.get(dataType)!;
    
    if (position !== undefined && position >= 0 && position <= processors.length) {
      processors.splice(position, 0, processor);
    } else {
      processors.push(processor);
    }
    
    // Update existing pipelines
    this.subscriptions.forEach(subscription => {
      if (subscription.options.dataTypes.includes(dataType)) {
        const pipeline = subscription.pipelines.get(dataType);
        if (pipeline) {
          // Recreate the pipeline with the new processor
          pipeline.stop();
          
          const newPipeline = this.createPipeline(dataType, subscription.options);
          subscription.pipelines.set(dataType, newPipeline);
          
          // Reconnect listeners
          const listeners = subscription.listeners.get(dataType) || new Set();
          listeners.forEach(listener => {
            newPipeline.on('data', listener);
          });
          
          newPipeline.start();
        }
      }
    });
  }

  /**
   * Creates a data streaming pipeline for a specific data type
   * @param dataType Data type
   * @param options Subscription options
   * @returns Data streaming pipeline
   */
  private createPipeline(
    dataType: MarketDataType, 
    options: MarketDataSubscriptionOptions
  ): DataStreamingPipeline<MarketDataMessage> {
    const pipeline = new DataStreamingPipeline<MarketDataMessage>(`${dataType}-pipeline`);
    
    // Add symbol filter
    pipeline.addStage({
      processor: DataProcessorFactory.createFilter(
        (data: MarketDataMessage) => options.symbols.includes(data.symbol) || options.symbols.includes('*'),
        'SymbolFilter'
      ),
      bufferSize: options.bufferSize || 1000,
      dropStrategy: 'oldest'
    });
    
    // Add deduplication if specified
    if (options.deduplicationWindow) {
      pipeline.addStage({
        processor: DataProcessorFactory.createDeduplicator(
          (data: MarketDataMessage) => `${data.type}-${data.symbol}-${JSON.stringify(data.data)}`,
          options.deduplicationWindow,
          'Deduplicator'
        ),
        bufferSize: options.bufferSize || 1000,
        dropStrategy: 'oldest'
      });
    }
    
    // Add throttling if specified
    if (options.throttleRate) {
      pipeline.addStage({
        processor: DataProcessorFactory.createThrottler(
          options.throttleRate,
          'Throttler'
        ),
        bufferSize: options.bufferSize || 1000,
        dropStrategy: 'oldest'
      });
    }
    
    // Add custom processors
    const customProcessors = this.customProcessors.get(dataType) || [];
    for (const processor of customProcessors) {
      pipeline.addStage({
        processor,
        bufferSize: options.bufferSize || 1000,
        dropStrategy: 'oldest'
      });
    }
    
    // Set up pipeline events
    pipeline.on('backpressure', (info) => {
      this.emit('backpressure', {
        dataType,
        ...info
      });
    });
    
    pipeline.on('stageError', (info) => {
      this.emit('processingError', {
        dataType,
        ...info
      });
    });
    
    return pipeline;
  }

  /**
   * Checks if two arrays have any overlapping elements
   * @param arr1 First array
   * @param arr2 Second array
   * @returns True if arrays overlap
   */
  private arraysOverlap<T>(arr1: T[], arr2: T[]): boolean {
    return arr1.some(item => arr2.includes(item));
  }

  /**
   * Shuts down the service and disconnects all WebSocket connections
   */
  public shutdown(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((_, id) => {
      this.unsubscribe(id);
    });
    
    // Disconnect all WebSocket services
    this.wsFactory.disconnectAll();
    
    this.isInitialized = false;
    this.emit('shutdown');
  }
}