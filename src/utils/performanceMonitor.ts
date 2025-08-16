/**
 * Performance Monitoring Utility for Hedge Fund Trading Application
 * 
 * This utility provides tools for monitoring and analyzing performance of
 * real-time components, rendering cycles, and data processing operations.
 */

// Performance metrics interface
export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  dataProcessingTime: number;
  networkTime?: number;
  memoryUsage?: number;
  timestamp: number;
}

// Component render metrics
export interface ComponentRenderMetrics {
  componentId: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  maxRenderTime: number;
}

// Data processing metrics
export interface DataProcessingMetrics {
  operationId: string;
  averageProcessingTime: number;
  lastProcessingTime: number;
  maxProcessingTime: number;
  dataSize: number;
  operationCount: number;
}

// Network request metrics
export interface NetworkMetrics {
  url: string;
  method: string;
  responseTime: number;
  status: number;
  dataSize: number;
  timestamp: number;
}

// WebSocket metrics
export interface WebSocketMetrics {
  messageType: string;
  messageSize: number;
  processingTime: number;
  queueTime?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsStorage: PerformanceMetrics[] = [];
  private componentMetrics: Map<string, ComponentRenderMetrics> = new Map();
  private dataProcessingMetrics: Map<string, DataProcessingMetrics> = new Map();
  private networkMetrics: NetworkMetrics[] = [];
  private webSocketMetrics: WebSocketMetrics[] = [];
  private isEnabled: boolean = false;
  private maxStoredMetrics: number = 1000;
  private performanceWarningThreshold: number = 16; // ms (for 60fps target)
  private listeners: Map<string, Function[]> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {
    // Initialize performance monitoring
    this.setupPerformanceObserver();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      console.log('Performance monitoring enabled');
    } else {
      console.log('Performance monitoring disabled');
    }
  }
  
  /**
   * Set maximum number of metrics to store
   */
  public setMaxStoredMetrics(max: number): void {
    this.maxStoredMetrics = max;
    this.pruneMetrics();
  }
  
  /**
   * Set performance warning threshold in milliseconds
   */
  public setPerformanceWarningThreshold(threshold: number): void {
    this.performanceWarningThreshold = threshold;
  }
  
  /**
   * Setup PerformanceObserver to monitor long tasks
   */
  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          if (!this.isEnabled) return;
          
          list.getEntries().forEach((entry) => {
            if (entry.duration > this.performanceWarningThreshold) {
              console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
              this.emit('longTask', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
                entryType: entry.entryType
              });
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        
        // Monitor resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          if (!this.isEnabled) return;
          
          list.getEntries().forEach((entry) => {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
              const url = entry.name;
              const responseTime = entry.duration;
              
              this.recordNetworkMetric({
                url,
                method: 'unknown', // Can't get method from PerformanceResourceTiming
                responseTime,
                status: 0, // Can't get status from PerformanceResourceTiming
                dataSize: entry.transferSize || 0,
                timestamp: Date.now()
              });
            }
          });
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        
      } catch (error) {
        console.error('Error setting up PerformanceObserver:', error);
      }
    }
  }
  
  /**
   * Start measuring component render time
   * @param componentName Name of the component
   * @returns Measurement ID to be used with endMeasure
   */
  public startMeasure(componentName: string): string {
    if (!this.isEnabled) return '';
    
    const id = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    performance.mark(`start_${id}`);
    return id;
  }
  
  /**
   * End measuring component render time
   * @param id Measurement ID returned from startMeasure
   * @param componentName Name of the component
   */
  public endMeasure(id: string, componentName: string): void {
    if (!this.isEnabled || !id) return;
    
    try {
      performance.mark(`end_${id}`);
      performance.measure(id, `start_${id}`, `end_${id}`);
      
      const entries = performance.getEntriesByName(id);
      if (entries.length > 0) {
        const duration = entries[0].duration;
        
        // Record component render metrics
        this.recordComponentRender(componentName, duration);
        
        // Log warning if render time exceeds threshold
        if (duration > this.performanceWarningThreshold) {
          console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
          this.emit('slowRender', { componentName, duration });
        }
        
        // Clean up marks
        performance.clearMarks(`start_${id}`);
        performance.clearMarks(`end_${id}`);
        performance.clearMeasures(id);
      }
    } catch (error) {
      console.error('Error measuring performance:', error);
    }
  }
  
  /**
   * Measure data processing time
   * @param operationId Unique identifier for the operation
   * @param callback Function to measure
   * @param dataSize Size of data being processed (optional)
   * @returns Result of the callback function
   */
  public measureDataProcessing<T>(operationId: string, callback: () => T, dataSize: number = 0): T {
    if (!this.isEnabled) {
      return callback();
    }
    
    const startTime = performance.now();
    let result: T;
    
    try {
      result = callback();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordDataProcessing(operationId, duration, dataSize);
      
      if (duration > this.performanceWarningThreshold) {
        console.warn(`Slow data processing detected in ${operationId}: ${duration.toFixed(2)}ms`);
        this.emit('slowDataProcessing', { operationId, duration, dataSize });
      }
    }
    
    return result;
  }
  
  /**
   * Record component render metrics
   * @param componentId Component identifier
   * @param renderTime Render time in milliseconds
   */
  private recordComponentRender(componentId: string, renderTime: number): void {
    let metrics = this.componentMetrics.get(componentId);
    
    if (!metrics) {
      metrics = {
        componentId,
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        maxRenderTime: 0
      };
    }
    
    // Update metrics
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
    metrics.averageRenderTime = ((metrics.averageRenderTime * (metrics.renderCount - 1)) + renderTime) / metrics.renderCount;
    
    // Store updated metrics
    this.componentMetrics.set(componentId, metrics);
    
    // Add to metrics storage
    this.metricsStorage.push({
      componentName: componentId,
      renderTime,
      dataProcessingTime: 0,
      timestamp: Date.now()
    });
    
    // Prune metrics if needed
    this.pruneMetrics();
    
    // Emit event
    this.emit('componentRender', metrics);
  }
  
  /**
   * Record data processing metrics
   * @param operationId Operation identifier
   * @param processingTime Processing time in milliseconds
   * @param dataSize Size of data being processed
   */
  private recordDataProcessing(operationId: string, processingTime: number, dataSize: number): void {
    let metrics = this.dataProcessingMetrics.get(operationId);
    
    if (!metrics) {
      metrics = {
        operationId,
        averageProcessingTime: 0,
        lastProcessingTime: 0,
        maxProcessingTime: 0,
        dataSize,
        operationCount: 0
      };
    }
    
    // Update metrics
    metrics.operationCount++;
    metrics.lastProcessingTime = processingTime;
    metrics.maxProcessingTime = Math.max(metrics.maxProcessingTime, processingTime);
    metrics.averageProcessingTime = ((metrics.averageProcessingTime * (metrics.operationCount - 1)) + processingTime) / metrics.operationCount;
    metrics.dataSize = dataSize;
    
    // Store updated metrics
    this.dataProcessingMetrics.set(operationId, metrics);
    
    // Add to metrics storage
    this.metricsStorage.push({
      componentName: operationId,
      renderTime: 0,
      dataProcessingTime: processingTime,
      timestamp: Date.now()
    });
    
    // Prune metrics if needed
    this.pruneMetrics();
    
    // Emit event
    this.emit('dataProcessing', metrics);
  }
  
  /**
   * Record network request metrics
   * @param metrics Network metrics
   */
  public recordNetworkMetric(metrics: NetworkMetrics): void {
    if (!this.isEnabled) return;
    
    this.networkMetrics.push(metrics);
    
    // Limit the number of stored network metrics
    if (this.networkMetrics.length > this.maxStoredMetrics) {
      this.networkMetrics = this.networkMetrics.slice(-this.maxStoredMetrics);
    }
    
    // Emit event
    this.emit('networkRequest', metrics);
    
    // Log warning if response time exceeds threshold
    if (metrics.responseTime > this.performanceWarningThreshold * 2) { // Network has higher threshold
      console.warn(`Slow network request detected: ${metrics.responseTime.toFixed(2)}ms for ${metrics.url}`);
    }
  }
  
  /**
   * Record WebSocket message metrics
   * @param metrics WebSocket metrics
   */
  public recordWebSocketMetric(metrics: WebSocketMetrics): void {
    if (!this.isEnabled) return;
    
    this.webSocketMetrics.push(metrics);
    
    // Limit the number of stored WebSocket metrics
    if (this.webSocketMetrics.length > this.maxStoredMetrics) {
      this.webSocketMetrics = this.webSocketMetrics.slice(-this.maxStoredMetrics);
    }
    
    // Emit event
    this.emit('webSocketMessage', metrics);
    
    // Log warning if processing time exceeds threshold
    if (metrics.processingTime > this.performanceWarningThreshold) {
      console.warn(`Slow WebSocket message processing detected: ${metrics.processingTime.toFixed(2)}ms for ${metrics.messageType}`);
    }
  }
  
  /**
   * Prune metrics to stay within maxStoredMetrics limit
   */
  private pruneMetrics(): void {
    if (this.metricsStorage.length > this.maxStoredMetrics) {
      this.metricsStorage = this.metricsStorage.slice(-this.maxStoredMetrics);
    }
  }
  
  /**
   * Get component render metrics
   * @param componentId Optional component ID to filter by
   * @returns Component render metrics
   */
  public getComponentMetrics(componentId?: string): ComponentRenderMetrics[] {
    if (componentId) {
      const metrics = this.componentMetrics.get(componentId);
      return metrics ? [metrics] : [];
    }
    
    return Array.from(this.componentMetrics.values());
  }
  
  /**
   * Get data processing metrics
   * @param operationId Optional operation ID to filter by
   * @returns Data processing metrics
   */
  public getDataProcessingMetrics(operationId?: string): DataProcessingMetrics[] {
    if (operationId) {
      const metrics = this.dataProcessingMetrics.get(operationId);
      return metrics ? [metrics] : [];
    }
    
    return Array.from(this.dataProcessingMetrics.values());
  }
  
  /**
   * Get network metrics
   * @param url Optional URL to filter by
   * @returns Network metrics
   */
  public getNetworkMetrics(url?: string): NetworkMetrics[] {
    if (url) {
      return this.networkMetrics.filter(metric => metric.url.includes(url));
    }
    
    return this.networkMetrics;
  }
  
  /**
   * Get WebSocket metrics
   * @param messageType Optional message type to filter by
   * @returns WebSocket metrics
   */
  public getWebSocketMetrics(messageType?: string): WebSocketMetrics[] {
    if (messageType) {
      return this.webSocketMetrics.filter(metric => metric.messageType === messageType);
    }
    
    return this.webSocketMetrics;
  }
  
  /**
   * Get performance summary
   * @returns Performance summary
   */
  public getPerformanceSummary(): {
    slowestComponents: ComponentRenderMetrics[];
    slowestOperations: DataProcessingMetrics[];
    slowestNetworkRequests: NetworkMetrics[];
    slowestWebSocketMessages: WebSocketMetrics[];
  } {
    // Get top 5 slowest components by average render time
    const slowestComponents = Array.from(this.componentMetrics.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, 5);
    
    // Get top 5 slowest operations by average processing time
    const slowestOperations = Array.from(this.dataProcessingMetrics.values())
      .sort((a, b) => b.averageProcessingTime - a.averageProcessingTime)
      .slice(0, 5);
    
    // Get top 5 slowest network requests
    const slowestNetworkRequests = [...this.networkMetrics]
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 5);
    
    // Get top 5 slowest WebSocket messages
    const slowestWebSocketMessages = [...this.webSocketMetrics]
      .sort((a, b) => b.processingTime - a.processingTime)
      .slice(0, 5);
    
    return {
      slowestComponents,
      slowestOperations,
      slowestNetworkRequests,
      slowestWebSocketMessages
    };
  }
  
  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metricsStorage = [];
    this.componentMetrics.clear();
    this.dataProcessingMetrics.clear();
    this.networkMetrics = [];
    this.webSocketMetrics = [];
    console.log('Performance metrics cleared');
  }
  
  /**
   * Subscribe to performance events
   * @param eventType Event type
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  public subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit event to listeners
   * @param eventType Event type
   * @param data Event data
   */
  private emit(eventType: string, data: any): void {
    if (!this.listeners.has(eventType)) return;
    
    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in performance event listener for ${eventType}:`, error);
      }
    });
  }
}

// Create React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startMeasure: () => monitor.startMeasure(componentName),
    endMeasure: (id: string) => monitor.endMeasure(id, componentName),
    measureDataProcessing: <T>(operationId: string, callback: () => T, dataSize?: number) => 
      monitor.measureDataProcessing(operationId, callback, dataSize)
  };
}

// Export singleton instance
export default PerformanceMonitor.getInstance();