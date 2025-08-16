import OptimizationService from './optimizationService';
import { OptimizationConfig, OptimizationResult } from '../../types/backtesting/strategyTypes';

/**
 * Extension methods for OptimizationService
 * These methods are used by the StrategyOptimizationPanel component
 */

/**
 * Start an optimization process
 * @param config Optimization configuration
 * @returns The ID of the created optimization
 */
OptimizationService.prototype.startOptimization = async function(
  config: OptimizationConfig
): Promise<string> {
  try {
    // Create the optimization configuration
    const createdConfig = await this.createOptimizationConfig(config);
    
    // Execute the optimization
    const result = await this.executeOptimization(createdConfig.id!);
    
    return result.id;
  } catch (error) {
    console.error('Error starting optimization:', error);
    throw error;
  }
};

/**
 * Get the progress of an optimization
 * @param optimizationId Optimization ID
 * @returns Progress percentage (0-100)
 */
OptimizationService.prototype.getOptimizationProgress = async function(
  optimizationId: string
): Promise<number> {
  try {
    // Get the optimization result
    const result = await this.getOptimizationResult(optimizationId);
    
    // Calculate progress based on status
    if (result.status === 'completed') {
      return 100;
    } else if (result.status === 'failed') {
      throw new Error(result.errorMessage || 'Optimization failed');
    } else if (result.status === 'pending') {
      return 0;
    } else if (result.status === 'running') {
      // If we have iterations, calculate progress based on maxIterations
      if (result.iterations && result.iterations.length > 0) {
        // Get the optimization config to get maxIterations
        const config = await this.getOptimizationConfig(result.configId);
        
        // Calculate progress
        const progress = (result.iterations.length / config.maxIterations) * 100;
        return Math.min(progress, 99); // Cap at 99% until completed
      }
      
      // Default progress if we can't calculate
      return 50;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error getting optimization progress for ID ${optimizationId}:`, error);
    throw error;
  }
};

/**
 * Cancel an ongoing optimization
 * @param optimizationId Optimization ID
 * @returns Success status
 */
OptimizationService.prototype.cancelOptimization = async function(
  optimizationId: string
): Promise<boolean> {
  try {
    // Make a request to cancel the optimization
    const response = await fetch(`${this.apiUrl}/api/backtesting/optimizations/cancel/${optimizationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel optimization: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error canceling optimization with ID ${optimizationId}:`, error);
    throw error;
  }
};

/**
 * Save an optimization configuration
 * @param config Optimization configuration
 * @returns Saved optimization configuration
 */
OptimizationService.prototype.saveOptimizationConfig = async function(
  config: OptimizationConfig
): Promise<OptimizationConfig> {
  try {
    if (config.id) {
      // Update existing config
      return await this.updateOptimizationConfig(config.id, config);
    } else {
      // Create new config
      return await this.createOptimizationConfig(config);
    }
  } catch (error) {
    console.error('Error saving optimization configuration:', error);
    throw error;
  }
};

export default OptimizationService;