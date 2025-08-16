/**
 * Component Integration Utility
 * 
 * Provides utilities for improving cross-component integration, state sharing,
 * and communication between different parts of the application.
 */

import { debounce } from 'lodash';

// Event bus for cross-component communication
type EventCallback = (data: any) => void;
type EventSubscription = { unsubscribe: () => void };

// Component dependency map
interface ComponentDependency {
  source: string;
  target: string;
  type: 'data' | 'event' | 'state' | 'prop';
  description?: string;
}

// Shared state interface
interface SharedStateOptions {
  persist?: boolean;
  storageKey?: string;
  debounceMs?: number;
  validateState?: (state: any) => boolean;
  onError?: (error: Error) => void;
}

/**
 * Event Bus for cross-component communication
 */
class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<EventCallback>> = new Map();
  private eventHistory: Map<string, any[]> = new Map();
  private maxHistorySize: number = 10;
  private debugMode: boolean = false;
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
  
  /**
   * Set maximum history size
   */
  public setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    
    // Trim existing history
    this.eventHistory.forEach((history, eventName) => {
      if (history.length > this.maxHistorySize) {
        this.eventHistory.set(eventName, history.slice(-this.maxHistorySize));
      }
    });
  }
  
  /**
   * Subscribe to an event
   * @param eventName Event name
   * @param callback Callback function
   * @returns Subscription object with unsubscribe method
   */
  public on(eventName: string, callback: EventCallback): EventSubscription {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    
    this.events.get(eventName)!.add(callback);
    
    return {
      unsubscribe: () => {
        const callbacks = this.events.get(eventName);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.events.delete(eventName);
          }
        }
      }
    };
  }
  
  /**
   * Emit an event
   * @param eventName Event name
   * @param data Event data
   */
  public emit(eventName: string, data: any): void {
    // Store in history
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }
    
    const history = this.eventHistory.get(eventName)!;
    history.push({
      data,
      timestamp: Date.now()
    });
    
    // Trim history if needed
    if (history.length > this.maxHistorySize) {
      this.eventHistory.set(eventName, history.slice(-this.maxHistorySize));
    }
    
    // Log if debug mode is enabled
    if (this.debugMode) {
      console.log(`[EventBus] Event emitted: ${eventName}`, data);
    }
    
    // Notify subscribers
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }
  
  /**
   * Get event history
   * @param eventName Event name
   * @returns Event history
   */
  public getEventHistory(eventName: string): any[] {
    return this.eventHistory.get(eventName) || [];
  }
  
  /**
   * Clear event history
   * @param eventName Optional event name to clear specific history
   */
  public clearEventHistory(eventName?: string): void {
    if (eventName) {
      this.eventHistory.delete(eventName);
    } else {
      this.eventHistory.clear();
    }
  }
  
  /**
   * Get all registered event names
   * @returns Array of event names
   */
  public getEventNames(): string[] {
    return Array.from(this.events.keys());
  }
  
  /**
   * Get subscriber count for an event
   * @param eventName Event name
   * @returns Number of subscribers
   */
  public getSubscriberCount(eventName: string): number {
    const callbacks = this.events.get(eventName);
    return callbacks ? callbacks.size : 0;
  }
}

/**
 * Component Dependency Manager
 */
class ComponentDependencyManager {
  private static instance: ComponentDependencyManager;
  private dependencies: ComponentDependency[] = [];
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ComponentDependencyManager {
    if (!ComponentDependencyManager.instance) {
      ComponentDependencyManager.instance = new ComponentDependencyManager();
    }
    return ComponentDependencyManager.instance;
  }
  
  /**
   * Register a dependency between components
   * @param dependency Component dependency
   */
  public registerDependency(dependency: ComponentDependency): void {
    this.dependencies.push(dependency);
  }
  
  /**
   * Get all dependencies
   * @returns Array of component dependencies
   */
  public getAllDependencies(): ComponentDependency[] {
    return [...this.dependencies];
  }
  
  /**
   * Get dependencies for a component
   * @param componentName Component name
   * @param direction 'incoming', 'outgoing', or 'both'
   * @returns Array of component dependencies
   */
  public getDependenciesForComponent(
    componentName: string,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): ComponentDependency[] {
    if (direction === 'incoming') {
      return this.dependencies.filter(dep => dep.target === componentName);
    } else if (direction === 'outgoing') {
      return this.dependencies.filter(dep => dep.source === componentName);
    } else {
      return this.dependencies.filter(dep => 
        dep.source === componentName || dep.target === componentName
      );
    }
  }
  
  /**
   * Check if there's a dependency between components
   * @param source Source component
   * @param target Target component
   * @returns True if dependency exists
   */
  public hasDependency(source: string, target: string): boolean {
    return this.dependencies.some(dep => 
      dep.source === source && dep.target === target
    );
  }
  
  /**
   * Get dependency chain between components
   * @param start Start component
   * @param end End component
   * @returns Array of component dependencies forming a chain, or null if no path exists
   */
  public getDependencyChain(start: string, end: string): ComponentDependency[] | null {
    // Simple BFS to find path
    const visited = new Set<string>();
    const queue: { node: string; path: ComponentDependency[] }[] = [{ node: start, path: [] }];
    
    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      
      if (node === end) {
        return path;
      }
      
      if (visited.has(node)) {
        continue;
      }
      
      visited.add(node);
      
      // Find all outgoing dependencies
      const outgoing = this.dependencies.filter(dep => dep.source === node);
      
      for (const dep of outgoing) {
        queue.push({
          node: dep.target,
          path: [...path, dep]
        });
      }
    }
    
    return null; // No path found
  }
  
  /**
   * Clear all dependencies
   */
  public clearDependencies(): void {
    this.dependencies = [];
  }
}

/**
 * Shared State Manager
 */
class SharedStateManager {
  private static instance: SharedStateManager;
  private states: Map<string, any> = new Map();
  private listeners: Map<string, Set<(state: any) => void>> = new Map();
  private options: Map<string, SharedStateOptions> = new Map();
  private debouncedSetters: Map<string, (stateKey: string, newState: any) => void> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {
    // Load persisted states from localStorage
    this.loadPersistedStates();
    
    // Set up window unload handler to save states
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.savePersistedStates();
      });
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): SharedStateManager {
    if (!SharedStateManager.instance) {
      SharedStateManager.instance = new SharedStateManager();
    }
    return SharedStateManager.instance;
  }
  
  /**
   * Set state
   * @param stateKey State key
   * @param newState New state
   * @param options State options
   */
  public setState(stateKey: string, newState: any, options?: SharedStateOptions): void {
    // Store options if provided
    if (options) {
      this.options.set(stateKey, options);
    }
    
    // Get current options
    const currentOptions = this.options.get(stateKey) || {};
    
    // Validate state if validator is provided
    if (currentOptions.validateState) {
      try {
        const isValid = currentOptions.validateState(newState);
        if (!isValid) {
          const error = new Error(`Invalid state for ${stateKey}`);
          if (currentOptions.onError) {
            currentOptions.onError(error);
          } else {
            console.error(error);
          }
          return;
        }
      } catch (error) {
        if (currentOptions.onError) {
          currentOptions.onError(error as Error);
        } else {
          console.error(`Error validating state for ${stateKey}:`, error);
        }
        return;
      }
    }
    
    // Use debounced setter if debounce is enabled
    if (currentOptions.debounceMs && currentOptions.debounceMs > 0) {
      if (!this.debouncedSetters.has(stateKey)) {
        this.debouncedSetters.set(
          stateKey,
          debounce(this.setStateImmediate.bind(this), currentOptions.debounceMs)
        );
      }
      
      this.debouncedSetters.get(stateKey)!(stateKey, newState);
    } else {
      this.setStateImmediate(stateKey, newState);
    }
  }
  
  /**
   * Set state immediately (without debouncing)
   * @param stateKey State key
   * @param newState New state
   */
  private setStateImmediate(stateKey: string, newState: any): void {
    // Store state
    this.states.set(stateKey, newState);
    
    // Get current options
    const options = this.options.get(stateKey);
    
    // Persist state if enabled
    if (options?.persist) {
      this.persistState(stateKey);
    }
    
    // Notify listeners
    const stateListeners = this.listeners.get(stateKey);
    if (stateListeners) {
      stateListeners.forEach(listener => {
        try {
          listener(newState);
        } catch (error) {
          console.error(`Error in state listener for ${stateKey}:`, error);
        }
      });
    }
  }
  
  /**
   * Get state
   * @param stateKey State key
   * @param defaultValue Default value if state doesn't exist
   * @returns Current state or default value
   */
  public getState<T>(stateKey: string, defaultValue?: T): T {
    return this.states.has(stateKey) ? this.states.get(stateKey) : defaultValue;
  }
  
  /**
   * Subscribe to state changes
   * @param stateKey State key
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  public subscribe(stateKey: string, listener: (state: any) => void): () => void {
    if (!this.listeners.has(stateKey)) {
      this.listeners.set(stateKey, new Set());
    }
    
    this.listeners.get(stateKey)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const stateListeners = this.listeners.get(stateKey);
      if (stateListeners) {
        stateListeners.delete(listener);
        if (stateListeners.size === 0) {
          this.listeners.delete(stateKey);
        }
      }
    };
  }
  
  /**
   * Reset state
   * @param stateKey State key
   */
  public resetState(stateKey: string): void {
    this.states.delete(stateKey);
    
    // Remove persisted state if exists
    if (typeof localStorage !== 'undefined') {
      const options = this.options.get(stateKey);
      if (options?.persist && options.storageKey) {
        localStorage.removeItem(options.storageKey);
      }
    }
    
    // Notify listeners with undefined
    const stateListeners = this.listeners.get(stateKey);
    if (stateListeners) {
      stateListeners.forEach(listener => {
        try {
          listener(undefined);
        } catch (error) {
          console.error(`Error in state listener for ${stateKey}:`, error);
        }
      });
    }
  }
  
  /**
   * Persist state to localStorage
   * @param stateKey State key
   */
  private persistState(stateKey: string): void {
    if (typeof localStorage === 'undefined') return;
    
    const options = this.options.get(stateKey);
    if (!options?.persist) return;
    
    const storageKey = options.storageKey || `shared_state_${stateKey}`;
    const state = this.states.get(stateKey);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Error persisting state for ${stateKey}:`, error);
    }
  }
  
  /**
   * Load persisted states from localStorage
   */
  private loadPersistedStates(): void {
    if (typeof localStorage === 'undefined') return;
    
    // Find all persisted states
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Check if it's a shared state
      if (key.startsWith('shared_state_')) {
        const stateKey = key.replace('shared_state_', '');
        try {
          const state = JSON.parse(localStorage.getItem(key) || 'null');
          this.states.set(stateKey, state);
          
          // Set options
          this.options.set(stateKey, {
            persist: true,
            storageKey: key
          });
        } catch (error) {
          console.error(`Error loading persisted state for ${stateKey}:`, error);
        }
      }
    }
  }
  
  /**
   * Save all persisted states to localStorage
   */
  private savePersistedStates(): void {
    if (typeof localStorage === 'undefined') return;
    
    // Save all states with persist option
    this.options.forEach((options, stateKey) => {
      if (options.persist) {
        this.persistState(stateKey);
      }
    });
  }
  
  /**
   * Get all state keys
   * @returns Array of state keys
   */
  public getStateKeys(): string[] {
    return Array.from(this.states.keys());
  }
}

/**
 * Error Boundary Manager
 */
class ErrorBoundaryManager {
  private static instance: ErrorBoundaryManager;
  private errors: Map<string, Error[]> = new Map();
  private errorHandlers: Map<string, Set<(error: Error, componentId: string) => void>> = new Map();
  private globalErrorHandlers: Set<(error: Error, componentId: string) => void> = new Set();
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorBoundaryManager {
    if (!ErrorBoundaryManager.instance) {
      ErrorBoundaryManager.instance = new ErrorBoundaryManager();
    }
    return ErrorBoundaryManager.instance;
  }
  
  /**
   * Register an error
   * @param componentId Component ID
   * @param error Error object
   */
  public registerError(componentId: string, error: Error): void {
    if (!this.errors.has(componentId)) {
      this.errors.set(componentId, []);
    }
    
    this.errors.get(componentId)!.push(error);
    
    // Notify component-specific handlers
    const handlers = this.errorHandlers.get(componentId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(error, componentId);
        } catch (handlerError) {
          console.error(`Error in error handler for ${componentId}:`, handlerError);
        }
      });
    }
    
    // Notify global handlers
    this.globalErrorHandlers.forEach(handler => {
      try {
        handler(error, componentId);
      } catch (handlerError) {
        console.error('Error in global error handler:', handlerError);
      }
    });
  }
  
  /**
   * Register an error handler for a specific component
   * @param componentId Component ID
   * @param handler Error handler function
   * @returns Unregister function
   */
  public registerErrorHandler(
    componentId: string,
    handler: (error: Error, componentId: string) => void
  ): () => void {
    if (!this.errorHandlers.has(componentId)) {
      this.errorHandlers.set(componentId, new Set());
    }
    
    this.errorHandlers.get(componentId)!.add(handler);
    
    // Return unregister function
    return () => {
      const handlers = this.errorHandlers.get(componentId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.errorHandlers.delete(componentId);
        }
      }
    };
  }
  
  /**
   * Register a global error handler
   * @param handler Global error handler function
   * @returns Unregister function
   */
  public registerGlobalErrorHandler(
    handler: (error: Error, componentId: string) => void
  ): () => void {
    this.globalErrorHandlers.add(handler);
    
    // Return unregister function
    return () => {
      this.globalErrorHandlers.delete(handler);
    };
  }
  
  /**
   * Get errors for a component
   * @param componentId Component ID
   * @returns Array of errors
   */
  public getErrors(componentId: string): Error[] {
    return this.errors.get(componentId) || [];
  }
  
  /**
   * Get all errors
   * @returns Map of component IDs to errors
   */
  public getAllErrors(): Map<string, Error[]> {
    return new Map(this.errors);
  }
  
  /**
   * Clear errors for a component
   * @param componentId Component ID
   */
  public clearErrors(componentId: string): void {
    this.errors.delete(componentId);
  }
  
  /**
   * Clear all errors
   */
  public clearAllErrors(): void {
    this.errors.clear();
  }
}

// Export singleton instances
export const eventBus = EventBus.getInstance();
export const componentDependencyManager = ComponentDependencyManager.getInstance();
export const sharedStateManager = SharedStateManager.getInstance();
export const errorBoundaryManager = ErrorBoundaryManager.getInstance();

// Export types
export type { EventCallback, EventSubscription, ComponentDependency, SharedStateOptions };

// Export default object with all managers
export default {
  eventBus,
  componentDependencyManager,
  sharedStateManager,
  errorBoundaryManager
};