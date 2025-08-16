/**
 * Type definitions for trading strategies in the Backtesting & Simulation Engine
 */

/**
 * Represents a trading strategy
 */
export interface Strategy {
  id?: string;
  name: string;
  description?: string;
  type: StrategyType;
  rules: StrategyRule[];
  parameters: Record<string, any>;
  riskManagement: RiskManagementRule[];
  positionSizing: PositionSizingRule;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  isPublic: boolean;
  version: string;
}

/**
 * Types of trading strategies
 */
export enum StrategyType {
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  SENTIMENT = 'sentiment',
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  MULTI_FACTOR = 'multi_factor',
  EVENT_DRIVEN = 'event_driven',
  CUSTOM = 'custom'
}

/**
 * Represents a rule in a trading strategy
 */
export interface StrategyRule {
  id?: string;
  name: string;
  description?: string;
  conditions: Condition[];
  actions: Action[];
  logicOperator: LogicOperator;
  enabled: boolean;
  priority: number;
}

/**
 * Logic operators for combining conditions
 */
export enum LogicOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Represents a condition in a strategy rule
 */
export interface Condition {
  id?: string;
  type: ConditionType;
  indicator?: string;
  parameters: Record<string, any>;
  operator: ConditionOperator;
  value: any;
  lookback?: number;
  timeFrame?: string;
}

/**
 * Types of conditions
 */
export enum ConditionType {
  PRICE = 'price',
  INDICATOR = 'indicator',
  PATTERN = 'pattern',
  VOLUME = 'volume',
  SENTIMENT = 'sentiment',
  FUNDAMENTAL = 'fundamental',
  TIME = 'time',
  PORTFOLIO = 'portfolio',
  MARKET = 'market',
  CUSTOM = 'custom'
}

/**
 * Operators for conditions
 */
export enum ConditionOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUAL = 'equal',
  NOT_EQUAL = 'not_equal',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  CROSSES_ABOVE = 'crosses_above',
  CROSSES_BELOW = 'crosses_below',
  BETWEEN = 'between',
  NOT_BETWEEN = 'not_between',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists',
  CUSTOM = 'custom'
}

/**
 * Represents an action in a strategy rule
 */
export interface Action {
  id?: string;
  type: ActionType;
  parameters: Record<string, any>;
}

/**
 * Types of actions
 */
export enum ActionType {
  ENTER_LONG = 'enter_long',
  EXIT_LONG = 'exit_long',
  ENTER_SHORT = 'enter_short',
  EXIT_SHORT = 'exit_short',
  CLOSE_ALL = 'close_all',
  ADJUST_POSITION = 'adjust_position',
  SET_STOP_LOSS = 'set_stop_loss',
  SET_TAKE_PROFIT = 'set_take_profit',
  CANCEL_ORDER = 'cancel_order',
  CUSTOM = 'custom'
}

/**
 * Represents a risk management rule
 */
export interface RiskManagementRule {
  id?: string;
  type: RiskManagementType;
  parameters: Record<string, any>;
  enabled: boolean;
}

/**
 * Types of risk management rules
 */
export enum RiskManagementType {
  STOP_LOSS = 'stop_loss',
  TAKE_PROFIT = 'take_profit',
  TRAILING_STOP = 'trailing_stop',
  MAX_DRAWDOWN = 'max_drawdown',
  MAX_POSITION_SIZE = 'max_position_size',
  MAX_CONCENTRATION = 'max_concentration',
  MAX_OPEN_TRADES = 'max_open_trades',
  TIME_STOP = 'time_stop',
  CUSTOM = 'custom'
}

/**
 * Represents a position sizing rule
 */
export interface PositionSizingRule {
  id?: string;
  type: PositionSizingType;
  parameters: Record<string, any>;
}

/**
 * Types of position sizing rules
 */
export enum PositionSizingType {
  FIXED = 'fixed',
  PERCENTAGE_OF_EQUITY = 'percentage_of_equity',
  RISK_BASED = 'risk_based',
  VOLATILITY_BASED = 'volatility_based',
  KELLY_CRITERION = 'kelly_criterion',
  OPTIMAL_F = 'optimal_f',
  CUSTOM = 'custom'
}

/**
 * Represents a strategy template
 */
export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  defaultParameters: Record<string, any>;
  parameterDefinitions: ParameterDefinition[];
  code: string;
  tags: string[];
  category: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
  author: string;
  isPublic: boolean;
  version: string;
}

/**
 * Represents a parameter definition for a strategy template
 */
export interface ParameterDefinition {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'select' | 'multi-select';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  required: boolean;
  description?: string;
  category?: string;
  order?: number;
}

/**
 * Represents a strategy optimization configuration
 */
export interface OptimizationConfig {
  id?: string;
  strategyId: string;
  backtestConfigId: string;
  parameters: OptimizationParameter[];
  objectiveFunction: ObjectiveFunction;
  customObjectiveFunction?: string;
  method: OptimizationMethod;
  constraints: OptimizationConstraint[];
  maxIterations: number;
  parallelRuns: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * Represents a parameter to optimize
 */
export interface OptimizationParameter {
  name: string;
  type: 'number' | 'boolean' | 'string' | 'select';
  min?: number;
  max?: number;
  step?: number;
  values?: any[];
  defaultValue: any;
}

/**
 * Objective functions for optimization
 */
export enum ObjectiveFunction {
  SHARPE_RATIO = 'sharpe_ratio',
  SORTINO_RATIO = 'sortino_ratio',
  CALMAR_RATIO = 'calmar_ratio',
  TOTAL_RETURN = 'total_return',
  ANNUALIZED_RETURN = 'annualized_return',
  MAX_DRAWDOWN = 'max_drawdown',
  PROFIT_FACTOR = 'profit_factor',
  EXPECTANCY = 'expectancy',
  CUSTOM = 'custom'
}

/**
 * Optimization methods
 */
export enum OptimizationMethod {
  GRID_SEARCH = 'grid_search',
  RANDOM_SEARCH = 'random_search',
  BAYESIAN = 'bayesian',
  GENETIC = 'genetic',
  PARTICLE_SWARM = 'particle_swarm',
  CUSTOM = 'custom'
}

/**
 * Represents a constraint for optimization
 */
export interface OptimizationConstraint {
  metric: string;
  operator: ConditionOperator;
  value: any;
}

/**
 * Represents an optimization result
 */
export interface OptimizationResult {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  iterations: OptimizationIteration[];
  bestParameters: Record<string, any>;
  bestObjectiveValue: number;
  executionTime: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Represents an iteration in optimization
 */
export interface OptimizationIteration {
  id: string;
  parameters: Record<string, any>;
  objectiveValue: number;
  metrics: Record<string, number>;
  rank: number;
}

/**
 * Represents a walk-forward analysis configuration
 */
export interface WalkForwardConfig {
  id?: string;
  strategyId: string;
  optimizationConfigId: string;
  inSamplePeriod: number; // in days
  outOfSamplePeriod: number; // in days
  numberOfFolds: number;
  anchored: boolean;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * Represents a walk-forward analysis result
 */
export interface WalkForwardResult {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  folds: WalkForwardFold[];
  aggregateMetrics: Record<string, number>;
  robustnessScore: number;
  executionTime: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

/**
 * Represents a fold in walk-forward analysis
 */
export interface WalkForwardFold {
  id: string;
  inSampleStart: string;
  inSampleEnd: string;
  outOfSampleStart: string;
  outOfSampleEnd: string;
  parameters: Record<string, any>;
  inSampleMetrics: Record<string, number>;
  outOfSampleMetrics: Record<string, number>;
}