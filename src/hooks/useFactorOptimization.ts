import { useState } from 'react';
import { 
  FactorOptimizationParameters, 
  FactorOptimizationResult 
} from '../services/portfolio/FactorOptimizationService';
import factorOptimizationService from '../services/portfolio/FactorOptimizationService';

export const useFactorOptimization = () => {
  const [isOptimizingFactors, setIsOptimizingFactors] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Optimizes a portfolio based on factor exposures
   * @param portfolioId The portfolio ID
   * @param parameters Factor optimization parameters
   * @returns The factor optimization result
   */
  const optimizeFactorPortfolio = async (
    portfolioId: string,
    parameters: FactorOptimizationParameters
  ): Promise<FactorOptimizationResult> => {
    setIsOptimizingFactors(true);
    setError(null);
    
    try {
      const result = await factorOptimizationService.optimizePortfolio(portfolioId, parameters);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizingFactors(false);
    }
  };

  /**
   * Analyzes a portfolio's factor exposures
   * @param portfolioId The portfolio ID
   * @returns The factor exposures and risk decomposition
   */
  const analyzePortfolioFactors = async (
    portfolioId: string
  ): Promise<any> => {
    setIsOptimizingFactors(true);
    setError(null);
    
    try {
      const result = await factorOptimizationService.analyzePortfolioFactors(portfolioId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizingFactors(false);
    }
  };

  /**
   * Saves a factor-optimized portfolio
   * @param portfolioId The portfolio ID
   * @param result The factor optimization result to save
   * @param name Optional name for the saved portfolio
   * @returns The ID of the saved portfolio
   */
  const saveFactorOptimizedPortfolio = async (
    portfolioId: string, 
    result: FactorOptimizationResult, 
    name?: string
  ): Promise<string> => {
    setIsOptimizingFactors(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a service method
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      return `${portfolioId}-factor-optimized`;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsOptimizingFactors(false);
    }
  };

  return {
    optimizeFactorPortfolio,
    analyzePortfolioFactors,
    saveFactorOptimizedPortfolio,
    isOptimizingFactors,
    error
  };
};