import * as Sentry from '@sentry/react';
import { config } from '../../config/environments';

/**
 * Performance metric types
 */
export enum MetricType {
  API_CALL = 'api_call',
  COMPONENT_RENDER = 'component_render',
  DATA_PROCESSING = 'data_processing',
  USER_INTERACTION = 'user_interaction',
  RESOURCE_LOADING = 'resource_loading'
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring service
 */
class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;
  private slowOperationThreshold: number = 1000; // 1 second threshold for slow operations
  
  private constructor() {
    // Enable performance monitoring based on environment config
    this.isEnabled = config.monitoring.performanceMonitoring;
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }
  
  /**
   * Start tracking a metric
   * @param name - Metric name
   * @param type - Metric type
   * @param metadata - Additional metadata
   * @returns Metric ID
   */
  public startMetric(name: string, type: MetricType, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';
    
    const id = `${type}_${name}_${Date.now()}`;
    const metric: PerformanceMetric = {
      name,
      type,
      startTime: performance.now(),
      metadata
    };
    
    this.activeMetrics.set(id, metric);
    
    // Start a Sentry transaction for API calls if Sentry is enabled
    if (type === MetricType.API_CALL && config.monitoring.errorTracking) {
      const transaction = Sentry.startTransaction({
        name: `API: ${name}`,
        op: 'http'
      });
      
      // Store transaction in metadata
      if (!metric.metadata) metric.metadata = {};
      metric.metadata.transaction = transaction;
    }
    
    return id;
  }
  
  /**
   * End tracking a metric
   * @param id - Metric ID
   * @param success - Whether the operation was successful
   * @param additionalMetadata - Additional metadata to add
   */
  public endMetric(id: string, success: boolean = true, additionalMetadata?: Record<string, any>): void {
    if (!this.isEnabled || !id) return;
    
    const metric = this.activeMetrics.get(id);
    if (!metric) return;
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    
    // Add additional metadata if provided
    if (additionalMetadata) {
      metric.metadata = {
        ...metric.metadata,
        ...additionalMetadata
      };
    }
    
    // Finish Sentry transaction for API calls
    if (metric.type === MetricType.API_CALL && metric.metadata?.transaction) {
      const transaction = metric.metadata.transaction as Sentry.Transaction;
      
      // Add metadata to transaction
      if (metric.metadata) {
        Object.entries(metric.metadata).forEach(([key, value]) => {
          if (key !== 'transaction') {
            transaction.setData(key, value);
          }
        });
      }
      
      // Set transaction status
      transaction.setStatus(success ? 'ok' : 'failed');
      
      // Finish transaction
      transaction.finish();
      
      // Remove transaction from metadata to avoid circular reference
      delete metric.metadata.transaction;
    }
    
    // Store the completed metric
    this.metrics.push(metric);
    this.activeMetrics.delete(id);
    
    // Report to analytics if duration exceeds threshold
    if (metric.duration > this.slowOperationThreshold) {
      this.reportSlowOperation(metric);
    }
  }
  
  /**
   * Track a complete metric (start and end in one call)
   * @param name - Metric name
   * @param type - Metric type
   * @param duration - Duration in milliseconds
   * @param success - Whether the operation was successful
   * @param metadata - Additional metadata
   */
  public trackMetric(
    name: string, 
    type: MetricType, 
    duration: number, 
    success: boolean = true, 
    metadata?: Record<string, any>
  ): void {
    if (!this.isEnabled) return;
    
    const now = performance.now();
    const metric: PerformanceMetric = {
      name,
      type,
      startTime: now - duration,
      endTime: now,
      duration,
      success,
      metadata
    };
    
    this.metrics.push(metric);
    
    // Report to analytics if duration exceeds threshold
    if (duration > this.slowOperationThreshold) {
      this.reportSlowOperation(metric);
    }
  }
  
  /**
   * Get all metrics
   * @returns Array of metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Get metrics by type
   * @param type - Metric type
   * @returns Array of metrics of the specified type
   */
  public getMetricsByType(type: MetricType): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }
  
  /**
   * Get average duration by metric name
   * @param name - Metric name
   * @returns Average duration in milliseconds
   */
  public getAverageDuration(name: string): number {
    const matchingMetrics = this.metrics.filter(metric => metric.name === name && metric.duration !== undefined);
    
    if (matchingMetrics.length === 0) return 0;
    
    const totalDuration = matchingMetrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return totalDuration / matchingMetrics.length;
  }
  
  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Set slow operation threshold
   * @param threshold - Threshold in milliseconds
   */
  public setSlowOperationThreshold(threshold: number): void {
    this.slowOperationThreshold = threshold;
  }
  
  /**
   * Report a slow operation to analytics
   * @param metric - Performance metric
   */
  private reportSlowOperation(metric: PerformanceMetric): void {
    // Only report if Sentry is enabled
    if (!config.monitoring.errorTracking) return;
    
    // Report to Sentry as a performance issue
    Sentry.captureMessage(
      `Slow operation: ${metric.name} (${metric.duration?.toFixed(2)}ms)`,
      metric.success ? 'warning' : 'error'
    );
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Slow operation detected: ${metric.name} (${metric.duration?.toFixed(2)}ms)`);
    }
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();

/**
 * Higher-order component for tracking component render performance
 * @param Component - React component to track
 * @param componentName - Optional name for the component (defaults to Component.displayName)
 * @returns Wrapped component with performance tracking
 */
export function withPerformanceTracking<P>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const displayName = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  const WrappedComponent: React.FC<P> = (props) => {
    const metricId = React.useRef<string>('');
    
    React.useEffect(() => {
      metricId.current = performanceMonitoring.startMetric(
        displayName,
        MetricType.COMPONENT_RENDER
      );
      
      return () => {
        if (metricId.current) {
          performanceMonitoring.endMetric(metricId.current);
        }
      };
    }, []);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithPerformanceTracking(${displayName})`;
  
  return WrappedComponent;
}

/**
 * Hook for tracking performance within a component
 * @param name - Operation name
 * @param type - Metric type
 * @returns Object with start and end functions
 */
export function usePerformanceTracking(name: string, type: MetricType = MetricType.USER_INTERACTION) {
  const metricIdRef = React.useRef<string>('');
  
  const start = React.useCallback((metadata?: Record<string, any>) => {
    metricIdRef.current = performanceMonitoring.startMetric(name, type, metadata);
  }, [name, type]);
  
  const end = React.useCallback((success: boolean = true, additionalMetadata?: Record<string, any>) => {
    if (metricIdRef.current) {
      performanceMonitoring.endMetric(metricIdRef.current, success, additionalMetadata);
      metricIdRef.current = '';
    }
  }, []);
  
  return { start, end };
}