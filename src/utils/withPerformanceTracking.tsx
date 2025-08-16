import React, { useEffect, useRef } from 'react';
import PerformanceMonitor from './performanceMonitor';

/**
 * Higher-Order Component that wraps a component with performance tracking
 * 
 * @param Component The component to wrap
 * @param componentName Optional name for the component (defaults to Component.displayName or Component.name)
 * @returns Wrapped component with performance tracking
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  // Get component name for tracking
  const displayName = componentName || Component.displayName || Component.name || 'UnknownComponent';
  
  // Create wrapped component
  const WrappedComponent: React.FC<P> = (props) => {
    // Create refs to track render count and measure ID
    const renderCountRef = useRef(0);
    const measureIdRef = useRef<string | null>(null);
    
    // Start measuring on render
    useEffect(() => {
      // Increment render count
      renderCountRef.current += 1;
      
      // Start measuring render time
      measureIdRef.current = PerformanceMonitor.startMeasure(`${displayName}_render_${renderCountRef.current}`);
      
      // End measuring after render is complete
      const timeoutId = setTimeout(() => {
        if (measureIdRef.current) {
          PerformanceMonitor.endMeasure(measureIdRef.current, displayName);
          measureIdRef.current = null;
        }
      }, 0);
      
      // Clean up on unmount
      return () => {
        clearTimeout(timeoutId);
        if (measureIdRef.current) {
          PerformanceMonitor.endMeasure(measureIdRef.current, displayName);
          measureIdRef.current = null;
        }
      };
    });
    
    // Render the wrapped component
    return <Component {...props} />;
  };
  
  // Set display name for debugging
  WrappedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return WrappedComponent;
}

/**
 * React hook for tracking component performance
 * 
 * @param componentName Name of the component
 * @returns Object with performance tracking methods
 */
export function useComponentPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const measureIdRef = useRef<string | null>(null);
  
  // Start measuring on mount and re-renders
  useEffect(() => {
    // Increment render count
    renderCountRef.current += 1;
    
    // Start measuring render time
    measureIdRef.current = PerformanceMonitor.startMeasure(`${componentName}_render_${renderCountRef.current}`);
    
    // End measuring after render is complete
    const timeoutId = setTimeout(() => {
      if (measureIdRef.current) {
        PerformanceMonitor.endMeasure(measureIdRef.current, componentName);
        measureIdRef.current = null;
      }
    }, 0);
    
    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
      if (measureIdRef.current) {
        PerformanceMonitor.endMeasure(measureIdRef.current, componentName);
        measureIdRef.current = null;
      }
    };
  });
  
  return {
    trackOperation: <T>(operationName: string, operation: () => T, dataSize?: number): T => {
      return PerformanceMonitor.measureDataProcessing(
        `${componentName}_${operationName}`,
        operation,
        dataSize
      );
    }
  };
}

export default withPerformanceTracking;