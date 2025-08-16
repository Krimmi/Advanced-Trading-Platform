import { IExecutionService } from './IExecutionService';
import { MockExecutionService } from './MockExecutionService';

/**
 * Execution service type enum
 */
export enum ExecutionServiceType {
  MOCK = 'MOCK',
  // Add more execution service types here as they are implemented
}

/**
 * Factory for creating execution services
 */
export class ExecutionServiceFactory {
  private static instance: ExecutionServiceFactory;
  private services: Map<string, IExecutionService> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): ExecutionServiceFactory {
    if (!ExecutionServiceFactory.instance) {
      ExecutionServiceFactory.instance = new ExecutionServiceFactory();
    }
    return ExecutionServiceFactory.instance;
  }
  
  /**
   * Create a new execution service
   * @param type Type of execution service to create
   * @param config Configuration for the execution service
   * @returns The created execution service
   */
  public async createExecutionService(
    type: ExecutionServiceType,
    config: Record<string, any>
  ): Promise<IExecutionService> {
    let service: IExecutionService;
    
    switch (type) {
      case ExecutionServiceType.MOCK:
        service = new MockExecutionService();
        break;
      default:
        throw new Error(`Unknown execution service type: ${type}`);
    }
    
    await service.initialize(config);
    this.services.set(service.id, service);
    
    return service;
  }
  
  /**
   * Get an execution service by ID
   * @param id ID of the execution service
   * @returns The execution service, or undefined if not found
   */
  public getExecutionService(id: string): IExecutionService | undefined {
    return this.services.get(id);
  }
  
  /**
   * Get all execution services
   * @returns Array of all execution services
   */
  public getAllExecutionServices(): IExecutionService[] {
    return Array.from(this.services.values());
  }
  
  /**
   * Remove an execution service
   * @param id ID of the execution service to remove
   * @returns True if the service was removed, false otherwise
   */
  public removeExecutionService(id: string): boolean {
    return this.services.delete(id);
  }
  
  /**
   * Clear all execution services
   */
  public clearExecutionServices(): void {
    this.services.clear();
  }
}