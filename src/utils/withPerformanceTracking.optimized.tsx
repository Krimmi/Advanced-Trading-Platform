import React, { useEffect, useRef, useMemo, memo } from 'react';
import PerformanceMonitor from './performanceMonitor';

/**
 * Higher-Order Component that wraps a component with performance tracking
 * Optimized version with memoization and more efficient tracking
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
  
  // Create wrapped component - use memo to prevent unnecessary re-renders
  const WrappedComponent: React.FC<P> = memo((props) => {
    // Create refs to track render count and measure ID
    const renderCountRef = useRef(0);
    const measureIdRef = useRef<string | null>(null);
    
    // Start measuring on render
    useEffect(() => {
      // Only track performance if monitoring is enabled
      if (!PerformanceMonitor.isEnabled()) {
        return;
      }
      
      // Increment render count
      renderCountRef.current += 1;
      
      // Start measuring render time
      measureIdRef.current = PerformanceMonitor.startMeasure(`${displayName}_render_${renderCountRef.current}`);
      
      // Use requestAnimationFrame for more accurate timing
      const rafId = requestAnimationFrame(() => {
        if (measureIdRef.current) {
          PerformanceMonitor.endMeasure(measureIdRef.current, displayName);
          measureIdRef.current = null;
        }
      });
      
      // Clean up on unmount
      return () => {
        cancelAnimationFrame(rafId);
        if (measureIdRef.current) {
          PerformanceMonitor.endMeasure(measureIdRef.current, displayName);
          measureIdRef.current = null;
        }
      };
    });
    
    // Render the wrapped component
    return <Component {...props} />;
  });
  
  // Set display name for debugging
  WrappedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return WrappedComponent;
}

/**
 * React hook for tracking component performance
 * Optimized version with better timing and conditional tracking
 * 
 * @param componentName Name of the component
 * @returns Object with performance tracking methods
 */
export function useComponentPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const measureIdRef = useRef<string | null>(null);
  
  // Start measuring on mount and re-renders
  useEffect(() => {
    // Only track performance if monitoring is enabled
    if (!PerformanceMonitor.isEnabled()) {
      return;
    }
    
    // Increment render count
    renderCountRef.current += 1;
    
    // Start measuring render time
    measureIdRef.current = PerformanceMonitor.startMeasure(`${componentName}_render_${renderCountRef.current}`);
    
    // Use requestAnimationFrame for more accurate timing
    const rafId = requestAnimationFrame(() => {
      if (measureIdRef.current) {
        PerformanceMonitor.endMeasure(measureIdRef.current, componentName);
        measureIdRef.current = null;
      }
    });
    
    // Clean up on unmount
    return () => {
      cancelAnimationFrame(rafId);
      if (measureIdRef.current) {
        PerformanceMonitor.endMeasure(measureIdRef.current, componentName);
        measureIdRef.current = null;
      }
    };
  });
  
  // Memoize the trackOperation function to prevent unnecessary re-creation
  const trackOperation = useMemo(() => {
    return <T>(operationName: string, operation: () => T, dataSize?: number): T => {
      // Only track if monitoring is enabled
      if (!PerformanceMonitor.isEnabled()) {
        return operation();
      }
      
      return PerformanceMonitor.measureDataProcessing(
        `${componentName}_${operationName}`,
        operation,
        dataSize
      );
    };
  }, [componentName]);
  
  return { trackOperation };
}

export default withPerformanceTracking;