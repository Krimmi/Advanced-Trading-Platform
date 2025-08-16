import { IStrategy } from '../strategies/IStrategy';
import { MovingAverageCrossoverStrategy } from '../strategies/MovingAverageCrossoverStrategy';

/**
 * Strategy type enum
 */
export enum StrategyType {
  MOVING_AVERAGE_CROSSOVER = 'MOVING_AVERAGE_CROSSOVER',
  // Add more strategy types here as they are implemented
}

/**
 * Factory for creating strategies
 */
export class StrategyFactory {
  private static instance: StrategyFactory;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): StrategyFactory {
    if (!StrategyFactory.instance) {
      StrategyFactory.instance = new StrategyFactory();
    }
    return StrategyFactory.instance;
  }
  
  /**
   * Create a new strategy
   * @param type Type of strategy to create
   * @param config Configuration for the strategy
   * @returns The created strategy
   */
  public async createStrategy(
    type: StrategyType,
    config: Record<string, any>
  ): Promise<IStrategy> {
    let strategy: IStrategy;
    
    switch (type) {
      case StrategyType.MOVING_AVERAGE_CROSSOVER:
        strategy = new MovingAverageCrossoverStrategy();
        break;
      default:
        throw new Error(`Unknown strategy type: ${type}`);
    }
    
    await strategy.initialize(config);
    
    return strategy;
  }
}