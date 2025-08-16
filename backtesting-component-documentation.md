# Backtesting & Simulation Engine: Component Documentation

## Frontend Components

### 1. BacktestingDashboard.tsx

#### Purpose
The main container component that orchestrates the backtesting workflow and manages navigation between different functional areas.

#### Props
```typescript
interface BacktestingDashboardProps {
  // No props required as this is the top-level component
}
```

#### State
```typescript
// Key state variables
const [tabValue, setTabValue] = useState(0);
const [strategies, setStrategies] = useState<Strategy[]>([]);
const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
const [selectedBacktestResult, setSelectedBacktestResult] = useState<BacktestResult | null>(null);
const [selectedBacktestResults, setSelectedBacktestResults] = useState<BacktestResult[]>([]);
const [isCreatingStrategy, setIsCreatingStrategy] = useState<boolean>(false);
const [isCreatingBacktest, setIsCreatingBacktest] = useState<boolean>(false);
```

#### Key Methods
- `handleTabChange`: Manages tab navigation
- `handleStrategySelect`: Updates selected strategy
- `handleBacktestResultSelect`: Updates selected backtest result
- `handleBacktestResultsSelect`: Updates selected backtest results for comparison
- `handleCreateStrategy`: Initiates strategy creation mode
- `handleCreateBacktest`: Initiates backtest creation mode
- `handleStrategyCreated`: Handles new strategy creation
- `handleBacktestCreated`: Handles new backtest creation
- `handleRefresh`: Refreshes strategies and backtest results

#### Usage Example
```tsx
// In App.tsx or a route component
import BacktestingDashboard from './components/backtesting/BacktestingDashboard';

function BacktestingPage() {
  return <BacktestingDashboard />;
}
```

### 2. StrategyBuilder.tsx

#### Purpose
Provides an interface for creating and editing trading strategies with customizable parameters and rules.

#### Props
```typescript
interface StrategyBuilderProps {
  strategy: Strategy | null;
  isCreating: boolean;
  strategies: Strategy[];
  onStrategyCreated: (strategy: Strategy) => void;
  onStrategySelected: (strategy: Strategy) => void;
  onCreateNew: () => void;
}
```

#### State
```typescript
// Key state variables
const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
const [strategyName, setStrategyName] = useState<string>('');
const [strategyDescription, setStrategyDescription] = useState<string>('');
const [parameters, setParameters] = useState<StrategyParameter[]>([]);
const [rules, setRules] = useState<StrategyRule[]>([]);
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### Key Methods
- `initializeStrategy`: Sets up the component with a strategy
- `handleStrategySelect`: Handles selection from existing strategies
- `handleParameterChange`: Updates strategy parameter values
- `handleAddParameter`: Adds a new parameter to the strategy
- `handleRemoveParameter`: Removes a parameter from the strategy
- `handleAddRule`: Adds a new rule to the strategy
- `handleRemoveRule`: Removes a rule from the strategy
- `handleSaveStrategy`: Validates and saves the strategy
- `validateStrategy`: Performs validation on the strategy configuration

#### Usage Example
```tsx
<StrategyBuilder
  strategy={selectedStrategy}
  isCreating={isCreatingStrategy}
  strategies={strategies}
  onStrategyCreated={handleStrategyCreated}
  onStrategySelected={handleStrategySelect}
  onCreateNew={handleCreateStrategy}
/>
```

### 3. BacktestConfigPanel.tsx

#### Purpose
Provides an interface for configuring backtest parameters such as date range, initial capital, and trading costs.

#### Props
```typescript
interface BacktestConfigPanelProps {
  strategy: Strategy | null;
  isCreating: boolean;
  strategies: Strategy[];
  onBacktestCreated: (result: BacktestResult) => void;
  onStrategySelected: (strategy: Strategy) => void;
}
```

#### State
```typescript
// Key state variables
const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
  strategyId: '',
  startDate: '',
  endDate: '',
  initialCapital: 100000,
  commission: 0.001,
  slippage: 0.001
});
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### Key Methods
- `handleStrategySelect`: Updates the selected strategy
- `handleDateRangeChange`: Updates the backtest date range
- `handleInitialCapitalChange`: Updates the initial capital
- `handleCommissionChange`: Updates the commission rate
- `handleSlippageChange`: Updates the slippage rate
- `handleRunBacktest`: Validates and runs the backtest
- `validateConfig`: Performs validation on the backtest configuration

#### Usage Example
```tsx
<BacktestConfigPanel
  strategy={selectedStrategy}
  isCreating={isCreatingBacktest}
  strategies={strategies}
  onBacktestCreated={handleBacktestCreated}
  onStrategySelected={handleStrategySelect}
/>
```

### 4. PerformanceResultsPanel.tsx

#### Purpose
Displays the performance results of a backtest, including equity curve, drawdown, and performance metrics.

#### Props
```typescript
interface PerformanceResultsPanelProps {
  backtestResult: BacktestResult | null;
  backtestResults: BacktestResult[];
  onBacktestSelected: (result: BacktestResult) => void;
}
```

#### State
```typescript
// Key state variables
const [activeTab, setActiveTab] = useState<number>(0);
const [equityCurve, setEquityCurve] = useState<EquityCurvePoint[]>([]);
const [drawdownCurve, setDrawdownCurve] = useState<DrawdownPoint[]>([]);
const [monthlyReturns, setMonthlyReturns] = useState<MonthlyReturn[]>([]);
```

#### Key Methods
- `fetchBacktestData`: Retrieves detailed backtest data
- `handleBacktestSelect`: Updates the selected backtest
- `handleTabChange`: Manages tab navigation
- `renderEquityCurveChart`: Renders the equity curve chart
- `renderDrawdownChart`: Renders the drawdown chart
- `renderMonthlyReturnsHeatmap`: Renders the monthly returns heatmap
- `renderPerformanceMetricsTable`: Renders the performance metrics table

#### Usage Example
```tsx
<PerformanceResultsPanel
  backtestResult={selectedBacktestResult}
  backtestResults={backtestResults}
  onBacktestSelected={handleBacktestResultSelect}
/>
```

### 5. SimulationControlPanel.tsx

#### Purpose
Provides controls for running market simulations with different scenarios and parameters.

#### Props
```typescript
interface SimulationControlPanelProps {
  backtestResult: BacktestResult | null;
  backtestResults: BacktestResult[];
  onBacktestSelected: (result: BacktestResult) => void;
}
```

#### State
```typescript
// Key state variables
const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
  backtestId: '',
  scenarioType: 'marketCrash',
  parameters: {},
  duration: 30
});
const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
```

#### Key Methods
- `handleBacktestSelect`: Updates the selected backtest
- `handleScenarioTypeChange`: Updates the simulation scenario type
- `handleParameterChange`: Updates simulation parameters
- `handleDurationChange`: Updates the simulation duration
- `handleRunSimulation`: Validates and runs the simulation
- `renderSimulationControls`: Renders the simulation control inputs
- `renderSimulationResults`: Renders the simulation results

#### Usage Example
```tsx
<SimulationControlPanel
  backtestResult={selectedBacktestResult}
  backtestResults={backtestResults}
  onBacktestSelected={handleBacktestResultSelect}
/>
```

### 6. StrategyOptimizationPanel.tsx

#### Purpose
Provides an interface for optimizing strategy parameters to improve performance.

#### Props
```typescript
interface StrategyOptimizationPanelProps {
  strategy: Strategy | null;
  onOptimizationComplete?: (optimizedStrategy: Strategy) => void;
}
```

#### State
```typescript
// Key state variables
const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig | null>(null);
const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[] | null>(null);
const [parameterRanges, setParameterRanges] = useState<ParameterRange[]>([]);
const [optimizationMetric, setOptimizationMetric] = useState<string>('sharpeRatio');
```

#### Key Methods
- `initializeOptimizationConfig`: Sets up the optimization configuration
- `handleParameterRangeChange`: Updates parameter optimization ranges
- `handleOptimizationMetricChange`: Updates the optimization target metric
- `handleDateRangeChange`: Updates the optimization date range
- `handleRunOptimization`: Validates and runs the optimization
- `renderParameterRanges`: Renders the parameter range inputs
- `renderOptimizationResults`: Renders the optimization results

#### Usage Example
```tsx
<StrategyOptimizationPanel
  strategy={selectedStrategy}
  onOptimizationComplete={handleOptimizedStrategyCreated}
/>
```

### 7. TradeListComponent.tsx

#### Purpose
Displays a list of trades from a backtest with filtering and sorting capabilities.

#### Props
```typescript
interface TradeListComponentProps {
  backtestResult: BacktestResult | null;
  onTradeSelected?: (trade: Trade) => void;
}
```

#### State
```typescript
// Key state variables
const [trades, setTrades] = useState<Trade[]>([]);
const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
const [filters, setFilters] = useState<TradeFilters>({
  symbol: '',
  direction: 'all',
  result: 'all',
  dateRange: [null, null]
});
const [sortConfig, setSortConfig] = useState<SortConfig>({
  key: 'entryDate',
  direction: 'desc'
});
const [page, setPage] = useState<number>(0);
const [rowsPerPage, setRowsPerPage] = useState<number>(10);
```

#### Key Methods
- `fetchTrades`: Retrieves trades for the selected backtest
- `handleFilterChange`: Updates trade filters
- `handleSortChange`: Updates trade sorting
- `handlePageChange`: Updates the current page
- `handleRowsPerPageChange`: Updates rows per page
- `applyFilters`: Applies filters to the trade list
- `applySorting`: Applies sorting to the trade list
- `renderTradeTable`: Renders the trade table
- `renderFilterControls`: Renders the filter controls

#### Usage Example
```tsx
<TradeListComponent
  backtestResult={selectedBacktestResult}
  onTradeSelected={handleTradeSelect}
/>
```

### 8. BacktestHistoryPanel.tsx

#### Purpose
Displays a history of backtests with filtering and sorting capabilities.

#### Props
```typescript
interface BacktestHistoryPanelProps {
  backtestResults: BacktestResult[];
  onBacktestSelected: (result: BacktestResult) => void;
  onRefresh: () => void;
}
```

#### State
```typescript
// Key state variables
const [filteredResults, setFilteredResults] = useState<BacktestResult[]>([]);
const [filters, setFilters] = useState<BacktestFilters>({
  strategyId: '',
  dateRange: [null, null],
  performanceRange: [null, null]
});
const [sortConfig, setSortConfig] = useState<SortConfig>({
  key: 'endDate',
  direction: 'desc'
});
```

#### Key Methods
- `handleFilterChange`: Updates backtest filters
- `handleSortChange`: Updates backtest sorting
- `handleBacktestSelect`: Handles backtest selection
- `handleDeleteBacktest`: Handles backtest deletion
- `applyFilters`: Applies filters to the backtest list
- `applySorting`: Applies sorting to the backtest list
- `renderBacktestTable`: Renders the backtest table
- `renderFilterControls`: Renders the filter controls

#### Usage Example
```tsx
<BacktestHistoryPanel
  backtestResults={backtestResults}
  onBacktestSelected={handleBacktestResultSelect}
  onRefresh={handleRefresh}
/>
```

### 9. BacktestComparisonPanel.tsx

#### Purpose
Provides an interface for comparing multiple backtest results side by side.

#### Props
```typescript
interface BacktestComparisonPanelProps {
  selectedResults: BacktestResult[];
  backtestResults: BacktestResult[];
  onResultsSelected: (results: BacktestResult[]) => void;
}
```

#### State
```typescript
// Key state variables
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [availableResults, setAvailableResults] = useState<BacktestResult[]>([]);
const [selectedMetric, setSelectedMetric] = useState<string>('equityCurve');
const [comparisonData, setComparisonData] = useState<any>(null);
```

#### Key Methods
- `fetchComparisonData`: Retrieves data for comparison
- `handleAddBacktest`: Adds a backtest to the comparison
- `handleRemoveBacktest`: Removes a backtest from the comparison
- `handleMetricChange`: Updates the comparison metric
- `renderEquityCurveChart`: Renders the equity curve comparison chart
- `renderDrawdownChart`: Renders the drawdown comparison chart
- `renderMonthlyReturnsChart`: Renders the monthly returns comparison chart
- `renderPerformanceMetricsChart`: Renders the performance metrics comparison chart
- `renderMetricsTable`: Renders the metrics comparison table

#### Usage Example
```tsx
<BacktestComparisonPanel
  selectedResults={selectedBacktestResults}
  backtestResults={backtestResults}
  onResultsSelected={handleBacktestResultsSelect}
/>
```

## Backend Services

### 1. backtestingService.ts

#### Purpose
Provides core functionality for creating and managing backtests.

#### Methods
- `createBacktest(config: BacktestConfig): Promise<BacktestResult>`
  - Creates a new backtest with the specified configuration
  - Returns the backtest result with performance metrics

- `getBacktestResults(): Promise<BacktestResult[]>`
  - Retrieves all backtest results
  - Returns an array of backtest results

- `getBacktestById(id: string): Promise<BacktestResult>`
  - Retrieves a specific backtest by ID
  - Returns the backtest result

- `getBacktestEquityCurve(id: string): Promise<EquityCurvePoint[]>`
  - Retrieves the equity curve for a specific backtest
  - Returns an array of equity curve points

- `getBacktestDrawdownCurve(id: string): Promise<DrawdownPoint[]>`
  - Retrieves the drawdown curve for a specific backtest
  - Returns an array of drawdown points

- `getBacktestMonthlyReturns(id: string): Promise<MonthlyReturn[]>`
  - Retrieves the monthly returns for a specific backtest
  - Returns an array of monthly return objects

- `getBacktestTradeStatistics(id: string): Promise<TradeStatistics>`
  - Retrieves trade statistics for a specific backtest
  - Returns trade statistics object

- `getBacktestTrades(id: string): Promise<Trade[]>`
  - Retrieves all trades for a specific backtest
  - Returns an array of trade objects

- `deleteBacktest(id: string): Promise<boolean>`
  - Deletes a specific backtest
  - Returns true if successful

#### Usage Example
```typescript
const backtestingService = new BacktestingService();

// Create a new backtest
const config: BacktestConfig = {
  strategyId: 'strategy-1',
  startDate: '2020-01-01',
  endDate: '2021-01-01',
  initialCapital: 100000,
  commission: 0.001,
  slippage: 0.001
};

const result = await backtestingService.createBacktest(config);

// Get equity curve for a backtest
const equityCurve = await backtestingService.getBacktestEquityCurve(result.id);
```

### 2. strategyExecutionService.ts

#### Purpose
Manages strategy creation, execution, and management.

#### Methods
- `createStrategy(strategy: Strategy): Promise<Strategy>`
  - Creates a new trading strategy
  - Returns the created strategy with ID

- `getStrategies(): Promise<Strategy[]>`
  - Retrieves all available strategies
  - Returns an array of strategies

- `getStrategyById(id: string): Promise<Strategy>`
  - Retrieves a specific strategy by ID
  - Returns the strategy

- `updateStrategy(strategy: Strategy): Promise<Strategy>`
  - Updates an existing strategy
  - Returns the updated strategy

- `deleteStrategy(id: string): Promise<boolean>`
  - Deletes a specific strategy
  - Returns true if successful

- `executeStrategy(strategyId: string, data: MarketData): Promise<TradeSignal[]>`
  - Executes a strategy against market data
  - Returns an array of trade signals

#### Usage Example
```typescript
const strategyService = new StrategyExecutionService();

// Create a new strategy
const strategy: Strategy = {
  name: 'Moving Average Crossover',
  description: 'Simple moving average crossover strategy',
  parameters: [
    { name: 'shortPeriod', value: 10, type: 'number' },
    { name: 'longPeriod', value: 50, type: 'number' }
  ],
  rules: [
    {
      type: 'entry',
      direction: 'long',
      conditions: [
        { indicator: 'sma', parameter: 'shortPeriod', operator: '>', valueType: 'indicator', value: 'sma', valueParameter: 'longPeriod' }
      ]
    },
    {
      type: 'exit',
      direction: 'long',
      conditions: [
        { indicator: 'sma', parameter: 'shortPeriod', operator: '<', valueType: 'indicator', value: 'sma', valueParameter: 'longPeriod' }
      ]
    }
  ]
};

const createdStrategy = await strategyService.createStrategy(strategy);
```

### 3. marketSimulationService.ts

#### Purpose
Provides functionality for simulating different market conditions and scenarios.

#### Methods
- `createSimulation(config: SimulationConfig): Promise<SimulationResult>`
  - Creates a new market simulation with the specified configuration
  - Returns the simulation result

- `getSimulationResults(): Promise<SimulationResult[]>`
  - Retrieves all simulation results
  - Returns an array of simulation results

- `getSimulationById(id: string): Promise<SimulationResult>`
  - Retrieves a specific simulation by ID
  - Returns the simulation result

- `runSimulationScenario(backtestId: string, scenario: SimulationScenario): Promise<SimulationResult>`
  - Runs a specific simulation scenario on a backtest
  - Returns the simulation result

- `getMarketConditions(): Promise<MarketCondition[]>`
  - Retrieves available market conditions for simulation
  - Returns an array of market conditions

#### Usage Example
```typescript
const simulationService = new MarketSimulationService();

// Create a new simulation
const config: SimulationConfig = {
  backtestId: 'backtest-1',
  scenarioType: 'marketCrash',
  parameters: {
    crashSeverity: 0.3,
    recoverySpeed: 0.1
  },
  duration: 30
};

const result = await simulationService.createSimulation(config);
```

### 4. performanceAnalyticsService.ts

#### Purpose
Provides analytics and performance metrics for backtests and simulations.

#### Methods
- `calculatePerformanceMetrics(trades: Trade[], initialCapital: number): Promise<PerformanceMetrics>`
  - Calculates performance metrics from a set of trades
  - Returns performance metrics object

- `calculateDrawdown(equityCurve: EquityCurvePoint[]): Promise<DrawdownPoint[]>`
  - Calculates drawdown from an equity curve
  - Returns an array of drawdown points

- `calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): Promise<number>`
  - Calculates the Sharpe ratio from a series of returns
  - Returns the Sharpe ratio

- `calculateSortinoRatio(returns: number[], riskFreeRate: number = 0): Promise<number>`
  - Calculates the Sortino ratio from a series of returns
  - Returns the Sortino ratio

- `calculateMonthlyReturns(trades: Trade[], initialCapital: number): Promise<MonthlyReturn[]>`
  - Calculates monthly returns from a set of trades
  - Returns an array of monthly return objects

- `calculateWinRate(trades: Trade[]): Promise<number>`
  - Calculates the win rate from a set of trades
  - Returns the win rate as a percentage

- `calculateProfitFactor(trades: Trade[]): Promise<number>`
  - Calculates the profit factor from a set of trades
  - Returns the profit factor

#### Usage Example
```typescript
const analyticsService = new PerformanceAnalyticsService();

// Calculate performance metrics
const metrics = await analyticsService.calculatePerformanceMetrics(trades, 100000);

// Calculate drawdown
const drawdown = await analyticsService.calculateDrawdown(equityCurve);
```

### 5. optimizationService.ts

#### Purpose
Provides functionality for optimizing strategy parameters.

#### Methods
- `optimizeStrategy(config: OptimizationConfig): Promise<OptimizationResult[]>`
  - Optimizes strategy parameters based on the configuration
  - Returns an array of optimization results

- `getOptimizationResults(strategyId: string): Promise<OptimizationResult[]>`
  - Retrieves optimization results for a specific strategy
  - Returns an array of optimization results

- `applyOptimizationResult(strategyId: string, optimizationResultId: string): Promise<Strategy>`
  - Applies an optimization result to create a new optimized strategy
  - Returns the optimized strategy

- `getOptimizationMetrics(): Promise<string[]>`
  - Retrieves available optimization metrics
  - Returns an array of metric names

#### Usage Example
```typescript
const optimizationService = new OptimizationService();

// Optimize a strategy
const config: OptimizationConfig = {
  strategyId: 'strategy-1',
  parameterRanges: [
    { name: 'shortPeriod', min: 5, max: 20, step: 1 },
    { name: 'longPeriod', min: 30, max: 100, step: 5 }
  ],
  optimizationMetric: 'sharpeRatio',
  startDate: '2020-01-01',
  endDate: '2021-01-01',
  maxIterations: 100
};

const results = await optimizationService.optimizeStrategy(config);
```

### 6. dataProviderService.ts

#### Purpose
Provides historical market data for backtesting and simulation.

#### Methods
- `getHistoricalData(symbol: string, startDate: string, endDate: string, timeframe: string): Promise<MarketData[]>`
  - Retrieves historical market data for a specific symbol and time range
  - Returns an array of market data points

- `getAvailableSymbols(): Promise<string[]>`
  - Retrieves available symbols for backtesting
  - Returns an array of symbol strings

- `getAvailableTimeframes(): Promise<string[]>`
  - Retrieves available timeframes for backtesting
  - Returns an array of timeframe strings

- `getMarketEvents(symbol: string, startDate: string, endDate: string): Promise<MarketEvent[]>`
  - Retrieves market events (earnings, dividends, etc.) for a specific symbol and time range
  - Returns an array of market events

#### Usage Example
```typescript
const dataProviderService = new DataProviderService();

// Get historical data
const data = await dataProviderService.getHistoricalData(
  'AAPL',
  '2020-01-01',
  '2021-01-01',
  'daily'
);

// Get available symbols
const symbols = await dataProviderService.getAvailableSymbols();
```

## Type Definitions

### 1. backtestingTypes.ts

```typescript
// Backtest Configuration
interface BacktestConfig {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  symbols?: string[];
  timeframe?: string;
}

// Backtest Result
interface BacktestResult {
  id: string;
  configId: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  performanceMetrics: PerformanceMetrics;
  createdAt: string;
}

// Trade
interface Trade {
  id: string;
  backtestId: string;
  symbol: string;
  direction: 'long' | 'short';
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  quantity: number;
  profit: number;
  profitPercentage: number;
  holdingPeriod: number;
}

// Performance Metrics
interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  recoveryFactor: number;
  payoffRatio: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

// Equity Curve Point
interface EquityCurvePoint {
  date: string;
  equity: number;
  return: number;
  drawdown: number;
}

// Drawdown Point
interface DrawdownPoint {
  date: string;
  equity: number;
  drawdown: number;
  drawdownPercentage: number;
}

// Monthly Return
interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

// Trade Statistics
interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}
```

### 2. strategyTypes.ts

```typescript
// Strategy
interface Strategy {
  id?: string;
  name: string;
  description: string;
  parameters: StrategyParameter[];
  rules: StrategyRule[];
}

// Strategy Parameter
interface StrategyParameter {
  name: string;
  value: number | string | boolean;
  type: 'number' | 'string' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// Strategy Rule
interface StrategyRule {
  id?: string;
  type: 'entry' | 'exit' | 'risk';
  direction: 'long' | 'short' | 'both';
  conditions: RuleCondition[];
}

// Rule Condition
interface RuleCondition {
  indicator: string;
  parameter?: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  valueType: 'number' | 'indicator' | 'parameter';
  value: string | number;
  valueParameter?: string;
}

// Optimization Configuration
interface OptimizationConfig {
  strategyId: string;
  parameterRanges: ParameterRange[];
  optimizationMetric: string;
  startDate: string;
  endDate: string;
  maxIterations?: number;
}

// Parameter Range
interface ParameterRange {
  name: string;
  min: number;
  max: number;
  step: number;
}

// Optimization Result
interface OptimizationResult {
  id: string;
  strategyId: string;
  parameters: OptimizedParameter[];
  performance: {
    sharpeRatio: number;
    totalReturn: number;
    maxDrawdown: number;
    [key: string]: number;
  };
  rank: number;
}

// Optimized Parameter
interface OptimizedParameter {
  name: string;
  value: number | string | boolean;
}

// Trade Signal
interface TradeSignal {
  symbol: string;
  direction: 'long' | 'short';
  action: 'enter' | 'exit';
  price: number;
  quantity: number;
  date: string;
  ruleId: string;
}
```

### 3. simulationTypes.ts

```typescript
// Simulation Configuration
interface SimulationConfig {
  backtestId: string;
  scenarioType: string;
  parameters: Record<string, any>;
  duration: number;
}

// Simulation Result
interface SimulationResult {
  id: string;
  backtestId: string;
  scenarioType: string;
  parameters: Record<string, any>;
  duration: number;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  maxDrawdown: number;
  trades: Trade[];
  equityCurve: EquityCurvePoint[];
  createdAt: string;
}

// Simulation Scenario
interface SimulationScenario {
  type: string;
  name: string;
  description: string;
  parameters: SimulationParameter[];
}

// Simulation Parameter
interface SimulationParameter {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
  defaultValue: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// Market Condition
interface MarketCondition {
  type: string;
  name: string;
  description: string;
  volatility: number;
  trend: number;
  liquidity: number;
  correlations: Record<string, number>;
}

// Market Data
interface MarketData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

// Market Event
interface MarketEvent {
  symbol: string;
  date: string;
  type: 'earnings' | 'dividend' | 'split' | 'news';
  value?: number;
  description?: string;
}
```