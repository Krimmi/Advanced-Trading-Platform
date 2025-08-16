import { useState } from 'react';
import { 
  RebalancingParameters, 
  RebalancingResult 
} from '../services/portfolio/PortfolioRebalancingService';
import portfolioRebalancingService from '../services/portfolio/PortfolioRebalancingService';

export const usePortfolioRebalancing = () => {
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Checks if a portfolio needs rebalancing
   * @param portfolioId The portfolio ID
   * @param parameters The rebalancing parameters
   * @returns True if rebalancing is needed, false otherwise
   */
  const needsRebalancing = async (
    portfolioId: string,
    parameters: RebalancingParameters
  ): Promise<boolean> => {
    setIsRebalancing(true);
    setError(null);
    
    try {
      const result = await portfolioRebalancingService.needsRebalancing(portfolioId, parameters);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRebalancing(false);
    }
  };

  /**
   * Generates a rebalancing plan for a portfolio
   * @param portfolioId The portfolio ID
   * @param parameters The rebalancing parameters
   * @returns The rebalancing result
   */
  const generateRebalancingPlan = async (
    portfolioId: string,
    parameters: RebalancingParameters
  ): Promise<RebalancingResult> => {
    setIsRebalancing(true);
    setError(null);
    
    try {
      const result = await portfolioRebalancingService.generateRebalancingPlan(portfolioId, parameters);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRebalancing(false);
    }
  };

  /**
   * Approves a rebalancing plan
   * @param rebalancingResult The rebalancing result to approve
   * @returns The updated rebalancing result
   */
  const approveRebalancingPlan = async (
    rebalancingResult: RebalancingResult
  ): Promise<RebalancingResult> => {
    setIsRebalancing(true);
    setError(null);
    
    try {
      const result = await portfolioRebalancingService.approveRebalancingPlan(rebalancingResult);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRebalancing(false);
    }
  };

  /**
   * Executes an approved rebalancing plan
   * @param rebalancingResult The approved rebalancing plan
   * @returns The updated rebalancing result
   */
  const executeRebalancingPlan = async (
    rebalancingResult: RebalancingResult
  ): Promise<RebalancingResult> => {
    setIsRebalancing(true);
    setError(null);
    
    try {
      const result = await portfolioRebalancingService.executeRebalancingPlan(rebalancingResult);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsRebalancing(false);
    }
  };

  return {
    needsRebalancing,
    generateRebalancingPlan,
    approveRebalancingPlan,
    executeRebalancingPlan,
    isRebalancing,
    error
  };
};