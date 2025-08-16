# Frontend-Backend Integration Example

This document provides an example of how to connect the `StrategyOptimizationPanel` frontend component to the `optimizationService` backend service.

## 1. Update StrategyOptimizationPanel.tsx

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  // other imports...
} from '@mui/material';

// Import the optimization service
import OptimizationService from '../../services/backtesting/optimizationService';
import { 
  Strategy, 
  OptimizationConfig, 
  OptimizationResult,
  ParameterRange
} from '../../types/backtesting';

interface StrategyOptimizationPanelProps {
  strategy: Strategy | null;
  onOptimizationComplete?: (optimizedStrategy: Strategy) => void;
}

const StrategyOptimizationPanel: React.FC<StrategyOptimizationPanelProps> = ({
  strategy,
  onOptimizationComplete
}) => {
  // State variables
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[] | null>(null);
  const [parameterRanges, setParameterRanges] = useState<ParameterRange[]>([]);
  const [optimizationMetric, setOptimizationMetric] = useState<string>('sharpeRatio');
  
  // Create an instance of the optimization service
  const optimizationService = new OptimizationService();
  
  // Initialize optimization configuration when strategy changes
  useEffect(() => {
    if (strategy) {
      initializeOptimizationConfig();
    }
  }, [strategy]);
  
  // Initialize optimization configuration based on strategy parameters
  const initializeOptimizationConfig = () => {
    if (!strategy) return;
    
    try {
      // Extract parameters from strategy that can be optimized
      const parameters = strategy.parameters.map(param => ({
        name: param.name,
        min: typeof param.value === 'number' ? param.value * 0.5 : 1,
        max: typeof param.value === 'number' ? param.value * 1.5 : 100,
        step: typeof param.value === 'number' ? (param.value * 0.1) || 1 : 1
      }));
      
      setParameterRanges(parameters);
      
      // Create initial optimization config
      const config: OptimizationConfig = {
        strategyId: strategy.id,
        parameterRanges: parameters,
        optimizationMetric: optimizationMetric,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
        endDate: new Date().toISOString(),
        maxIterations: 100
      };
      
      setOptimizationConfig(config);
    } catch (err) {
      console.error('Error initializing optimization config:', err);
      setError('Failed to initialize optimization configuration.');
    }
  };
  
  // Handle parameter range change
  const handleParameterRangeChange = (index: number, field: 'min' | 'max' | 'step', value: number) => {
    const updatedRanges = [...parameterRanges];
    updatedRanges[index][field] = value;
    setParameterRanges(updatedRanges);
    
    // Update optimization config
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        parameterRanges: updatedRanges
      });
    }
  };
  
  // Handle optimization metric change
  const handleOptimizationMetricChange = (metric: string) => {
    setOptimizationMetric(metric);
    
    // Update optimization config
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        optimizationMetric: metric
      });
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    // Update optimization config
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        startDate,
        endDate
      });
    }
  };
  
  // Run optimization
  const handleRunOptimization = async () => {
    if (!optimizationConfig || !strategy) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the optimization service
      const results = await optimizationService.optimizeStrategy(optimizationConfig);
      
      setOptimizationResults(results);
      setLoading(false);
      
      // If there are results and a best result is available
      if (results && results.length > 0) {
        const bestResult = results[0]; // Assuming results are sorted by performance
        
        // Create optimized strategy
        const optimizedStrategy: Strategy = {
          ...strategy,
          id: `${strategy.id}_optimized`,
          name: `${strategy.name} (Optimized)`,
          parameters: strategy.parameters.map(param => {
            const optimizedParam = bestResult.parameters.find(p => p.name === param.name);
            return optimizedParam ? { ...param, value: optimizedParam.value } : param;
          })
        };
        
        // Notify parent component
        if (onOptimizationComplete) {
          onOptimizationComplete(optimizedStrategy);
        }
      }
    } catch (err) {
      console.error('Error running optimization:', err);
      setError('Failed to run optimization. Please try again later.');
      setLoading(false);
    }
  };
  
  // Render component UI
  // ...
};

export default StrategyOptimizationPanel;
```

## 2. Update OptimizationService.ts

```typescript
import axios from 'axios';
import { 
  OptimizationConfig, 
  OptimizationResult,
  Strategy
} from '../../types/backtesting';

class OptimizationService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = '/api/backtesting/optimization';
  }
  
  /**
   * Optimize a strategy based on the provided configuration
   * @param config The optimization configuration
   * @returns Array of optimization results sorted by performance
   */
  async optimizeStrategy(config: OptimizationConfig): Promise<OptimizationResult[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/optimize`, config);
      return response.data;
    } catch (error) {
      console.error('Error optimizing strategy:', error);
      throw new Error('Failed to optimize strategy');
    }
  }
  
  /**
   * Get optimization results for a specific strategy
   * @param strategyId The ID of the strategy
   * @returns Array of optimization results
   */
  async getOptimizationResults(strategyId: string): Promise<OptimizationResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/results/${strategyId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting optimization results:', error);
      throw new Error('Failed to get optimization results');
    }
  }
  
  /**
   * Apply optimization result to create a new optimized strategy
   * @param strategyId The ID of the original strategy
   * @param optimizationResultId The ID of the optimization result to apply
   * @returns The optimized strategy
   */
  async applyOptimizationResult(strategyId: string, optimizationResultId: string): Promise<Strategy> {
    try {
      const response = await axios.post(`${this.baseUrl}/apply`, {
        strategyId,
        optimizationResultId
      });
      return response.data;
    } catch (error) {
      console.error('Error applying optimization result:', error);
      throw new Error('Failed to apply optimization result');
    }
  }
  
  /**
   * Get available optimization metrics
   * @returns Array of available optimization metrics
   */
  async getOptimizationMetrics(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error getting optimization metrics:', error);
      throw new Error('Failed to get optimization metrics');
    }
  }
}

export default OptimizationService;
```

## 3. Error Handling and Loading States

```typescript
// In StrategyOptimizationPanel.tsx

// Example of how to handle loading states and errors
const renderContent = () => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }
  
  if (!strategy) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1">
          No strategy selected. Please select a strategy to optimize.
        </Typography>
      </Box>
    );
  }
  
  return (
    // Render optimization UI
    // ...
  );
};
```

## 4. Testing the Integration

```typescript
// Example test for the integration between StrategyOptimizationPanel and OptimizationService

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StrategyOptimizationPanel from './StrategyOptimizationPanel';
import OptimizationService from '../../services/backtesting/optimizationService';

// Mock the optimization service
jest.mock('../../services/backtesting/optimizationService');

describe('StrategyOptimizationPanel', () => {
  const mockStrategy = {
    id: 'strategy-1',
    name: 'Test Strategy',
    description: 'A test strategy',
    parameters: [
      { name: 'period', value: 14, type: 'number' },
      { name: 'threshold', value: 0.5, type: 'number' }
    ],
    rules: []
  };
  
  const mockOptimizationResults = [
    {
      id: 'opt-result-1',
      strategyId: 'strategy-1',
      parameters: [
        { name: 'period', value: 10 },
        { name: 'threshold', value: 0.7 }
      ],
      performance: {
        sharpeRatio: 1.5,
        totalReturn: 25.5,
        maxDrawdown: 10.2
      }
    }
  ];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock implementation
    (OptimizationService.prototype.optimizeStrategy as jest.Mock).mockResolvedValue(mockOptimizationResults);
  });
  
  test('initializes optimization config when strategy is provided', () => {
    render(<StrategyOptimizationPanel strategy={mockStrategy} />);
    
    // Check that parameter ranges are displayed
    expect(screen.getByText('period')).toBeInTheDocument();
    expect(screen.getByText('threshold')).toBeInTheDocument();
  });
  
  test('runs optimization when button is clicked', async () => {
    const onOptimizationComplete = jest.fn();
    
    render(
      <StrategyOptimizationPanel 
        strategy={mockStrategy} 
        onOptimizationComplete={onOptimizationComplete} 
      />
    );
    
    // Click the run optimization button
    fireEvent.click(screen.getByText('Run Optimization'));
    
    // Check that loading state is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for optimization to complete
    await waitFor(() => {
      expect(OptimizationService.prototype.optimizeStrategy).toHaveBeenCalled();
    });
    
    // Check that results are displayed
    expect(screen.getByText('Optimization Results')).toBeInTheDocument();
    
    // Check that onOptimizationComplete was called with the optimized strategy
    expect(onOptimizationComplete).toHaveBeenCalled();
    const optimizedStrategy = onOptimizationComplete.mock.calls[0][0];
    expect(optimizedStrategy.name).toBe('Test Strategy (Optimized)');
    expect(optimizedStrategy.parameters[0].value).toBe(10); // Optimized value
  });
  
  test('displays error when optimization fails', async () => {
    // Mock error
    (OptimizationService.prototype.optimizeStrategy as jest.Mock).mockRejectedValue(new Error('Optimization failed'));
    
    render(<StrategyOptimizationPanel strategy={mockStrategy} />);
    
    // Click the run optimization button
    fireEvent.click(screen.getByText('Run Optimization'));
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to run optimization. Please try again later.')).toBeInTheDocument();
    });
  });
});
```

This example demonstrates how to connect the StrategyOptimizationPanel frontend component to the OptimizationService backend service, including:

1. Initializing the optimization configuration based on the strategy
2. Handling user interactions to update the configuration
3. Calling the backend service to run the optimization
4. Processing and displaying the results
5. Handling loading states and errors
6. Testing the integration between the component and service