import { apiRequest } from './api';
import { Alert } from './alertsService';

// Types
export interface ExecutionStrategy {
  id: string;
  name: string;
  description: string;
  alertTypes: string[];
  parameters: ExecutionParameter[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  value: any;
  options?: string[]; // For select type
  required: boolean;
  description: string;
}

export interface ExecutionRecord {
  id: string;
  alertId: string;
  strategyId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  result?: {
    orderId?: string;
    price?: number;
    quantity?: number;
    timestamp?: string;
    message?: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateExecutionStrategyRequest {
  name: string;
  description: string;
  alertTypes: string[];
  parameters: Omit<ExecutionParameter, 'id'>[];
}

export interface ExecutionRequest {
  alertId: string;
  strategyId: string;
  parameters?: Record<string, any>;
}

// Alert Execution service
const alertExecutionService = {
  // Get all execution strategies
  getExecutionStrategies: () => {
    return apiRequest<ExecutionStrategy[]>({
      method: 'GET',
      url: '/api/alerts/execution/strategies',
    });
  },

  // Get execution strategy by ID
  getExecutionStrategy: (strategyId: string) => {
    return apiRequest<ExecutionStrategy>({
      method: 'GET',
      url: `/api/alerts/execution/strategies/${strategyId}`,
    });
  },

  // Create a new execution strategy
  createExecutionStrategy: (data: CreateExecutionStrategyRequest) => {
    return apiRequest<ExecutionStrategy>({
      method: 'POST',
      url: '/api/alerts/execution/strategies',
      data,
    });
  },

  // Update an execution strategy
  updateExecutionStrategy: (strategyId: string, data: Partial<CreateExecutionStrategyRequest>) => {
    return apiRequest<ExecutionStrategy>({
      method: 'PUT',
      url: `/api/alerts/execution/strategies/${strategyId}`,
      data,
    });
  },

  // Delete an execution strategy
  deleteExecutionStrategy: (strategyId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/alerts/execution/strategies/${strategyId}`,
    });
  },

  // Get execution records
  getExecutionRecords: (limit: number = 50, offset: number = 0) => {
    return apiRequest<{ records: ExecutionRecord[]; total: number }>({
      method: 'GET',
      url: '/api/alerts/execution/records',
      params: {
        limit,
        offset,
      },
    });
  },

  // Get execution records by alert ID
  getExecutionRecordsByAlert: (alertId: string) => {
    return apiRequest<ExecutionRecord[]>({
      method: 'GET',
      url: `/api/alerts/execution/records/alert/${alertId}`,
    });
  },

  // Get execution record by ID
  getExecutionRecord: (recordId: string) => {
    return apiRequest<ExecutionRecord>({
      method: 'GET',
      url: `/api/alerts/execution/records/${recordId}`,
    });
  },

  // Execute an alert manually
  executeAlert: (data: ExecutionRequest) => {
    return apiRequest<ExecutionRecord>({
      method: 'POST',
      url: '/api/alerts/execution/execute',
      data,
    });
  },

  // Cancel a pending execution
  cancelExecution: (recordId: string) => {
    return apiRequest<ExecutionRecord>({
      method: 'PUT',
      url: `/api/alerts/execution/records/${recordId}/cancel`,
    });
  },

  // Link an alert to an execution strategy
  linkAlertToStrategy: (alertId: string, strategyId: string, parameters?: Record<string, any>) => {
    return apiRequest<Alert>({
      method: 'POST',
      url: `/api/alerts/${alertId}/link-strategy`,
      data: {
        strategyId,
        parameters,
      },
    });
  },

  // Unlink an alert from an execution strategy
  unlinkAlertFromStrategy: (alertId: string) => {
    return apiRequest<Alert>({
      method: 'DELETE',
      url: `/api/alerts/${alertId}/unlink-strategy`,
    });
  },

  // Test an execution strategy (dry run)
  testExecutionStrategy: (data: ExecutionRequest) => {
    return apiRequest<{
      valid: boolean;
      message: string;
      simulatedResult?: {
        price?: number;
        quantity?: number;
        estimatedValue?: number;
        timestamp?: string;
      };
    }>({
      method: 'POST',
      url: '/api/alerts/execution/test',
      data,
    });
  },

  // Get execution statistics
  getExecutionStatistics: () => {
    return apiRequest<{
      total: number;
      completed: number;
      failed: number;
      pending: number;
      executing: number;
      cancelled: number;
      successRate: number;
    }>({
      method: 'GET',
      url: '/api/alerts/execution/statistics',
    });
  },
};

export default alertExecutionService;