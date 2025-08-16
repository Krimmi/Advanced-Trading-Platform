import { EventEmitter } from 'events';
import { StrategyRegistry } from './registry/StrategyRegistry';
import { StrategyFactory, StrategyType } from './registry/StrategyFactory';
import { SignalGeneratorFactory, SignalGeneratorType } from './signals/SignalGeneratorFactory';
import { ExecutionServiceFactory, ExecutionServiceType } from './execution/ExecutionServiceFactory';
import { StrategyMarketDataService } from './market-data/StrategyMarketDataService';
import { OrderManagementSystem } from './execution/OrderManagementSystem';
import { PositionTrackingService } from './portfolio/PositionTrackingService';
import { RiskManagementService, RiskCheckResult } from './risk/RiskManagementService';
import { IStrategy } from './strategies/IStrategy';
import { ISignalGenerator } from './signals/ISignalGenerator';
import { IExecutionService } from './execution/IExecutionService';
import { Signal } from '../../models/algorithmic-trading/StrategyTypes';
import { OrderParams, OrderStatus } from '../../models/algorithmic-trading/OrderTypes';
import { ConnectionState } from '../../services/websocket/WebSocketService';

/**
 * Main service for algorithmic trading
 */
export class AlgorithmicTradingService extends EventEmitter {
  private static instance: AlgorithmicTradingService;
  
  private strategyRegistry: StrategyRegistry;
  private strategyFactory: StrategyFactory;
  private signalGeneratorFactory: SignalGeneratorFactory;
  private executionServiceFactory: ExecutionServiceFactory;
  private marketDataService: StrategyMarketDataService;
  
  private defaultExecutionServiceId?: string;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private signalBuffer: Map<string, Signal[]> = new Map(); // strategyId -> signals
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
    this.strategyRegistry = StrategyRegistry.getInstance();
    this.strategyFactory = StrategyFactory.getInstance();
    this.signalGeneratorFactory = SignalGeneratorFactory.getInstance();
    this.executionServiceFactory = ExecutionServiceFactory.getInstance();
    this.marketDataService = StrategyMarketDataService.getInstance();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): AlgorithmicTradingService {
    if (!AlgorithmicTradingService.instance) {
      AlgorithmicTradingService.instance = new AlgorithmicTradingService();
    }
    return AlgorithmicTradingService.instance;
  }
  
  /**
   * Initialize the algorithmic trading service
   * @param config Configuration for the service
   */
  public async initialize(config: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Create an execution service based on config or default to mock
      let executionService;
      
      if (config.executionService?.type === 'alpaca') {
        // Create Alpaca execution service
        executionService = await this.executionServiceFactory.createExecutionService(
          ExecutionServiceType.ALPACA,
          config.executionService || {}
        );
      } else {
        // Create mock execution service by default
        executionService = await this.executionServiceFactory.createExecutionService(
          ExecutionServiceType.MOCK,
          config.executionService || {}
        );
      }
      
      this.defaultExecutionServiceId = executionService.id;
      
      // Initialize the market data service
      await this.marketDataService.initialize();
      
      // Initialize the order management system
      const orderManagementSystem = OrderManagementSystem.getInstance();
      await orderManagementSystem.initialize(executionService, config.orderManagement || {});
      
      // Initialize the position tracking service
      const positionTrackingService = PositionTrackingService.getInstance();
      await positionTrackingService.initialize(executionService, config.positionTracking || {});
      
      // Initialize the risk management service
      const riskManagementService = RiskManagementService.getInstance();
      await riskManagementService.initialize(config.riskManagement || {});
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('Algorithmic Trading Service initialized');
    } catch (error) {
      console.error('Error initializing Algorithmic Trading Service:', error);
      throw error;
    }
  }
  
  /**
   * Start the service
   */
  public async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service must be initialized before starting');
    }

    if (this.isRunning) {
      return;
    }

    try {
      // Start all active strategies
      const strategies = this.strategyRegistry.getAllStrategies();
      for (const strategy of strategies) {
        if (strategy.state === 'ACTIVE' || strategy.state === 'INITIALIZED') {
          await strategy.start();
        }
      }

      this.isRunning = true;
      this.emit('started');
      console.log('Algorithmic Trading Service started');
    } catch (error) {
      console.error('Error starting Algorithmic Trading Service:', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop all running strategies
      const strategies = this.strategyRegistry.getAllStrategies();
      for (const strategy of strategies) {
        if (strategy.state === 'RUNNING') {
          await strategy.stop();
        }
      }

      this.isRunning = false;
      this.emit('stopped');
      console.log('Algorithmic Trading Service stopped');
    } catch (error) {
      console.error('Error stopping Algorithmic Trading Service:', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for strategy registry events
    this.strategyRegistry.on('strategy_added', this.handleStrategyAdded.bind(this));
    this.strategyRegistry.on('strategy_removed', this.handleStrategyRemoved.bind(this));
    this.strategyRegistry.on('strategy_updated', this.handleStrategyUpdated.bind(this));
    this.strategyRegistry.on('strategy_started', this.handleStrategyStarted.bind(this));
    this.strategyRegistry.on('strategy_stopped', this.handleStrategyStopped.bind(this));

    // Listen for market data service events
    this.marketDataService.on('connection_state_changed', this.handleConnectionStateChanged.bind(this));
    this.marketDataService.on('error', this.handleMarketDataError.bind(this));
  }

  /**
   * Handle strategy added event
   * @param strategy Strategy that was added
   */
  private handleStrategyAdded(strategy: IStrategy): void {
    console.log(`Strategy added: ${strategy.id} - ${strategy.name}`);
    
    // Initialize signal buffer for this strategy
    this.signalBuffer.set(strategy.id, []);
    
    // If the service is running and the strategy is active, start it
    if (this.isRunning && strategy.state === 'ACTIVE') {
      strategy.start().catch(error => {
        console.error(`Error starting strategy ${strategy.id}:`, error);
      });
    }
    
    // Emit event
    this.emit('strategy_added', strategy);
  }

  /**
   * Handle strategy removed event
   * @param strategyId ID of the strategy that was removed
   */
  private handleStrategyRemoved(strategyId: string): void {
    console.log(`Strategy removed: ${strategyId}`);
    
    // Clear any buffered signals
    this.signalBuffer.delete(strategyId);
    
    // Emit event
    this.emit('strategy_removed', strategyId);
  }

  /**
   * Handle strategy updated event
   * @param strategy Strategy that was updated
   */
  private handleStrategyUpdated(strategy: IStrategy): void {
    console.log(`Strategy updated: ${strategy.id} - ${strategy.name}`);
    
    // Emit event
    this.emit('strategy_updated', strategy);
  }
  
  /**
   * Handle strategy started event
   * @param strategy Strategy that was started
   */
  private handleStrategyStarted(strategy: IStrategy): void {
    console.log(`Strategy started: ${strategy.id} - ${strategy.name}`);
    
    // Emit event
    this.emit('strategy_started', strategy);
  }
  
  /**
   * Handle strategy stopped event
   * @param strategy Strategy that was stopped
   */
  private handleStrategyStopped(strategy: IStrategy): void {
    console.log(`Strategy stopped: ${strategy.id} - ${strategy.name}`);
    
    // Emit event
    this.emit('strategy_stopped', strategy);
  }

  /**
   * Handle connection state changed event
   * @param state New connection state
   */
  private handleConnectionStateChanged(state: ConnectionState): void {
    console.log(`Market data connection state changed: ${state}`);
    this.emit('connection_state_changed', state);
  }

  /**
   * Handle market data error event
   * @param error Error
   */
  private handleMarketDataError(error: any): void {
    console.error('Market data error:', error);
    this.emit('market_data_error', error);
  }
  
  /**
   * Create and register a strategy
   * @param type Type of strategy to create
   * @param config Configuration for the strategy
   * @returns The created strategy
   */
  public async createStrategy(
    type: StrategyType,
    config: Record<string, any>
  ): Promise<IStrategy> {
    const strategy = await this.strategyFactory.createStrategy(type, config);
    this.strategyRegistry.registerStrategy(strategy);
    return strategy;
  }
  
  /**
   * Create a signal generator
   * @param type Type of signal generator to create
   * @param config Configuration for the signal generator
   * @returns The created signal generator
   */
  public async createSignalGenerator(
    type: SignalGeneratorType,
    config: Record<string, any>
  ): Promise<ISignalGenerator> {
    return await this.signalGeneratorFactory.createSignalGenerator(type, config);
  }
  
  /**
   * Create an execution service
   * @param type Type of execution service to create
   * @param config Configuration for the execution service
   * @returns The created execution service
   */
  public async createExecutionService(
    type: ExecutionServiceType,
    config: Record<string, any>
  ): Promise<IExecutionService> {
    return await this.executionServiceFactory.createExecutionService(type, config);
  }
  
  /**
   * Set the default execution service
   * @param executionServiceId ID of the execution service to use as default
   */
  public setDefaultExecutionService(executionServiceId: string): void {
    const executionService = this.executionServiceFactory.getExecutionService(executionServiceId);
    if (!executionService) {
      throw new Error(`Execution service not found: ${executionServiceId}`);
    }
    
    this.defaultExecutionServiceId = executionServiceId;
  }
  
  /**
   * Get the default execution service
   * @returns The default execution service
   */
  public getDefaultExecutionService(): IExecutionService {
    if (!this.defaultExecutionServiceId) {
      throw new Error('No default execution service set');
    }
    
    const executionService = this.executionServiceFactory.getExecutionService(this.defaultExecutionServiceId);
    if (!executionService) {
      throw new Error(`Default execution service not found: ${this.defaultExecutionServiceId}`);
    }
    
    return executionService;
  }
  
  /**
   * Start a strategy
   * @param strategyId ID of the strategy to start
   * @returns The started strategy
   */
  public async startStrategy(strategyId: string): Promise<IStrategy> {
    return await this.strategyRegistry.startStrategy(strategyId);
  }
  
  /**
   * Stop a strategy
   * @param strategyId ID of the strategy to stop
   * @returns The stopped strategy
   */
  public async stopStrategy(strategyId: string): Promise<IStrategy> {
    return await this.strategyRegistry.stopStrategy(strategyId);
  }
  
  /**
   * Pause a strategy
   * @param strategyId ID of the strategy to pause
   * @returns The paused strategy
   */
  public async pauseStrategy(strategyId: string): Promise<IStrategy> {
    return await this.strategyRegistry.pauseStrategy(strategyId);
  }
  
  /**
   * Reset a strategy
   * @param strategyId ID of the strategy to reset
   * @returns The reset strategy
   */
  public async resetStrategy(strategyId: string): Promise<IStrategy> {
    return await this.strategyRegistry.resetStrategy(strategyId);
  }
  
  /**
   * Get a strategy by ID
   * @param strategyId ID of the strategy
   * @returns The strategy, or undefined if not found
   */
  public getStrategy(strategyId: string): IStrategy | undefined {
    return this.strategyRegistry.getStrategy(strategyId);
  }
  
  /**
   * Get all registered strategies
   * @returns Array of all registered strategies
   */
  public getAllStrategies(): IStrategy[] {
    return this.strategyRegistry.getAllStrategies();
  }
  
  /**
   * Get all active strategies
   * @returns Array of all active strategies
   */
  public getActiveStrategies(): IStrategy[] {
    return this.strategyRegistry.getActiveStrategies();
  }
  
  /**
   * Process market data for all active strategies
   * @param data Market data to process
   */
  public async processMarketData(data: any): Promise<void> {
    await this.strategyRegistry.processMarketData(data);
  }
  
  /**
   * Generate signals from all active strategies
   * @returns Map of strategy IDs to generated signals
   */
  public async generateSignals(): Promise<Map<string, Signal[]>> {
    const signalMap = await this.strategyRegistry.generateSignals();
    
    // Store signals in buffer
    for (const [strategyId, signals] of signalMap.entries()) {
      const buffer = this.signalBuffer.get(strategyId) || [];
      buffer.push(...signals);
      this.signalBuffer.set(strategyId, buffer);
      
      // Emit events for each signal
      for (const signal of signals) {
        this.emit('signal', { strategyId, signal });
      }
    }
    
    return signalMap;
  }
  
  /**
   * Execute a signal using the order management system
   * @param signal Signal to execute
   * @param orderParams Additional order parameters
   * @returns The created order
   */
  public async executeSignal(signal: Signal, orderParams?: Partial<OrderParams>): Promise<any> {
    // Get the order management system
    const orderManagementSystem = OrderManagementSystem.getInstance();
    
    // Get the risk management service
    const riskManagementService = RiskManagementService.getInstance();
    
    // Convert signal to order parameters
    const params: OrderParams = {
      symbol: signal.symbol,
      side: signal.type.includes('BUY') ? 'BUY' : 'SELL',
      type: 'MARKET', // Default to market order
      quantity: 1, // Default quantity
      ...orderParams
    };
    
    // Check risk limits
    const riskCheckResult = riskManagementService.checkOrderRiskLimits(params);
    
    if (!riskCheckResult.passed) {
      console.warn(`Risk check failed: ${riskCheckResult.message}`);
      
      // Emit risk check failed event
      this.emit('risk_check_failed', { signal, orderParams: params, riskCheckResult });
      
      // If the risk action is to reduce size, adjust the quantity
      if (riskCheckResult.action === 'REDUCE_SIZE' && riskCheckResult.limitValue) {
        console.log(`Reducing order quantity from ${params.quantity} to ${riskCheckResult.limitValue}`);
        params.quantity = riskCheckResult.limitValue;
      } else {
        // Otherwise, block the order
        throw new Error(`Order blocked by risk management: ${riskCheckResult.message}`);
      }
    }
    
    // Create the order through the order management system
    const order = await orderManagementSystem.createOrderFromSignal(signal, params);
    
    // Emit event for order created
    this.emit('order_created', { signal, order });
    
    return order;
  }
  
  /**
   * Execute signals from a specific strategy
   * @param strategyId ID of the strategy
   * @returns The created orders
   */
  public async executeStrategySignals(strategyId: string): Promise<any[]> {
    const strategy = this.strategyRegistry.getStrategy(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    // Get the position tracking service
    const positionTrackingService = PositionTrackingService.getInstance();
    
    // Generate signals
    const signals = await strategy.generateSignals();
    const orders = [];
    
    // Store signals in buffer
    const buffer = this.signalBuffer.get(strategyId) || [];
    buffer.push(...signals);
    this.signalBuffer.set(strategyId, buffer);
    
    // Emit events for each signal
    for (const signal of signals) {
      this.emit('signal', { strategyId, signal });
    }
    
    // Get portfolio for position sizing
    const portfolio = positionTrackingService.getPortfolio();
    
    // Process each signal
    for (const signal of signals) {
      try {
        // Calculate position size based on portfolio percentage
        // Default to 5% of portfolio per position
        const portfolioPercentage = 5;
        
        // Get current price from signal metadata or use a default
        const price = signal.metadata?.price || 100; // This would be replaced with actual price in a real implementation
        
        // Calculate position size
        const positionSize = positionTrackingService.calculatePositionSizeByPortfolioPercentage(
          portfolioPercentage,
          price
        );
        
        // Execute the signal
        const order = await this.executeSignal(signal, {
          strategyId,
          quantity: positionSize,
          portfolioPercentage,
          metadata: {
            signalType: signal.type,
            signalConfidence: signal.confidence,
            signalTimestamp: signal.timestamp,
            signalMetadata: signal.metadata,
            portfolioValue: portfolio.totalValue,
            calculatedPositionSize: positionSize
          }
        });
        
        orders.push(order);
      } catch (error) {
        console.error(`Error executing signal for strategy ${strategyId}:`, error);
        
        // Emit error event
        this.emit('signal_execution_error', { strategyId, signal, error });
      }
    }
    
    return orders;
  }
  
  /**
   * Get the market data connection state
   * @returns Connection state
   */
  public getMarketDataConnectionState(): ConnectionState {
    return this.marketDataService.getConnectionState();
  }

  /**
   * Get all signals for a strategy
   * @param strategyId Strategy ID
   * @returns Array of signals
   */
  public getSignalsForStrategy(strategyId: string): Signal[] {
    return this.signalBuffer.get(strategyId) || [];
  }

  /**
   * Clear signals for a strategy
   * @param strategyId Strategy ID
   */
  public clearSignalsForStrategy(strategyId: string): void {
    this.signalBuffer.set(strategyId, []);
  }

  /**
   * Get all signals
   * @returns Map of strategy ID to signals
   */
  public getAllSignals(): Map<string, Signal[]> {
    return new Map(this.signalBuffer);
  }

  /**
   * Clear all signals
   */
  public clearAllSignals(): void {
    for (const strategyId of this.signalBuffer.keys()) {
      this.signalBuffer.set(strategyId, []);
    }
  }

  /**
   * Check if the service is initialized
   * @returns True if initialized
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if the service is running
   * @returns True if running
   */
  public isServiceRunning(): boolean {
    return this.isRunning;
  }
}