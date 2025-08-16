/**
 * WebSocket Data Optimizer
 * 
 * Utilities for optimizing WebSocket data handling in real-time applications.
 * Provides data batching, throttling, and efficient state updates.
 */

import { throttle, debounce } from 'lodash';
import PerformanceMonitor from './performanceMonitor';

// Types
export interface DataBatch<T> {
  items: T[];
  timestamp: number;
  batchId: string;
}

export interface DataProcessingOptions {
  throttleMs?: number;
  debounceMs?: number;
  batchSize?: number;
  processingPriority?: 'high' | 'normal' | 'low';
  trackPerformance?: boolean;
}

export interface DataSubscription {
  unsubscribe: () => void;
}

/**
 * Creates a throttled data handler for WebSocket messages
 * 
 * @param handler Function to handle the data
 * @param options Throttling options
 * @returns Throttled handler function
 */
export function createThrottledHandler<T>(
  handler: (data: T) => void,
  options: { throttleMs?: number; trackPerformance?: boolean } = {}
): (data: T) => void {
  const { throttleMs = 100, trackPerformance = true } = options;
  
  // Create throttled handler
  const throttledHandler = throttle((data: T) => {
    if (trackPerformance) {
      PerformanceMonitor.measureDataProcessing(
        'throttledWebSocketHandler',
        () => handler(data),
        JSON.stringify(data).length
      );
    } else {
      handler(data);
    }
  }, throttleMs, { leading: true, trailing: true });
  
  return throttledHandler;
}

/**
 * Creates a debounced data handler for WebSocket messages
 * 
 * @param handler Function to handle the data
 * @param options Debouncing options
 * @returns Debounced handler function
 */
export function createDebouncedHandler<T>(
  handler: (data: T) => void,
  options: { debounceMs?: number; trackPerformance?: boolean } = {}
): (data: T) => void {
  const { debounceMs = 200, trackPerformance = true } = options;
  
  // Create debounced handler
  const debouncedHandler = debounce((data: T) => {
    if (trackPerformance) {
      PerformanceMonitor.measureDataProcessing(
        'debouncedWebSocketHandler',
        () => handler(data),
        JSON.stringify(data).length
      );
    } else {
      handler(data);
    }
  }, debounceMs);
  
  return debouncedHandler;
}

/**
 * Creates a batch processor for WebSocket messages
 * 
 * @param batchHandler Function to handle batches of data
 * @param options Batch processing options
 * @returns Object with addItem and flush methods
 */
export function createBatchProcessor<T>(
  batchHandler: (batch: DataBatch<T>) => void,
  options: { batchSize?: number; maxDelayMs?: number; trackPerformance?: boolean } = {}
): { addItem: (item: T) => void; flush: () => void } {
  const { batchSize = 50, maxDelayMs = 500, trackPerformance = true } = options;
  
  // Batch state
  let currentBatch: T[] = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  
  // Create flush function
  const flush = () => {
    if (currentBatch.length === 0) return;
    
    const batch: DataBatch<T> = {
      items: [...currentBatch],
      timestamp: Date.now(),
      batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Clear batch
    currentBatch = [];
    
    // Clear timeout
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      batchTimeout = null;
    }
    
    // Process batch
    if (trackPerformance) {
      PerformanceMonitor.measureDataProcessing(
        'batchWebSocketHandler',
        () => batchHandler(batch),
        JSON.stringify(batch).length
      );
    } else {
      batchHandler(batch);
    }
  };
  
  // Create debounced flush
  const debouncedFlush = debounce(flush, maxDelayMs);
  
  // Create add item function
  const addItem = (item: T) => {
    // Add item to batch
    currentBatch.push(item);
    
    // Set timeout if not already set
    if (!batchTimeout) {
      batchTimeout = setTimeout(flush, maxDelayMs);
    }
    
    // Flush if batch is full
    if (currentBatch.length >= batchSize) {
      flush();
    } else {
      // Schedule debounced flush
      debouncedFlush();
    }
  };
  
  return { addItem, flush };
}

/**
 * Creates a data subscription manager for WebSocket data
 * 
 * @returns Subscription manager
 */
export function createDataSubscriptionManager<T>() {
  // Subscribers
  const subscribers = new Set<(data: T) => void>();
  
  // Add subscriber
  const subscribe = (handler: (data: T) => void): DataSubscription => {
    subscribers.add(handler);
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        subscribers.delete(handler);
      }
    };
  };
  
  // Publish data to all subscribers
  const publish = (data: T) => {
    subscribers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in WebSocket data handler:', error);
      }
    });
  };
  
  // Get subscriber count
  const getSubscriberCount = () => subscribers.size;
  
  return { subscribe, publish, getSubscriberCount };
}

/**
 * Creates a priority queue for WebSocket message processing
 * 
 * @returns Priority queue
 */
export function createPriorityQueue<T>() {
  // Queues for different priorities
  const highPriorityQueue: T[] = [];
  const normalPriorityQueue: T[] = [];
  const lowPriorityQueue: T[] = [];
  
  // Processing state
  let isProcessing = false;
  
  // Add item to queue
  const enqueue = (item: T, priority: 'high' | 'normal' | 'low' = 'normal') => {
    switch (priority) {
      case 'high':
        highPriorityQueue.push(item);
        break;
      case 'normal':
        normalPriorityQueue.push(item);
        break;
      case 'low':
        lowPriorityQueue.push(item);
        break;
    }
    
    // Start processing if not already processing
    if (!isProcessing) {
      processNextBatch();
    }
  };
  
  // Process next batch of items
  const processNextBatch = async () => {
    isProcessing = true;
    
    // Process items in priority order
    while (highPriorityQueue.length > 0 || normalPriorityQueue.length > 0 || lowPriorityQueue.length > 0) {
      // Get next item based on priority
      let item: T | undefined;
      let priority: 'high' | 'normal' | 'low' = 'normal';
      
      if (highPriorityQueue.length > 0) {
        item = highPriorityQueue.shift();
        priority = 'high';
      } else if (normalPriorityQueue.length > 0) {
        item = normalPriorityQueue.shift();
        priority = 'normal';
      } else if (lowPriorityQueue.length > 0) {
        item = lowPriorityQueue.shift();
        priority = 'low';
      }
      
      if (item) {
        // Process item
        await processItem(item, priority);
        
        // Yield to browser for UI updates if needed
        if (priority !== 'high') {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    isProcessing = false;
  };
  
  // Process a single item
  const processItem = async (item: T, priority: 'high' | 'normal' | 'low') => {
    // Override this method in the returned object
    console.log(`Processing ${priority} priority item:`, item);
  };
  
  return {
    enqueue,
    processItem, // Allow overriding this method
    getQueueLengths: () => ({
      high: highPriorityQueue.length,
      normal: normalPriorityQueue.length,
      low: lowPriorityQueue.length,
      total: highPriorityQueue.length + normalPriorityQueue.length + lowPriorityQueue.length
    }),
    clearQueues: () => {
      highPriorityQueue.length = 0;
      normalPriorityQueue.length = 0;
      lowPriorityQueue.length = 0;
    }
  };
}

/**
 * Creates a data diff calculator for efficient state updates
 * 
 * @returns Diff calculator
 */
export function createDataDiffCalculator<T extends Record<string, any>>() {
  // Previous state
  let previousState: T | null = null;
  
  // Calculate diff between previous and current state
  const calculateDiff = (currentState: T): Partial<T> => {
    if (!previousState) {
      previousState = { ...currentState };
      return currentState;
    }
    
    // Calculate diff
    const diff: Partial<T> = {};
    
    // Check each property
    Object.keys(currentState).forEach(key => {
      const typedKey = key as keyof T;
      if (currentState[typedKey] !== previousState![typedKey]) {
        diff[typedKey] = currentState[typedKey];
      }
    });
    
    // Update previous state
    previousState = { ...currentState };
    
    return diff;
  };
  
  // Reset previous state
  const reset = () => {
    previousState = null;
  };
  
  return { calculateDiff, reset };
}

/**
 * Creates a data change detector for WebSocket data
 * 
 * @param options Change detection options
 * @returns Change detector
 */
export function createChangeDetector<T>(
  options: { 
    significantChangeThreshold?: number;
    trackHistory?: boolean;
    historySize?: number;
  } = {}
) {
  const { 
    significantChangeThreshold = 0.01, // 1% change
    trackHistory = false,
    historySize = 100
  } = options;
  
  // Previous value
  let previousValue: T | null = null;
  
  // History
  const history: { value: T; timestamp: number }[] = [];
  
  // Check if value has changed significantly
  const hasSignificantChange = (newValue: T): boolean => {
    if (previousValue === null) {
      previousValue = newValue;
      
      // Add to history if tracking
      if (trackHistory) {
        addToHistory(newValue);
      }
      
      return true;
    }
    
    // Check if values are numbers
    if (typeof newValue === 'number' && typeof previousValue === 'number') {
      // Calculate percentage change
      const percentChange = Math.abs((newValue - previousValue) / previousValue);
      
      // Check if change is significant
      const isSignificant = percentChange >= significantChangeThreshold;
      
      // Update previous value
      if (isSignificant) {
        previousValue = newValue;
        
        // Add to history if tracking
        if (trackHistory) {
          addToHistory(newValue);
        }
      }
      
      return isSignificant;
    }
    
    // For non-numbers, check if values are different
    const hasChanged = newValue !== previousValue;
    
    // Update previous value
    if (hasChanged) {
      previousValue = newValue;
      
      // Add to history if tracking
      if (trackHistory) {
        addToHistory(newValue);
      }
    }
    
    return hasChanged;
  };
  
  // Add value to history
  const addToHistory = (value: T) => {
    if (!trackHistory) return;
    
    // Add to history
    history.push({
      value,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (history.length > historySize) {
      history.shift();
    }
  };
  
  // Get history
  const getHistory = () => {
    return [...history];
  };
  
  // Reset detector
  const reset = () => {
    previousValue = null;
    history.length = 0;
  };
  
  return { hasSignificantChange, getHistory, reset };
}

/**
 * Creates a data aggregator for WebSocket data
 * 
 * @param aggregationFn Function to aggregate data
 * @param options Aggregation options
 * @returns Data aggregator
 */
export function createDataAggregator<T, R>(
  aggregationFn: (items: T[]) => R,
  options: {
    aggregationPeriodMs?: number;
    maxItems?: number;
    trackPerformance?: boolean;
  } = {}
) {
  const {
    aggregationPeriodMs = 1000,
    maxItems = 1000,
    trackPerformance = true
  } = options;
  
  // Items to aggregate
  let items: T[] = [];
  
  // Aggregation interval
  let aggregationInterval: NodeJS.Timeout | null = null;
  
  // Subscribers
  const subscribers = new Set<(result: R) => void>();
  
  // Add item
  const addItem = (item: T) => {
    // Add item
    items.push(item);
    
    // Limit items
    if (items.length > maxItems) {
      items.shift();
    }
    
    // Start aggregation interval if not already started
    if (!aggregationInterval) {
      aggregationInterval = setInterval(aggregate, aggregationPeriodMs);
    }
  };
  
  // Aggregate items
  const aggregate = () => {
    if (items.length === 0) {
      // Stop interval if no items
      if (aggregationInterval) {
        clearInterval(aggregationInterval);
        aggregationInterval = null;
      }
      return;
    }
    
    // Copy items
    const itemsToAggregate = [...items];
    
    // Clear items
    items = [];
    
    // Aggregate items
    let result: R;
    
    if (trackPerformance) {
      result = PerformanceMonitor.measureDataProcessing(
        'dataAggregation',
        () => aggregationFn(itemsToAggregate),
        itemsToAggregate.length
      );
    } else {
      result = aggregationFn(itemsToAggregate);
    }
    
    // Notify subscribers
    subscribers.forEach(subscriber => {
      try {
        subscriber(result);
      } catch (error) {
        console.error('Error in data aggregation subscriber:', error);
      }
    });
  };
  
  // Subscribe to aggregated results
  const subscribe = (handler: (result: R) => void): DataSubscription => {
    subscribers.add(handler);
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        subscribers.delete(handler);
      }
    };
  };
  
  // Force aggregation
  const forceAggregate = () => {
    aggregate();
  };
  
  // Clean up
  const cleanup = () => {
    if (aggregationInterval) {
      clearInterval(aggregationInterval);
      aggregationInterval = null;
    }
    
    items = [];
    subscribers.clear();
  };
  
  return { addItem, subscribe, forceAggregate, cleanup };
}

export default {
  createThrottledHandler,
  createDebouncedHandler,
  createBatchProcessor,
  createDataSubscriptionManager,
  createPriorityQueue,
  createDataDiffCalculator,
  createChangeDetector,
  createDataAggregator
};