import { useState } from 'react';
import { 
  BlackLittermanParameters, 
  BlackLittermanResult 
} from '../services/portfolio/BlackLittermanService';
import blackLittermanService from '../services/portfolio/BlackLittermanService';

export const useBlackLitterman = () => {
  const [isRunningBlackLitterman, setIsRunningBlackLitterman] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Runs the Black-Litterman model to generate optimal portfolio allocations
   * @param portfolioId The portfolio ID
   * @param parameters Black-Litterman model parameters
   * @returns The Black-Litterman model results
   */
  const runBlackLittermanModel = async (
    portfolioId: string,
    parameters: BlackLittermanParameters
  ): Promise<BlackLittermanResult> => {
    setIsRunningBlackLitterman(true);
    setError(null);
    
    try {
      const result = await blackLittermanService.runBlackLittermanModel(portfolioId, parameters);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRunningBlackLitterman(false);
    }
  };

  /**
   * Saves a Black-Litterman optimized portfolio
   * @param portfolioId The portfolio ID
   * @param result The Black-Litterman result to save
   * @param name Optional name for the saved portfolio
   * @returns The ID of the saved portfolio
   */
  const saveBlackLittermanPortfolio = async (
    portfolioId: string, 
    result: BlackLittermanResult, 
    name?: string
  ): Promise<string> => {
    setIsRunningBlackLitterman(true);
    setError(null);
    
    try {
      // In a real implementation, this would call a service method
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      return `${portfolioId}-bl-optimized`;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRunningBlackLitterman(false);
    }
  };

  return {
    runBlackLittermanModel,
    saveBlackLittermanPortfolio,
    isRunningBlackLitterman,
    error
  };
};