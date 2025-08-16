import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  eventBus, 
  sharedStateManager, 
  componentDependencyManager,
  errorBoundaryManager,
  SharedStateOptions
} from '../utils/componentIntegration';

/**
 * Hook for component integration
 * 
 * @param componentId Unique identifier for the component
 * @param options Additional options
 * @returns Object with integration utilities
 */
export function useComponentIntegration(
  componentId: string,
  options: {
    dependencies?: { target: string; type: 'data' | 'event' | 'state' | 'prop'; description?: string }[];
    registerErrorHandler?: boolean;
    debug?: boolean;
  } = {}
) {
  const { dependencies = [], registerErrorHandler = false, debug = false } = options;
  
  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Register component dependencies
  useEffect(() => {
    // Register dependencies
    dependencies.forEach(dep => {
      componentDependencyManager.registerDependency({
        source: componentId,
        target: dep.target,
        type: dep.type,
        description: dep.description
      });
    });
    
    if (debug) {
      console.log(`[${componentId}] Registered ${dependencies.length} dependencies`);
    }
    
    // Clean up function
    return () => {
      isMounted.current = false;
    };
  }, [componentId, dependencies, debug]);
  
  // Register error handler if enabled
  useEffect(() => {
    if (!registerErrorHandler) return;
    
    const unregister = errorBoundaryManager.registerErrorHandler(
      componentId,
      (error) => {
        if (debug) {
          console.error(`[${componentId}] Error:`, error);
        }
      }
    );
    
    return unregister;
  }, [componentId, registerErrorHandler, debug]);
  
  /**
   * Subscribe to an event
   * @param eventName Event name
   * @param callback Callback function
   */
  const subscribeToEvent = useCallback(<T = any>(
    eventName: string,
    callback: (data: T) => void
  ) => {
    const subscription = eventBus.on(eventName, (data) => {
      if (isMounted.current) {
        callback(data);
      }
    });
    
    if (debug) {
      console.log(`[${componentId}] Subscribed to event: ${eventName}`);
    }
    
    return subscription;
  }, [componentId, debug]);
  
  /**
   * Emit an event
   * @param eventName Event name
   * @param data Event data
   */
  const emitEvent = useCallback(<T = any>(
    eventName: string,
    data: T
  ) => {
    eventBus.emit(eventName, data);
    
    if (debug) {
      console.log(`[${componentId}] Emitted event: ${eventName}`, data);
    }
  }, [componentId, debug]);
  
  /**
   * Get shared state
   * @param stateKey State key
   * @param defaultValue Default value if state doesn't exist
   */
  const getSharedState = useCallback(<T = any>(
    stateKey: string,
    defaultValue?: T
  ): T => {
    return sharedStateManager.getState<T>(stateKey, defaultValue);
  }, []);
  
  /**
   * Set shared state
   * @param stateKey State key
   * @param newState New state
   * @param options State options
   */
  const setSharedState = useCallback(<T = any>(
    stateKey: string,
    newState: T,
    options?: SharedStateOptions
  ) => {
    sharedStateManager.setState(stateKey, newState, options);
    
    if (debug) {
      console.log(`[${componentId}] Set shared state: ${stateKey}`, newState);
    }
  }, [componentId, debug]);
  
  /**
   * Use shared state (like useState but shared across components)
   * @param stateKey State key
   * @param initialValue Initial value
   * @param options State options
   */
  const useSharedState = <T = any>(
    stateKey: string,
    initialValue: T,
    options?: SharedStateOptions
  ): [T, (newState: T) => void] => {
    // Initialize state
    const [state, setState] = useState<T>(() => {
      const existingState = sharedStateManager.getState<T>(stateKey);
      return existingState !== undefined ? existingState : initialValue;
    });
    
    // Subscribe to state changes
    useEffect(() => {
      const unsubscribe = sharedStateManager.subscribe(stateKey, (newState: T) => {
        if (isMounted.current) {
          setState(newState);
        }
      });
      
      // Set initial state if it doesn't exist
      if (sharedStateManager.getState(stateKey) === undefined) {
        sharedStateManager.setState(stateKey, initialValue, options);
      }
      
      return unsubscribe;
    }, [stateKey]);
    
    // Create setter function
    const setSharedStateValue = useCallback((newState: T) => {
      sharedStateManager.setState(stateKey, newState, options);
      
      if (debug) {
        console.log(`[${componentId}] Updated shared state: ${stateKey}`, newState);
      }
    }, [stateKey, options]);
    
    return [state, setSharedStateValue];
  };
  
  /**
   * Report an error
   * @param error Error object
   */
  const reportError = useCallback((error: Error) => {
    errorBoundaryManager.registerError(componentId, error);
    
    if (debug) {
      console.error(`[${componentId}] Reported error:`, error);
    }
  }, [componentId, debug]);
  
  /**
   * Get component dependencies
   * @param direction 'incoming', 'outgoing', or 'both'
   */
  const getComponentDependencies = useCallback((
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ) => {
    return componentDependencyManager.getDependenciesForComponent(componentId, direction);
  }, [componentId]);
  
  /**
   * Check if this component depends on another component
   * @param targetComponentId Target component ID
   */
  const dependsOn = useCallback((targetComponentId: string) => {
    return componentDependencyManager.hasDependency(componentId, targetComponentId);
  }, [componentId]);
  
  /**
   * Check if another component depends on this component
   * @param sourceComponentId Source component ID
   */
  const isDependencyOf = useCallback((sourceComponentId: string) => {
    return componentDependencyManager.hasDependency(sourceComponentId, componentId);
  }, [componentId]);
  
  return {
    // Event bus methods
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
  };
}

/**
 * Hook for subscribing to events
 * 
 * @param eventName Event name
 * @param callback Callback function
 * @param deps Dependencies array for useEffect
 */
export function useEventSubscription<T = any>(
  eventName: string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const subscription = eventBus.on(eventName, callback);
    return () => subscription.unsubscribe();
  }, [eventName, ...deps]);
}

/**
 * Hook for shared state
 * 
 * @param stateKey State key
 * @param initialValue Initial value
 * @param options State options
 * @returns [state, setState] tuple
 */
export function useSharedState<T = any>(
  stateKey: string,
  initialValue: T,
  options?: SharedStateOptions
): [T, (newState: T) => void] {
  // Initialize state
  const [state, setState] = useState<T>(() => {
    const existingState = sharedStateManager.getState<T>(stateKey);
    return existingState !== undefined ? existingState : initialValue;
  });
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = sharedStateManager.subscribe(stateKey, (newState: T) => {
      setState(newState);
    });
    
    // Set initial state if it doesn't exist
    if (sharedStateManager.getState(stateKey) === undefined) {
      sharedStateManager.setState(stateKey, initialValue, options);
    }
    
    return unsubscribe;
  }, [stateKey]);
  
  // Create setter function
  const setSharedStateValue = useCallback((newState: T) => {
    sharedStateManager.setState(stateKey, newState, options);
  }, [stateKey, options]);
  
  return [state, setSharedStateValue];
}

/**
 * Hook for error boundary
 * 
 * @param componentId Component ID
 * @returns Object with error handling methods
 */
export function useErrorBoundary(componentId: string) {
  const [errors, setErrors] = useState<Error[]>([]);
  
  // Subscribe to errors
  useEffect(() => {
    const unregister = errorBoundaryManager.registerErrorHandler(
      componentId,
      (error) => {
        setErrors(prev => [...prev, error]);
      }
    );
    
    return unregister;
  }, [componentId]);
  
  // Report error
  const reportError = useCallback((error: Error) => {
    errorBoundaryManager.registerError(componentId, error);
  }, [componentId]);
  
  // Clear errors
  const clearErrors = useCallback(() => {
    errorBoundaryManager.clearErrors(componentId);
    setErrors([]);
  }, [componentId]);
  
  return {
    errors,
    reportError,
    clearErrors,
    hasErrors: errors.length > 0
  };
}

export default useComponentIntegration;