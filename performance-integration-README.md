# Performance Optimization & Cross-Component Integration Utilities

This document provides a comprehensive guide to using the performance optimization and cross-component integration utilities developed for the hedge fund trading application.

## Table of Contents

1. [Performance Monitoring](#performance-monitoring)
2. [Component Optimization](#component-optimization)
3. [WebSocket Data Optimization](#websocket-data-optimization)
4. [Cross-Component Integration](#cross-component-integration)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Performance Monitoring

### PerformanceMonitor

The `PerformanceMonitor` utility allows you to track and analyze the performance of your components, data processing operations, and network requests.

#### Basic Usage

```typescript
import PerformanceMonitor from '../utils/performanceMonitor';

// Enable performance monitoring
PerformanceMonitor.setEnabled(true);

// Measure component render time
const measureId = PerformanceMonitor.startMeasure('MyComponent');
// Component rendering happens here
PerformanceMonitor.endMeasure(measureId, 'MyComponent');

// Measure data processing time
const result = PerformanceMonitor.measureDataProcessing(
  'processPortfolioData',
  () => {
    // Expensive data processing
    return processedData;
  },
  rawData.length // Optional data size
);

// Get performance metrics
const componentMetrics = PerformanceMonitor.getComponentMetrics();
const dataProcessingMetrics = PerformanceMonitor.getDataProcessingMetrics();
const performanceSummary = PerformanceMonitor.getPerformanceSummary();
```

#### React Hook

```typescript
import { usePerformanceMonitor } from '../utils/performanceMonitor';

function MyComponent() {
  const { startMeasure, endMeasure, measureDataProcessing } = usePerformanceMonitor('MyComponent');
  
  // Use in effects or callbacks
  useEffect(() => {
    const id = startMeasure();
    // Setup component
    return () => endMeasure(id);
  }, []);
  
  const handleDataProcessing = () => {
    const result = measureDataProcessing('processData', () => {
      // Process data
      return processedData;
    });
    // Use result
  };
  
  return (
    // Component JSX
  );
}
```

### PerformanceMonitorPanel

The `PerformanceMonitorPanel` component provides a visual interface for monitoring performance metrics.

```tsx
import PerformanceMonitorPanel from '../components/performance/PerformanceMonitorPanel';

function App() {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  
  return (
    <div>
      {/* Your app components */}
      
      <button onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}>
        Toggle Performance Monitor
      </button>
      
      {showPerformanceMonitor && (
        <PerformanceMonitorPanel 
          refreshInterval={2000}
          onClose={() => setShowPerformanceMonitor(false)}
        />
      )}
    </div>
  );
}
```

## Component Optimization

### withPerformanceTracking HOC

The `withPerformanceTracking` higher-order component automatically tracks the render performance of your components.

```tsx
import withPerformanceTracking from '../utils/withPerformanceTracking';

function MyComponent(props) {
  // Component implementation
}

export default withPerformanceTracking(MyComponent);
```

### useComponentPerformance Hook

```tsx
import { useComponentPerformance } from '../utils/withPerformanceTracking';

function MyComponent() {
  const { trackOperation } = useComponentPerformance('MyComponent');
  
  const handleClick = () => {
    const result = trackOperation('handleClick', () => {
      // Expensive operation
      return operationResult;
    });
    // Use result
  };
  
  return (
    // Component JSX
  );
}
```

### Optimization Techniques

1. **Memoization with useMemo and useCallback**

```tsx
// Memoize expensive calculations
const filteredData = useMemo(() => {
  return data.filter(item => item.value > threshold)
    .sort((a, b) => a.value - b.value);
}, [data, threshold]);

// Memoize event handlers
const handleClick = useCallback(() => {
  // Handler implementation
}, [dependencies]);
```

2. **React.memo for Pure Components**

```tsx
const MyPureComponent = React.memo(function MyPureComponent(props) {
  // Component implementation
});
```

3. **Virtualization for Large Lists**

```tsx
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );
  
  return (
    <div style={{ height: 400 }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={35}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
```

## WebSocket Data Optimization

### WebSocketDataOptimizer

The `WebSocketDataOptimizer` utility provides tools for optimizing WebSocket data handling.

#### Throttled Handler

```typescript
import { createThrottledHandler } from '../utils/websocketDataOptimizer';

// Create throttled handler
const handleMarketData = createThrottledHandler(
  (data) => {
    // Update UI with market data
  },
  { throttleMs: 100 }
);

// Use in WebSocket message handler
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMarketData(data);
};
```

#### Batch Processing

```typescript
import { createBatchProcessor } from '../utils/websocketDataOptimizer';

// Create batch processor
const { addItem, flush } = createBatchProcessor(
  (batch) => {
    // Process batch of items
    console.log(`Processing ${batch.items.length} items`);
    updateUI(batch.items);
  },
  { batchSize: 50, maxDelayMs: 500 }
);

// Add items to batch
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  addItem(data);
};

// Force flush when needed
function handleUserInteraction() {
  flush(); // Process any pending items immediately
}
```

#### Data Change Detection

```typescript
import { createChangeDetector } from '../utils/websocketDataOptimizer';

// Create change detector
const priceChangeDetector = createChangeDetector({
  significantChangeThreshold: 0.005, // 0.5% change
  trackHistory: true,
  historySize: 100
});

// Use in data handler
function handlePriceUpdate(newPrice) {
  if (priceChangeDetector.hasSignificantChange(newPrice)) {
    // Update UI only for significant changes
    updatePriceDisplay(newPrice);
  }
}
```

## Cross-Component Integration

### useComponentIntegration Hook

The `useComponentIntegration` hook provides utilities for cross-component communication and state sharing.

```typescript
import useComponentIntegration from '../hooks/useComponentIntegration';

function MyComponent() {
  const {
    // Event methods
    subscribeToEvent,
    emitEvent,
    
    // Shared state methods
    getSharedState,
    setSharedState,
    useSharedState,
    
    // Error handling
    reportError,
    
    // Dependency management
    getComponentDependencies,
    dependsOn,
    isDependencyOf,
    
    // Component ID
    componentId
  } = useComponentIntegration('MyComponent', {
    dependencies: [
      { target: 'OtherComponent', type: 'data', description: 'Uses portfolio data' }
    ],
    registerErrorHandler: true,
    debug: true
  });
  
  // Use event bus
  useEffect(() => {
    const subscription = subscribeToEvent('marketUpdate', (data) => {
      // Handle market update
    });
    return () => subscription.unsubscribe();
  }, []);
  
  const handleAction = () => {
    emitEvent('userAction', { type: 'buy', symbol: 'AAPL' });
  };
  
  // Use shared state
  const [portfolioData, setPortfolioData] = useSharedState(
    'portfolioData',
    initialValue,
    { persist: true }
  );
  
  return (
    // Component JSX
  );
}
```

### Specialized Hooks

#### useEventSubscription

```typescript
import { useEventSubscription } from '../hooks/useComponentIntegration';

function MyComponent() {
  useEventSubscription('marketUpdate', (data) => {
    // Handle market update
  }, [/* dependencies */]);
  
  return (
    // Component JSX
  );
}
```

#### useSharedState

```typescript
import { useSharedState } from '../hooks/useComponentIntegration';

function MyComponent() {
  const [portfolioData, setPortfolioData] = useSharedState(
    'portfolioData',
    initialValue,
    { persist: true, debounceMs: 300 }
  );
  
  return (
    // Component JSX
  );
}
```

#### useErrorBoundary

```typescript
import { useErrorBoundary } from '../hooks/useComponentIntegration';

function MyComponent() {
  const { errors, reportError, clearErrors, hasErrors } = useErrorBoundary('MyComponent');
  
  if (hasErrors) {
    return (
      <div>
        <h3>Something went wrong</h3>
        <button onClick={clearErrors}>Retry</button>
      </div>
    );
  }
  
  return (
    // Component JSX
  );
}
```

## Error Handling

### Error Boundary Manager

```typescript
import { errorBoundaryManager } from '../utils/componentIntegration';

// Register global error handler
const unregister = errorBoundaryManager.registerGlobalErrorHandler((error, componentId) => {
  console.error(`Error in ${componentId}:`, error);
  // Log to monitoring service
});

// Register component-specific error handler
const unregisterComponent = errorBoundaryManager.registerErrorHandler(
  'MyComponent',
  (error) => {
    // Handle component-specific error
  }
);

// Report an error
errorBoundaryManager.registerError('MyComponent', new Error('Something went wrong'));

// Get errors
const componentErrors = errorBoundaryManager.getErrors('MyComponent');
const allErrors = errorBoundaryManager.getAllErrors();

// Clear errors
errorBoundaryManager.clearErrors('MyComponent');
errorBoundaryManager.clearAllErrors();
```

## Best Practices

### Performance Optimization

1. **Use Memoization Wisely**
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers passed as props
   - Use `React.memo` for pure components

2. **Virtualize Large Lists**
   - Always use virtualization for lists with more than 50 items
   - Set appropriate item sizes for better performance

3. **Optimize WebSocket Data Handling**
   - Use throttling for high-frequency updates
   - Use batching for processing multiple messages
   - Implement change detection to avoid unnecessary updates

4. **Monitor Performance**
   - Regularly check the PerformanceMonitorPanel
   - Address components with high render times
   - Look for patterns in slow operations

### Cross-Component Integration

1. **Use Event Bus for Loose Coupling**
   - Use events for cross-component communication
   - Document event names and payload structures
   - Use typed events when possible

2. **Use Shared State for Common Data**
   - Use shared state for data needed by multiple components
   - Consider persistence options for important state
   - Use debouncing for frequently updated state

3. **Track Component Dependencies**
   - Register dependencies between components
   - Visualize dependencies to understand component relationships
   - Identify circular dependencies and refactor as needed

4. **Handle Errors Consistently**
   - Use error boundaries for component-level error handling
   - Report errors to the error boundary manager
   - Provide recovery options when possible