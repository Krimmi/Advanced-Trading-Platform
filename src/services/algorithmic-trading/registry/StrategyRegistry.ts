import { IStrategy } from '../strategies/IStrategy';
import { StrategyState } from '../../../models/algorithmic-trading/StrategyTypes';

/**
 * Strategy registry for managing trading strategies
 */
export class StrategyRegistry {
  private static instance: StrategyRegistry;
  private strategies: Map<string, IStrategy> = new Map();
  private activeStrategies: Set<string> = new Set();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): StrategyRegistry {
    if (!StrategyRegistry.instance) {
      StrategyRegistry.instance = new StrategyRegistry();
    }
    return StrategyRegistry.instance;
  }
  
  /**
   * Register a strategy
   * @param strategy Strategy to register
   * @returns The registered strategy
   */
  public registerStrategy(strategy: IStrategy): IStrategy {
    if (this.strategies.has(strategy.id)) {
      throw new Error(`Strategy with ID ${strategy.id} is already registered`);
    }
    
    this.strategies.set(strategy.id, strategy);
    return strategy;
  }
  
  /**
   * Unregister a strategy
   * @param strategyId ID of the strategy to unregister
   * @returns True if the strategy was unregistered, false otherwise
   */
  public unregisterStrategy(strategyId: string): boolean {
    // Stop the strategy if it's active
    if (this.activeStrategies.has(strategyId)) {
      this.stopStrategy(strategyId);
    }
    
    return this.strategies.delete(strategyId);
  }
  
  /**
   * Get a strategy by ID
   * @param strategyId ID of the strategy
   * @returns The strategy, or undefined if not found
   */
  public getStrategy(strategyId: string): IStrategy | undefined {
    return this.strategies.get(strategyId);
  }
  
  /**
   * Get all registered strategies
   * @returns Array of all registered strategies
   */
  public getAllStrategies(): IStrategy[] {
    return Array.from(this.strategies.values());
  }
  
  /**
   * Get all active strategies
   * @returns Array of all active strategies
   */
  public getActiveStrategies(): IStrategy[] {
    return Array.from(this.activeStrategies).map(id => this.strategies.get(id)!);
  }
  
  /**
   * Start a strategy
   * @param strategyId ID of the strategy to start
   * @returns The started strategy
   */
  public async startStrategy(strategyId: string): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    await strategy.start();
    
    if (strategy.state === StrategyState.RUNNING) {
      this.activeStrategies.add(strategyId);
    }
    
    return strategy;
  }
  
  /**
   * Stop a strategy
   * @param strategyId ID of the strategy to stop
   * @returns The stopped strategy
   */
  public async stopStrategy(strategyId: string): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    await strategy.stop();
    this.activeStrategies.delete(strategyId);
    
    return strategy;
  }
  
  /**
   * Pause a strategy
   * @param strategyId ID of the strategy to pause
   * @returns The paused strategy
   */
  public async pauseStrategy(strategyId: string): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    await strategy.pause();
    
    return strategy;
  }
  
  /**
   * Reset a strategy
   * @param strategyId ID of the strategy to reset
   * @returns The reset strategy
   */
  public async resetStrategy(strategyId: string): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    // Stop the strategy if it's active
    if (this.activeStrategies.has(strategyId)) {
      await this.stopStrategy(strategyId);
    }
    
    await strategy.reset();
    
    return strategy;
  }
  
  /**
   * Update strategy parameters
   * @param strategyId ID of the strategy
   * @param parameters Parameters to update
   * @returns The updated strategy
   */
  public async updateStrategyParameters(
    strategyId: string,
    parameters: Record<string, any>
  ): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    await strategy.updateParameters(parameters);
    
    return strategy;
  }
  
  /**
   * Export strategy configuration
   * @param strategyId ID of the strategy
   * @returns Serializable configuration
   */
  public exportStrategyConfig(strategyId: string): Record<string, any> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    return strategy.exportConfig();
  }
  
  /**
   * Import strategy configuration
   * @param strategyId ID of the strategy
   * @param config Configuration to import
   * @returns The updated strategy
   */
  public async importStrategyConfig(
    strategyId: string,
    config: Record<string, any>
  ): Promise<IStrategy> {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    await strategy.importConfig(config);
    
    return strategy;
  }
  
  /**
   * Process market data for all active strategies
   * @param data Market data to process
   */
  public async processMarketData(data: any): Promise<void> {
    const activeStrategies = this.getActiveStrategies();
    
    for (const strategy of activeStrategies) {
      try {
        await strategy.onData(data);
      } catch (error) {
        console.error(`Error processing data for strategy ${strategy.id}:`, error);
      }
    }
  }
  
  /**
   * Generate signals from all active strategies
   * @returns Map of strategy IDs to generated signals
   */
  public async generateSignals(): Promise<Map<string, any[]>> {
    const activeStrategies = this.getActiveStrategies();
    const signalsMap = new Map<string, any[]>();
    
    for (const strategy of activeStrategies) {
      try {
        const signals = await strategy.generateSignals();
        signalsMap.set(strategy.id, signals);
      } catch (error) {
        console.error(`Error generating signals for strategy ${strategy.id}:`, error);
        signalsMap.set(strategy.id, []);
      }
    }
    
    return signalsMap;
  }
}