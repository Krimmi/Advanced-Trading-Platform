import { useState } from 'react';
import { 
  OptimizationRequest, 
  OptimizationResult 
} from '../services/portfolio/models/OptimizationModels';
import portfolioOptimizationService from '../services/portfolio/PortfolioOptimizationService';

export const usePortfolioOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Optimizes a portfolio based on the provided request
   * @param request The optimization request
   * @returns The optimization result
   */
  const optimizePortfolio = async (request: OptimizationRequest): Promise<OptimizationResult> => {
    setIsOptimizing(true);
    setError(null);
    
    try {
      const result = await portfolioOptimizationService.optimizePortfolio(request);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * Saves an optimized portfolio
   * @param portfolioId The portfolio ID
   * @param result The optimization result to save
   * @param name Optional name for the saved portfolio
   * @returns The ID of the saved portfolio
   */
  const saveOptimizedPortfolio = async (
    portfolioId: string, 
    result: OptimizationResult, 
    name?: string
  ): Promise<string> => {
    setIsOptimizing(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a service method
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      return `${portfolioId}-optimized`;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  };

  /**
   * Compares multiple optimization results
   * @param results The optimization results to compare
   * @returns The comparison data
   */
  const compareOptimizationResults = async (
    results: OptimizationResult[]
  ): Promise<any> => {
    setIsOptimizing(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a service method
      // For now, we'll just return a simple comparison
      const comparison = results.map(result => ({
        objectiveType: result.objective.type,
        expectedReturn: result.metrics.expectedReturn,
        expectedRisk: result.metrics.expectedRisk,
        sharpeRatio: result.metrics.sharpeRatio
      }));
      
      return comparison;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    optimizePortfolio,
    saveOptimizedPortfolio,
    compareOptimizationResults,
    isOptimizing,
    error
  };
};