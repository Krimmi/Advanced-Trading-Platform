import { ISignalGenerator, SignalGeneratorConfig } from './ISignalGenerator';
import { MovingAverageCrossoverSignalGenerator } from './MovingAverageCrossoverSignalGenerator';
import { RSISignalGenerator } from './RSISignalGenerator';

/**
 * Signal generator type enum
 */
export enum SignalGeneratorType {
  MOVING_AVERAGE_CROSSOVER = 'MOVING_AVERAGE_CROSSOVER',
  RSI = 'RSI',
  // Add more signal generator types here
}

/**
 * Factory for creating signal generators
 */
export class SignalGeneratorFactory {
  private static instance: SignalGeneratorFactory;
  private generators: Map<string, ISignalGenerator> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): SignalGeneratorFactory {
    if (!SignalGeneratorFactory.instance) {
      SignalGeneratorFactory.instance = new SignalGeneratorFactory();
    }
    return SignalGeneratorFactory.instance;
  }
  
  /**
   * Create a new signal generator
   * @param type Type of signal generator to create
   * @param config Configuration for the signal generator
   * @returns The created signal generator
   */
  public async createSignalGenerator(
    type: SignalGeneratorType,
    config: SignalGeneratorConfig
  ): Promise<ISignalGenerator> {
    let generator: ISignalGenerator;
    
    switch (type) {
      case SignalGeneratorType.MOVING_AVERAGE_CROSSOVER:
        generator = new MovingAverageCrossoverSignalGenerator();
        break;
      case SignalGeneratorType.RSI:
        generator = new RSISignalGenerator();
        break;
      default:
        throw new Error(`Unknown signal generator type: ${type}`);
    }
    
    await generator.initialize(config);
    this.generators.set(generator.id, generator);
    
    return generator;
  }
  
  /**
   * Get a signal generator by ID
   * @param id ID of the signal generator
   * @returns The signal generator, or undefined if not found
   */
  public getSignalGenerator(id: string): ISignalGenerator | undefined {
    return this.generators.get(id);
  }
  
  /**
   * Get all signal generators
   * @returns Array of all signal generators
   */
  public getAllSignalGenerators(): ISignalGenerator[] {
    return Array.from(this.generators.values());
  }
  
  /**
   * Remove a signal generator
   * @param id ID of the signal generator to remove
   * @returns True if the generator was removed, false otherwise
   */
  public removeSignalGenerator(id: string): boolean {
    return this.generators.delete(id);
  }
  
  /**
   * Clear all signal generators
   */
  public clearSignalGenerators(): void {
    this.generators.clear();
  }
}