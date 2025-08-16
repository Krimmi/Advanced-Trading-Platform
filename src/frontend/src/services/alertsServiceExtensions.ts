import alertsService, { Alert, CreateAlertRequest } from './alertsService';
import { apiRequest } from './api';

// Types for automated execution
export interface ExecutionStrategy {
  id?: string;
  name: string;
  description?: string;
  conditions: ExecutionCondition[];
  actions: ExecutionAction[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecutionCondition {
  type: 'price' | 'technical' | 'volume' | 'time' | 'news' | 'custom';
  symbol: string;
  indicator?: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'crosses_above' | 'crosses_below';
  value: number | string;
  value2?: number | string; // For 'between' operator
  timeframe?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | 'daily' | 'weekly';
}

export interface ExecutionAction {
  type: 'market_order' | 'limit_order' | 'stop_order' | 'stop_limit_order' | 'notification' | 'custom';
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number | 'percentage_of_portfolio' | 'fixed_usd_amount';
  quantityValue?: number; // Value for percentage or fixed amount
  price?: number; // For limit, stop, and stop-limit orders
  stopPrice?: number; // For stop and stop-limit orders
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
  notificationType?: 'email' | 'push' | 'sms' | 'in-app';
  notificationMessage?: string;
  customActionType?: string;
  customActionParams?: Record<string, any>;
}

export interface ExecutionResult {
  id: string;
  strategyId: string;
  alertId?: string;
  status: 'pending' | 'executed' | 'failed' | 'canceled';
  actions: ExecutionActionResult[];
  triggeredAt: string;
  completedAt?: string;
  error?: string;
}

export interface ExecutionActionResult {
  type: string;
  status: 'pending' | 'executed' | 'failed' | 'canceled';
  details: Record<string, any>;
  error?: string;
}

// Extend the alerts service with automated execution capabilities
const alertsServiceExtensions = {
  // Get all execution strategies
  getExecutionStrategies: () => {
    return apiRequest<ExecutionStrategy[]>({
      method: 'GET',
      url: '/api/alerts/execution-strategies',
    });
  },

  // Get a specific execution strategy
  getExecutionStrategy: (strategyId: string) => {
    return apiRequest<ExecutionStrategy>({
      method: 'GET',
      url: `/api/alerts/execution-strategies/${strategyId}`,
    });
  },

  // Create a new execution strategy
  createExecutionStrategy: (strategy: Omit<ExecutionStrategy, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiRequest<ExecutionStrategy>({
      method: 'POST',
      url: '/api/alerts/execution-strategies',
      data: strategy,
    });
  },

  // Update an existing execution strategy
  updateExecutionStrategy: (strategyId: string, strategy: Partial<ExecutionStrategy>) => {
    return apiRequest<ExecutionStrategy>({
      method: 'PUT',
      url: `/api/alerts/execution-strategies/${strategyId}`,
      data: strategy,
    });
  },

  // Delete an execution strategy
  deleteExecutionStrategy: (strategyId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/alerts/execution-strategies/${strategyId}`,
    });
  },

  // Activate an execution strategy
  activateExecutionStrategy: (strategyId: string) => {
    return apiRequest<ExecutionStrategy>({
      method: 'PUT',
      url: `/api/alerts/execution-strategies/${strategyId}/activate`,
    });
  },

  // Deactivate an execution strategy
  deactivateExecutionStrategy: (strategyId: string) => {
    return apiRequest<ExecutionStrategy>({
      method: 'PUT',
      url: `/api/alerts/execution-strategies/${strategyId}/deactivate`,
    });
  },

  // Get execution history
  getExecutionHistory: (limit: number = 50, offset: number = 0) => {
    return apiRequest<{ executions: ExecutionResult[]; total: number }>({
      method: 'GET',
      url: '/api/alerts/executions',
      params: {
        limit,
        offset,
      },
    });
  },

  // Get execution history for a specific strategy
  getExecutionHistoryForStrategy: (strategyId: string, limit: number = 50, offset: number = 0) => {
    return apiRequest<{ executions: ExecutionResult[]; total: number }>({
      method: 'GET',
      url: `/api/alerts/execution-strategies/${strategyId}/executions`,
      params: {
        limit,
        offset,
      },
    });
  },

  // Get execution details
  getExecutionDetails: (executionId: string) => {
    return apiRequest<ExecutionResult>({
      method: 'GET',
      url: `/api/alerts/executions/${executionId}`,
    });
  },

  // Cancel a pending execution
  cancelExecution: (executionId: string) => {
    return apiRequest<ExecutionResult>({
      method: 'PUT',
      url: `/api/alerts/executions/${executionId}/cancel`,
    });
  },

  // Test an execution strategy (dry run)
  testExecutionStrategy: (strategy: Omit<ExecutionStrategy, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiRequest<{ valid: boolean; message: string; simulatedActions: ExecutionActionResult[] }>({
      method: 'POST',
      url: '/api/alerts/execution-strategies/test',
      data: strategy,
    });
  },

  // Link an alert to an execution strategy
  linkAlertToStrategy: (alertId: string, strategyId: string) => {
    return apiRequest<Alert>({
      method: 'PUT',
      url: `/api/alerts/${alertId}/link-strategy/${strategyId}`,
    });
  },

  // Unlink an alert from an execution strategy
  unlinkAlertFromStrategy: (alertId: string) => {
    return apiRequest<Alert>({
      method: 'PUT',
      url: `/api/alerts/${alertId}/unlink-strategy`,
    });
  },

  // Get available execution condition types
  getExecutionConditionTypes: () => {
    return apiRequest<{
      type: string;
      name: string;
      description: string;
      operators: { id: string; name: string; description: string }[];
    }[]>({
      method: 'GET',
      url: '/api/alerts/execution-conditions',
    });
  },

  // Get available execution action types
  getExecutionActionTypes: () => {
    return apiRequest<{
      type: string;
      name: string;
      description: string;
      parameters: { id: string; name: string; type: string; required: boolean; description: string }[];
    }[]>({
      method: 'GET',
      url: '/api/alerts/execution-actions',
    });
  },
};

export default alertsServiceExtensions;