import MarketSimulationService from './marketSimulationService';
import { 
  SimulationConfig, 
  SimulationResult, 
  SimulationScenario,
  MarketCondition
} from '../../types/backtesting/simulationTypes';

/**
 * Extension methods for MarketSimulationService
 * These methods are used by the SimulationControlPanel component
 */

/**
 * Create a new market simulation
 * @param config Simulation configuration
 * @returns The ID of the created simulation
 */
MarketSimulationService.prototype.createSimulation = async function(
  config: SimulationConfig
): Promise<string> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create simulation: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Error creating simulation:', error);
    throw error;
  }
};

/**
 * Get available simulation scenarios
 * @returns Array of simulation scenarios
 */
MarketSimulationService.prototype.getSimulationScenarios = async function(): Promise<SimulationScenario[]> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations/scenarios`);
    
    if (!response.ok) {
      throw new Error(`Failed to get simulation scenarios: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting simulation scenarios:', error);
    throw error;
  }
};

/**
 * Get simulation progress
 * @param simulationId Simulation ID
 * @returns Progress percentage (0-100)
 */
MarketSimulationService.prototype.getSimulationProgress = async function(
  simulationId: string
): Promise<number> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations/${simulationId}/progress`);
    
    if (!response.ok) {
      throw new Error(`Failed to get simulation progress: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.progress;
  } catch (error) {
    console.error(`Error getting simulation progress for ID ${simulationId}:`, error);
    throw error;
  }
};

/**
 * Get simulation result
 * @param simulationId Simulation ID
 * @returns Simulation result
 */
MarketSimulationService.prototype.getSimulationResult = async function(
  simulationId: string
): Promise<SimulationResult> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations/${simulationId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get simulation result: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting simulation result for ID ${simulationId}:`, error);
    throw error;
  }
};

/**
 * Cancel a simulation
 * @param simulationId Simulation ID
 * @returns Success status
 */
MarketSimulationService.prototype.cancelSimulation = async function(
  simulationId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations/${simulationId}/cancel`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to cancel simulation: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Error canceling simulation with ID ${simulationId}:`, error);
    throw error;
  }
};

/**
 * Get available market conditions
 * @returns Array of market conditions
 */
MarketSimulationService.prototype.getMarketConditions = async function(): Promise<MarketCondition[]> {
  try {
    const response = await fetch(`${this.apiUrl}/api/backtesting/simulations/market-conditions`);
    
    if (!response.ok) {
      throw new Error(`Failed to get market conditions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting market conditions:', error);
    throw error;
  }
};

export default MarketSimulationService;