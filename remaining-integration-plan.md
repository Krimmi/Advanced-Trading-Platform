# Remaining Integration Plan for Backtesting & Simulation Engine

## 1. BacktestComparisonPanel Integration

### Implementation Steps
1. Update import statement to use centralized services:
   ```typescript
   import { BacktestingService } from '../../services';
   ```

2. Implement required service methods in backtestingServiceExtensions.ts:
   - `getBacktestEquityCurve`: Retrieve equity curve data for comparison
   - `getBacktestDrawdownCurve`: Retrieve drawdown curve data for comparison
   - `getBacktestMonthlyReturns`: Retrieve monthly returns data for comparison
   - `getBacktestTradeStatistics`: Retrieve trade statistics for comparison

3. Update component to use these methods:
   ```typescript
   const fetchComparisonData = async () => {
     try {
       setLoading(true);
       setError(null);
       
       // For equity curve comparison
       if (selectedMetric === 'equityCurve') {
         const equityCurves = await Promise.all(
           selectedResults.map(result => 
             backtestingService.getBacktestEquityCurve(result.id)
           )
         );
         
         setComparisonData({
           type: 'equityCurve',
           data: equityCurves,
           results: selectedResults
         });
       }
       // Similar implementations for other metrics...
     } catch (err) {
       console.error('Error fetching comparison data:', err);
       setError('Failed to load comparison data. Please try again later.');
     } finally {
       setLoading(false);
     }
   };
   ```

4. Create unit tests for BacktestComparisonPanel in `__tests__/BacktestComparisonPanel.test.tsx`

## 2. SimulationControlPanel Integration

### Implementation Steps
1. Update import statement to use centralized services:
   ```typescript
   import { MarketSimulationService, BacktestingService } from '../../services';
   ```

2. Implement required service methods in marketSimulationServiceExtensions.ts:
   - `createSimulation`: Create a new market simulation
   - `getSimulationScenarios`: Get available simulation scenarios
   - `getSimulationProgress`: Track simulation progress
   - `cancelSimulation`: Cancel an ongoing simulation

3. Update component to use these methods:
   ```typescript
   const handleRunSimulation = async () => {
     if (!simulationConfig || !selectedBacktest) return;
     
     try {
       setLoading(true);
       setError(null);
       setIsSimulationRunning(true);
       
       // Create and run the simulation
       const simulationId = await marketSimulationService.createSimulation({
         backtestId: selectedBacktest.id,
         scenarioType: simulationConfig.scenarioType,
         parameters: simulationConfig.parameters,
         duration: simulationConfig.duration
       });
       
       // Poll for progress
       const progressInterval = setInterval(async () => {
         try {
           const progress = await marketSimulationService.getSimulationProgress(simulationId);
           setSimulationProgress(progress);
           
           if (progress >= 100) {
             clearInterval(progressInterval);
             
             // Get the final result
             const result = await marketSimulationService.getSimulationResult(simulationId);
             setSimulationResult(result);
             setIsSimulationRunning(false);
             setLoading(false);
           }
         } catch (err) {
           console.error('Error checking simulation progress:', err);
           clearInterval(progressInterval);
           setIsSimulationRunning(false);
           setLoading(false);
           setError('Failed to check simulation progress. Please try again later.');
         }
       }, 2000);
     } catch (err) {
       console.error('Error running simulation:', err);
       setError('Failed to run simulation. Please try again later.');
       setIsSimulationRunning(false);
       setLoading(false);
     }
   };
   ```

4. Create unit tests for SimulationControlPanel in `__tests__/SimulationControlPanel.test.tsx`

## 3. TradeListComponent Integration

### Implementation Steps
1. Update import statement to use centralized services:
   ```typescript
   import { BacktestingService } from '../../services';
   ```

2. Implement required service methods in backtestingServiceExtensions.ts:
   - `getBacktestTrades`: Retrieve trades for a backtest with filtering options
   - `getTradeDetails`: Get detailed information about a specific trade

3. Update component to use these methods:
   ```typescript
   const fetchTrades = async () => {
     if (!backtestResult) return;
     
     try {
       setLoading(true);
       setError(null);
       
       // Get trades with optional filters
       const trades = await backtestingService.getBacktestTrades(
         backtestResult.id,
         {
           symbol: filters.symbol || undefined,
           direction: filters.direction !== 'all' ? filters.direction : undefined,
           result: filters.result !== 'all' ? filters.result : undefined,
           dateRange: filters.dateRange[0] && filters.dateRange[1] ? filters.dateRange : undefined
         }
       );
       
       setTrades(trades);
       setFilteredTrades(trades);
       setLoading(false);
     } catch (err) {
       console.error('Error fetching trades:', err);
       setError('Failed to load trades. Please try again later.');
       setLoading(false);
     }
   };
   ```

4. Create unit tests for TradeListComponent in `__tests__/TradeListComponent.test.tsx`

## 4. Integration Testing

### Implementation Steps
1. Create an integration test file for the complete workflow:
   ```typescript
   // src/components/backtesting/__tests__/BacktestingIntegration.test.tsx
   
   import React from 'react';
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { ThemeProvider, createTheme } from '@mui/material/styles';
   import BacktestingDashboard from '../BacktestingDashboard';
   import { BacktestingService, StrategyExecutionService } from '../../../services';
   
   // Mock the services
   jest.mock('../../../services', () => ({
     BacktestingService: jest.fn().mockImplementation(() => ({
       // Mock implementation of all required methods
     })),
     StrategyExecutionService: jest.fn().mockImplementation(() => ({
       // Mock implementation of all required methods
     })),
     // Other services...
   }));
   
   describe('Backtesting Integration', () => {
     // Test the complete workflow from strategy creation to backtest comparison
     test('complete backtesting workflow', async () => {
       // Implementation...
     });
   });
   ```

2. Test the following workflows:
   - Strategy creation → Backtest configuration → Backtest execution → Results analysis
   - Backtest history → Backtest comparison
   - Backtest results → Simulation → Simulation results
   - Strategy → Optimization → Optimized strategy → Backtest

## 5. Performance Optimization

### Implementation Steps
1. Implement virtualization for large data tables:
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   // In TradeListComponent
   const renderVirtualizedTable = () => {
     return (
       <FixedSizeList
         height={400}
         width="100%"
         itemCount={filteredTrades.length}
         itemSize={53} // Height of each row
         overscanCount={5}
       >
         {({ index, style }) => {
           const trade = filteredTrades[index];
           return (
             <TableRow style={style} hover key={trade.id}>
               {/* Row content */}
             </TableRow>
           );
         }}
       </FixedSizeList>
     );
   };
   ```

2. Implement lazy loading for historical data:
   ```typescript
   // In BacktestHistoryPanel
   const loadMoreResults = async () => {
     if (loading || !hasMore) return;
     
     try {
       setLoading(true);
       const nextPage = page + 1;
       const moreResults = await backtestingService.getBacktestResults({
         page: nextPage,
         pageSize: rowsPerPage,
         // Other filters...
       });
       
       if (moreResults.length === 0) {
         setHasMore(false);
       } else {
         setBacktestResults([...backtestResults, ...moreResults]);
         setPage(nextPage);
       }
       setLoading(false);
     } catch (err) {
       console.error('Error loading more results:', err);
       setError('Failed to load more results. Please try again later.');
       setLoading(false);
     }
   };
   ```

3. Implement memoization for expensive calculations:
   ```typescript
   // In PerformanceResultsPanel
   const performanceMetrics = useMemo(() => {
     if (!backtestResult) return null;
     return calculatePerformanceMetrics(backtestResult);
   }, [backtestResult]);
   ```

4. Implement data caching:
   ```typescript
   // In backtestingService
   const equityCurveCache = new Map<string, EquityCurvePoint[]>();
   
   BacktestingService.prototype.getBacktestEquityCurve = async function(
     backtestId: string
   ): Promise<EquityCurvePoint[]> {
     // Check cache first
     if (equityCurveCache.has(backtestId)) {
       return equityCurveCache.get(backtestId)!;
     }
     
     try {
       const response = await axios.get(`${this.apiUrl}/api/backtesting/results/${backtestId}/equity-curve`);
       const data = response.data;
       
       // Cache the result
       equityCurveCache.set(backtestId, data);
       
       return data;
     } catch (error) {
       console.error(`Error getting equity curve for backtest ID ${backtestId}:`, error);
       throw error;
     }
   };
   ```

## 6. Documentation

### Implementation Steps
1. Create component API documentation:
   ```typescript
   /**
    * BacktestComparisonPanel Component
    * 
    * Allows users to compare multiple backtest results side by side.
    * 
    * @component
    * @example
    * ```tsx
    * <BacktestComparisonPanel
    *   selectedResults={selectedBacktestResults}
    *   backtestResults={backtestResults}
    *   onResultsSelected={handleBacktestResultsSelect}
    * />
    * ```
    */
   ```

2. Create service method documentation:
   ```typescript
   /**
    * Get backtest equity curve
    * 
    * Retrieves the equity curve data for a specific backtest.
    * 
    * @param backtestId - The ID of the backtest
    * @returns Promise resolving to an array of equity curve points
    * 
    * @example
    * ```typescript
    * const equityCurve = await backtestingService.getBacktestEquityCurve('backtest-123');
    * ```
    */
   ```

3. Create usage examples for common workflows:
   ```typescript
   /**
    * Example: Running a backtest and analyzing results
    * 
    * ```typescript
    * // Create backtest configuration
    * const config = {
    *   strategyId: 'strategy-123',
    *   startDate: '2020-01-01',
    *   endDate: '2021-01-01',
    *   initialCapital: 100000,
    *   commission: 0.001,
    *   slippage: 0.001
    * };
    * 
    * // Execute backtest
    * const backtestResult = await backtestingService.executeBacktest(config);
    * 
    * // Get equity curve
    * const equityCurve = await backtestingService.getBacktestEquityCurve(backtestResult.id);
    * 
    * // Get trades
    * const trades = await backtestingService.getBacktestTrades(backtestResult.id);
    * ```
    */
   ```

4. Update README.md with component and service documentation